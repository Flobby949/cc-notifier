/**
 * 配置管理模块
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NotificationConfig } from './types';

const CONFIG_DIR = path.join(os.homedir(), '.claude');
const CONFIG_PATH = path.join(CONFIG_DIR, 'webhook-config.json');

const DEFAULT_CONFIG: NotificationConfig = {
  minDuration: 10,
  enableSystemNotification: true,
  enableVoice: false,
  enableLogging: true,
  autoActivateWindow: false,
  enableSessionCleanup: true,
  sessionCleanupDays: 7,
  enableNotificationHook: true,
  notificationHookTypes: ['permission_prompt', 'idle_prompt'],
  webhooks: [
    {
      enabled: false,
      url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      type: 'slack'
    },
    {
      enabled: false,
      url: 'https://discord.com/api/webhooks/YOUR/WEBHOOK',
      type: 'discord'
    },
    {
      enabled: false,
      url: 'https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage',
      type: 'telegram',
      token: 'YOUR_BOT_TOKEN',
      chatId: 'YOUR_CHAT_ID'
    }
  ]
};

export function loadConfig(): NotificationConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    }
  } catch (error) {
    console.error('加载配置文件失败，使用默认配置:', error);
  }
  return DEFAULT_CONFIG;
}

export function saveConfig(config: NotificationConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

export function configExists(): boolean {
  return fs.existsSync(CONFIG_PATH);
}

export { CONFIG_PATH, DEFAULT_CONFIG };
