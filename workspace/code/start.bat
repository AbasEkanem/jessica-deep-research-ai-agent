@echo off
echo Starting RAG Agent...

REM Check if .env exists, if not copy from .env.example
if not exist .env (
    echo Creating .env file from .env.example...
    copy .env.example .env
    echo Please edit .env and add your OpenAI API key
    pause
    exit /b
)

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Start backend server in new window
start "RAG Backend" cmd /k "python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a bit for backend to start
timeout /t 3 /nobreak > nul

REM Install frontend dependencies and start
echo Installing frontend dependencies...
cd frontend
call npm install

REM Start frontend
echo Starting frontend...
start "RAG Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo RAG Agent is starting!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to stop all servers...
pause > nul

REM Kill processes
taskkill /F /IM python.exe > nul 2>&1
taskkill /F /IM node.exe > nul 2>&1
echo Servers stopped.
