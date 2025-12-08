/**
 * 日志模块
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NotificationConfig } from './types';

const LOG_FILE = path.join(os.homedir(), '.claude', 'webhook-notification.log');
const MAX_LOG_LINES = 500;

export function log(message: string, config: NotificationConfig): void {
  if (!config.enableLogging) return;

  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const newEntry = `[${timestamp}] ${message}\n`;

  // 追加新日志
  fs.appendFileSync(LOG_FILE, newEntry);

  // 检查并清理过多的日志
  trimLogFile();
}

function trimLogFile(): void {
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length > MAX_LOG_LINES) {
      const trimmedContent = lines.slice(-MAX_LOG_LINES).join('\n') + '\n';
      fs.writeFileSync(LOG_FILE, trimmedContent);
    }
  } catch (error) {
    // 清理失败不影响主流程
  }
}

export { LOG_FILE };
