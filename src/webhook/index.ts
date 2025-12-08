/**
 * Webhook 模块导出
 */

import { WebhookConfig, SessionData } from '../types';
import { log } from '../logger';
import { NotificationConfig } from '../types';

import { sendSlackNotification } from './providers/slack';
import { sendDiscordNotification } from './providers/discord';
import { sendTelegramNotification } from './providers/telegram';
import { sendDingTalkNotification } from './providers/dingtalk';
import { sendFeishuNotification } from './providers/feishu';
import { sendWeComNotification } from './providers/wecom';
import { sendCustomNotification } from './providers/custom';

/**
 * Webhook 发送器映射
 */
const webhookSenders: Record<string, (webhook: WebhookConfig, session: SessionData) => Promise<void>> = {
  slack: sendSlackNotification,
  discord: sendDiscordNotification,
  telegram: sendTelegramNotification,
  dingtalk: sendDingTalkNotification,
  feishu: sendFeishuNotification,
  wecom: sendWeComNotification,
  custom: sendCustomNotification
};

/**
 * 发送所有启用的 Webhook 通知
 */
export async function sendAllWebhooks(webhooks: WebhookConfig[], session: SessionData, config: NotificationConfig): Promise<void> {
  const promises: Promise<void>[] = [];

  for (const webhook of webhooks) {
    if (!webhook.enabled) continue;

    const sender = webhookSenders[webhook.type];
    if (!sender) {
      console.warn(`未知的 webhook 类型: ${webhook.type}`);
      continue;
    }

    const promise = sender(webhook, session)
      .then(() => {
        log(`Webhook 发送成功: ${webhook.type}`, config);
      })
      .catch((error) => {
        log(`Webhook 发送失败 (${webhook.type}): ${error.message}`, config);
      });

    promises.push(promise);
  }

  await Promise.allSettled(promises);
}

export { sendWebhook } from './http';
