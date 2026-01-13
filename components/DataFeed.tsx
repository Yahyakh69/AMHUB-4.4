import React, { useState, useEffect } from 'react';
import { Device, TopologyResponse } from '../types';

interface DataFeedProps {
  topologyResponse: TopologyResponse | null;
  onManualRefresh: () => void;
  isLoading: boolean;
  projectUuid: string;
  onProjectUuidChange: (newUuid: string) => void;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const DataFeed: React.FC<DataFeedProps> = ({ 
  topologyResponse, 
  onManualRefresh, 
  isLoading, 
  projectUuid, 
  onProjectUuidChange,
  isPaused,
  onTogglePause
}) => {
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString() + "." + new Date().getMilliseconds().toString().padStart(3, '0'));
  const [localUuid, setLocalUuid] = useState(projectUuid);
  const [activeTab, setActiveTab] = useState<'RESPONSE_BODY' | 'HEADERS'>('RESPONSE_BODY');

  useEffect(() => {
    setLocalUuid(projectUuid);
  }, [projectUuid]);

  useEffect(() => {
    if (topologyResponse) {
      const now = new Date();
      setLastUpdate(now.toLocaleTimeString() + "." + now.getMilliseconds().toString().padStart(3, '0'));
    }
  }, [topologyResponse]);

  const rawData = topologyResponse?.rawResponse || { message: "Waiting for handshake..." };
  const statusCode = topologyResponse?.code ?? 0;
  
  // Construct the visible URL for the request builder to match screenshot exactly
  const displayUrl = `/manage/api/v1.0/projects/${projectUuid}/topologies`;

  return (
    <div className="h-full w-full flex bg-[#0d0d0d] text-slate-300 font-sans text-sm overflow-hidden animate-in fade-in duration-500">
      
      {/* LEFT PANE: CONTROLS & BUILDER */}
      <div className="w-[48%] flex flex-col border-r border-[#222] p-8 gap-10 overflow-y-auto">
        
        {/* Header / Quick Actions */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
               Quick Requests
            </div>
            <div className="flex items-center gap-3 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333]">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Auto Refresh</span>
               <button 
                 onClick={onTogglePause}
                 className={`w-9 h-4 rounded-full relative transition-colors ${!isPaused ? 'bg-emerald-600' : 'bg-slate-700'}`}
               >
                 <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${!isPaused ? 'left-5.5' : 'left-0.5'}`} />
               </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             {[
               { name: 'Get Workspaces', endpoint: '/manage/api/v1/workspaces' },
               { name: 'Get Devices', endpoint: '/manage/api/v1/devices' },
               { name: 'Get Project Info', endpoint: `/manage/api/v1/projects/${projectUuid}` },
               { name: 'Get Live Streams', endpoint: '/live/api/v1/streams' },
               { name: 'Get Media Files', endpoint: '/media/api/v1/files' },
               { name: 'Get Firmware', endpoint: '/manage/api/v1/firmware/versions' }
             ].map((req, idx) => (
               <button 
                key={idx}
                className="text-left bg-[#111] border border-[#222] rounded-lg p-4 hover:border-[#444] hover:bg-[#161616] transition-all group"
               >
                 <div className="text-[11px] font-bold text-slate-200 mb-1">{req.name}</div>
                 <div className="text-[9px] font-mono text-slate-500 uppercase truncate">GET {req.endpoint}</div>
               </button>
             ))}
          </div>
        </section>

        {/* Request Builder Section - Matching User Screenshot */}
        <section className="space-y-5 flex-1">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-wider">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Request Builder
          </div>

          <div className="bg-[#111] border border-[#222] rounded-xl p-8 space-y-8 shadow-2xl">
            <div className="flex gap-2">
               <div className="relative group">
                  <select className="bg-[#080808] border border-[#333] rounded px-4 py-2.5 text-[11px] font-black text-slate-200 appearance-none pr-10 focus:outline-none focus:border-cyan-600 cursor-pointer">
                    <option>GET</option>
                    <option>POST</option>
                    <option>PUT</option>
                  </select>
                  <svg className="w-3 h-3 absolute right-3 top-3.5 text-slate-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
               </div>
               
               <div className="flex-1 bg-[#080808] border border-[#333] rounded flex items-center px-5 group hover:border-[#444] transition-colors">
                  <span className="text-cyan-400 font-mono text-xs truncate select-all">{displayUrl}</span>
               </div>
               
               <button 
                 onClick={onManualRefresh}
                 disabled={isLoading}
                 className="bg-[#0070f3] hover:bg-[#0060e0] text-white px-8 rounded-lg flex items-center gap-2.5 transition-all active:scale-95 shadow-xl shadow-blue-900/10 disabled:opacity-50"
               >
                 {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full" />
                 ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                 )}
                 <span className="text-[11px] font-black uppercase tracking-widest">Run</span>
               </button>
            </div>

            <div className="pt-4 space-y-4">
              <div className="flex flex-col gap-2">
                 <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.25em]">Project UUID Injector</label>
                 <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={localUuid}
                      onChange={(e) => setLocalUuid(e.target.value)}
                      className="flex-1 bg-[#080808] border border-[#333] rounded-lg px-5 py-2.5 text-xs font-mono text-slate-400 focus:outline-none focus:border-cyan-500/50"
                    />
                    <button 
                      onClick={() => onProjectUuidChange(localUuid)}
                      className="px-6 py-2.5 bg-[#1a1a1a] border border-[#333] rounded-lg text-[9px] font-black uppercase text-slate-400 hover:text-white hover:bg-[#222] transition-all"
                    >
                      Sync
                    </button>
                 </div>
              </div>
              <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-700"></div>
                 Base URL: <span className="text-slate-600">https://es-flight-api-us.djigate.com</span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* RIGHT PANE: RESPONSE TERMINAL */}
      <div className="flex-1 flex flex-col p-8 bg-[#0d0d0d]">
        
        <div className="flex justify-between items-end mb-5 border-b border-[#222] pb-4">
           <div className="flex gap-10">
              <button 
                onClick={() => setActiveTab('RESPONSE_BODY')}
                className={`text-[11px] font-black uppercase tracking-widest pb-4 transition-all relative ${activeTab === 'RESPONSE_BODY' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Response Body
                {activeTab === 'RESPONSE_BODY' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-500 rounded-t-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
              </button>
              <button 
                onClick={() => setActiveTab('HEADERS')}
                className={`text-[11px] font-black uppercase tracking-widest pb-4 transition-all relative ${activeTab === 'HEADERS' ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`}
              >
                Headers
                {activeTab === 'HEADERS' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-cyan-500 rounded-t-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />}
              </button>
           </div>
           
           <div className={`mb-4 px-3 py-1 rounded text-[10px] font-black tracking-wider ${statusCode === 0 || statusCode === 200 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse'}`}>
              {statusCode === 0 || statusCode === 200 ? '200' : statusCode === -999 ? 'FETCH_FAILED' : statusCode}
           </div>
        </div>

        <div className="flex-1 bg-[#0a0a0a] border border-[#222] rounded-2xl overflow-hidden flex flex-col shadow-[inset_0_2px_20px_rgba(0,0,0,0.8)]">
           <div className="flex-1 overflow-auto p-8 custom-scrollbar font-mono text-xs leading-relaxed selection:bg-cyan-500/20">
              {activeTab === 'RESPONSE_BODY' ? (
                <div className="relative">
                   <pre className="text-[#9cdcfe]">
                      <code>{JSON.stringify(rawData, null, 2)}</code>
                   </pre>
                   {statusCode === -999 && (
                      <div className="mt-8 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-[10px] space-y-2">
                         <div className="font-black uppercase tracking-widest">Diagnostic Logic:</div>
                         <p>The system failed to reach the target domain. This is usually caused by CORS restrictions or a proxy failure.</p>
                         <p><strong>Fix:</strong> Ensure "CORS Proxy" is ON in settings. If ON and still failing, the proxy service may be overloaded.</p>
                      </div>
                   )}
                </div>
              ) : (
                <div className="space-y-6 text-[11px]">
                   <div className="grid grid-cols-[160px_1fr] gap-6 py-3 border-b border-[#1a1a1a]">
                      <span className="text-slate-600 font-bold uppercase tracking-widest">Protocol</span>
                      <span className="text-cyan-500">HTTP/2.0 TLSv1.3</span>
                   </div>
                   <div className="grid grid-cols-[160px_1fr] gap-6 py-3 border-b border-[#1a1a1a]">
                      <span className="text-slate-600 font-bold uppercase tracking-widest">Content-Type</span>
                      <span className="text-cyan-400">application/json; charset=utf-8</span>
                   </div>
                   <div className="grid grid-cols-[160px_1fr] gap-6 py-3 border-b border-[#1a1a1a]">
                      <span className="text-slate-600 font-bold uppercase tracking-widest">X-Project-UUID</span>
                      <span className="text-cyan-400">{projectUuid}</span>
                   </div>
                   <div className="grid grid-cols-[160px_1fr] gap-6 py-3 border-b border-[#1a1a1a]">
                      <span className="text-slate-600 font-bold uppercase tracking-widest">X-Handshake-TS</span>
                      <span className="text-cyan-400">{lastUpdate}</span>
                   </div>
                </div>
              )}
           </div>
           
           {/* Terminal Footer Indicator */}
           <div className="bg-[#080808] border-t border-[#1a1a1a] px-6 py-3 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-slate-600">
                 <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${!isPaused ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`} />
                    {!isPaused ? 'LIVE STREAM ACTIVE' : 'POLLING PAUSED'}
                 </div>
                 <div className="h-3 w-px bg-slate-800"></div>
                 <span>Handshake: {lastUpdate}</span>
              </div>
              <div className="text-[9px] text-slate-800 font-black uppercase tracking-widest">
                 SECURE PIPE V4.1
              </div>
           </div>
        </div>

      </div>

    </div>
  );
};
