@echo off
setlocal enabledelayedexpansion

REM Speech Pronunciation Analyzer - Service Startup Script
REM For Windows

echo Starting Speech Pronunciation Analyzer Services...
echo.

REM Get script directory
set "SCRIPT_DIR=%~dp0"
set "SCRIPT_DIR=%SCRIPT_DIR:~0,-1%"
set "BACKEND_DIR=%SCRIPT_DIR%\pronunciation-evaluation\pronunciation-backend"
set "LOG_DIR=%SCRIPT_DIR%\logs"

REM Parse command line arguments
set "ACTION=%1"
if "%ACTION%"=="" set "ACTION=start"

REM Main program entry
if /i "%ACTION%"=="start" goto :start_all
if /i "%ACTION%"=="stop" goto :stop_all
if /i "%ACTION%"=="status" goto :show_status
if /i "%ACTION%"=="restart" goto :restart_all
goto :show_usage

:start_all
call :check_dependencies
if errorlevel 1 exit /b 1
call :install_dependencies
if errorlevel 1 exit /b 1
call :start_services
timeout /t 3 /nobreak >nul
call :show_status
goto :end

:stop_all
call :stop_services
goto :end

:restart_all
call :stop_services
timeout /t 2 /nobreak >nul
call :check_dependencies
if errorlevel 1 exit /b 1
call :install_dependencies
if errorlevel 1 exit /b 1
call :start_services
timeout /t 3 /nobreak >nul
call :show_status
goto :end

:check_dependencies
echo Checking dependencies...

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed. Please install Python first.
    exit /b 1
)

REM Check pip
pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not installed. Please install pip first.
    exit /b 1
)

echo SUCCESS: Dependencies check completed.
exit /b 0

:install_dependencies
echo Installing service dependencies...

REM Check if backend directory exists
if not exist "%BACKEND_DIR%" (
    echo ERROR: Cannot find backend directory: %BACKEND_DIR%
    exit /b 1
)

echo Using backend directory: %BACKEND_DIR%

REM Install dependencies for each service
for %%s in (asr-service alignment-service scoring-service api-gateway) do (
    set "SERVICE_PATH=%BACKEND_DIR%\%%s"
    if exist "!SERVICE_PATH!" (
        echo Installing %%s dependencies...
        pushd "!SERVICE_PATH!"
        if exist "requirements.txt" (
            pip install -r requirements.txt
            if errorlevel 1 (
                echo ERROR: Failed to install %%s dependencies
                popd
                exit /b 1
            ) else (
                echo SUCCESS: %%s dependencies installed
            )
        ) else (
            echo WARNING: %%s has no requirements.txt file
        )
        popd
    ) else (
        echo ERROR: Cannot find %%s directory: !SERVICE_PATH!
        exit /b 1
    )
)

echo SUCCESS: All dependencies installed
exit /b 0

:start_services
echo Starting services...

REM Create logs directory
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Start asr-service on port 8001
set "SERVICE_PATH=%BACKEND_DIR%\asr-service"
if exist "%SERVICE_PATH%" (
    echo Starting asr-service on port 8001...
    pushd "%SERVICE_PATH%"
    start "asr-service" /min cmd /c "uvicorn app.main:app --reload --port 8001 --host 0.0.0.0 > "%LOG_DIR%\asr-service.log" 2>&1"
    echo asr-service > "%LOG_DIR%\asr-service.pid"
    popd
    timeout /t 2 /nobreak >nul
) else (
    echo ERROR: Cannot find asr-service directory
)

REM Start alignment-service on port 8002
set "SERVICE_PATH=%BACKEND_DIR%\alignment-service"
if exist "%SERVICE_PATH%" (
    echo Starting alignment-service on port 8002...
    pushd "%SERVICE_PATH%"
    start "alignment-service" /min cmd /c "uvicorn app.main:app --reload --port 8002 --host 0.0.0.0 > "%LOG_DIR%\alignment-service.log" 2>&1"
    echo alignment-service > "%LOG_DIR%\alignment-service.pid"
    popd
    timeout /t 2 /nobreak >nul
) else (
    echo ERROR: Cannot find alignment-service directory
)

REM Start scoring-service on port 8003
set "SERVICE_PATH=%BACKEND_DIR%\scoring-service"
if exist "%SERVICE_PATH%" (
    echo Starting scoring-service on port 8003...
    pushd "%SERVICE_PATH%"
    start "scoring-service" /min cmd /c "uvicorn app.main:app --reload --port 8003 --host 0.0.0.0 > "%LOG_DIR%\scoring-service.log" 2>&1"
    echo scoring-service > "%LOG_DIR%\scoring-service.pid"
    popd
    timeout /t 2 /nobreak >nul
) else (
    echo ERROR: Cannot find scoring-service directory
)

REM Start api-gateway on port 8000
set "SERVICE_PATH=%BACKEND_DIR%\api-gateway"
if exist "%SERVICE_PATH%" (
    echo Starting api-gateway on port 8000...
    pushd "%SERVICE_PATH%"
    start "api-gateway" /min cmd /c "uvicorn app.main:app --reload --port 8000 --host 0.0.0.0 > "%LOG_DIR%\api-gateway.log" 2>&1"
    echo api-gateway > "%LOG_DIR%\api-gateway.pid"
    popd
    timeout /t 2 /nobreak >nul
) else (
    echo ERROR: Cannot find api-gateway directory
)

echo All services started. Check logs directory for service output.
exit /b 0



:show_status
echo Service Status:
echo ----------------------------------------

REM Check asr-service (port 8001)
curl -s "http://localhost:8001/health" >nul 2>&1
if not errorlevel 1 (
    echo SUCCESS: asr-service (port 8001) - Running
) else (
    curl -s "http://localhost:8001/" >nul 2>&1
    if not errorlevel 1 (
        echo SUCCESS: asr-service (port 8001) - Running
    ) else (
        echo ERROR: asr-service (port 8001) - Not running
    )
)

REM Check alignment-service (port 8002)
curl -s "http://localhost:8002/health" >nul 2>&1
if not errorlevel 1 (
    echo SUCCESS: alignment-service (port 8002) - Running
) else (
    curl -s "http://localhost:8002/" >nul 2>&1
    if not errorlevel 1 (
        echo SUCCESS: alignment-service (port 8002) - Running
    ) else (
        echo ERROR: alignment-service (port 8002) - Not running
    )
)

REM Check scoring-service (port 8003)
curl -s "http://localhost:8003/health" >nul 2>&1
if not errorlevel 1 (
    echo SUCCESS: scoring-service (port 8003) - Running
) else (
    curl -s "http://localhost:8003/" >nul 2>&1
    if not errorlevel 1 (
        echo SUCCESS: scoring-service (port 8003) - Running
    ) else (
        echo ERROR: scoring-service (port 8003) - Not running
    )
)

REM Check api-gateway (port 8000)
curl -s "http://localhost:8000/health" >nul 2>&1
if not errorlevel 1 (
    echo SUCCESS: api-gateway (port 8000) - Running
) else (
    curl -s "http://localhost:8000/" >nul 2>&1
    if not errorlevel 1 (
        echo SUCCESS: api-gateway (port 8000) - Running
    ) else (
        echo ERROR: api-gateway (port 8000) - Not running
    )
)

echo ----------------------------------------
echo Log files location: logs\
echo API Gateway: http://localhost:8000
exit /b 0

:stop_services
echo Stopping services...

REM Stop all uvicorn processes
for /f "tokens=2" %%i in ('tasklist /fi "imagename eq python.exe" /fo table /nh 2^>nul ^| findstr uvicorn') do (
    echo Stopping process %%i...
    taskkill /pid %%i /f >nul 2>&1
)

REM Stop service windows by title
taskkill /fi "windowtitle eq asr-service" /f >nul 2>&1
taskkill /fi "windowtitle eq alignment-service" /f >nul 2>&1
taskkill /fi "windowtitle eq scoring-service" /f >nul 2>&1
taskkill /fi "windowtitle eq api-gateway" /f >nul 2>&1

REM Clean up PID files
if exist "%LOG_DIR%\*.pid" del /q "%LOG_DIR%\*.pid" >nul 2>&1

echo SUCCESS: All services stopped
exit /b 0

:show_usage
echo Usage: %~nx0 [start^|stop^|status^|restart]
echo   start   - Start all services (default)
echo   stop    - Stop all services
echo   status  - Show service status
echo   restart - Restart all services
exit /b 1

:end
endlocal