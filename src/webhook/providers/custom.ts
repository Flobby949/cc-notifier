/**
 * 自定义 Webhook
 */

import { WebhookConfig, SessionData } from '../../types';
import { sendWebhook } from '../http';

export async function sendCustomNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const payload = {
    title: 'Claude Code 任务完成',
    sessionId: session.sessionId,
    stopReason: session.stopReason,
    duration: session.duration,
    projectPath: session.projectPath,
    timestamp: new Date().toISOString()
  };

  await sendWebhook(webhook.url, payload);
}
