/**
 * Slack Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendSlackNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const color = session.stopReason.includes('error') ? 'danger' : 'good';
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  // 从 stopReason 中提取标题（支持 Notification hook 传递的格式）
  const titleMatch = session.stopReason.match(/^(.+?):/);
  const title = titleMatch ? titleMatch[1] : '任务完成';
  const status = titleMatch ? session.stopReason.substring(titleMatch[0].length).trim() : session.stopReason;

  const fields: any[] = [
    { title: '会话 ID', value: session.sessionId.substring(0, 16), short: true },
    { title: '状态', value: status, short: true }
  ];

  if (session.duration) {
    fields.push({ title: '耗时', value: `${session.duration} 秒`, short: true });
  }

  if (session.projectPath) {
    fields.push({ title: '项目路径', value: session.projectPath, short: false });
  }

  const payload = {
    text: `${emoji} Claude Code ${title}`,
    attachments: [{
      color: color,
      fields: fields,
      footer: 'Claude Code Notifier',
      ts: Math.floor(Date.now() / 1000)
    }]
  };

  await sendWebhook(webhook.url, payload);
}
