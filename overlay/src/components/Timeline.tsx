export default function Timeline({ progress }: { progress: number }) {
  return (
    <div
      style={{
        height: 6,
        background: "#1E293B",
        borderRadius: 999,
        overflow: "hidden",
        margin: "12px 0"
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg,#3B82F6,#60A5FA)",
          transition: "width 0.1s linear"
        }}
      />
    </div>
  );
}
