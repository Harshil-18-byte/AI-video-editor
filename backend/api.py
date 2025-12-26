from vision.screen_capture import capture_screen
from vision.ocr import extract_text
from audio.system_audio import record_system_audio

app = FastAPI()

@app.get("/context")
def context():
    frame = capture_screen()
    text = extract_text(frame)
    audio = record_system_audio(1)

    return {
        "screen_text": text[:300],
        "audio_level": float(abs(audio).mean())
    }
from fastapi import FastAPI
