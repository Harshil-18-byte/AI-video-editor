import { useEffect, useState } from "react";

export default function Onboarding() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("aiva_onboarded");
    if (!seen) {
      setShow(true);
      localStorage.setItem("aiva_onboarded", "true");
    }
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 100,
        right: 20,
        background: "#020617",
        border: "1px solid #1E293B",
        borderRadius: 12,
        padding: 12,
        maxWidth: 220,
        fontSize: 12
      }}
    >
      <strong>Welcome to AIVA 👋</strong>
      <p>Say <b>“Hey AIVA”</b> or press <b>Ctrl+Shift+A</b> to start.</p>
      <button onClick={() => setShow(false)}>Got it</button>
    </div>
  );
}
