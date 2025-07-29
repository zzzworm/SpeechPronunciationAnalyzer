@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 语音发音分析器 - 一键启动脚本
:: 适用于 Windows

echo �� 启动语音发音分析器服务...

:: 获取脚本所在目录
set "SCRIPT_DIR=%~dp0"

:: 检查依赖
echo �� 检查依赖项...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python 未安装，请先安装 Python
    pause
    exit /b 1
)

pip --version >nul 2>&1
if errorlevel 1 (
    echo ❌ pip 未安装，请先安装 pip
    pause
    exit /b 1
)

echo ✅ 依赖项检查完成

:: 安装依赖
echo 📦 安装服务依赖...

set "services=asr-service alignment-service scoring-service api-gateway"

for %%s in (%services%) do (
    set "service_path=%SCRIPT_DIR%pronunciation-backend\%%s"
    if exist "!service_path!" (
        echo 📦 安装 %%s 依赖...
        cd /d "!service_path!"
        if exist "requirements.txt" (
            pip install -r requirements.txt
            if !errorlevel! equ 0 (
                echo ✅ %%s 依赖安装完成
            ) else (
                echo ❌ %%s 依赖安装失败
                pause
                exit /b 1
            )
        ) else (
            echo ⚠️  %%s 没有 requirements.txt 文件
        )
    ) else (
        echo ❌ 找不到 %%s 目录
        pause
        exit /b 1
    )
)

echo ✅ 所有依赖安装完成

:: 创建日志目录
if not exist "%SCRIPT_DIR%logs" mkdir "%SCRIPT_DIR%logs"

:: 启动服务
echo �� 启动服务...

:: 定义服务配置
set "asr_port=8001"
set "alignment_port=8002"
set "scoring_port=8003"
set "gateway_port=8000"

:: 启动 ASR Service
echo �� 启动 asr-service (端口: %asr_port%)...
cd /d "%SCRIPT_DIR%pronunciation-backend\asr-service"
start "ASR Service" cmd /c "uvicorn app.main:app --reload --port %asr_port% --host 0.0.0.0 > %SCRIPT_DIR%logs\asr-service.log 2>&1"

:: 启动 Alignment Service
echo 🚀 启动 alignment-service (端口: %alignment_port%)...
cd /d "%SCRIPT_DIR%pronunciation-backend\alignment-service"
start "Alignment Service" cmd /c "uvicorn app.main:app --reload --port %alignment_port% --host 0.0.0.0 > %SCRIPT_DIR%logs\alignment-service.log 2>&1"

:: 启动 Scoring Service
echo �� 启动 scoring-service (端口: %scoring_port%)...
cd /d "%SCRIPT_DIR%pronunciation-backend\scoring-service"
start "Scoring Service" cmd /c "uvicorn app.main:app --reload --port %scoring_port% --host 0.0.0.0 > %SCRIPT_DIR%logs\scoring-service.log 2>&1"

:: 启动 API Gateway
echo �� 启动 api-gateway (端口: %gateway_port%)...
cd /d "%SCRIPT_DIR%pronunciation-backend\api-gateway"
start "API Gateway" cmd /c "uvicorn app.main:app --reload --port %gateway_port% --host 0.0.0.0 > %SCRIPT_DIR%logs\api-gateway.log 2>&1"

:: 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 5 /nobreak >nul

:: 显示服务状态
echo 📊 服务状态:
echo ----------------------------------------
echo ✅ 所有服务已启动
echo �� 日志文件位置: logs\
echo 🌐 API Gateway: http://localhost:%gateway_port%
echo ----------------------------------------
echo.
echo 💡 提示:
echo - 每个服务都在独立的窗口中运行
echo - 关闭窗口即可停止对应服务
echo - 查看日志文件了解服务运行状态
echo.

pause 