export default function Indicators({ listening, gesture }: any) {
  return (
    <div style={{ position: "fixed", bottom: 14, right: 14 }}>
      {listening && <span>🎙 Listening</span>}
      {gesture && (
        <div
          style={{
            marginTop: 6,
            padding: "6px 10px",
            background: "#1E293B",
            borderRadius: 8,
            animation: "pulse 0.5s ease"
          }}
        >
          ✋ Gesture detected
        </div>
      )}
    </div>
  );
}
