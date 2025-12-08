#!/usr/bin/env node

/**
 * Claude Code Notification Hook 处理器
 * 在 Claude Code 需要用户确认或等待输入时发送通知
 * 支持 macOS / Windows / Linux
 */

import * as fs from 'fs';
import { loadConfig } from './config';
import { sendSystemNotification, speakNotification, activateTerminalWindow } from './notification';
import { sendAllWebhooks } from './webhook';
import { log } from './logger';
import { SessionData } from './types';

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
