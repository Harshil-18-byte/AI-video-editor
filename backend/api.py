@app.post("/voice")
def voice(payload: dict):
    audio = np.array(payload["audio"], dtype=np.float32)
    text = transcribe(audio, payload["sr"])
    intent = parse_intent(text)

    confidence = confidence_score(intent, {
        "silence_ratio": payload.get("silence_ratio", 0.4)
    })

    return {
        "text": text,
        "intent": intent,
        "confidence": round(confidence, 2),
        "reason": "Detected prolonged silence in system audio"
    }
from fastapi import FastAPI
import numpy as np