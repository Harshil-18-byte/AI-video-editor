@echo off
cd /d "%~dp0"
echo Starting AIVA Backend...
<<<<<<< HEAD
call backend\.venv\Scripts\activate.bat
python backend\start_backend.py
=======
python start_backend.py
>>>>>>> 96ba0f751fdc17380f2c11865a7a8641bc3b28d2
pause
