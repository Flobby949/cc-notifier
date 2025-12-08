/**
 * 钉钉 Webhook
 */

import * as crypto from 'crypto';
import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendDingTalkNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  // 从 stopReason 中提取标题（支持 Notification hook 传递的格式）
  const titleMatch = session.stopReason.match(/^(.+?):/);
  const title = titleMatch ? titleMatch[1] : '任务完成';
  const status = titleMatch ? session.stopReason.substring(titleMatch[0].length).trim() : session.stopReason;

  let message = `${emoji} **Claude Code ${title}**\n\n`;
  message += `> **会话 ID:** ${session.sessionId.substring(0, 16)}\n>\n`;
  message += `> **状态:** ${status}\n>\n`;
  message += `> **耗时:** ${session.duration ? session.duration + ' 秒' : '未知'}\n>\n`;

  if (session.projectPath) {
    message += `> **项目:** ${session.projectPath}\n`;
  }

  const payload = {
    msgtype: 'markdown',
    markdown: {
      title: `Claude Code ${title}`,
      text: message
    }
  };

  // 如果配置了签名，添加签名
  let url = webhook.url;
  if (webhook.secret) {
    const timestamp = Date.now();
    const sign = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}\n${webhook.secret}`)
      .digest('base64');
    url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }

  await sendWebhook(url, payload);
}
