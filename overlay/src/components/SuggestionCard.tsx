import { useState } from "react";

export default function SuggestionCard({
  title,
  reason,
  confidence,
  onApply
}: any) {
  const [state, setState] = useState<"idle" | "applying" | "done">("idle");

  async function apply() {
    setState("applying");
    await new Promise(r => setTimeout(r, 800));
    onApply?.();
    setState("done");
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: "#020617",
        border: "1px solid #1E293B",
        marginBottom: 10,
        position: "relative",
        overflow: "hidden"
      }}
    >
      <strong>{title}</strong>
      <p style={{ fontSize: 12, opacity: 0.75 }}>{reason}</p>

      {state === "applying" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(120deg, transparent, rgba(255,255,255,0.1), transparent)",
            animation: "shimmer 0.8s infinite"
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12 }}>
          Confidence: {(confidence * 100).toFixed(0)}%
        </span>

        {state === "idle" && <button onClick={apply}>Apply</button>}
        {state === "applying" && <button disabled>Applying…</button>}
        {state === "done" && <button disabled>✓ Applied</button>}
      </div>
    </div>
  );
}
