import Indicators from "./components/Indicators";

const [listening, setListening] = useState(false);
const [gestures, setGestures] = useState(false);

<Indicators listening={listening} gestures={gestures} />
import { useState } from "react";
import FloatingButton from "./components/FloatingButton";
import Panel from "./components/Panel";

export default function App() {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<any>(null);

  return (
    <div>
      <FloatingButton onClick={() => setOpen(!open)} />
      {open && result && <Panel {...result} />}
    </div>
  );
}
