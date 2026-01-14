# AIVA Editor

AIVA is a system-wide AI assistant for video editing that works on top of
any software — similar to Grammarly for writing.

## Features

- **Professional 3-Pane NLE Layout**: Media Bin, Preview Monitor, and Timeline.
- **AI Analysis**: Detect silence, scene cuts, and generate captions locally.
- **Privacy-First**: All processing happens locally using FFmpeg and Whisper. No cloud uploads.
- **Real Exports**: Direct FFmpeg pipeline for reliable rendering.

## Architecture

- **Frontend**: React + Electron + Vite (Standard Window, not overlay).
- **Backend**: Python FastAPI + FFmpeg + OpenAI Whisper.

## Getting Started

### 1. Backend Setup

Install dependencies and start the local AI engine.

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Start the Backend Server
python start_backend.py
```

*Server runs on [http://localhost:8000](http://localhost:8000)*

### 2. Frontend Setup

Launch the editor interface.

```bash
cd frontend
npm install
npm run dev
```

*App launches in a standalone window.*
