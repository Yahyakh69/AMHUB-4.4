import { WorkflowRequest, AppSettings, TopologyResponse, Device, DeviceTelemetry, DockPosition } from '../types';

const PROXY_BASE = "https://corsproxy.io/?";
let globalRequestCounter = 0;

/**
 * Transmits the workflow trigger to the DJI API.
 */
export const sendWorkflowAlert = async (payload: WorkflowRequest, settings: AppSettings): Promise<any> => {
  try {
    const baseUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
    const workflowUrl = `${baseUrl}/openapi/v0.1/workflow`;
    const targetUrl = settings.useCorsProxy ? PROXY_BASE + encodeURIComponent(workflowUrl) : workflowUrl;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-token': settings.userToken,
        'x-auth-token': settings.userToken,
        'x-project-uuid': settings.projectUuid
      },
      body: JSON.stringify(payload)
    });

    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text || response.statusText };
    }

    if (!response.ok) throw new Error(responseData.message || `HTTP Error: ${response.status}`);
    return responseData;
  } catch (error) {
    console.error("Workflow Service Error:", error);
    throw error;
  }
};

/**
 * Direct Parser for the DJI FlightHub 2 Topology Response.
 */
export const getProjectTopology = async (settings: AppSettings): Promise<TopologyResponse> => {
  globalRequestCounter++;
  const timestamp = new Date().toLocaleTimeString() + "." + new Date().getMilliseconds().toString().padStart(3, '0');
  const projectUuid = settings.projectUuid.trim();
  
  // Construct the debug metadata that user wants at the TOP of the JSON
  const debugMetadata = {
    "_POLL_START": "====================================================================================================",
    "_SYNC_TIME": timestamp,
    "_CALL_INDEX": globalRequestCounter,
    "_REQUEST_URI": `/manage/api/v1.0/projects/${projectUuid}/topologies`,
    "_SEPARATOR": "----------------------------------------------------------------------------------------------------"
  };

  try {
    const baseUrl = settings.apiUrl.endsWith('/') ? settings.apiUrl.slice(0, -1) : settings.apiUrl;
    const topologyPath = `${baseUrl}/manage/api/v1.0/projects/${projectUuid}/topologies?t=${Date.now()}`;
    const targetUrl = settings.useCorsProxy ? PROXY_BASE + encodeURIComponent(topologyPath) : topologyPath;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-user-token': settings.userToken,
        'x-auth-token': settings.userToken,
        'x-organization-key': settings.userToken, 
        'x-project-uuid': projectUuid,
        'cache-control': 'no-cache, no-store, must-revalidate',
        'pragma': 'no-cache'
      }
    });

    const responseText = await response.text();
    let rawData: any = null;
    
    try {
      rawData = JSON.parse(responseText);
    } catch (e) {
      return {
        code: response.status,
        message: `HTTP ${response.status}`,
        data: [],
        rawResponse: { 
          ...debugMetadata,
          "error": "Failed to parse JSON",
          "status": response.status,
          "raw_body": responseText.substring(0, 500)
        }
      };
    }

    const finalRawResponse = {
      ...debugMetadata,
      ...rawData
    };

    if (!response.ok || (rawData?.code !== 0 && rawData?.code !== 200)) {
        return { 
          code: rawData?.code || response.status, 
          message: rawData?.message || `Access Denied`, 
          data: [], 
          rawResponse: finalRawResponse 
        };
    }
    
    const processedDevices: Device[] = [];
    const deviceList = rawData.data?.list || [];

    deviceList.forEach((item: any) => {
        const d = item.host;
        if (!d) return;

        let domainVal = d.domain ?? d.device_model?.domain;
        if (domainVal != 0 && domainVal !== undefined) return;

        const sn = d.device_sn || d.sn;
        if (!sn) return;

        const isOnline = d.device_online_status === true || d.device_online_status === 1 || d.status === 1;
        const modelName = d.device_model?.name || d.device_model?.key || "Drone";
        const nickname = d.device_project_callsign || d.device_organization_callsign || modelName;
        const state = d.device_state || {};
        
        // --- Coordinate Logic ---
        let lat = Number(state.latitude || 0);
        let lng = Number(state.longitude || 0);
        
        // Extract Dock/Parent Info first
        let dockInfo: DockPosition | undefined = undefined;
        if (d.parents && Array.isArray(d.parents) && d.parents.length > 0) {
            const parent = d.parents[0];
            const pLat = Number(parent.position?.latitude || parent.latitude || 0);
            const pLng = Number(parent.position?.longitude || parent.longitude || 0);
            
            if (pLat !== 0 || pLng !== 0) {
                dockInfo = {
                    sn: parent.sn || parent.device_sn || "UNKNOWN_DOCK",
                    latitude: pLat,
                    longitude: pLng,
                    nickname: parent.nickname || parent.model || "Dock Station"
                };
            }
        }

        // Fallback 1: Offline Position
        if (lat === 0 && lng === 0 && d.device_offline_position) {
            lat = Number(d.device_offline_position.latitude || 0);
            lng = Number(d.device_offline_position.longitude || 0);
        }

        // Fallback 2: Dock Position (for docked drones that don't report own GPS)
        if (lat === 0 && lng === 0 && dockInfo) {
            lat = dockInfo.latitude;
            lng = dockInfo.longitude;
        }

        // --- Flight Status Logic ---
        // Determines if the drone is actually flying vs just online (grounded/docked)
        // 0: Standby, 1: Taking Off, 2: In Air, 3: Landing, 4: Go Home
        const flightStatusRaw = state.flight_status;
        let isFlying = false;

        if (flightStatusRaw !== undefined && flightStatusRaw !== null) {
             const fs = Number(flightStatusRaw);
             // Treat 0 (Standby) as Not Flying (Yellow status).
             // Treat 1, 2, 3, 4 as Flying/Active (Green status).
             isFlying = fs > 0; 
        } else {
             // Fallback: Use speed and relative height ONLY. 
             // CRITICAL: Do NOT use state.elevation, as it is ASL and causes false positives for grounded drones.
             const h = Number(state.height || 0); 
             const s = Number(state.horizontal_speed || 0);
             const motors = state.are_motors_on;
             
             if (motors === 1 || motors === true) {
                 isFlying = true;
             } else {
                 // Assume flying if height > 1m (AGL) or speed > 0.5m/s
                 isFlying = h > 1.0 || s > 0.5;
             }
        }

        const telemetry: DeviceTelemetry | undefined = isOnline ? {
            latitude: Number(state.latitude || 0), // Keep raw telemetry lat/lng here
            longitude: Number(state.longitude || 0),
            height: Number(state.height || state.elevation || 0),
            speed: Number(state.horizontal_speed || 0),
            battery_percent: state.battery?.capacity_percent ?? 0,
            link_signal_quality: Number(state.wireless_link?.sdr_quality || 0),
            flight_time: Number(state.total_flight_time || 0),
            remaining_flight_time: Number(state.battery?.remain_flight_time || 0),
            yaw: Number(state.attitude_head || state.heading || 0),
            pitch: Number(state.attitude_pitch || 0),
            roll: Number(state.attitude_roll || 0)
        } : undefined;

        processedDevices.push({
            device_sn: String(sn),
            nickname: String(nickname),
            device_model: String(modelName),
            status: isOnline,
            domain: 0,
            position: { lat, lng },
            telemetry,
            dock: dockInfo,
            is_flying: isFlying,
            raw: d
        });
    });

    return { code: 0, message: "Success", data: processedDevices, rawResponse: finalRawResponse };
  } catch (error) {
    return { 
      code: -999, 
      message: "Pipeline Error", 
      data: [], 
      rawResponse: { 
        ...debugMetadata,
        "error": String(error)
      } 
    };
  }
};