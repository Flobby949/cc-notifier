# Claude Code Notifier

Claude Code 任务完成通知器，支持多平台系统通知和多种 Webhook 服务。

## 特性

- **跨平台系统通知**：macOS / Windows / Linux
- **点击激活终端**：支持 Warp、iTerm、Terminal、Windows Terminal、VS Code
- **自动激活窗口**：任务完成后自动切换到终端窗口
- **语音播报**：macOS / Windows
- **多种 Webhook**：Slack、Discord、Telegram、钉钉、飞书、企业微信
- **任务耗时统计**：精确计算单次任务耗时
- **日志自动清理**：最多保留 500 条记录

## 目录结构

```
src/
├── index.ts           # 主入口
├── types.ts           # 类型定义
├── config.ts          # 配置管理
├── logger.ts          # 日志模块
├── session.ts         # 会话管理
├── session-tracker.ts # 会话追踪器（hook）
├── notification/      # 系统通知模块
│   ├── system.ts      # 系统通知（跨平台）
│   ├── terminal.ts    # 终端检测和激活
│   └── voice.ts       # 语音播报
└── webhook/           # Webhook 模块
    ├── http.ts        # HTTP 请求
    └── providers/     # 各平台实现
        ├── slack.ts
        ├── discord.ts
        ├── telegram.ts
        ├── dingtalk.ts
        ├── feishu.ts
        ├── wecom.ts
        └── custom.ts
```

## 安装

### 前置要求

- [Node.js](https://nodejs.org/) >= 18.0.0
- macOS 用户推荐安装 [Homebrew](https://brew.sh/)

---

### 快速安装（推荐）

从 [GitHub Releases](https://github.com/Flobby949/cc-notifier/releases) 下载预编译包，无需手动编译。

#### macOS / Linux

```bash
# 创建目录
mkdir -p ~/.claude/cc-notifier && cd ~/.claude/cc-notifier

# 下载最新版本（以 v1.0.0 为例，请替换为实际版本号）
curl -L https://github.com/Flobby949/cc-notifier/releases/latest/download/cc-notifier-dist.tar.gz | tar -xz

# 添加执行权限
chmod +x dist/index.js dist/session-tracker.js
```

macOS 用户推荐安装 `terminal-notifier`（点击通知可激活终端）：

```bash
brew install terminal-notifier
```

#### Windows

1. 从 [Releases 页面](https://github.com/Flobby949/cc-notifier/releases) 下载 `cc-notifier-dist.zip`
2. 解压到 `%USERPROFILE%\.claude\cc-notifier` 目录
3. 确保目录结构为 `%USERPROFILE%\.claude\cc-notifier\dist\index.js`

或使用 PowerShell：

```powershell
# 创建目录
mkdir $env:USERPROFILE\.claude\cc-notifier -Force
cd $env:USERPROFILE\.claude\cc-notifier

# 下载并解压（以 v1.0.0 为例，请替换为实际版本号）
Invoke-WebRequest -Uri "https://github.com/Flobby949/cc-notifier/releases/latest/download/cc-notifier-dist.zip" -OutFile "cc-notifier-dist.zip"
Expand-Archive -Path "cc-notifier-dist.zip" -DestinationPath "." -Force
Remove-Item "cc-notifier-dist.zip"
```

---

### 源码安装

如果你需要修改源码或参与开发，可以选择源码安装。

<details>
<summary>macOS 源码安装</summary>

#### 1. 克隆项目

```bash
# 创建 .claude 目录（如果不存在）
mkdir -p ~/.claude

# 克隆项目
cd ~/.claude
git clone https://github.com/Flobby949/cc-notifier.git

# 进入项目目录
cd cc-notifier
```

#### 2. 安装依赖并编译

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

#### 3. 添加执行权限

```bash
chmod +x dist/index.js dist/session-tracker.js
```

#### 4. 安装 terminal-notifier（推荐）

`terminal-notifier` 可以让你点击通知时自动激活终端窗口：

```bash
brew install terminal-notifier
```

> **注意**：如果不安装 `terminal-notifier`，系统通知仍然可以正常工作，但点击通知不会激活终端。

</details>

<details>
<summary>Windows 源码安装</summary>

#### 1. 克隆项目

打开 PowerShell 或 CMD：

```powershell
# 创建 .claude 目录（如果不存在）
mkdir %USERPROFILE%\.claude 2>nul

# 克隆项目
cd %USERPROFILE%\.claude
git clone https://github.com/Flobby949/cc-notifier.git

# 进入项目目录
cd cc-notifier
```

或者使用 Git Bash：

```bash
# 创建 .claude 目录（如果不存在）
mkdir -p ~/.claude

# 克隆项目
cd ~/.claude
git clone https://github.com/Flobby949/cc-notifier.git

# 进入项目目录
cd cc-notifier
```

#### 2. 安装依赖并编译

```powershell
# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

#### 3. 验证安装

```powershell
# 检查编译后的文件是否存在
dir dist\*.js
```

> **注意**：Windows 不需要额外的执行权限设置，Node.js 脚本可以直接运行。

</details>

<details>
<summary>Linux 源码安装</summary>

#### 1. 克隆项目

```bash
# 创建 .claude 目录（如果不存在）
mkdir -p ~/.claude

# 克隆项目
cd ~/.claude
git clone https://github.com/Flobby949/cc-notifier.git

# 进入项目目录
cd cc-notifier
```

#### 2. 安装依赖并编译

```bash
# 安装依赖
npm install

# 编译 TypeScript
npm run build
```

#### 3. 添加执行权限

```bash
chmod +x dist/index.js dist/session-tracker.js
```

> **注意**：Linux 系统通知依赖 `notify-send`，大多数桌面发行版已预装。如未安装，请使用包管理器安装 `libnotify-bin`（Debian/Ubuntu）或 `libnotify`（Fedora/Arch）。

</details>

## 配置 Claude Code Hooks

编辑 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/cc-notifier/dist/session-tracker.js"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/cc-notifier/dist/index.js",
            "background": false
          }
        ]
      }
    ]
  }
}
```

## 配置通知

首次运行会自动创建配置文件 `~/.claude/webhook-config.json`：

```json
{
  "minDuration": 10,
  "enableSystemNotification": true,
  "enableVoice": false,
  "enableLogging": true,
  "autoActivateWindow": false,
  "webhooks": []
}
```

| 参数 | 说明 |
|------|------|
| `minDuration` | 最小通知时长（秒），低于此值不发送通知 |
| `enableSystemNotification` | 是否启用系统通知 |
| `enableVoice` | 是否启用语音播报 |
| `enableLogging` | 是否记录日志 |
| `autoActivateWindow` | 任务完成后是否自动激活终端窗口 |

## Webhook 配置

### Slack

```json
{
  "enabled": true,
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXX",
  "type": "slack"
}
```

### Discord

```json
{
  "enabled": true,
  "url": "https://discord.com/api/webhooks/1234567890/abcdefg",
  "type": "discord"
}
```

### Telegram

```json
{
  "enabled": true,
  "url": "https://api.telegram.org/bot",
  "type": "telegram",
  "token": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
  "chatId": "123456789"
}
```

### 钉钉

```json
{
  "enabled": true,
  "url": "https://oapi.dingtalk.com/robot/send?access_token=XXXX",
  "type": "dingtalk",
  "secret": "SECxxxxxxxxxx"
}
```

### 飞书

```json
{
  "enabled": true,
  "url": "https://open.feishu.cn/open-apis/bot/v2/hook/xxxx",
  "type": "feishu",
  "secret": "xxxxxxxx"
}
```

### 企业微信

```json
{
  "enabled": true,
  "url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxx",
  "type": "wecom"
}
```

### 自定义 Webhook

```json
{
  "enabled": true,
  "url": "https://your-server.com/webhook",
  "type": "custom"
}
```

发送的 JSON 格式：

```json
{
  "title": "Claude Code 任务完成",
  "sessionId": "abc123...",
  "stopReason": "completed",
  "duration": 45,
  "projectPath": "/path/to/project",
  "timestamp": "2024-12-08T10:30:00.000Z"
}
```

## 多 Webhook 配置示例

```json
{
  "minDuration": 10,
  "enableSystemNotification": true,
  "enableVoice": false,
  "enableLogging": true,
  "webhooks": [
    {
      "enabled": true,
      "url": "https://oapi.dingtalk.com/robot/send?access_token=XXXX",
      "type": "dingtalk",
      "secret": "SECxxxxxxxxxx"
    },
    {
      "enabled": true,
      "url": "https://api.telegram.org/bot",
      "type": "telegram",
      "token": "xxx",
      "chatId": "xxx"
    }
  ]
}
```

## 平台支持

### 系统通知

| 平台 | 实现方式 | 点击激活终端 |
|------|----------|--------------|
| macOS | terminal-notifier | Warp / iTerm / Terminal |
| Windows | node-notifier | Windows Terminal / VS Code |
| Linux | node-notifier | 不支持 |

### 语音播报

| 平台 | 实现方式 |
|------|----------|
| macOS | `say` 命令 |
| Windows | PowerShell SpeechSynthesizer |
| Linux | 不支持 |

## 测试

```bash
# 测试通知
echo '{"session_id":"test123","stop_reason":"completed"}' | ~/.claude/cc-notifier/dist/index.js

# 查看日志
tail -f ~/.claude/webhook-notification.log
```

## 扩展开发

### 添加新的 Webhook 平台

1. 在 `src/webhook/providers/` 下创建新文件，如 `pushover.ts`
2. 实现发送函数：

```typescript
import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendPushoverNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  // 实现发送逻辑
}
```

3. 在 `src/webhook/index.ts` 中注册：

```typescript
import { sendPushoverNotification } from './providers/pushover';

const webhookSenders = {
  // ...
  pushover: sendPushoverNotification
};
```

4. 在 `src/types.ts` 中添加类型：

```typescript
export type WebhookType = '...' | 'pushover';
```

### 添加新的通知方式

在 `src/notification/` 下创建新模块，然后在 `index.ts` 中导出。

## 故障排查

### Webhook 发送失败

```bash
# 查看日志
tail -20 ~/.claude/webhook-notification.log

# 手动测试
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Test"}' \
  YOUR_WEBHOOK_URL
```

### 钉钉签名失败

确保系统时间同步：

```bash
# macOS
sudo sntp -sS time.apple.com
```

### 权限问题

```bash
chmod +x ~/.claude/cc-notifier/dist/*.js
```

## License

MIT
