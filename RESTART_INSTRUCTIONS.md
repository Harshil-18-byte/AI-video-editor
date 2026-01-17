# 🔴 IMPORTANT: RESTART REQUIRED

## You're seeing OLD errors because the backend is still running the old code!

### The errors you're seeing:
```
OpenCV: FFMPEG: tag 0x30387076/'vp80' is not supported
Audio analysis failed: Error opening 'video.mp4': Format not recognised
Error in browse_file: main thread is not in main loop
```

### ✅ These are ALREADY FIXED in the code, but you need to restart!

---

## How to Restart the Backend:

### Option 1: Manual Restart
1. Go to the terminal/command prompt running `python api.py`
2. Press `Ctrl+C` to stop it
3. Run again:
   ```bash
   cd backend
   python api.py
   ```

### Option 2: Quick Restart (Windows)
1. Close the backend window
2. Double-click `RESTART_BACKEND.bat`
3. Follow the instructions

---

## What Will Change After Restart:

### ❌ BEFORE (Current - Old Code):
```
OpenCV: FFMPEG: tag 0x30387076/'vp80' is not supported  ← Codec error
Audio analysis failed: Error opening 'video.mp4'         ← Format error  
Error in browse_file: main thread is not in main loop    ← Threading error
```

### ✅ AFTER (New Code):
```
INFO: Application startup complete
INFO: Uvicorn running on http://localhost:8000
(No errors - clean output!)
```

---

## Verify the Fixes Are Loaded:

After restarting, test one AI feature (e.g., Smart Re-light):
1. Select a clip
2. Click "Smart Re-light" in Inspector
3. You should see:
   - Toast: "🚀 Processing: Smart Re-light..."
   - Backend creates: `video_bright_[timestamp].mp4` (not .webm!)
   - Toast: "✅ Smart Re-light Complete!"
   - NO codec errors in backend logs

---

## Why This Happens:

Python loads code into memory when you start `python api.py`. Changes to the files don't affect the running process. You MUST restart to load new code.

---

## Quick Test After Restart:

Run this to verify all endpoints work:
```bash
python scripts/test_backend.py
```

You should see all ✅ (no ❌ errors).
