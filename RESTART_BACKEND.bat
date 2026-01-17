@echo off
echo ========================================
echo AIVA Backend Restart Script
echo ========================================
echo.
echo This will restart the backend with the latest fixes.
echo.
echo Step 1: Stop the current backend (Press Ctrl+C in the backend window)
echo Step 2: Run this command:
echo.
echo   cd backend
echo   python api.py
echo.
echo ========================================
echo IMPORTANT FIXES APPLIED:
echo ========================================
echo [✓] OpenCV codec changed from vp80 to mp4v
echo [✓] Audio analysis skips video files
echo [✓] File dialogs now thread-safe
echo.
echo After restarting, you should see NO errors!
echo ========================================
pause
