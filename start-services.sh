#!/bin/bash

# 语音发音分析器 - 一键启动脚本
# 适用于 macOS/Linux

echo "�� 启动语音发音分析器服务..."

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否安装了 Python 和 uvicorn
check_dependencies() {
    echo -e "${BLUE}📋 检查依赖项...${NC}"
    
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 未安装，请先安装 Python3${NC}"
        exit 1
    fi
    
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}❌ pip3 未安装，请先安装 pip3${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖项检查完成${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装服务依赖...${NC}"
    
    # 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # 安装各个服务的依赖
    services=("asr-service" "alignment-service" "scoring-service" "api-gateway")
    
    for service in "${services[@]}"; do
        service_path="$SCRIPT_DIR/pronunciation-backend/$service"
        if [ -d "$service_path" ]; then
            echo -e "${YELLOW}📦 安装 $service 依赖...${NC}"
            cd "$service_path"
            if [ -f "requirements.txt" ]; then
                pip3 install -r requirements.txt
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ $service 依赖安装完成${NC}"
                else
                    echo -e "${RED}❌ $service 依赖安装失败${NC}"
                    return 1
                fi
            else
                echo -e "${YELLOW}⚠️  $service 没有 requirements.txt 文件${NC}"
            fi
        else
            echo -e "${RED}❌ 找不到 $service 目录${NC}"
            return 1
        fi
    done
    
    echo -e "${GREEN}✅ 所有依赖安装完成${NC}"
}

# 启动服务
start_services() {
    echo -e "${BLUE}🚀 启动服务...${NC}"
    
    # 获取脚本所在目录
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    # 定义服务配置
    declare -A services=(
        ["asr-service"]="8001"
        ["alignment-service"]="8002"
        ["scoring-service"]="8003"
        ["api-gateway"]="8000"
    )
    
    # 创建日志目录
    mkdir -p "$SCRIPT_DIR/logs"
    
    # 启动每个服务
    for service in "${!services[@]}"; do
        port="${services[$service]}"
        service_path="$SCRIPT_DIR/pronunciation-backend/$service"
        
        if [ -d "$service_path" ]; then
            echo -e "${YELLOW}�� 启动 $service (端口: $port)...${NC}"
            
            # 切换到服务目录并启动
            cd "$service_path"
            
            # 在后台启动服务，并将输出重定向到日志文件
            nohup uvicorn app.main:app --reload --port "$port" --host 0.0.0.0 > "$SCRIPT_DIR/logs/${service}.log" 2>&1 &
            
            # 保存进程ID
            echo $! > "$SCRIPT_DIR/logs/${service}.pid"
            
            # 等待一下确保服务启动
            sleep 2
            
            # 检查服务是否成功启动
            if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || curl -s "http://localhost:$port/" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $service 启动成功 (端口: $port)${NC}"
            else
                echo -e "${YELLOW}⚠️  $service 可能还在启动中，请检查日志: logs/${service}.log${NC}"
            fi
        else
            echo -e "${RED}❌ 找不到 $service 目录${NC}"
        fi
    done
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}📊 服务状态:${NC}"
    echo "----------------------------------------"
    
    declare -A services=(
        ["asr-service"]="8001"
        ["alignment-service"]="8002"
        ["scoring-service"]="8003"
        ["api-gateway"]="8000"
    )
    
    for service in "${!services[@]}"; do
        port="${services[$service]}"
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || curl -s "http://localhost:$port/" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service (端口: $port) - 运行中${NC}"
        else
            echo -e "${RED}❌ $service (端口: $port) - 未运行${NC}"
        fi
    done
    
    echo "----------------------------------------"
    echo -e "${BLUE}📝 日志文件位置: logs/${NC}"
    echo -e "${BLUE}🌐 API Gateway: http://localhost:8000${NC}"
}

# 停止服务
stop_services() {
    echo -e "${BLUE}🛑 停止服务...${NC}"
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    if [ -d "$SCRIPT_DIR/logs" ]; then
        for pid_file in "$SCRIPT_DIR/logs"/*.pid; do
            if [ -f "$pid_file" ]; then
                service_name=$(basename "$pid_file" .pid)
                pid=$(cat "$pid_file")
                
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${YELLOW}�� 停止 $service_name (PID: $pid)...${NC}"
                    kill "$pid"
                    rm "$pid_file"
                    echo -e "${GREEN}✅ $service_name 已停止${NC}"
                else
                    echo -e "${YELLOW}⚠️  $service_name 进程不存在，清理 PID 文件${NC}"
                    rm "$pid_file"
                fi
            fi
        done
    fi
    
    echo -e "${GREEN}✅ 所有服务已停止${NC}"
}

# 主函数
main() {
    case "${1:-start}" in
        "start")
            check_dependencies
            install_dependencies
            start_services
            sleep 3
            show_status
            ;;
        "stop")
            stop_services
            ;;
        "status")
            show_status
            ;;
        "restart")
            stop_services
            sleep 2
            check_dependencies
            install_dependencies
            start_services
            sleep 3
            show_status
            ;;
        *)
            echo "用法: $0 [start|stop|status|restart]"
            echo "  start   - 启动所有服务 (默认)"
            echo "  stop    - 停止所有服务"
            echo "  status  - 显示服务状态"
            echo "  restart - 重启所有服务"
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@" 