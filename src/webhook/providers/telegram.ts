/**
 * Telegram Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendTelegramNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  // 从 stopReason 中提取标题（支持 Notification hook 传递的格式）
  const titleMatch = session.stopReason.match(/^(.+?):/);
  const title = titleMatch ? titleMatch[1] : '任务完成';
  const status = titleMatch ? session.stopReason.substring(titleMatch[0].length).trim() : session.stopReason;

  let message = `${emoji} *Claude Code ${title}*\n\n`;
  message += `*会话 ID:* \`${session.sessionId.substring(0, 16)}\`\n`;
  message += `*状态:* ${status}\n`;

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
