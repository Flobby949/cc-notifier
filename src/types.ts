/**
 * 类型定义
 */

export type WebhookType = 'slack' | 'discord' | 'telegram' | 'dingtalk' | 'feishu' | 'wecom' | 'custom';

export interface WebhookConfig {
  enabled: boolean;
  url: string;
  type: WebhookType;
  token?: string;    // Telegram bot token
  chatId?: string;   // Telegram chat ID
  secret?: string;   // 钉钉、飞书签名密钥
}

export interface NotificationConfig {
  minDuration: number;              // 最小通知时长（秒）
  enableSystemNotification: boolean; // 是否启用系统通知（跨平台）
  enableVoice: boolean;             // 是否启用语音
  enableLogging: boolean;           // 是否记录日志
  autoActivateWindow: boolean;      // 任务完成后是否自动激活终端窗口
  enableSessionCleanup: boolean;    // 是否启用会话文件自动清理
  sessionCleanupDays: number;       // 保留最近多少天的会话文件
  webhooks: WebhookConfig[];
}

export interface SessionData {
  sessionId: string;
  stopReason: string;
  startTime?: number;
  duration?: number;
  projectPath?: string;
  toolCalls?: number;
}

export type Platform = 'darwin' | 'win32' | 'linux';

export type TerminalApp = 'Warp' | 'iTerm' | 'Terminal' | 'WindowsTerminal' | 'VSCode' | 'cmd';
