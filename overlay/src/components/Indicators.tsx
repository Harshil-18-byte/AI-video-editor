export default function Indicators({
  listening,
  gestures
}: {
  listening: boolean;
  gestures: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        display: "flex",
        gap: 8
      }}
    >
      {listening && (
        <span style={{ color: "#22C55E" }}>🎙 Listening</span>
      )}
      {gestures && (
        <span style={{ color: "#3B82F6" }}>✋ Gestures ON</span>
      )}
    </div>
  );
}
