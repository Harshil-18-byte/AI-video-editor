from fastapi import FastAPI
import numpy as np

from voice.whisper_engine import transcribe
from voice.intent import parse_intent, confidence_score
from vision.screen_capture import capture_screen
from vision.ocr import extract_text
from audio.system_audio import record_system_audio

# ✅ CREATE APP FIRST
app = FastAPI(title="AIVA Backend")


# -----------------------------
# VOICE ENDPOINT
# -----------------------------
@app.post("/voice")
def voice(payload: dict):
    audio = np.array(payload["audio"], dtype=np.float32)
    sr = payload.get("sr", 16000)

    text = transcribe(audio, sr)
    intent = parse_intent(text)

    confidence = confidence_score(
        intent, {"silence_ratio": payload.get("silence_ratio", 0.4)}
    )

    return {
        "text": text,
        "intent": intent,
        "confidence": round(confidence, 2),
        "reason": "Detected silence and voice command intent",
    }


# -----------------------------
# CONTEXT ENDPOINT
# -----------------------------
@app.get("/context")
def context():
    frame = capture_screen()
    text = extract_text(frame)
    audio = record_system_audio(1)

    return {"screen_text": text[:300], "audio_level": float(abs(audio).mean())}


@app.get("/")
def root():
    return {"status": "AIVA backend running", "docs": "/docs"}
