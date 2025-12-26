export default function FloatingButton({ onClick }: any) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#3B82F6",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer"
      }}
    >
      AIVA
    </div>
  );
}
