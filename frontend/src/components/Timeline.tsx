import React, { useState } from 'react';
import { 
  Scissors, Type, ArrowRight, Trash2, 
  Mic, Eye, Lock, GripVertical, Sparkles, Wand2, Plus, EyeOff, Unlock, MicOff
} from 'lucide-react';

import { Clip, Track } from '../types';

interface TimelineProps {
  videoTracks: Track[];
  setVideoTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  audioTracks: Track[];
  setAudioTracks: React.Dispatch<React.SetStateAction<Track[]>>;
  selectedClipId: string | null;
  setSelectedClipId: (id: string | null) => void;
  setSelectedAssetId: (id: string | null) => void;
  playheadPos: number;
  setPlayheadPos: (pos: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  suggestions: any[];
  onAddVideoTrack: () => void;
  onAddAudioTrack: () => void;
  showToast?: (message: string, type: 'success' | 'error') => void;
  markers?: number[];
}

export const Timeline: React.FC<TimelineProps> = ({ 
    videoTracks, setVideoTracks, 
    audioTracks, setAudioTracks, 
    selectedClipId, setSelectedClipId,
    setSelectedAssetId,
    playheadPos, setPlayheadPos,
    isPlaying, setIsPlaying,
    suggestions,
    onAddVideoTrack,
    onAddAudioTrack,
    showToast,
    markers
}) => {
  const [tool, setTool] = useState<'select' | 'razor'>('select');
  const [magneticMode, setMagneticMode] = useState(true);
  const [draggingClip, setDraggingClip] = useState<{ id: string, type: 'v'|'a', trackId: string, edge?: 'left'|'right' } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [initialClipState, setInitialClipState] = useState<{ start: number, width: number } | null>(null);
  
  // Track State Management
  const [trackStates, setTrackStates] = useState<Record<string, { hidden?: boolean, locked?: boolean, muted?: boolean }>>({});

  const toggleTrackState = (trackId: string, key: 'hidden' | 'locked' | 'muted') => {
    setTrackStates(prev => ({
      ...prev,
      [trackId]: {
        ...prev[trackId],
        [key]: !prev[trackId]?.[key]
      }
    }));
  };

  const handleMouseDown = (e: React.MouseEvent, clipId: string, trackId: string, type: 'v'|'a', start: number, width: number, edge?: 'left'|'right') => {
    if (tool !== 'select') return;
    
    // Check lock state
    if (trackStates[trackId]?.locked) {
        showToast?.("Track is locked", "error");
        return;
    }

    e.stopPropagation();
    setSelectedClipId(clipId);
    setDraggingClip({ id: clipId, type, trackId, edge });
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset(e.clientX);
    setInitialClipState({ start, width });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingClip || !initialClipState) return;
    const deltaX = e.clientX - dragOffset;
    
    const updateTracks = (prev: Track[]) => prev.map(t => t.id === draggingClip.trackId ? {
      ...t, clips: t.clips.map(c => {
        if (c.id !== draggingClip.id) return c;
        if (!draggingClip.edge) {
            let newX = initialClipState.start + deltaX;
            return { ...c, start: Math.max(0, newX) };
        } else if (draggingClip.edge === 'left') {
            let newStart = initialClipState.start + deltaX;
            let newWidth = initialClipState.width - deltaX;
            if (newWidth < 1) return c;
            return { ...c, start: Math.max(0, newStart), width: newWidth };
        } else {
            let newWidth = initialClipState.width + deltaX;
            return { ...c, width: Math.max(1, newWidth) };
        }
      })
    } : t);

    if (draggingClip.type === 'v') setVideoTracks(updateTracks);
    else setAudioTracks(updateTracks);
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
      setSelectedClipId(null);
      setSelectedAssetId(null);
      
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x > 192) {
          const rawPos = x - 192;
          // Snap to exact frame boundary (4 pixels per frame at 25fps)
          // Frame index is the single source of truth
          const frameIndex = Math.floor(rawPos / 4);
          const snappedPos = frameIndex * 4;
          setPlayheadPos(snappedPos);
          if (tool === 'razor') handleSplit(snappedPos);
      }
  };

  const findFirstGap = (trackId: string, type: 'v' | 'a') => {
    const tracks = type === 'v' ? videoTracks : audioTracks;
    const track = tracks.find(t => t.id === trackId);
    if (!track || track.clips.length === 0) return 0;
    return Math.max(...track.clips.map(c => c.start + c.width));
  };

  const handleDrop = (e: React.DragEvent, trackId: string, trackType: 'v' | 'a') => {
    e.preventDefault();
    
    if (trackStates[trackId]?.locked) {
       showToast?.("Track is locked", "error");
       return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    let x = e.clientX - rect.left;
    if (x < 0) x = 0;

    const assetData = e.dataTransfer.getData('application/aiva-asset');
    if (!assetData) return;
    const asset = JSON.parse(assetData);

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      name: asset.name,
      path: asset.path,
      start: x,
      width: asset.type === 'transition' ? 40 : 200, 
      type: asset.type,
      color: asset.type === 'transition' ? '#9333ea' : (trackType === 'v' ? '#2563eb' : '#16a34a')
    };
      
    if (trackType === 'v') {
      setVideoTracks(prev => prev.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t));
    } else {
      setAudioTracks(prev => prev.map(t => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t));
    }
  };

  const handleSplit = async (pos: number) => {
    let targetClip: Clip | null = null;
    
    const nextVideoTracks = videoTracks.map(track => {
      const clipIndex = track.clips.findIndex(c => pos > c.start && pos < (c.start + c.width));
      if (clipIndex === -1) return track;
      const clip = track.clips[clipIndex];
      targetClip = clip;
      const part1Id = `${clip.id}_p1`;
      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, 
        { ...clip, id: part1Id, width: pos - clip.start },
        { ...clip, id: `${clip.id}_p2`, start: pos, width: clip.width - (pos - clip.start) }
      );
      setSelectedClipId(part1Id);
      return { ...track, clips: newClips };
    });

    const nextAudioTracks = audioTracks.map(track => {
      const clipIndex = track.clips.findIndex(c => pos > c.start && pos < (c.start + c.width));
      if (clipIndex === -1) return track;
      const clip = track.clips[clipIndex];
      if (!targetClip) targetClip = clip;
      const part1Id = `${clip.id}_p1`;
      const newClips = [...track.clips];
      newClips.splice(clipIndex, 1, 
        { ...clip, id: part1Id, width: pos - clip.start },
        { ...clip, id: `${clip.id}_p2`, start: pos, width: clip.width - (pos - clip.start) }
      );
      setSelectedClipId(part1Id);
      return { ...track, clips: newClips };
    });

    setVideoTracks(nextVideoTracks);
    setAudioTracks(nextAudioTracks);

    if (targetClip) {
      setTool('select');
      try {
        await fetch('http://localhost:8000/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cut_clip', file_path: (targetClip as Clip).path, params: { timestamp: pos / 100 } })
        });
      } catch (e) {}
    }
  };

  const handleDelete = () => {
    if (!selectedClipId) return;
    setVideoTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedClipId) })));
    setAudioTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedClipId) })));
    setSelectedClipId(null);
  };

  return (
    <div className="panel h-[320px] bg-[#0c0c0e] flex flex-col border-t border-[#2c2c30] select-none">
      <div className="h-10 border-b border-[#2c2c30] flex items-center px-4 justify-between bg-[#141417]">
        <div className="flex items-center gap-2">
          <button onClick={() => setTool('select')} className={`p-1.5 rounded transition-all ${tool === 'select' ? 'bg-blue-600' : 'hover:bg-[#2c2c30]'}`} title="Selection Tool (V)"><ArrowRight size={14} /></button>
          <button onClick={() => setTool('razor')} className={`p-1.5 rounded transition-all ${tool === 'razor' ? 'bg-red-600' : 'hover:bg-[#2c2c30]'}`} title="Razor Tool (C)"><Scissors size={14} /></button>
          <div className="w-[1px] h-4 bg-[#2c2c30] mx-1"></div>
          <button onClick={() => setMagneticMode(!magneticMode)} className={`p-1.5 rounded transition-all ${magneticMode ? 'text-blue-400' : 'text-[#52525b] hover:bg-[#2c2c30]'}`} title="Magnetic Timeline"><GripVertical size={14} /></button>
          <button className="btn-icon text-red-500" onClick={handleDelete} title="Ripple Delete (Del)"><Trash2 size={14} /></button>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#a1a1aa]">
           <span className="text-blue-400 font-bold tracking-tighter">PLAYHEAD: {playheadPos.toFixed(0)}f</span>
           <span className="bg-black/40 px-2 py-0.5 rounded border border-white/5">{(() => {
              const totalSeconds = playheadPos / 100;
              const m = Math.floor(totalSeconds / 60);
              const s = Math.floor(totalSeconds % 60);
              const f = Math.floor((playheadPos % 100) / 4);
              return `00:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}:${f.toString().padStart(2,'0')}`;
           })()}</span>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-48 bg-[#141417] border-r border-[#2c2c30] flex flex-col pt-2 overflow-y-auto track-hide-scrollbar">
          {videoTracks.map((t, i) => (
            <div key={t.id} className={`h-16 border-b border-[#2c2c30] flex items-center justify-between px-3 group ${trackStates[t.id]?.locked ? 'bg-red-900/10' : ''} ${trackStates[t.id]?.hidden ? 'opacity-50' : ''}`}>
              <span className="text-[10px] font-bold text-[#52525b]">VIDEO V{i+1}</span>
              <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                <button title={trackStates[t.id]?.hidden ? "Show Track" : "Hide Track"} onClick={() => toggleTrackState(t.id, 'hidden')} className={`p-1 hover:text-white ${trackStates[t.id]?.hidden ? 'text-zinc-500' : 'text-blue-500'}`}>{trackStates[t.id]?.hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
                <button title={trackStates[t.id]?.locked ? "Unlock Track" : "Lock Track"} onClick={() => toggleTrackState(t.id, 'locked')} className={`p-1 hover:text-white ${trackStates[t.id]?.locked ? 'text-red-500' : 'text-zinc-500'}`}>{trackStates[t.id]?.locked ? <Lock size={12} /> : <Unlock size={12} />}</button>
              </div>
            </div>
          ))}
          <button 
            onClick={onAddVideoTrack}
            className="flex items-center gap-2 px-3 py-2 text-[8px] font-black text-[#3f3f46] hover:text-blue-400 hover:bg-blue-400/5 transition-all uppercase tracking-widest border-b border-[#2c2c30]"
          >
            <Plus size={10} /> Add Video Track
          </button>

          <div className="h-4 bg-[#0a0a0c]"></div>
          
          {audioTracks.map((t, i) => (
            <div key={t.id} className={`h-16 border-b border-[#2c2c30] flex items-center justify-between px-3 group bg-[#0f0f11] ${trackStates[t.id]?.locked ? 'bg-red-900/10' : ''} ${trackStates[t.id]?.muted ? 'opacity-75' : ''}`}>
              <span className="text-[10px] font-bold text-[#52525b]">AUDIO A{i+1}</span>
              <div className="flex gap-1 opacity-10 group-hover:opacity-100 transition-opacity">
                <button title={trackStates[t.id]?.muted ? "Unmute Track" : "Mute Track"} onClick={() => toggleTrackState(t.id, 'muted')} className={`p-1 hover:text-white ${trackStates[t.id]?.muted ? 'text-red-500' : 'text-green-500'}`}>{trackStates[t.id]?.muted ? <MicOff size={12} /> : <Mic size={12} />}</button>
                <button title={trackStates[t.id]?.locked ? "Unlock Track" : "Lock Track"} onClick={() => toggleTrackState(t.id, 'locked')} className={`p-1 hover:text-white ${trackStates[t.id]?.locked ? 'text-red-500' : 'text-zinc-500'}`}>{trackStates[t.id]?.locked ? <Lock size={12} /> : <Unlock size={12} />}</button>
              </div>
            </div>
          ))}
          <button 
            onClick={onAddAudioTrack}
            className="flex items-center gap-2 px-3 py-2 text-[8px] font-black text-[#3f3f46] hover:text-green-400 hover:bg-green-400/5 transition-all uppercase tracking-widest border-b border-[#2c2c30]"
          >
            <Plus size={10} /> Add Audio Track
          </button>
        </div>

        <div className="flex-1 bg-[#0c0c0e] relative overflow-auto custom-scrollbar" 
             onMouseMove={handleMouseMove} 
             onMouseUp={() => setDraggingClip(null)}
             onMouseLeave={() => setDraggingClip(null)}
             onClick={handleTimelineClick} 
             onDragOver={(e) => e.preventDefault()}>
            <div className="h-6 bg-[#141417] border-b border-[#2c2c30] sticky top-0 z-20 w-[6000px] flex items-end">
              {[...Array(60)].map((_, i) => (
                 <div key={i} className="min-w-[100px] text-[8px] text-[#3f3f46] border-l border-[#1f1f23] pl-1 h-3 flex items-end pb-0.5 font-mono">00:{i < 10 ? `0${i}` : i}:00</div>
              ))}
            </div>
            
            <div className="absolute top-0 h-full w-[1px] bg-red-600 z-30 pointer-events-none" style={{ left: `${playheadPos}px` }}>
              <div className="w-5 h-5 -ml-2.5 bg-red-600 rounded-b"></div>
            </div>

            <div className="relative w-[6000px] pt-0">
               <div className="absolute inset-0 z-0">
                 {markers?.map((m, i) => (
                   <div key={i} className="absolute top-0 bottom-0 w-[1px] bg-red-600/50 shadow-[0_0_10px_rgba(220,38,38,0.5)] pointer-events-none" style={{ left: `${m}px` }}>
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                   </div>
                 ))}
               </div>
              {videoTracks.map(track => (
                <div key={track.id} className={`h-16 border-b border-[#1f1f23]/50 relative transition-all ${trackStates[track.id]?.hidden ? 'opacity-20 grayscale pointer-events-none' : ''} ${trackStates[track.id]?.locked ? 'bg-red-900/5' : ''}`} onDrop={(e) => handleDrop(e, track.id, 'v')}>
                   {track.clips.map(clip => (
                     <div key={clip.id} 
                      onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'v', clip.start, clip.width)}
                      className={`absolute top-1 bottom-1 border rounded shadow-2xl transition-all cursor-move select-none ${selectedClipId === clip.id ? 'bg-blue-600 border-white z-10 scale-[1.015]' : (clip.type === 'transition' ? 'bg-purple-600/60 border-purple-400' : 'bg-blue-900/40 border-blue-500/30')}`}
                      style={{ left: `${clip.start}px`, width: `${clip.width}px` }}>
                       <div onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'v', clip.start, clip.width, 'left')} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-20" />
                       <div onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'v', clip.start, clip.width, 'right')} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-20" />
                       <div className="px-2 py-1 text-[9px] text-white truncate font-bold uppercase tracking-tighter opacity-90 pointer-events-none">{clip.name}</div>
                     </div>
                   ))}
                </div>
              ))}
              <div className="h-6 bg-[#0a0a0c]"></div>
              {audioTracks.map(track => (
                <div key={track.id} className={`h-16 border-b border-[#1f1f23]/50 relative bg-[#0f0f11] transition-all ${trackStates[track.id]?.muted ? 'opacity-50 grayscale' : ''} ${trackStates[track.id]?.locked ? 'bg-red-900/5' : ''}`} onDrop={(e) => handleDrop(e, track.id, 'a')}>
                   {track.clips.map(clip => (
                     <div key={clip.id} 
                      onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'a', clip.start, clip.width)}
                      className={`absolute top-1 bottom-1 border rounded shadow-2xl transition-all cursor-move select-none ${selectedClipId === clip.id ? 'bg-green-600 border-white z-10 scale-[1.015]' : (clip.type === 'transition' ? 'bg-purple-600/60 border-purple-400' : 'bg-green-900/40 border-green-500/30')}`}
                      style={{ left: `${clip.start}px`, width: `${clip.width}px` }}>
                       <div onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'a', clip.start, clip.width, 'left')} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-20" />
                       <div onMouseDown={(e) => handleMouseDown(e, clip.id, track.id, 'a', clip.start, clip.width, 'right')} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/20 z-20" />
                       <div className="px-2 py-1 text-[9px] text-white truncate font-bold uppercase tracking-tighter opacity-90 pointer-events-none">{clip.name}</div>
                     </div>
                   ))}
                </div>
              ))}
            </div>

            {/* AI Smart Suggestions Ribbon */}
            {suggestions.length > 0 && (
              <div className="sticky bottom-0 left-0 right-0 h-10 bg-[#18181b]/95 backdrop-blur-md border-t border-blue-500/20 z-40 flex items-center px-4 gap-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex items-center gap-2 text-blue-400">
                  <Sparkles size={14} className="animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest">AI Insights</span>
                </div>
                <div className="h-4 w-[1px] bg-[#2c2c30]"></div>
                <div className="flex items-center gap-2 overflow-x-auto track-hide-scrollbar flex-1">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const runAction = async () => {
                           if (!selectedClipId) return;
                           try {
                             const clip = [...videoTracks, ...audioTracks].flatMap(t => t.clips).find(c => c.id === selectedClipId);
                             if (!clip) return;
                             const res = await fetch('http://localhost:8000/apply', {
                               method: 'POST',
                               headers: { 'Content-Type': 'application/json' },
                               body: JSON.stringify({ action: s.action, file_path: clip.path, params: {} })
                             });
                             const data = await res.json();
                             if (data.status === 'success' && data.output_file) {
                                const nextV = videoTracks.map(t => ({...t, clips: t.clips.map(c => c.id === selectedClipId ? {...c, path: data.output_file, name: `AI_${c.name}`} : c)}));
                                const nextA = audioTracks.map(t => ({...t, clips: t.clips.map(c => c.id === selectedClipId ? {...c, path: data.output_file, name: `AI_${c.name}`} : c)}));
                                setVideoTracks(nextV);
                                setAudioTracks(nextA);
                             }
                             showToast?.(`Applied: ${s.title}`, 'success');
                           } catch (e) { showToast?.("Failed to apply suggestion.", "error"); }
                        };
                       runAction();
                      }}
                      className="flex items-center gap-2 px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-full transition-all group"
                    >
                      <Wand2 size={10} className="text-blue-400 group-hover:rotate-12 transition-transform" />
                      <div className="flex flex-col items-start leading-none gap-0.5">
                        <span className="text-[9px] text-blue-100 font-bold">{s.title}</span>
                        <span className="text-[7px] text-blue-400/60 font-medium">{s.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
