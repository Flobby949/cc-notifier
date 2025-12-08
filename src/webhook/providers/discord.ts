/**
 * Discord Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendDiscordNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const color = session.stopReason.includes('error') ? 0xED4245 : 0x57F287;
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';

  const fields: any[] = [
    { name: '会话 ID', value: `\`${session.sessionId.substring(0, 16)}\``, inline: true },
    { name: '状态', value: session.stopReason, inline: true }
  ];

  if (session.duration) {
    fields.push({ name: '耗时', value: `${session.duration} 秒`, inline: true });
  }

  if (session.projectPath) {
    fields.push({ name: '项目路径', value: `\`${session.projectPath}\``, inline: false });
  }

  const payload = {
    content: `${emoji} **Claude Code 任务完成**`,
    embeds: [{
      color: color,
      fields: fields,
      timestamp: new Date().toISOString(),
      footer: { text: 'Claude Code Notifier' }
    }]
  };

  await sendWebhook(webhook.url, payload);
}
