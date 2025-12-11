# Webhook 配置指南

本文档介绍如何配置各平台的 Webhook 推送。

## 配置文件

配置文件路径：`~/.claude/webhook-config.json`

运行 `ccntf init` 创建配置文件，然后编辑 `webhooks` 数组添加 Webhook。

## 各平台配置

### 钉钉

```json
{
  "enabled": true,
  "url": "https://oapi.dingtalk.com/robot/send?access_token=XXXX",
  "type": "dingtalk",
  "secret": "SECxxxxxxxxxx"
}
```

> `secret` 为签名密钥，在钉钉机器人设置中获取。

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

## 多 Webhook 配置

可以同时配置多个 Webhook：

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

## 测试

```bash
ccntf test    # 测试所有通知（包括 Webhook）
```

## 故障排查

### Webhook 发送失败

```bash
# 查看日志
tail -20 ~/.claude/webhook-notification.log

# 手动测试 Webhook URL
curl -X POST -H 'Content-Type: application/json' \
  -d '{"text":"Test"}' \
  YOUR_WEBHOOK_URL
```

### 钉钉签名失败

确保系统时间同步：

```bash
# macOS
sudo sntp -sS time.apple.com

# Linux
sudo ntpdate pool.ntp.org
```
