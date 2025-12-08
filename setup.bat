@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: Claude Code Notifier 快速安装脚本 (Windows)

:: 获取项目目录（脚本所在目录）
set "PROJECT_DIR=%~dp0"
:: 移除末尾的反斜杠
if "%PROJECT_DIR:~-1%"=="\" set "PROJECT_DIR=%PROJECT_DIR:~0,-1%"
set "DIST_DIR=%PROJECT_DIR%\dist"
set "HOOK_JS=%DIST_DIR%\hook.js"

echo ===================================
echo Claude Code Notifier 安装脚本
echo ===================================
echo.

:: 进入项目目录
cd /d "%PROJECT_DIR%"

:: 检查 node 是否安装
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo X 未找到 Node.js，请先安装 Node.js ^>= 16
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VER=%%i
echo √ Node.js 版本: %NODE_VER%

:: 检查 dist 是否存在
set "DIST_EXISTS=false"
if exist "%HOOK_JS%" (
    set "DIST_EXISTS=true"
    echo √ dist 目录已存在
) else (
    echo X dist 目录不存在
)

:: 显示选项菜单
echo.
echo 请选择安装模式:
echo   1^) 快速安装 ^(仅 npm link，需要 dist 已存在^)
echo   2^) 完整构建 ^(npm install + build + link^)
echo   3^) 退出
echo.

if "!DIST_EXISTS!"=="true" (
    set /p choice="请输入选项 [1]: "
    if "!choice!"=="" set "choice=1"
) else (
    set /p choice="请输入选项 [2]: "
    if "!choice!"=="" set "choice=2"
)

if "!choice!"=="1" (
    if "!DIST_EXISTS!"=="false" (
        echo.
        echo X dist 目录不存在，无法使用快速安装
        echo   请选择选项 2 进行完整构建
        pause
        exit /b 1
    )
    echo.
    echo 模式: 快速安装

    :: 检查 npm 是否安装
    where npm >nul 2>nul
    if !errorlevel! neq 0 (
        echo X 未找到 npm
        pause
        exit /b 1
    )

    :: 安装运行时依赖
    echo.
    echo 安装运行时依赖...
    call npm install --omit=dev
) else if "!choice!"=="2" (
    echo.
    echo 模式: 完整构建

    :: 检查 npm 是否安装
    where npm >nul 2>nul
    if !errorlevel! neq 0 (
        echo X 未找到 npm
        pause
        exit /b 1
    )
    for /f "tokens=*" %%i in ('npm -v') do set NPM_VER=%%i
    echo √ npm 版本: !NPM_VER!

    :: 安装依赖
    echo.
    echo 安装依赖...
    call npm install

    :: 编译
    echo.
    echo 编译项目...
    call npm run build
) else if "!choice!"=="3" (
    echo 已退出
    exit /b 0
) else (
    echo 无效选项: !choice!
    pause
    exit /b 1
)

:: npm link
echo.
echo 链接 ccntf 命令...
call npm link

echo.
echo √ ccntf 命令已安装
echo.

:: 检查配置
echo ===================================
echo 检查 Claude Code hooks 配置
echo ===================================
echo.
call ccntf check

:: 检查并询问是否初始化配置
set "CONFIG_FILE=%USERPROFILE%\.claude\webhook-config.json"
echo.
echo ===================================
if exist "%CONFIG_FILE%" (
    echo √ webhook 配置文件已存在: %CONFIG_FILE%
) else (
    echo X webhook 配置文件不存在
    set /p init_config="是否初始化 webhook 配置文件? (Y/n): "
    if /i not "!init_config!"=="n" (
        call ccntf init
    )
)

echo.
echo ===================================
echo 安装完成!
echo.
echo 使用方法:
echo   ccntf help    - 查看帮助
echo   ccntf test    - 测试通知
echo   ccntf config  - 查看配置
echo   ccntf check   - 检查 hooks 配置
echo ===================================

pause
