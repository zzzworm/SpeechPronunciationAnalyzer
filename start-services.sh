#!/bin/bash

# 语音发音分析器 - 一键启动脚本
# 适用于 macOS/Linux

echo " 启动语音发音分析器服务..."

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
    
    # 修正路径：添加 pronunciation-evaluation 目录
    BACKEND_DIR="$SCRIPT_DIR/pronunciation-evaluation/pronunciation-backend"
    
    # 检查后端目录是否存在
    if [ ! -d "$BACKEND_DIR" ]; then
        echo -e "${RED}❌ 找不到后端目录: $BACKEND_DIR${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}🔍 使用后端目录: $BACKEND_DIR${NC}"
    
    # 安装各个服务的依赖
    services=("asr-service" "alignment-service" "scoring-service" "api-gateway")
    
    for service_name in "${services[@]}"; do
        service_path="$BACKEND_DIR/$service_name"
        if [ -d "$service_path" ]; then
            echo -e "${YELLOW}📦 安装 $service_name 依赖...${NC}"
            # 保存当前目录
            CURRENT_DIR=$(pwd)
            cd "$service_path"
            if [ -f "requirements.txt" ]; then
                pip3 install -r requirements.txt
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}✅ $service_name 依赖安装完成${NC}"
                else
                    echo -e "${RED}❌ $service_name 依赖安装失败${NC}"
                    # 恢复目录
                    cd "$CURRENT_DIR"
                    return 1
                fi
            else
                echo -e "${YELLOW}⚠️  $service_name 没有 requirements.txt 文件${NC}"
            fi
            # 恢复目录
            cd "$CURRENT_DIR"
        else
            echo -e "${RED}❌ 找不到 $service_name 目录: $service_path${NC}"
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
    
    # 修正路径：添加 pronunciation-evaluation 目录
    BACKEND_DIR="$SCRIPT_DIR/pronunciation-evaluation/pronunciation-backend"
    
    # 使用普通数组替代关联数组，兼容性更好
    service_names=("asr-service" "alignment-service" "scoring-service" "api-gateway")
    service_ports=("8001" "8002" "8003" "8000")
    
    # 创建日志目录
    mkdir -p "$SCRIPT_DIR/logs"
    
    # 启动每个服务
    for i in "${!service_names[@]}"; do
        service_name="${service_names[$i]}"
        port="${service_ports[$i]}"
        service_path="$BACKEND_DIR/$service_name"
        
        if [ -d "$service_path" ]; then
            echo -e "${YELLOW} 启动 $service_name (端口: $port)...${NC}"
            
            # 切换到服务目录并启动
            cd "$service_path"
            
            # 在后台启动服务，并将输出重定向到日志文件
            nohup uvicorn app.main:app --reload --port "$port" --host 0.0.0.0 > "$SCRIPT_DIR/logs/${service_name}.log" 2>&1 &
            
            # 保存进程ID
            echo $! > "$SCRIPT_DIR/logs/${service_name}.pid"
            
            # 等待一下确保服务启动
            sleep 2
            
            # 检查服务是否成功启动
            if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || curl -s "http://localhost:$port/" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ $service_name 启动成功 (端口: $port)${NC}"
            else
                echo -e "${YELLOW}⚠️  $service_name 可能还在启动中，请检查日志: logs/${service_name}.log${NC}"
            fi
        else
            echo -e "${RED}❌ 找不到 $service_name 目录: $service_path${NC}"
        fi
    done
}

# 显示服务状态
show_status() {
    echo -e "${BLUE}📊 服务状态:${NC}"
    echo "----------------------------------------"
    
    # 使用普通数组替代关联数组
    service_names=("asr-service" "alignment-service" "scoring-service" "api-gateway")
    service_ports=("8001" "8002" "8003" "8000")
    
    for i in "${!service_names[@]}"; do
        service_name="${service_names[$i]}"
        port="${service_ports[$i]}"
        if curl -s "http://localhost:$port/health" > /dev/null 2>&1 || curl -s "http://localhost:$port/" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $service_name (端口: $port) - 运行中${NC}"
        else
            echo -e "${RED}❌ $service_name (端口: $port) - 未运行${NC}"
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
                    echo -e "${YELLOW} 停止 $service_name (PID: $pid)...${NC}"
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