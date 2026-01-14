import React, { useState } from 'react';
import { 
  Sliders, Wand2, Activity, VolumeX, FileText, Plus, Shield, Sparkles, 
  Palette, Music, Video, Target, Filter, Volume2, Move, Scissors
} from 'lucide-react';

import { Clip } from '../types';

interface InspectorProps {
  selectedClip: Clip | null;
  onUpdateClip: (id: string, updates: Partial<Clip>) => void;
  onAddMarkers?: (markers: number[]) => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
}

export const Inspector: React.FC<InspectorProps> = ({ selectedClip, onUpdateClip, onAddMarkers, showToast }) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'ai' | 'color' | 'audio'>('properties');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const runAI = async (action: string) => {
    if (!selectedClip) {
        showToast?.("Please select a clip on the timeline first.", "error");
        return;
    }
    setIsProcessing(action);
    try {
      const res = await fetch('http://localhost:8000/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, file_path: selectedClip.path })
      });
      const data = await res.json();
      if (data.status === 'success' && data.output_file) {
          onUpdateClip(selectedClip.id, { 
              path: data.output_file,
              name: `AI_${selectedClip.name}`
          });
          showToast?.(`Success: Applied ${action}`, 'success');
      } else if (data.status === 'success' && data.log && action === 'scene_cut') {
          // Parse FFmpeg scdet logs: "[scdet @ ...] t: 0.500"
          const times = [...data.log.matchAll(/t:\s*([\d.]+)/g)].map(m => parseFloat(m[1]) * 100);
          onAddMarkers?.(times);
          showToast?.(`Detected ${times.length} scene changes`, 'success');
      } else {
          showToast?.(data.message || "Action completed", data.status === 'success' ? 'success' : 'error');
      }
    } catch (e) {
      showToast?.("Backend error. Is api.py running?", "error");
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="panel w-[320px] h-full bg-[#0c0c0e] flex flex-col border-l border-[#1f1f23]">
      <div className="h-10 border-b border-[#1f1f23] flex items-center justify-around bg-[#141417]">
        {[
          { id: 'properties', icon: <Sliders size={14} />, label: 'Ins' },
          { id: 'ai', icon: <Wand2 size={14} />, label: 'AI' },
          { id: 'color', icon: <Palette size={14} />, label: 'Col' },
          { id: 'audio', icon: <Music size={14} />, label: 'Aud' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 h-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-tighter ${activeTab === tab.id ? 'text-white border-b-2 border-blue-600 bg-white/5' : 'text-zinc-600 hover:text-white'}`}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {!selectedClip ? (
            <div className="h-full flex flex-col items-center justify-center text-[#52525b] opacity-40">
                <Target size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">No Selection</p>
            </div>
        ) : (
            <div className="space-y-6">
                {activeTab === 'properties' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-[#141417] p-3 rounded border border-blue-500/20">
                        <p className="text-[10px] text-zinc-600 font-black uppercase">Clip Name</p>
                        <p className="text-[11px] text-white truncate font-mono">{selectedClip.name}</p>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-blue-500">
                            <Video size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Transform</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1">
                              <span className="text-[8px] text-zinc-600 uppercase font-black">Pos X</span>
                              <input 
                                type="number" 
                                className="w-full bg-black border-[#1f1f23] text-white text-[10px] p-2 rounded outline-none" 
                                value={selectedClip.posX || 0}
                                onChange={(e) => onUpdateClip(selectedClip.id, { posX: parseInt(e.target.value) || 0 })}
                              />
                           </div>
                           <div className="space-y-1">
                              <span className="text-[8px] text-zinc-600 uppercase font-black">Pos Y</span>
                              <input 
                                type="number" 
                                className="w-full bg-black border-[#1f1f23] text-white text-[10px] p-2 rounded outline-none" 
                                value={selectedClip.posY || 0}
                                onChange={(e) => onUpdateClip(selectedClip.id, { posY: parseInt(e.target.value) || 0 })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600">
                              <span>Scale</span>
                              <span>{selectedClip.scale || 100}%</span>
                           </div>
                           <input 
                             type="range" min="1" max="500" 
                             className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-blue-600"
                             value={selectedClip.scale || 100}
                             onChange={(e) => onUpdateClip(selectedClip.id, { scale: parseInt(e.target.value) })}
                           />
                        </div>
                    </div>
                  </div>
                )}

                {activeTab === 'color' && (
                   <div className="space-y-8 animate-in slide-in-from-right duration-300">
                      <div className="space-y-4">
                         <div className="flex items-center gap-2 text-orange-500">
                            <Palette size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Primary Wheels</span>
                         </div>
                         <div className="grid grid-cols-1 gap-6">
                            {[
                               { id: 'temperature', label: 'Temp', icon: <Target size={10} />, min: -100, max: 100, def: 0 },
                               { id: 'tint', label: 'Tint', icon: <Target size={10} />, min: -100, max: 100, def: 0 },
                               { id: 'saturation', label: 'Sat', icon: <Target size={10} />, min: 0, max: 200, def: 100 },
                               { id: 'contrast', label: 'Cont', icon: <Target size={10} />, min: 0, max: 200, def: 100 }
                            ].map(p => (
                               <div key={p.id} className="space-y-2">
                                  <div className="flex justify-between text-[8px] font-black uppercase text-zinc-500">
                                     <span>{p.label}</span>
                                     <span>{(selectedClip as any)[p.id] ?? p.def}</span>
                                  </div>
                                  <input 
                                    type="range" min={p.min} max={p.max} 
                                    className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-orange-600"
                                    value={(selectedClip as any)[p.id] ?? p.def}
                                    onChange={(e) => onUpdateClip(selectedClip.id, { [p.id]: parseInt(e.target.value) })}
                                  />
                               </div>
                            ))}
                         </div>
                      </div>

                      <div className="pt-6 border-t border-[#1f1f23] space-y-4">
                         <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Luma / Chrominance</span>
                         <div className="space-y-4">
                            {['lift', 'gamma', 'gain'].map(mode => (
                               <div key={mode} className="space-y-2">
                                  <div className="flex justify-between text-[8px] font-black uppercase text-zinc-500">
                                     <span>{mode}</span>
                                     <span>{((selectedClip as any)[mode]?.g ?? 1).toFixed(2)}</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="200"
                                    className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-orange-600"
                                    value={((selectedClip as any)[mode]?.g ?? 1) * 100}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) / 100;
                                        onUpdateClip(selectedClip.id, { [mode]: { r: val, g: val, b: val } });
                                    }}
                                  />
                               </div>
                            ))}
                         </div>
                      </div>
                   </div>
                )}

                {activeTab === 'ai' && (
                  <div className="space-y-3 animate-in fade-in">
                    {[
                      { action: 'magic_mask', title: 'Magic Mask', desc: 'AI Object Isolation', icon: <Shield size={14} />, color: 'purple' },
                      { action: 'super_scale', title: 'Super Scale', desc: 'Hardware Upscaling', icon: <Plus size={14} />, color: 'blue' },
                      { action: 'smart_relight', title: 'Smart Re-light', desc: '3D Virtual Lighting', icon: <Sparkles size={14} />, color: 'orange' },
                      { action: 'face_refinement', title: 'Face Refine', desc: 'Auto Skin Retouching', icon: <Target size={14} />, color: 'rose' },
                      { action: 'voice_isolation', title: 'Voice Isolation', desc: 'Dialogue Leveler', icon: <Volume2 size={14} />, color: 'green' },
                      { action: 'scene_cut', title: 'Scene Detect', desc: 'Cut at scene changes', icon: <Scissors size={14} />, color: 'cyan' }
                    ].map(tool => (
                      <div 
                        key={tool.action} 
                        onClick={() => !isProcessing && runAI(tool.action)} 
                        className={`group border border-[#1f1f23] bg-[#141417]/30 p-3 rounded-lg hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden ${isProcessing === tool.action ? 'opacity-50' : ''}`}
                      >
                        {isProcessing === tool.action && (
                            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-blue-500 animate-[loading_2s_infinite]"></div>
                        )}
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded bg-zinc-800 text-${tool.color}-500 group-hover:bg-${tool.color}-500 group-hover:text-white transition-all`}>
                                {tool.icon}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-[10px] font-black uppercase text-white">{tool.title}</h4>
                                <p className="text-[8px] text-zinc-600 font-medium">{tool.desc}</p>
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'audio' && (
                  <div className="space-y-8 animate-in slide-in-from-right duration-300">
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 text-green-500">
                          <Music size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Audio Mixer</span>
                       </div>
                       <div className="space-y-6">
                          <div className="space-y-2">
                             <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600">
                                <span>Volume</span>
                                <span>{selectedClip.volume || 100}%</span>
                             </div>
                             <input 
                               type="range" min="0" max="200" 
                               className="w-full h-1 bg-zinc-900 rounded appearance-none cursor-pointer accent-green-600"
                               value={selectedClip.volume || 100}
                               onChange={(e) => onUpdateClip(selectedClip.id, { volume: parseInt(e.target.value) })}
                             />
                          </div>
                          <div className="pt-4 border-t border-[#1f1f23] space-y-4">
                             <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Normalization</p>
                             <button 
                               onClick={() => runAI('audio_normalize')}
                               className="w-full py-2 bg-zinc-900 border border-[#1f1f23] rounded text-[9px] font-bold uppercase tracking-widest hover:border-green-500/50 transition-all"
                             >
                               AI Loudness Leveling
                             </button>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

