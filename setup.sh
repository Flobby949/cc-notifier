#!/bin/bash

# Claude Code Notifier 快速安装脚本 (Mac/Linux)

set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
DIST_DIR="$PROJECT_DIR/dist"
HOOK_JS="$DIST_DIR/hook.js"

echo "==================================="
echo "Claude Code Notifier 安装脚本"
echo "==================================="
echo ""

# 进入项目目录
cd "$PROJECT_DIR"

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo "✗ 未找到 Node.js，请先安装 Node.js >= 16"
    exit 1
fi
echo "✓ Node.js 版本: $(node -v)"

# 检查 dist 是否存在
DIST_EXISTS=false
if [ -f "$HOOK_JS" ]; then
    DIST_EXISTS=true
    echo "✓ dist 目录已存在"
else
    echo "✗ dist 目录不存在"
fi

# 显示选项菜单
echo ""
echo "请选择安装模式:"
echo "  1) 快速安装 (仅 npm link，需要 dist 已存在)"
echo "  2) 完整构建 (npm install + build + link)"
echo "  3) 退出"
echo ""

if [ "$DIST_EXISTS" = true ]; then
    read -p "请输入选项 [1]: " choice
    choice=${choice:-1}
else
    read -p "请输入选项 [2]: " choice
    choice=${choice:-2}
fi

case $choice in
    1)
        if [ "$DIST_EXISTS" = false ]; then
            echo ""
            echo "✗ dist 目录不存在，无法使用快速安装"
            echo "  请选择选项 2 进行完整构建"
            exit 1
        fi
        echo ""
        echo "模式: 快速安装"
        ;;
    2)
        echo ""
        echo "模式: 完整构建"

        # 检查 npm 是否安装
        if ! command -v npm &> /dev/null; then
            echo "✗ 未找到 npm"
            exit 1
        fi
        echo "✓ npm 版本: $(npm -v)"

        # 安装依赖
        echo ""
        echo "安装依赖..."
        npm install

        # 编译
        echo ""
        echo "编译项目..."
        npm run build
        ;;
    3)
        echo "已退出"
        exit 0
        ;;
    *)
        echo "无效选项: $choice"
        exit 1
        ;;
esac

# 添加执行权限
echo ""
echo "添加执行权限..."
chmod +x "$DIST_DIR"/*.js

# npm link
echo ""
echo "链接 ccntf 命令..."
npm link

echo ""
echo "✓ ccntf 命令已安装"
echo ""

# 检查配置
echo "==================================="
echo "检查 Claude Code hooks 配置"
echo "==================================="
echo ""
ccntf check

# 检查并询问是否初始化配置
CONFIG_FILE="$HOME/.claude/webhook-config.json"
echo ""
echo "==================================="
if [ -f "$CONFIG_FILE" ]; then
    echo "✓ webhook 配置文件已存在: $CONFIG_FILE"
else
    echo "✗ webhook 配置文件不存在"
    read -p "是否初始化 webhook 配置文件? (Y/n): " init_config
    if [[ ! "$init_config" =~ ^[Nn]$ ]]; then
        ccntf init
    fi
fi

echo ""
echo "==================================="
echo "安装完成!"
echo ""
echo "使用方法:"
echo "  ccntf help    - 查看帮助"
echo "  ccntf test    - 测试通知"
echo "  ccntf config  - 查看配置"
echo "  ccntf check   - 检查 hooks 配置"
echo "==================================="
