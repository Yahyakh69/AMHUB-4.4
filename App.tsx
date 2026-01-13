
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { sendWorkflowAlert, getProjectTopology } from './services/apiService';
import { getCoordinatesFromText } from './services/geminiService';
import { WorkflowRequest, LogEntry, ConnectionStatus, AppSettings, Device, TopologyResponse } from './types';
import { 
  WORKFLOW_UUID, CREATOR_ID, DEFAULT_LAT, DEFAULT_LNG, 
  DEFAULT_LEVEL, DEFAULT_DESC, USER_TOKEN, PROJECT_UUID, API_URL, USE_CORS_PROXY, WORKFLOW_OPTIONS
} from './constants';
import { StatusBadge } from './components/StatusBadge';
import { ConsoleLog } from './components/ConsoleLog';
import { MapPicker } from './components/MapPicker';
import { SettingsModal } from './components/SettingsModal';
import { DeviceList } from './components/DeviceList';
import { DraggablePanel } from './components/DraggablePanel';
import { DataFeed } from './components/DataFeed';

const AmhubLogo = () => (
  <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center p-1 shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-white">
    <svg className="w-full h-full" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 15L35 35M15 15L10 25M15 15L10 25M15 15L25 10" stroke="#000000" strokeWidth="8" strokeLinecap="round"/>
      <path d="M85 15L65 35M85 15L90 25M85 15L75 10" stroke="#000000" strokeWidth="8" strokeLinecap="round"/>
      <path d="M15 85L35 65M15 85L10 75M15 85L25 90" stroke="#000000" strokeWidth="8" strokeLinecap="round"/>
      <path d="M85 85L65 65M85 85L90 75M85 85L75 90" stroke="#000000" strokeWidth="8" strokeLinecap="round"/>
      <defs>
        <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A90E2" />
          <stop offset="100%" stopColor="#76D2E1" />
        </linearGradient>
        <linearGradient id="gradOrange" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#F8E71C" />
        </linearGradient>
      </defs>
      <path d="M48 22L22 82H40L48 65L48 22Z" fill="url(#gradBlue)"/>
      <path d="M52 22L52 65L60 82H78L52 22Z" fill="url(#gradOrange)"/>
    </svg>
  </div>
);

type ActiveView = 'TACTICAL' | 'DATA_FEED';

// Helper: Haversine distance in meters
const getDistanceFromLatLonInM = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in m
  return d;
}

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<ActiveView>('TACTICAL');
  const [isMinimalMode, setIsMinimalMode] = useState(false);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [topologyRes, setTopologyRes] = useState<TopologyResponse | null>(null);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [flyTo, setFlyTo] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [selectedDeviceSn, setSelectedDeviceSn] = useState<string | null>(null);
  const [isLinkHealthy, setIsLinkHealthy] = useState<boolean | 'unauthorized'>(false);
  
  const [isPollingPaused, setIsPollingPaused] = useState(false);
  const pollTimerRef = useRef<number | null>(null);

  // Voice & AI State
  const [isListening, setIsListening] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // We keep this state for logic, but we no longer expose UI to change it
  const [selectedWorkflowName, setSelectedWorkflowName] = useState(WORKFLOW_OPTIONS[0].name);

  const [appSettings, setAppSettings] = useState<AppSettings>({
    userToken: USER_TOKEN,
    projectUuid: PROJECT_UUID,
    workflowUuid: WORKFLOW_UUID,
    creatorId: CREATOR_ID,
    apiUrl: API_URL,
    useCorsProxy: USE_CORS_PROXY
  });

  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [desc, setDesc] = useState(DEFAULT_DESC);
  const [level, setLevel] = useState(DEFAULT_LEVEL);
  const [requesterName, setRequesterName] = useState("");

  const addLog = useCallback((type: LogEntry['type'], message: string, details?: unknown) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      details
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  }, []);

  const fetchDevices = useCallback(async (isBackground = false) => {
    if (isBackground && isPollingPaused) {
       if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
       pollTimerRef.current = window.setTimeout(() => fetchDevices(true), 3000);
       return;
    }

    if (!isBackground) setIsLoadingDevices(true);
    try {
      const response = await getProjectTopology(appSettings);
      setTopologyRes({ ...response });
      
      if (response && (response.code === 0 || response.code === 200)) {
        setIsLinkHealthy(true);
      } else if (response && (response.code === 401 || response.code === 200401 || String(response.message).includes('401'))) {
        setIsLinkHealthy('unauthorized');
        if (!isBackground) addLog('error', 'Auth Token Invalid', response.rawResponse);
      } else {
        setIsLinkHealthy(false);
      }
    } catch (error) {
      setIsLinkHealthy(false);
    } finally {
      if (!isBackground) setIsLoadingDevices(false);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = window.setTimeout(() => fetchDevices(true), 3000);
    }
  }, [appSettings, addLog, isPollingPaused]);

  useEffect(() => {
    fetchDevices(false);
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [fetchDevices]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(Number(lat.toFixed(7)));
    setLongitude(Number(lng.toFixed(7)));
  };

  const devices = topologyRes?.data || [];
  const selectedDevice = devices.find(d => d.device_sn === selectedDeviceSn);

  const handleDeviceSelect = (device: Device) => {
      setSelectedDeviceSn(device.device_sn);
      if (device.telemetry && (device.telemetry.latitude !== 0 || device.telemetry.longitude !== 0)) {
          setFlyTo({ lat: device.telemetry.latitude, lng: device.telemetry.longitude });
          setTimeout(() => setFlyTo(undefined), 1000);
      }
  };

  const handleTrigger = async () => {
    if (status === ConnectionStatus.SENDING) return;
    setStatus(ConnectionStatus.SENDING);

    const selectedWorkflow = WORKFLOW_OPTIONS.find(w => w.name === selectedWorkflowName) || WORKFLOW_OPTIONS[0];
    const userMissionName = requesterName || `Mission-${Date.now().toString().slice(-6)}`;
    
    // Calculate Closest Drones to the Workflow Center
    let nearestDronesInfo = "";
    const availableDrones = devices.filter(d => 
      d.status && 
      d.telemetry && 
      (d.telemetry.latitude !== 0 || d.telemetry.longitude !== 0)
    );

    if (availableDrones.length > 0) {
      const dronesWithDistance = availableDrones.map(d => {
        const dist = getDistanceFromLatLonInM(
          selectedWorkflow.center.lat,
          selectedWorkflow.center.lng,
          d.telemetry!.latitude,
          d.telemetry!.longitude
        );
        return { ...d, distance: dist };
      });
      dronesWithDistance.sort((a, b) => a.distance - b.distance);
      const closest = dronesWithDistance.slice(0, 3);
      const droneStrings = closest.map(d => `${d.nickname} (${Math.round(d.distance)}m)`);
      nearestDronesInfo = ` [Nearest: ${droneStrings.join(', ')}]`;
    }

    const finalName = `${userMissionName}${nearestDronesInfo}`;

    const payload: WorkflowRequest = {
      workflow_uuid: selectedWorkflow.uuid,
      trigger_type: 0,
      name: finalName,
      params: {
        creator: appSettings.creatorId,
        latitude: latitude,
        longitude: longitude,
        level: level,
        desc: desc
      }
    };
    
    addLog('request', `Transmitting Alert...`, payload);
    try {
      const result = await sendWorkflowAlert(payload, appSettings);
      addLog('success', 'Uplink Successful', result);
      setStatus(ConnectionStatus.SUCCESS);
    } catch (error: any) {
      addLog('error', 'Alert Failed', { error: error instanceof Error ? error.message : 'Unknown' });
      setStatus(ConnectionStatus.ERROR);
    } finally {
      setTimeout(() => setStatus(prev => prev === ConnectionStatus.SENDING ? ConnectionStatus.IDLE : prev), 2000);
    }
  };

  const syncToDrone = () => {
    if (selectedDevice?.telemetry) {
        const lat = Number(selectedDevice.telemetry.latitude.toFixed(7));
        const lng = Number(selectedDevice.telemetry.longitude.toFixed(7));
        setLatitude(lat);
        setLongitude(lng);
        addLog('info', `Origin locked to ${selectedDevice.nickname} coordinates.`);
    }
  };

  const updateProjectUuid = (newUuid: string) => {
    setAppSettings(prev => ({ ...prev, projectUuid: newUuid }));
    addLog('info', `Target Pipeline switched to UUID: ${newUuid}`);
  };

  // --- New Features Logic ---

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      addLog('error', 'Geolocation is not supported by this browser.');
      return;
    }
    addLog('info', 'Acquiring GPS location...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLatitude(Number(latitude.toFixed(7)));
        setLongitude(Number(longitude.toFixed(7)));
        addLog('success', 'GPS Location Acquired', { lat: latitude, lng: longitude });
        setFlyTo({ lat: latitude, lng: longitude });
      },
      (error) => {
        addLog('error', 'GPS Error', { message: error.message });
      }
    );
  };

  const handleVoiceCommand = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      addLog('error', 'Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    addLog('info', 'Listening for location...');

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setIsAiProcessing(true);
      addLog('info', `Voice Input Received: "${transcript}"`);
      
      const result = await getCoordinatesFromText(transcript);
      
      if (result) {
        setLatitude(Number(result.latitude.toFixed(7)));
        setLongitude(Number(result.longitude.toFixed(7)));
        addLog('success', `AI Located: ${result.locationName}`, result);
        setFlyTo({ lat: result.latitude, lng: result.longitude });
      } else {
        addLog('error', 'AI could not identify location.');
      }
      setIsAiProcessing(false);
    };

    recognition.onerror = (event: any) => {
      console.error(event);
      setIsListening(false);
      addLog('error', 'Voice recognition error', { error: event.error });
    };

    recognition.onend = () => {
       if (isListening) setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={appSettings} onSave={setAppSettings} />

      <header className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex justify-between items-center z-50 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <AmhubLogo />
            <h1 className="hidden sm:block text-sm font-black tracking-widest text-white uppercase">AMHUB Command</h1>
          </div>
          <div className="hidden sm:block h-4 w-px bg-slate-800 mx-1"></div>
          <div className="flex items-center gap-2 px-2 py-1 rounded bg-slate-950 border border-slate-800">
             <div className={`w-2.5 h-2.5 rounded-full ${isLinkHealthy === 'unauthorized' ? 'bg-amber-500' : isLinkHealthy ? 'bg-emerald-500 animate-pulse' : 'bg-red-600'}`}></div>
             <span className={`text-[9px] font-black uppercase tracking-widest ${isLinkHealthy === 'unauthorized' ? 'text-amber-500' : isLinkHealthy ? 'text-emerald-500' : 'text-red-500'}`}>
                {isLinkHealthy === 'unauthorized' ? 'UNAUTHORIZED' : isLinkHealthy ? 'Live Link' : 'Offline'}
             </span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-slate-950/50 p-1 rounded-lg border border-slate-800">
           <button 
             onClick={() => { setActiveView('TACTICAL'); setIsMinimalMode(false); }}
             className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeView === 'TACTICAL' && !isMinimalMode ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <span className="sm:inline hidden">Tactical Map</span>
             <span className="sm:hidden">Map</span>
           </button>
           <button 
             onClick={() => { setActiveView('TACTICAL'); setIsMinimalMode(true); }}
             className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeView === 'TACTICAL' && isMinimalMode ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Panic
           </button>
           <button 
             onClick={() => { setActiveView('DATA_FEED'); setIsMinimalMode(false); }}
             className={`px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-[0.1em] transition-all ${activeView === 'DATA_FEED' ? 'bg-cyan-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <span className="sm:inline hidden">Data Monitor</span>
             <span className="sm:hidden">Data</span>
           </button>
        </nav>

        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden bg-slate-900">
        {activeView === 'TACTICAL' ? (
          <>
            <MapPicker lat={latitude} lng={longitude} onLocationSelect={handleLocationSelect} isMaximized={true} devices={devices} flyTo={flyTo} />
            
            {!isMinimalMode && (
              <>
                <div className="absolute top-4 left-4 bottom-4 w-72 z-10 flex flex-col pointer-events-none hidden lg:flex">
                  <DeviceList devices={devices} isLoading={isLoadingDevices} onRefresh={() => fetchDevices(false)} onSelectDevice={handleDeviceSelect} className="pointer-events-auto h-full shadow-2xl" />
                </div>
                <DraggablePanel 
                  id="mission-panel"
                  title="Tactical Overlay"
                  initialX={window.innerWidth > 1024 ? window.innerWidth - 360 : 20}
                  initialY={64}
                  className="w-full max-w-[320px] border-t-cyan-500 border-t-2"
                >
                  <div className="flex flex-col gap-4">
                    {selectedDevice ? (
                      <div className="bg-slate-900/90 border border-slate-700/50 rounded-lg p-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Selected Tracker</span>
                            <button onClick={() => setSelectedDeviceSn(null)} className="text-slate-500 hover:text-white"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                          <div className="space-y-1.5">
                            <div className="flex justify-between font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-slate-500 font-bold uppercase">Lat:</span>
                              <span className="text-cyan-400 font-bold">{selectedDevice.telemetry?.latitude.toFixed(8)}</span>
                            </div>
                            <div className="flex justify-between font-mono text-[10px] bg-slate-950 p-2 rounded border border-slate-800">
                              <span className="text-slate-500 font-bold uppercase">Lng:</span>
                              <span className="text-cyan-400 font-bold">{selectedDevice.telemetry?.longitude.toFixed(8)}</span>
                            </div>
                          </div>
                          <button onClick={syncToDrone} className="w-full mt-3 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 text-[10px] font-black uppercase tracking-widest rounded border border-cyan-500/30 transition-all flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            Sync Origin to Drone
                          </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic text-center py-3 bg-slate-900/30 border border-dashed border-slate-800 rounded-lg">Select tracker for live sync</div>
                    )}

                    <div className="space-y-3">
                      {/* Location Tool Buttons */}
                      <div className="grid grid-cols-2 gap-3 mb-1">
                        <button 
                          onClick={handleUseMyLocation}
                          className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg border border-slate-700 transition-all hover:border-emerald-500/50"
                        >
                           <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                           <span className="text-[9px] font-black uppercase tracking-widest">My GPS</span>
                        </button>
                        <button 
                          onClick={handleVoiceCommand}
                          disabled={isListening || isAiProcessing}
                          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all ${isListening ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse' : isAiProcessing ? 'bg-amber-500/20 text-amber-400 border-amber-500' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border-slate-700 hover:border-cyan-500/50'}`}
                        >
                           {isListening ? (
                             <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-75"></div>
                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce delay-150"></div>
                             </div>
                           ) : isAiProcessing ? (
                             <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                           ) : (
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                           )}
                           <span className="text-[9px] font-black uppercase tracking-widest">{isListening ? 'Listening' : isAiProcessing ? 'AI Logic' : 'Speak Pos'}</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Origin Lat</label>
                            <input type="number" step="0.000001" value={latitude} onChange={(e) => setLatitude(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Origin Lng</label>
                            <input type="number" step="0.000001" value={longitude} onChange={(e) => setLongitude(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500" />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] uppercase text-slate-500 font-black tracking-widest">Mission ID</label>
                          <input type="text" value={requesterName} onChange={(e) => setRequesterName(e.target.value)} placeholder="Enter ID" className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500" />
                      </div>

                      <button onClick={handleTrigger} disabled={status === ConnectionStatus.SENDING} className={`mt-2 w-full p-4 rounded-lg border font-black uppercase tracking-[0.3em] transition-all shadow-xl ${status === ConnectionStatus.SENDING ? 'bg-slate-800 border-slate-700 text-slate-600' : 'bg-gradient-to-b from-cyan-600 to-cyan-800 border-cyan-400 text-white hover:from-cyan-500 active:scale-[0.98]'}`}>
                        {status === ConnectionStatus.SENDING ? 'Uplinking...' : 'Transmit Alert'}
                      </button>
                    </div>
                  </div>
                </DraggablePanel>
              </>
            )}

            {/* PANIC MODE UI - GIANT SINGLE BUTTON */}
            {isMinimalMode && (
              <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-end pb-20 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[2px]"></div>
                <div className="relative pointer-events-auto flex flex-col items-center gap-6 animate-in slide-in-from-bottom-10 duration-500">
                  <div className="text-center space-y-2 mb-4">
                     <div className="text-red-500 font-black uppercase tracking-[0.5em] text-sm drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">EMERGENCY UPLINK ACTIVE</div>
                     <div className="text-slate-400 font-mono text-[10px] opacity-60">TARGET: {latitude.toFixed(6)}, {longitude.toFixed(6)}</div>
                  </div>
                  
                  <button 
                    onClick={handleTrigger}
                    disabled={status === ConnectionStatus.SENDING}
                    className={`group relative flex items-center justify-center w-48 h-48 rounded-full border-4 transition-all duration-300 ${status === ConnectionStatus.SENDING ? 'bg-slate-900 border-slate-700' : 'bg-red-600 border-red-400 hover:bg-red-500 hover:scale-105 active:scale-95 shadow-[0_0_50px_rgba(220,38,38,0.4)]'}`}
                  >
                    {status === ConnectionStatus.SENDING ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full mb-2" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-500">Transmitting</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-12 h-12 text-white mb-2 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span className="text-xl font-black uppercase tracking-[0.1em] text-white">TRIGGER</span>
                      </div>
                    )}
                    {status !== ConnectionStatus.SENDING && (
                      <div className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-20 pointer-events-none"></div>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setIsMinimalMode(false)}
                    className="mt-4 px-6 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    Exit Minimal Mode
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <DataFeed 
            topologyResponse={topologyRes}
            onManualRefresh={() => fetchDevices(false)} 
            isLoading={isLoadingDevices} 
            projectUuid={appSettings.projectUuid}
            onProjectUuidChange={updateProjectUuid}
            isPaused={isPollingPaused}
            onTogglePause={() => setIsPollingPaused(!isPollingPaused)}
          />
        )}
      </main>

      {activeView === 'TACTICAL' && !isMinimalMode && (
        <div className="h-44 border-t border-slate-800 bg-slate-950 shrink-0 z-20 hidden md:block">
          <ConsoleLog logs={logs} />
        </div>
      )}
    </div>
  );
};

export default App;
