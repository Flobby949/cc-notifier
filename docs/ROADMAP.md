# Claude Code Notifier 功能规划

## 通知增强

### 通知分级

根据任务耗时或状态设置不同紧急程度。

**配置示例：**

```json
{
  "notificationLevels": {
    "normal": { "minDuration": 10, "maxDuration": 60 },
    "important": { "minDuration": 60, "maxDuration": 300 },
    "urgent": { "minDuration": 300 }
  }
}
```

**效果：**
- 普通：默认提示音
- 重要：连续提示音
- 紧急：持续提示 + 震动

---

### 静默时段

设置免打扰时间段，在指定时间内不发送通知。

**配置示例：**

```json
{
  "quietHours": {
    "enabled": true,
    "start": "23:00",
    "end": "08:00",
    "allowUrgent": true
  }
}
```

**效果：**
- 23:00 - 08:00 不发送通知
- 可选允许紧急通知穿透

---

### 通知聚合

短时间内多个任务完成时合并为一条通知，避免通知轰炸。

**配置示例：**

```json
{
  "aggregation": {
    "enabled": true,
    "windowSeconds": 30,
    "maxCount": 5
  }
}
```

**效果：**
- 30 秒内的通知合并
- 显示 "5 个任务已完成，总耗时 xxx 秒"

---

### 失败重试

Webhook 发送失败时自动重试。

**配置示例：**

```json
{
  "retry": {
    "enabled": true,
    "maxAttempts": 3,
    "delayMs": 1000
  }
}
```

---

## 统计分析

### 任务统计

记录任务执行数据，支持查询统计信息。

**数据存储：**

```json
{
  "date": "2024-12-08",
  "tasks": [
    {
      "sessionId": "xxx",
      "projectPath": "/path/to/project",
      "duration": 45,
      "stopReason": "completed",
      "timestamp": "2024-12-08T10:30:00Z"
    }
  ]
}
```

**统计维度：**
- 每日任务数量
- 每日总耗时
- 平均任务耗时
- 成功/失败比例

---

### 项目统计

按项目分类统计使用情况。

**输出示例：**

```
项目统计 (最近 7 天)
=====================================
/Users/xxx/project-a    45 次    2.5 小时
/Users/xxx/project-b    23 次    1.2 小时
/Users/xxx/project-c    12 次    0.8 小时
```

---

### 统计报告

定时生成使用报告，通过 Webhook 发送。

**配置示例：**

```json
{
  "reports": {
    "daily": { "enabled": true, "time": "09:00" },
    "weekly": { "enabled": true, "day": "monday", "time": "09:00" }
  }
}
```

**报告内容：**
- 任务总数
- 总耗时
- 最活跃项目
- 错误率

---

### CLI 查看

命令行查看统计数据。

**命令示例：**

```bash
# 查看今日统计
notifier stats today

# 查看本周统计
notifier stats week

# 查看指定项目统计
notifier stats --project /path/to/project

# 查看最近 10 条任务
notifier history --limit 10
```

---

## 更多平台

### Pushover

iOS/Android 推送服务，支持优先级和声音自定义。

**配置示例：**

```json
{
  "enabled": true,
  "type": "pushover",
  "token": "your-api-token",
  "userKey": "your-user-key",
  "priority": 0,
  "sound": "pushover"
}
```

**优先级：**
- -2: 静默
- -1: 低优先级
- 0: 普通
- 1: 高优先级
- 2: 紧急（需要确认）

---

### Bark

iOS 推送服务，国内常用。

**配置示例：**

```json
{
  "enabled": true,
  "type": "bark",
  "url": "https://api.day.app/your-key"
}
```

---

### Server酱

微信推送服务。

**配置示例：**

```json
{
  "enabled": true,
  "type": "serverchan",
  "sendKey": "your-send-key"
}
```

---

### 邮件通知

SMTP 邮件发送。

**配置示例：**

```json
{
  "enabled": true,
  "type": "email",
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  },
  "from": "Claude Code <your-email@gmail.com>",
  "to": "recipient@example.com"
}
```

---

### 桌面小组件

macOS/Windows 桌面小组件显示状态。

**功能：**
- 显示今日任务数
- 显示今日总耗时
- 显示最近任务状态
- 点击打开详情

---

## 交互增强

### 快捷操作

通知中添加可点击的操作按钮。

**macOS 操作：**
- 查看日志
- 打开项目
- 复制会话 ID

**Slack/Discord 操作：**
- 按钮跳转到项目
- 按钮查看详情

---

### 回复交互

Telegram/Slack 支持回复消息触发操作。

**Telegram 命令：**

```
/status - 查看当前状态
/stats - 查看今日统计
/history - 查看最近任务
/config - 查看配置
```

---

### Web 面板

简单的 Web 界面查看历史和配置。

**功能：**
- 任务历史列表
- 统计图表
- 配置编辑
- Webhook 测试

**技术方案：**
- 本地 HTTP 服务器
- 端口：9876
- 访问：http://localhost:9876

---

## 其他

### 多语言

支持英文/中文切换。

**配置示例：**

```json
{
  "language": "zh-CN"
}
```

**支持语言：**
- `zh-CN`: 简体中文
- `en-US`: English

---

### 配置校验

启动时校验配置文件格式，提示错误。

**校验内容：**
- 必填字段检查
- URL 格式检查
- 类型检查
- Webhook 连通性测试（可选）

**错误提示：**

```
配置错误:
  - webhooks[0].url: 无效的 URL 格式
  - minDuration: 必须为正整数
```

---

### 健康检查

定期检测 Webhook 连通性。

**配置示例：**

```json
{
  "healthCheck": {
    "enabled": true,
    "intervalMinutes": 60,
    "notifyOnFailure": true
  }
}
```

---

### 插件系统

支持用户自定义插件扩展功能。

**插件目录：**

```
~/.claude/notifier/plugins/
├── my-plugin/
│   ├── package.json
│   └── index.js
```

**插件接口：**

```typescript
interface NotifierPlugin {
  name: string;
  version: string;

  // 生命周期钩子
  onTaskComplete?(session: SessionData): void;
  onNotificationSent?(type: string, success: boolean): void;

  // 自定义 Webhook
  webhookProvider?: {
    type: string;
    send(config: any, session: SessionData): Promise<void>;
  };
}
```

---

## 优先级建议

### 高优先级
1. Pushover / Bark 支持（扩展推送渠道）
2. 任务统计（数据积累）
3. CLI 查看（便捷查询）

### 中优先级
4. 静默时段（用户体验）
5. 失败重试（稳定性）
6. 配置校验（易用性）

### 低优先级
7. 通知聚合
8. Web 面板
9. 插件系统
10. 桌面小组件

---

## 贡献

欢迎提交 Issue 或 PR 来实现这些功能！
