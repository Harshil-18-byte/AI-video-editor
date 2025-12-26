import { useState } from "react";
import Indicators from "./components/Indicators";
import FloatingButton from "./components/FloatingButton";
import Panel from "./components/Panel";
import useShortcuts from "./hooks/useShortcuts";
import Onboarding from "./components/Onboarding";
import { track } from "./utils/analytics";

track("open_panel");
track("apply_suggestion");

export default function App() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [listening, setListening] = useState(false);
  const [gestures, setGestures] = useState(false);

  useShortcuts({
    toggleAIVA: () => setOpen(o => !o),
    toggleVoice: () => setListening(v => !v),
    toggleGestures: () => setGestures(g => !g)
  });

  return (
    <div>
      <Onboarding />
      <Indicators listening={listening} gestures={gestures} />
      <FloatingButton onClick={() => setOpen(!open)} />
      {open && result && <Panel {...result} />}
    </div>
  );
}
