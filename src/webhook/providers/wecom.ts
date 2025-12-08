/**
 * 企业微信 Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendWeComNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  let message = `${emoji} **Claude Code 任务完成**\n`;
  message += `> 会话ID: <font color="comment">${session.sessionId.substring(0, 16)}</font>\n`;
  message += `> 状态: ${session.stopReason}\n`;

  if (session.duration) {
    message += `> 耗时: <font color="info">${session.duration}秒</font>\n`;
  }

  if (session.projectPath) {
    message += `> 项目: ${session.projectPath}\n`;
  }

  const payload = {
    msgtype: 'markdown',
    markdown: { content: message }
  };

  await sendWebhook(webhook.url, payload);
}
