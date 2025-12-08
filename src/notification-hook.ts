#!/usr/bin/env node

/**
 * Claude Code Notification Hook 处理器
 * 在 Claude Code 需要用户确认或等待输入时发送通知
 * 支持 macOS / Windows / Linux
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig } from './config';
import { sendSystemNotification, speakNotification, activateTerminalWindow } from './notification';
import { sendAllWebhooks } from './webhook';
import { log } from './logger';
import { SessionData } from './types';

const SESSION_DIR = path.join(os.homedir(), '.claude', '.sessions');

// idle 通知超时时间（毫秒），超过此时间不再发送 idle 通知
const IDLE_NOTIFICATION_TIMEOUT = 5 * 60 * 1000; // 5 分钟

interface NotificationInput {
  session_id: string;
  hook_event_name: string;
  message: string;
  notification_type: 'permission_prompt' | 'idle_prompt' | 'auth_success' | 'elicitation_dialog';
  cwd?: string;
}

/**
 * 获取通知类型的中文描述
 */
function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    permission_prompt: '权限请求',
    idle_prompt: '等待输入',
    auth_success: '认证成功',
    elicitation_dialog: 'MCP 输入'
  };
  return labels[type] || type;
}

/**
 * 检查 idle 通知是否应该被抑制（超过 5 分钟）
 * 返回 true 表示应该抑制（不发送通知）
 */
function shouldSuppressIdleNotification(sessionId: string): boolean {
  const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
  const now = Date.now();

  try {
    if (fs.existsSync(sessionFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      const firstIdleTime = sessionData.firstIdleNotificationTime;

      if (firstIdleTime) {
        // 如果距离首次 idle 通知超过 5 分钟，抑制通知
        if (now - firstIdleTime > IDLE_NOTIFICATION_TIMEOUT) {
          return true;
        }
      } else {
        // 首次 idle 通知，记录时间
        sessionData.firstIdleNotificationTime = now;
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      }
    } else {
      // 会话文件不存在，创建并记录首次 idle 时间
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }
      fs.writeFileSync(sessionFile, JSON.stringify({
        firstIdleNotificationTime: now
      }, null, 2));
    }
  } catch (error) {
    // 出错时不抑制通知
  }

  return false;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  // 读取配置
  const config = loadConfig();

  // 检查是否启用通知 hook
  if (!config.enableNotificationHook) {
    return;
  }

  // 读取 stdin
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf-8');
  } catch (error) {
    return;
  }

  // 解析输入
  let notificationInput: NotificationInput;
  try {
    notificationInput = JSON.parse(input);
  } catch (error) {
    return;
  }

  // 确认是 Notification 事件
  if (notificationInput.hook_event_name !== 'Notification') {
    return;
  }

  // 检查是否需要处理此类型的通知
  const allowedTypes = config.notificationHookTypes || ['permission_prompt', 'idle_prompt'];
  if (!allowedTypes.includes(notificationInput.notification_type)) {
    return;
  }

  // 对于 idle_prompt 类型，检查是否超过 5 分钟，超过则不再通知
  if (notificationInput.notification_type === 'idle_prompt') {
    if (shouldSuppressIdleNotification(notificationInput.session_id)) {
      return;
    }
  }

  const typeLabel = getNotificationTypeLabel(notificationInput.notification_type);
  const title = `Claude Code ${typeLabel}`;
  const message = notificationInput.message || '需要您的操作';

  // 构造 SessionData 用于通知
  const session: SessionData = {
    sessionId: notificationInput.session_id,
    stopReason: notificationInput.notification_type,
    projectPath: notificationInput.cwd
  };

  // 发送系统通知
  if (config.enableSystemNotification) {
    sendSystemNotification({
      ...session,
      stopReason: message
    }, title);
  }

  // 发送语音通知
  if (config.enableVoice) {
    speakNotification({
      ...session,
      stopReason: typeLabel
    });
  }

  // 自动激活终端窗口
  if (config.autoActivateWindow) {
    activateTerminalWindow();
  }

  // 发送 Webhook 通知
  await sendAllWebhooks(config.webhooks, {
    ...session,
    stopReason: `${typeLabel}: ${message}`
  }, config);

  // 记录日志
  log(`[${typeLabel}] ${message}`, config);
}

// 运行
main().catch(() => {
  process.exit(0);
});
