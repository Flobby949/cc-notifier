/**
 * Telegram Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendTelegramNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  let message = `${emoji} *Claude Code 任务完成*\n\n`;
  message += `*会话 ID:* \`${session.sessionId.substring(0, 16)}\`\n`;
  message += `*状态:* ${session.stopReason}\n`;

  if (session.duration) {
    message += `*耗时:* ${session.duration} 秒\n`;
  }

  if (session.projectPath) {
    message += `*项目:* \`${session.projectPath}\`\n`;
  }

  const url = `https://api.telegram.org/bot${webhook.token}/sendMessage`;
  const payload = {
    chat_id: webhook.chatId,
    text: message,
    parse_mode: 'Markdown'
  };

  await sendWebhook(url, payload);
}
