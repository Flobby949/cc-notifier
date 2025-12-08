/**
 * 企业微信 Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendWeComNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  // 从 stopReason 中提取标题（支持 Notification hook 传递的格式）
  const titleMatch = session.stopReason.match(/^(.+?):/);
  const title = titleMatch ? titleMatch[1] : '任务完成';
  const status = titleMatch ? session.stopReason.substring(titleMatch[0].length).trim() : session.stopReason;

  let message = `${emoji} **Claude Code ${title}**\n`;
  message += `> 会话ID: <font color="comment">${session.sessionId.substring(0, 16)}</font>\n`;
  message += `> 状态: ${status}\n`;

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
