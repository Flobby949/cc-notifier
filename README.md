# Claude Code Notifier

Claude Code 任务完成通知器，支持多平台系统通知和多种 Webhook 服务。

## 特性

- **跨平台系统通知**：macOS / Windows / Linux
- **点击激活终端**：支持 Warp、iTerm、Terminal、Windows Terminal、VS Code
- **自动激活窗口**：任务完成后自动切换到终端窗口
- **语音播报**：macOS / Windows
- **多种 Webhook**：Slack、Discord、Telegram、钉钉、飞书、企业微信
- **任务耗时统计**：精确计算单次任务耗时
- **CLI 工具**：一键安装配置、测试通知、管理 hooks

## 快速开始

```bash
# 1. 下载并解压到 ~/.claude/ 目录
# 2. 运行安装脚本，Windows不需要授权
chmod +x setup.sh && ./setup.sh

# 3. 安装 Claude hooks 配置
ccntf hooks install

# 4. 初始化 webhook 配置（可选）
ccntf init

# 完成！重启 Claude Code 即可使用
```

## 安装

<details>
<summary>预编译包安装（推荐）</summary>

从 [GitHub Releases](https://github.com/Flobby949/cc-notifier/releases) 下载预编译包，无需手动编译。

### macOS / Linux

```bash
# 进入 .claude 目录
mkdir -p ~/.claude && cd ~/.claude

# 下载并解压
curl -L https://github.com/Flobby949/cc-notifier/releases/latest/download/cc-notifier-dist.tar.gz | tar -xz

# 运行安装脚本
chmod +x cc-notifier/setup.sh && cd cc-notifier && ./setup.sh
```

macOS 用户推荐安装 `terminal-notifier`（点击通知可激活终端）：

```bash
brew install terminal-notifier
```

### Windows

1. 从 [Releases 页面](https://github.com/Flobby949/cc-notifier/releases) 下载 `cc-notifier-dist.zip`
2. 解压到 `%USERPROFILE%\.claude\` 目录
3. 运行 `setup.bat`

或使用 PowerShell：

```powershell
# 进入 .claude 目录
mkdir $env:USERPROFILE\.claude -Force
cd $env:USERPROFILE\.claude

# 下载并解压
Invoke-WebRequest -Uri "https://github.com/Flobby949/cc-notifier/releases/latest/download/cc-notifier-dist.zip" -OutFile "cc-notifier-dist.zip"
Expand-Archive -Path "cc-notifier-dist.zip" -DestinationPath "." -Force
Remove-Item "cc-notifier-dist.zip"

# 运行安装脚本
cd cc-notifier
.\setup.bat
```

</details>

<details>
<summary>源码安装</summary>

如果你需要修改源码或参与开发，可以选择源码安装。

### macOS / Linux

```bash
# 克隆项目
mkdir -p ~/.claude && cd ~/.claude
git clone https://github.com/Flobby949/cc-notifier.git
cd cc-notifier

# 运行安装脚本（选择"完整构建"）
chmod +x setup.sh && ./setup.sh
```

### Windows

```powershell
# 克隆项目
mkdir $env:USERPROFILE\.claude -Force
cd $env:USERPROFILE\.claude
git clone https://github.com/Flobby949/cc-notifier.git
cd cc-notifier

# 运行安装脚本（选择"完整构建"）
.\setup.bat
```

> **Linux 注意**：系统通知依赖 `notify-send`，大多数桌面发行版已预装。如未安装，请使用包管理器安装 `libnotify-bin`（Debian/Ubuntu）或 `libnotify`（Fedora/Arch）。

</details>

## 配置

<details>
<summary>使用 CLI 工具配置（推荐）</summary>

### 1. 安装 Claude hooks

```bash
ccntf hooks install
```

这会自动将 hooks 配置写入 `~/.claude/settings.json`，并备份原配置。

### 2. 初始化 webhook 配置

```bash
ccntf init
```

这会创建 `~/.claude/webhook-config.json` 配置文件。

### 3. 验证配置

```bash
ccntf check
```

### 4. 测试通知

```bash
ccntf test
```

</details>

<details>
<summary>手动配置</summary>

### Claude hooks 配置

编辑 `~/.claude/settings.json`（Windows: `%USERPROFILE%\.claude\settings.json`）：

**macOS / Linux：**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "~/.claude/cc-notifier/dist/hook.js" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "~/.claude/cc-notifier/dist/hook.js" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "~/.claude/cc-notifier/dist/hook.js" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command", "command": "~/.claude/cc-notifier/dist/hook.js" }] }
    ]
  }
}
```

**Windows：**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node %USERPROFILE%\\.claude\\cc-notifier\\dist\\hook.js" }] }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "node %USERPROFILE%\\.claude\\cc-notifier\\dist\\hook.js" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "node %USERPROFILE%\\.claude\\cc-notifier\\dist\\hook.js" }] }
    ],
    "Notification": [
      { "hooks": [{ "type": "command", "command": "node %USERPROFILE%\\.claude\\cc-notifier\\dist\\hook.js" }] }
    ]
  }
}
```

### webhook 配置文件

创建 `~/.claude/webhook-config.json`：

```json
{
  "minDuration": 10,
  "enableSystemNotification": true,
  "enableVoice": false,
  "enableLogging": true,
  "autoActivateWindow": false,
  "enableSessionCleanup": true,
  "sessionCleanupDays": 7,
  "enableNotificationHook": true,
  "notificationHookTypes": ["permission_prompt", "idle_prompt"],
  "webhooks": []
}
```

</details>

## CLI 工具

<details>
<summary>安装 CLI</summary>

### 使用安装脚本（推荐）

```bash
# macOS / Linux
chmod +x setup.sh && ./setup.sh

# Windows
setup.bat
```

脚本会显示交互式菜单：
```
请选择安装模式:
  1) 快速安装 (安装依赖 + npm link，需要 dist 已存在)
  2) 完整构建 (npm install + build + link)
  3) 退出
```

### 手动安装

```bash
cd ~/.claude/cc-notifier
npm install && npm run build  # 源码安装需要
npm link
```

</details>

<details>
<summary>命令列表</summary>

```bash
ccntf help              # 查看帮助
ccntf init              # 初始化 webhook 配置文件
ccntf init --force      # 强制覆盖配置文件
ccntf hooks             # 显示当前 Claude hooks 配置
ccntf hooks show        # 同上
ccntf hooks print       # 打印可复制的 hooks 配置 JSON
ccntf hooks install     # 自动安装 hooks 到 Claude 配置
ccntf test              # 测试所有通知
ccntf test stop         # 测试 Stop 事件通知
ccntf test notification # 测试 Notification 事件通知
ccntf config            # 显示当前 webhook 配置
ccntf check             # 检查 Claude hooks 配置是否正确
ccntf clean             # 清理日志和会话文件
ccntf clean log         # 仅清理日志文件
ccntf clean session     # 仅清理会话文件（保留 30 分钟内活跃的会话）
ccntf version           # 显示版本号
```

</details>

<details>
<summary>hooks 命令详解</summary>

`ccntf hooks` 用于管理 Claude Code 的 hooks 配置：

```bash
# 查看当前配置
$ ccntf hooks
当前 Claude hooks 配置:
{
  "hooks": {
    "Stop": [...],
    "UserPromptSubmit": [...]
  }
}

# 打印可复制的配置（适配当前平台）
$ ccntf hooks print

# 自动安装（推荐）
$ ccntf hooks install
安装 hooks 到 Claude 配置...

✓ 读取现有配置文件
✓ 已备份原配置到: ~/.claude/settings.json.backup
✓ 已安装 4 个 hooks
✓ 配置已保存到: ~/.claude/settings.json

请重启 Claude Code 以使配置生效
```

> **注意**: `hooks install` 会自动备份原配置，并保留其他配置项不变。

</details>

## Webhook 配置

<details>
<summary>各平台配置示例</summary>

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

### 多 Webhook 配置示例

```json
{
  "minDuration": 10,
  "enableSystemNotification": true,
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

</details>

## 通知配置参数

配置文件路径：`~/.claude/webhook-config.json`

| 参数 | 说明 |
|------|------|
| `minDuration` | 最小通知时长（秒），低于此值不发送通知 |
| `enableSystemNotification` | 是否启用系统通知 |
| `enableVoice` | 是否启用语音播报 |
| `enableLogging` | 是否记录日志 |
| `autoActivateWindow` | 任务完成后是否自动激活终端窗口 |
| `enableSessionCleanup` | 是否启用会话文件自动清理 |
| `sessionCleanupDays` | 保留最近多少天的会话文件（默认 7 天） |
| `enableNotificationHook` | 是否启用 Notification hook（权限请求等通知） |
| `notificationHookTypes` | 需要通知的事件类型：`permission_prompt`、`idle_prompt`、`auth_success`、`elicitation_dialog` |

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

<details>
<summary>测试</summary>

### 使用 CLI 测试（推荐）

```bash
ccntf test              # 测试所有通知
ccntf test stop         # 测试 Stop 事件
ccntf test notification # 测试 Notification 事件
```

### 手动测试

```bash
# 测试 Stop 事件
echo '{"session_id":"test","hook_event_name":"Stop","stop_reason":"completed"}' | ~/.claude/cc-notifier/dist/hook.js

# 查看日志
tail -f ~/.claude/webhook-notification.log
```

</details>

<details>
<summary>故障排查</summary>

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
chmod +x ~/.claude/cc-notifier/dist/hook.js
```

</details>

## 扩展开发


### 目录结构

```
src/
├── cli.ts             # CLI 工具
├── hook.ts            # 统一入口（推荐）
├── index.ts           # Stop 事件处理
├── types.ts           # 类型定义
├── config.ts          # 配置管理
├── logger.ts          # 日志模块
├── session.ts         # 会话管理
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

3. 在 `src/webhook/index.ts` 中注册
4. 在 `src/types.ts` 中添加类型

### 添加新的通知方式

在 `src/notification/` 下创建新模块，然后在 `index.ts` 中导出。

## 参考文档

- [Claude Code Hooks 官方文档](https://code.claude.com/docs/en/hooks)

## License

MIT
