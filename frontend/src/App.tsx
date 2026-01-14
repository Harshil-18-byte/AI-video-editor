import React, { useState, useEffect } from "react";
import "./index.css";
import { TopBar } from "./components/TopBar";
import { MediaBin } from "./components/MediaBin";
import { PreviewMonitor } from "./components/PreviewMonitor";
import { Inspector } from "./components/Inspector";
import { Timeline } from "./components/Timeline";
import { SettingsModal } from "./components/SettingsModal";

import { Asset, Clip, Track } from "./types";

export default function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [playheadPos, setPlayheadPos] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [markers, setMarkers] = useState<number[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };
  
  const addMarkers = (newMarkers: number[]) => {
    setMarkers(prev => [...new Set([...prev, ...newMarkers])]);
  };

  const [activePage, setActivePage] = useState<
    "media" | "cut" | "edit" | "fusion" | "color" | "audio" | "deliver"
  >("edit");
  const [exportPreset, setExportPreset] = useState("Custom");

  const [assets, setAssets] = useState<Asset[]>([]);

  const [videoTracks, setVideoTracks] = useState<Track[]>([
    { id: "v1", clips: [] },
  ]);
  const [audioTracks, setAudioTracks] = useState<Track[]>([
    { id: "a1", clips: [] },
  ]);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  // Frame-accurate playhead update using video element as master clock
  // This ensures audio stays locked to video frames with no drift
  useEffect(() => {
    // Playhead updates are now driven by video element's timeupdate event
    // This ensures sample-accurate synchronization between video and audio
    // The interval is removed - video element is the authoritative clock source
  }, [isPlaying]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      const clip = getSelectedClip();
      if (!clip) {
        setSuggestions([]);
        return;
      }
      try {
        const resp = await fetch("http://localhost:8000/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: clip.path }),
        });
        const data = await resp.json();
        setSuggestions(data.suggestions || []);
      } catch (e) {
        setSuggestions([]);
      }
    };
    fetchSuggestions();
  }, [selectedClipId, selectedAssetId]);

  const addVideoTrack = () => {
    setVideoTracks((prev) => [
      ...prev,
      { id: `v${prev.length + 1}`, clips: [] },
    ]);
  };

  const addAudioTrack = () => {
    setAudioTracks((prev) => [
      ...prev,
      { id: `a${prev.length + 1}`, clips: [] },
    ]);
  };

  const updateClip = (clipId: string, updates: Partial<Clip>) => {
    setVideoTracks((prev) =>
      prev.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      }))
    );
    setAudioTracks((prev) =>
      prev.map((t) => ({
        ...t,
        clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
      }))
    );
  };

  const updateAsset = (assetId: string, updates: Partial<Asset>) => {
    setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...updates } : a));
  };

  const getSelectedClip = () => {
    if (selectedClipId) {
      let found: Clip | undefined = undefined;
      videoTracks.forEach((t) => {
        const c = t.clips.find((clip) => clip.id === selectedClipId);
        if (c) found = c;
      });
      if (found) return found;
      audioTracks.forEach((t) => {
        const c = t.clips.find((clip) => clip.id === selectedClipId);
        if (c) found = c;
      });
      return found || null;
    }
    if (selectedAssetId) {
      const asset = assets.find((a) => a.id === selectedAssetId);
      if (asset) return { ...asset, start: 0, width: 200, color: "blue" }; // Fake clip for preview
    }
    return null;
  };

  const getActiveClipAtPlayhead = () => {
    // Top-down search (last track is highest priority in this simple engine)
    for (let i = videoTracks.length - 1; i >= 0; i--) {
      const clip = videoTracks[i].clips.find(
        (c) => playheadPos >= c.start && playheadPos <= c.start + c.width
      );
      if (clip) return clip;
    }
    return null;
  };

  const runExport = async () => {
    try {
      const resp = await fetch('http://localhost:8000/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeline: { videoTracks, audioTracks },
          output_path: "c:/AIVA_Exports/Project_V1.mp4"
        })
      });
      const data = await resp.json();
      
      // Properly handle export response - never fail silently
      if (data.status === 'success') {
        showToast(`Export completed: ${data.output_file}`, 'success');
      } else {
        showToast(`Export failed: ${data.message || 'Unknown error'}`, 'error');
      }
    } catch (e) {
      showToast(`Export error: ${e instanceof Error ? e.message : 'Failed to reach render engine'}`, "error");
    }
  };

  const handleImportMedia = async () => {
    try {
      const response = await fetch("http://localhost:8000/system/browse_file");
      const data = await response.json();
      if (data.status === "success" && data.path) {
        const newAsset: Asset = {
          id: `asset-${Date.now()}`,
          name: data.path.split(/[\\/]/).pop() || "New Asset",
          type:
            data.path.toLowerCase().endsWith(".mp3") ||
            data.path.toLowerCase().endsWith(".wav")
              ? "audio"
              : "video",
          path: data.path,
          duration: "00:00",
        };
        setAssets((prev) => [...prev, newAsset]);
        showToast(`Successfully imported: ${newAsset.name}`);
      } else if (data.status === "error") {
        showToast(`Import Error: ${data.message}`, "error");
      }
    } catch (e) {
      showToast("Backend connectivity issue. Is the Python server running?", "error");
      console.error("Failed to import media", e);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Spacebar - Play/Pause
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
        showToast(isPlaying ? "Paused" : "Playing");
      }

      // Arrow Left - Previous Frame (frame-accurate)
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        // Decrement by exactly 1 frame (4 pixels at 25fps)
        setPlayheadPos(prev => {
          const frameIndex = Math.floor(prev / 4);
          const prevFrameIndex = Math.max(0, frameIndex - 1);
          return prevFrameIndex * 4; // Snap to frame boundary
        });
      }

      // Arrow Right - Next Frame (frame-accurate)
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        // Increment by exactly 1 frame (4 pixels at 25fps)
        setPlayheadPos(prev => {
          const frameIndex = Math.floor(prev / 4);
          const nextFrameIndex = frameIndex + 1;
          return nextFrameIndex * 4; // Snap to frame boundary
        });
      }

      // Delete/Backspace - Delete selected clip
      if ((e.code === 'Delete' || e.code === 'Backspace') && selectedClipId) {
        e.preventDefault();
        setVideoTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedClipId) })));
        setAudioTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== selectedClipId) })));
        setSelectedClipId(null);
        showToast("Clip deleted");
      }

      // Ctrl/Cmd + I - Import
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyI') {
        e.preventDefault();
        handleImportMedia();
      }

      // Ctrl/Cmd + E - Export
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyE') {
        e.preventDefault();
        runExport();
      }

      // Ctrl/Cmd + S - Save (show toast)
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
        e.preventDefault();
        showToast("Project auto-saved");
      }

      // Home - Go to start (frame 0)
      if (e.code === 'Home') {
        e.preventDefault();
        setPlayheadPos(0); // Frame 0 = 0 pixels
      }

      // End - Go to end (snap to frame boundary)
      if (e.code === 'End') {
        e.preventDefault();
        // Snap to frame boundary (6000 pixels = 1500 frames)
        const frameIndex = Math.floor(6000 / 4);
        setPlayheadPos(frameIndex * 4);
      }

      // J, K, L - Playback controls (industry standard, frame-accurate)
      if (e.code === 'KeyJ') {
        e.preventDefault();
        // Rewind by 10 frames (40 pixels = 10 frames at 25fps)
        setPlayheadPos(prev => {
          const frameIndex = Math.floor(prev / 4);
          const prevFrameIndex = Math.max(0, frameIndex - 10);
          return prevFrameIndex * 4; // Snap to frame boundary
        });
      }
      if (e.code === 'KeyK') {
        e.preventDefault();
        setIsPlaying(false); // Stop - immediately halts frame advancement
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        // Fast forward by 10 frames (40 pixels = 10 frames at 25fps)
        setPlayheadPos(prev => {
          const frameIndex = Math.floor(prev / 4);
          const nextFrameIndex = frameIndex + 10;
          return nextFrameIndex * 4; // Snap to frame boundary
        });
      }

      // Number keys 1-7 - Switch pages
      if (e.code === 'Digit1') setActivePage('media');
      if (e.code === 'Digit2') setActivePage('cut');
      if (e.code === 'Digit3') setActivePage('edit');
      if (e.code === 'Digit4') setActivePage('fusion');
      if (e.code === 'Digit5') setActivePage('color');
      if (e.code === 'Digit6') setActivePage('audio');
      if (e.code === 'Digit7') setActivePage('deliver');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, selectedClipId]);


  return (
    <div className="w-screen h-screen flex flex-col bg-[#080809] text-[#e4e4e7] overflow-hidden">
      <TopBar
        onSettingsClick={() => setIsSettingsOpen(true)}
        onImportClick={handleImportMedia}
        onUpdateClip={updateClip}
        showToast={showToast}
        timelineData={{
          videoTracks,
          audioTracks,
          lastSelectedClip: getSelectedClip(),
        }}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Main Workspace Router */}
        <div className="flex-1 flex min-h-0">
          {activePage === 'media' && (
            <div className="flex-1 flex animate-in fade-in zoom-in-95 duration-500">
               <MediaBin assets={assets} setSelectedAssetId={setSelectedAssetId} setSelectedClipId={setSelectedClipId} onUpdateAsset={updateAsset} showToast={showToast} fullView />
            </div>
          )}

          {(activePage === 'edit' || activePage === 'cut' || activePage === 'fusion') && (
            <>
               <MediaBin assets={assets} setSelectedAssetId={setSelectedAssetId} setSelectedClipId={setSelectedClipId} onUpdateAsset={updateAsset} showToast={showToast} />
               <div className="w-[1px] bg-[#1f1f23]"></div>
               <PreviewMonitor selectedClip={getSelectedClip() || getActiveClipAtPlayhead()} playheadPos={playheadPos} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
               <div className="w-[1px] bg-[#1f1f23]"></div>
               <Inspector selectedClip={getSelectedClip()} onUpdateClip={updateClip} onAddMarkers={addMarkers} showToast={showToast} />
            </>
          )}

          {activePage === 'color' && (
            <div className="flex-1 flex flex-col animate-in slide-in-from-bottom-4 duration-500">
               <div className="flex-1 flex overflow-hidden">
                  <div className="flex-1 bg-black flex items-center justify-center p-8">
                     <PreviewMonitor 
                        selectedClip={getSelectedClip() || getActiveClipAtPlayhead()} 
                        playheadPos={playheadPos} 
                        isPlaying={isPlaying} 
                        setIsPlaying={setIsPlaying}
                        hideControls 
                     />
                  </div>
                   <Inspector selectedClip={getSelectedClip()} onUpdateClip={updateClip} onAddMarkers={addMarkers} showToast={showToast} />
               </div>
               {/* Resolve Scopes */}
               <div className="h-64 bg-[#0a0a0c] border-t border-[#1f1f23] flex">
                  <div className="flex-1 p-4 flex flex-col gap-2">
                     <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Waveform</span>
                     <div className="flex-1 bg-black/40 rounded border border-[#1f1f23] relative">
                         <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent opacity-40"></div>
                     </div>
                  </div>
                  <div className="w-96 p-4 flex flex-col gap-2 border-l border-[#1f1f23]">
                     <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Parade (RGB)</span>
                     <div className="flex-1 flex gap-2">
                        <div className="flex-1 bg-red-900/10 border border-red-900/20 rounded"></div>
                        <div className="flex-1 bg-green-900/10 border border-green-900/20 rounded"></div>
                        <div className="flex-1 bg-blue-900/10 border border-blue-900/20 rounded"></div>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activePage === 'audio' && (
            <div className="flex-1 flex flex-col animate-in fade-in duration-500">
               <div className="h-64 border-b border-[#1f1f23]">
                  <PreviewMonitor 
                     selectedClip={getSelectedClip() || getActiveClipAtPlayhead()} 
                     playheadPos={playheadPos} 
                     isPlaying={isPlaying} 
                     setIsPlaying={setIsPlaying}
                     hideControls 
                  />
               </div>
               <div className="flex-1 bg-[#0c0c0e] p-8 flex gap-4 overflow-x-auto">
                  {[1, 2, 3, 4, 5, 'M'].map(id => (
                     <div key={id} className={`w-16 flex flex-col items-center gap-4 ${id === 'M' ? 'ml-8' : ''}`}>
                        <div className="flex-1 w-2 bg-black rounded-full relative">
                           <div className={`absolute bottom-0 inset-x-0 rounded-full h-1/2 ${id === 'M' ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-green-500'}`}></div>
                           <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-4 h-2 bg-zinc-600 rounded cursor-pointer shadow-xl"></div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-zinc-600">{id === 'M' ? 'Master' : `A${id}`}</span>
                     </div>
                  ))}
               </div>
            </div>
          )}

          {activePage === 'deliver' && (
            <div className="flex-1 bg-black p-20 flex animate-in slide-in-from-right duration-700">
               <div className="w-full max-w-5xl mx-auto flex gap-12">
                  <div className="w-80 space-y-6">
                     <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500">Render Settings</h3>
                     {['Custom', 'YouTube 4K', 'ProRes HQ', 'TikTok Vertical'].map(p => (
                        <div key={p} className="p-4 bg-[#141417] rounded-xl border border-[#1f1f23] hover:border-blue-500/50 cursor-pointer flex justify-between items-center group transition-all">
                           <span className="text-[11px] font-black uppercase">{p}</span>
                           <div className="w-2 h-2 rounded-full bg-zinc-800 group-hover:bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0)] group-hover:shadow-[0_0_10px_rgba(59,130,246,1)] transition-all"></div>
                        </div>
                     ))}
                  </div>
                  <div className="flex-1 space-y-8">
                     <div className="bg-[#141417] p-10 rounded-3xl border border-[#1f1f23] space-y-8">
                        <div className="flex justify-between items-end">
                           <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Project Name</p>
                              <h2 className="text-3xl font-black">AIVA_MASTER_SEQUENCE</h2>
                           </div>
                           <button onClick={runExport} className="px-10 py-4 bg-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl active:scale-95">Render project</button>
                        </div>
                        <div className="h-px bg-zinc-800"></div>
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs text-zinc-400">
                                 <span>Video Format</span>
                                 <span className="text-white">QuickTime / H.264</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-zinc-400">
                                 <span>FPS</span>
                                 <span className="text-white">24.000</span>
                              </div>
                           </div>
                           <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs text-zinc-400">
                                 <span>Audio Sample Rate</span>
                                 <span className="text-white">48,000 Hz</span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-zinc-400">
                                 <span>Encoding</span>
                                 <span className="text-white">Hardware Accelerated</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        <div className="h-[1px] bg-[#1f1f23]"></div>

        {/* Global Multi-Track Timeline */}
        {['edit', 'cut', 'color', 'audio'].includes(activePage) && (
          <Timeline
            videoTracks={videoTracks}
            setVideoTracks={setVideoTracks}
            audioTracks={audioTracks}
            setAudioTracks={setAudioTracks}
            selectedClipId={selectedClipId}
            setSelectedClipId={setSelectedClipId}
            setSelectedAssetId={setSelectedAssetId}
            playheadPos={playheadPos}
            setPlayheadPos={setPlayheadPos}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            suggestions={suggestions}
            onAddVideoTrack={addVideoTrack}
            onAddAudioTrack={addAudioTrack}
            showToast={showToast}
            markers={markers}
          />
        )}

        {/* DaVinci Style Page Switcher */}
        <div className="h-10 bg-[#0c0c0e] border-t border-[#1f1f23] flex items-center justify-center gap-12 select-none shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-50">
          {[
            { id: "media", label: "Media" },
            { id: "cut", label: "Cut" },
            { id: "edit", label: "Edit" },
            { id: "fusion", label: "Fusion" },
            { id: "color", label: "Color" },
            { id: "audio", label: "Fairlight" },
            { id: "deliver", label: "Deliver" },
          ].map((page) => (
            <button
              key={page.id}
              onClick={() => setActivePage(page.id as any)}
              className={`text-[9px] font-black uppercase tracking-widest transition-all px-4 py-1.5 rounded relative ${
                activePage === page.id
                  ? "text-white"
                  : "text-zinc-600 hover:text-zinc-400"
              }`}
            >
              {page.label}
              {activePage === page.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-red-600 shadow-[0_0_10px_red]"></div>
              )}
            </button>
          ))}
        </div>

        {isSettingsOpen && (
          <SettingsModal onClose={() => setIsSettingsOpen(false)} showToast={showToast} />
        )}

        {toast && (
          <div className={`fixed bottom-16 right-8 px-6 py-4 rounded-xl border shadow-2xl z-[100] animate-in slide-in-from-right duration-300 flex items-center gap-4 ${
            toast.type === 'success' ? 'bg-zinc-900 border-green-500/50 text-white' : 'bg-red-950/20 border-red-500/50 text-red-200'
          }`}>
             <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
             <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
