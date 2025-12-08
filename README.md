# Claude Code Webhook 通知器 - 完整指南

支持 Slack、Discord、Telegram、钉钉、飞书、企业微信等多种消息服务。

---

## 🚀 快速开始

### 方式一：使用预编译脚本（推荐）

如果你不想配置 TypeScript 环境，可以直接使用编译后的 JavaScript：

```bash
# 1. 创建项目目录
mkdir -p ~/.claude/notifier
cd ~/.claude/notifier

# 2. 初始化 package.json（可选，用于管理依赖）
npm init -y

# 3. 将上面的 TypeScript 代码保存为 index.ts，然后编译
npx tsc index.ts --outDir dist --target ES2020 --module commonjs --esModuleInterop

# 4. 添加执行权限
chmod +x dist/index.js

# 5. 配置 Claude Code hooks
```

### 方式二：从源码构建

```bash
# 1. 创建项目
mkdir -p ~/.claude/notifier
cd ~/.claude/notifier

# 2. 创建文件结构
mkdir -p src dist scripts test

# 3. 将以下文件放到对应位置：
#    - index.ts → src/index.ts
#    - session-tracker.ts → src/session-tracker.ts
#    - package.json → package.json
#    - tsconfig.json → tsconfig.json

# 4. 安装依赖
npm install

# 5. 编译
npm run build

# 6. 添加执行权限
chmod +x dist/index.js dist/session-tracker.js
```

---

## ⚙️ 配置 Claude Code

编辑 `~/.claude/settings.json`：

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/notifier/dist/session-tracker.js",
            "background": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/notifier/dist/index.js",
            "background": false
          }
        ]
      }
    ]
  }
}
```

---

## 📝 配置 Webhook

首次运行会自动创建配置文件 `~/.claude/webhook-config.json`。

### 基础配置

```json
{
  "minDuration": 10,
  "enableMacOS": true,
  "enableVoice": false,
  "enableLogging": true,
  "webhooks": []
}
```

**参数说明：**
- `minDuration`: 最小通知时长（秒），低于此值不发送通知
- `enableMacOS`: 是否启用 macOS 原生通知
- `enableVoice`: 是否启用语音提示
- `enableLogging`: 是否记录日志到 `~/.claude/webhook-notification.log`

---

## 🔗 支持的 Webhook 服务

### 1. Slack

**获取 Webhook URL：**
1. 访问 https://api.slack.com/apps
2. 创建新应用 → 选择 "From scratch"
3. 启用 "Incoming Webhooks"
4. 点击 "Add New Webhook to Workspace"
5. 选择频道，复制 Webhook URL

**配置示例：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX",
      "type": "slack"
    }
  ]
}
```

**效果：**
- 格式化的消息卡片
- 颜色编码（成功=绿色，错误=红色）
- 包含会话 ID、耗时、项目路径等信息

---

### 2. Discord

**获取 Webhook URL：**
1. 打开 Discord 服务器设置
2. 集成 → Webhooks → 新建 Webhook
3. 选择频道，复制 Webhook URL

**配置示例：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz",
      "type": "discord"
    }
  ]
}
```

**效果：**
- Rich Embed 消息
- 彩色边框
- 时间戳

---

### 3. Telegram

**获取 Bot Token 和 Chat ID：**

1. **创建 Bot：**
   - 在 Telegram 中找到 @BotFather
   - 发送 `/newbot`
   - 按提示设置名称，获取 token

2. **获取 Chat ID：**
   ```bash
   # 方法1：与 bot 对话后访问
   curl https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   
   # 方法2：使用 @userinfobot 获取自己的 Chat ID
   ```

**配置示例：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://api.telegram.org/bot",
      "type": "telegram",
      "token": "1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
      "chatId": "123456789"
    }
  ]
}
```

**效果：**
- Markdown 格式消息
- 即时推送到手机

---

### 4. 钉钉（DingTalk）

**获取 Webhook URL：**
1. 打开钉钉群 → 群设置 → 智能群助手
2. 添加机器人 → 自定义
3. 设置安全设置（推荐使用加签）
4. 复制 Webhook URL 和密钥

**配置示例（加签）：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://oapi.dingtalk.com/robot/send?access_token=XXXXXXXXXX",
      "type": "dingtalk",
      "secret": "SECxxxxxxxxxxxxxxxxxxxxxxxxxx"
    }
  ]
}
```

**配置示例（关键词）：**

如果使用关键词验证，确保消息中包含关键词（如 "Claude"）：

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://oapi.dingtalk.com/robot/send?access_token=XXXXXXXXXX",
      "type": "dingtalk"
    }
  ]
}
```

---

### 5. 飞书（Lark/Feishu）

**获取 Webhook URL：**
1. 打开飞书群 → 设置 → 群机器人
2. 添加机器人 → 自定义机器人
3. 复制 Webhook URL

**配置示例：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://open.feishu.cn/open-apis/bot/v2/hook/xxxxxxxxxxxxxxxxx",
      "type": "feishu",
      "secret": "xxxxxxxxxxxxxxxx"
    }
  ]
}
```

---

### 6. 企业微信（WeCom）

**获取 Webhook URL：**
1. 打开企业微信群 → 群设置 → 群机器人
2. 添加机器人
3. 复制 Webhook URL

**配置示例：**

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "type": "wecom"
    }
  ]
}
```

---

### 7. 自定义 Webhook

对于其他服务，可以使用 `custom` 类型，会发送标准 JSON 格式：

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://your-server.com/webhook",
      "type": "custom"
    }
  ]
}
```

**发送的 JSON 格式：**

```json
{
  "title": "Claude Code 任务完成",
  "sessionId": "abc123...",
  "stopReason": "completed",
  "duration": 45,
  "projectPath": "/Users/xxx/project",
  "timestamp": "2024-12-08T10:30:00.000Z"
}
```

---

## 🎨 高级配置

### 多个 Webhook

可以同时配置多个服务：

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://hooks.slack.com/services/...",
      "type": "slack"
    },
    {
      "enabled": true,
      "url": "https://discord.com/api/webhooks/...",
      "type": "discord"
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

### 项目级配置

在项目根目录创建 `.claude/webhook-config.json` 覆盖全局配置：

```json
{
  "minDuration": 30,
  "webhooks": [
    {
      "enabled": true,
      "url": "https://hooks.slack.com/services/PROJECT_SPECIFIC",
      "type": "slack"
    }
  ]
}
```

### 条件通知

可以通过修改脚本实现条件通知，例如：

```typescript
// 只在错误时通知
if (!session.stopReason.includes('error')) {
  return;
}

// 只在工作时间通知
const hour = new Date().getHours();
if (hour < 9 || hour > 18) {
  return;
}

// 只在特定项目通知
if (!session.projectPath?.includes('/important-project/')) {
  return;
}
```

---

## 📊 消息格式示例

### Slack 消息

```
✅ Claude Code 任务完成

会话 ID        状态
abc12345...    completed

耗时           项目路径
45 秒          /Users/xxx/my-project
```

### Discord 消息

```
✅ Claude Code 任务完成

会话 ID: abc12345...
状态: completed
耗时: 45 秒
项目路径: /Users/xxx/my-project
```

### Telegram 消息

```
✅ Claude Code 任务完成

会话 ID: abc12345...
状态: completed
耗时: 45 秒
项目: /Users/xxx/my-project
```

---

## 🧪 测试

### 测试 macOS 通知

```bash
echo '{"session_id":"test123","stop_reason":"completed"}' | ~/.claude/notifier/dist/index.js
```

### 测试 Webhook

创建测试文件 `test-input.json`：

```json
{
  "session_id": "test-session-123",
  "stop_reason": "completed",
  "project_path": "/Users/xxx/test-project"
}
```

运行测试：

```bash
cat test-input.json | ~/.claude/notifier/dist/index.js
```

### 检查日志

```bash
tail -f ~/.claude/webhook-notification.log
```

---

## 🔧 故障排查

### Webhook 发送失败

1. **检查 URL 是否正确**
   ```bash
   # 手动测试 Slack webhook
   curl -X POST -H 'Content-Type: application/json' \
     -d '{"text":"Test message"}' \
     YOUR_WEBHOOK_URL
   ```

2. **检查网络连接**
   ```bash
   ping hooks.slack.com
   ```

3. **查看错误日志**
   ```bash
   tail -20 ~/.claude/webhook-notification.log
   ```

### 钉钉签名失败

确保时间同步正确：

```bash
# macOS
sudo sntp -sS time.apple.com

# 检查时间
date
```

### 权限问题

```bash
chmod +x ~/.claude/notifier/dist/*.js
```

### Node.js 版本

确保 Node.js >= 16：

```bash
node --version
```

---

## 🎯 使用场景

### 1. 长时间任务提醒

```json
{
  "minDuration": 60,
  "webhooks": [...]
}
```

适合：大型项目构建、测试套件运行

### 2. 远程工作通知

配置 Telegram，在手机上接收通知：

```json
{
  "enableMacOS": false,
  "webhooks": [
    {
      "enabled": true,
      "type": "telegram",
      ...
    }
  ]
}
```

### 3. 团队协作通知

配置 Slack/钉钉/飞书，团队成员共同关注：

```json
{
  "webhooks": [
    {
      "enabled": true,
      "url": "https://hooks.slack.com/services/TEAM_CHANNEL",
      "type": "slack"
    }
  ]
}
```

### 4. 错误监控

修改脚本，只在错误时发送紧急通知：

```typescript
// 在 main() 函数中添加
if (session.stopReason.includes('error')) {
  // 发送紧急通知
  await sendUrgentNotification(session);
}
```

---

## 🔐 安全建议

1. **不要提交 Webhook URL 到代码仓库**
   
   添加到 `.gitignore`：
   ```
   .claude/webhook-config.json
   ```

2. **使用环境变量**

   ```bash
   export SLACK_WEBHOOK_URL="https://..."
   ```

   在脚本中读取：
   ```typescript
   const url = process.env.SLACK_WEBHOOK_URL || webhook.url;
   ```

3. **定期轮换密钥**

   特别是 Telegram bot token、钉钉/飞书签名密钥

4. **限制 Webhook 权限**

   在各平台设置中，仅授予必要的权限

---

## 📚 扩展阅读

- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [Discord Webhooks Guide](https://discord.com/developers/docs/resources/webhook)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [钉钉机器人文档](https://open.dingtalk.com/document/robots/custom-robot-access)
- [飞书机器人文档](https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN)

---

## 💡 贡献想法

欢迎提供更多集成方案：

- Pushover、Pushbullet
- IFTTT、Zapier
- Home Assistant
- Grafana、Prometheus
- 自建服务器监控

---

## 📄 许可

MIT License

---

**享受更高效的 vibecoding 体验！** 🎵✨
