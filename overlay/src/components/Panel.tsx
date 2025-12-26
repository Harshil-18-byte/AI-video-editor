import { useEffect, useState } from "react";
import SuggestionCard from "./SuggestionCard";
import Timeline from "./Timeline";
import { isDemoMode, toggleDemoMode } from "../utils/demo";

export default function Panel(props: any) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [progress, setProgress] = useState(0.3);

  useEffect(() => {
    if (isDemoMode()) {
      setSuggestions([
        {
          title: "Remove silence",
          reason: "Detected long silent sections",
          confidence: 0.92
        },
        {
          title: "Improve pacing",
          reason: "Scene duration exceeds optimal range",
          confidence: 0.81
        }
      ]);
      return;
    }

    fetch("http://127.0.0.1:8000/context")
      .then(r => r.json())
      .then(data => {
        setSuggestions([
          {
            title: "Remove silence",
            reason: "Low audio energy detected",
            confidence: Math.min(1, data.audio_level * 20),
          },
          {
            title: "Optimize pacing",
            reason: "Scene text density suggests long static section",
            confidence: 0.72
          }
        ]);
      })
      .catch(e => console.error(e));
  }, []);

  return (
    <div className="panel" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>AIVA Suggestions</h3>
        <button
          className="secondary"
          onClick={() => {
            toggleDemoMode();
            location.reload();
          }}
          style={{ fontSize: 12, padding: '4px 8px' }}
        >
          🎭 {isDemoMode() ? "Disable" : "Enable"} Demo Mode
        </button>
      </div>
      
      <Timeline progress={progress} />

      {suggestions.map((s, i) => (
        <SuggestionCard
          key={i}
          {...s}
          onApply={() => alert(`Applied: ${s.title}`)}
        />
      ))}

      <button
        className="secondary"
        onClick={async () => {
          const result = {
            intent: "REMOVE_SILENCE",
            reason: "Detected voice command",
            confidence: 0.91
          };

          setSuggestions([
            {
              title: "Remove silence",
              reason: result.reason,
              confidence: result.confidence
            }
          ]);
        }}
        style={{ marginTop: 10, width: '100%' }}
      >
        🎙 Simulate Voice Command
      </button>
    </div>
  );
}
