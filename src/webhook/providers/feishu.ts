/**
 * 飞书 Webhook
 */

import * as crypto from 'crypto';
import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendFeishuNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  let message = `${emoji} **Claude Code 任务完成**\n`;
  message += `会话 ID: ${session.sessionId.substring(0, 16)}\n`;
  message += `状态: ${session.stopReason}\n`;

  if (session.duration) {
    message += `耗时: ${session.duration} 秒\n`;
  }

  if (session.projectPath) {
    message += `项目: ${session.projectPath}\n`;
  }

  const payload = {
    msg_type: 'text',
    content: { text: message }
  };

  // 如果配置了签名，添加签名
  let url = webhook.url;
  if (webhook.secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}\n${webhook.secret}`)
      .digest('base64');
    url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }

  await sendWebhook(url, payload);
}
