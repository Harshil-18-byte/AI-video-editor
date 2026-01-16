# AIVA - AI Video Assistant & Editor

AIVA is a next-generation, privacy-first video editing suite that combines a professional **3-pane Non-Linear Editor (NLE)** with powerful system-wide AI capabilities. Unlike cloud-based tools, AIVA runs advanced AI models **locally** on your machine, ensuring zero latency and complete privacy for your media.

## 🚀 Key Features

### 🎬 AI Video Intelligence

* **Smart Scene Detection**: Automatically analyzes footage to detect cuts and scene changes using histogram correlation.
* **Auto-Reframe (Smart Crop)**: Intelligently crops landscape (16:9) footage into vertical (9:16) formats, keeping the subject centered.
* **Cinematic Grading**: automated color grading pipelines (e.g., Teal & Orange) to instantly improve footage aesthetics.
* **AI Stabilization**: Algorithms to smooth out shaky handheld camera movements.
* **Video Upscaling**: Feature-preserving upscaling to enhance low-resolution clips.

### 🎙️ Advanced Audio Engineering

* **Smart Silence Removal**: Automatically detects and strips "dead air" and pauses from voiceovers.
* **Local Transcription**: Full offline speech-to-text using OpenAI's **Whisper** model.
* **Audio Enhancement**: Professional high-pass filtering, normalization, and noise reduction.
* **Voice Changer**: Real-time DSP effects to transform vocal characteristics.

### 🧠 Multimodal Interaction

* **Gesture Control**: Control playback and timeline operations using hand gestures (integrated via MediaPipe).
* **Voice Command Interface**: Execute complex editing macros using natural language.
* **Screen context**: Built-in OCR and screen capture to assist with workflows outside the editor.

---

## 🛠️ Architecture

AIVA uses a hybrid architecture to combine the performance of native Python handling with the reactivity of a modern web frontend.

* **Frontend**: Electron + React + Vite + TailwindCSS.
  * *Features*: Draggable 3-pane layout, MediaPipe gesture recognition, Lucide UI.
* **Backend**: Python FastAPI.
  * *Core*: OpenCV (Vision), Librosa/Scipy (Audio), FFmpeg (Rendering).
* **Privacy**: All processing happens on `localhost`. No data is uploaded to the cloud.

---

## 📦 Getting Started

### Prerequisites

* Python 3.10+
* Node.js 18+
* FFmpeg (Installed and added to PATH)

### 1. Backend Setup (AI Engine)

The backend handles all heavy lifting, file processing, and AI inference.

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API Server
python start_backend.py
```

*Server runs on [http://localhost:8000](http://localhost:8000)*

### 2. Frontend Setup (Editor UI)

The frontend launches the Electron application window.

```bash
cd frontend

# Install Node dependencies
npm install

# Run the application
npm run electron
```

*Note: Ensure the backend is running before starting the frontend.*

---

## 📂 Project Structure

```text
AIVA/
├── backend/            # Python FastAPI Server
│   ├── audio/          # DSP & Cleaning Logic
│   ├── vision/         # OpenCV & OCR Logic
│   ├── voice/          # Whisper & Intent Parsing
│   ├── api.py          # Main Endpoints
│   └── start_backend.py
├── frontend/           # React + Electron
│   ├── src/            # UI Components & Logic
│   ├── package.json
│   └── tailwind.config.cjs
└── README.md
```
