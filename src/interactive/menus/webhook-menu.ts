/**
 * Webhook 管理菜单
 */

import { select, input, confirm, Separator } from '@inquirer/prompts';
import { NotificationConfig, WebhookConfig, WebhookType } from '../../types';
import { truncateUrl } from '../prompts';
import { validateUrl } from '../validators';

const WEBHOOK_TYPE_LABELS: Record<WebhookType, string> = {
  'slack': 'Slack',
  'discord': 'Discord',
  'telegram': 'Telegram',
  'dingtalk': '钉钉 (DingTalk)',
  'feishu': '飞书 (Feishu)',
  'wecom': '企业微信 (WeCom)',
  'custom': '自定义 (Custom)'
};

export async function showWebhookMenu(config: NotificationConfig): Promise<void> {
  while (true) {
    // 显示当前 Webhook 列表
    if (config.webhooks.length > 0) {
      console.log('\n已配置的 Webhook:');
      config.webhooks.forEach((w, i) => {
        const status = w.enabled ? '[启用]' : '[禁用]';
        console.log(`  ${i + 1}. ${status} ${WEBHOOK_TYPE_LABELS[w.type]}: ${truncateUrl(w.url)}`);
      });
      console.log('');
    } else {
      console.log('\n暂无配置的 Webhook\n');
    }

    const choices = [
      { name: '添加新 Webhook', value: 'add' },
    ];

    if (config.webhooks.length > 0) {
      choices.push(
        { name: '编辑 Webhook', value: 'edit' },
        { name: '删除 Webhook', value: 'remove' },
        { name: '启用/禁用 Webhook', value: 'toggle' }
      );
    }

    choices.push(
      new Separator() as any,
      { name: '返回主菜单', value: 'back' }
    );

    const action = await select({
      message: 'Webhook 管理:',
      choices
    });

    switch (action) {
      case 'add':
        const newWebhook = await addWebhook();
        if (newWebhook) {
          config.webhooks.push(newWebhook);
          console.log('\n Webhook 添加成功!\n');
        }
        break;
      case 'edit':
        await editWebhookFlow(config.webhooks);
        break;
      case 'remove':
        await removeWebhookFlow(config.webhooks);
        break;
      case 'toggle':
        await toggleWebhookFlow(config.webhooks);
        break;
      case 'back':
        return;
    }
  }
}

async function addWebhook(): Promise<WebhookConfig | null> {
  // 选择类型
  const type = await select<WebhookType>({
    message: '选择 Webhook 类型:',
    choices: Object.entries(WEBHOOK_TYPE_LABELS).map(([value, name]) => ({
      name,
      value: value as WebhookType
    }))
  });

  // 输入 URL
  const url = await input({
    message: '输入 Webhook URL:',
    validate: validateUrl
  });

  const webhook: WebhookConfig = {
    enabled: true,
    url,
    type
  };

  // 类型特定字段
  if (type === 'telegram') {
    webhook.token = await input({ message: '输入 Bot Token:' });
    webhook.chatId = await input({ message: '输入 Chat ID:' });
  } else if (type === 'dingtalk' || type === 'feishu') {
    const secret = await input({
      message: '输入签名密钥 (可选，按回车跳过):'
    });
    if (secret) webhook.secret = secret;
  }

  // 确认启用
  webhook.enabled = await confirm({
    message: '立即启用此 Webhook?',
    default: true
  });

  return webhook;
}

async function editWebhookFlow(webhooks: WebhookConfig[]): Promise<void> {
  if (webhooks.length === 0) return;

  const index = await selectWebhook(webhooks, '选择要编辑的 Webhook:');
  if (index === -1) return;

  const webhook = webhooks[index];

  while (true) {
    const field = await select({
      message: `编辑 Webhook (${WEBHOOK_TYPE_LABELS[webhook.type]}):`,
      choices: [
        { name: `enabled: ${webhook.enabled ? '启用' : '禁用'}`, value: 'enabled' },
        { name: `type: ${WEBHOOK_TYPE_LABELS[webhook.type]}`, value: 'type' },
        { name: `url: ${truncateUrl(webhook.url)}`, value: 'url' },
        ...(webhook.type === 'telegram' ? [
          { name: `token: ${webhook.token ? '已设置' : '未设置'}`, value: 'token' },
          { name: `chatId: ${webhook.chatId || '未设置'}`, value: 'chatId' }
        ] : []),
        ...(['dingtalk', 'feishu'].includes(webhook.type) ? [
          { name: `secret: ${webhook.secret ? '已设置' : '未设置'}`, value: 'secret' }
        ] : []),
        new Separator(),
        { name: '返回', value: 'back' }
      ]
    });

    switch (field) {
      case 'enabled':
        webhook.enabled = await confirm({
          message: '启用此 Webhook?',
          default: webhook.enabled
        });
        break;
      case 'type':
        webhook.type = await select<WebhookType>({
          message: '选择新的类型:',
          choices: Object.entries(WEBHOOK_TYPE_LABELS).map(([value, name]) => ({
            name,
            value: value as WebhookType
          })),
          default: webhook.type
        });
        break;
      case 'url':
        webhook.url = await input({
          message: '输入新的 URL:',
          default: webhook.url,
          validate: validateUrl
        });
        break;
      case 'token':
        webhook.token = await input({
          message: '输入 Bot Token:',
          default: webhook.token || ''
        });
        break;
      case 'chatId':
        webhook.chatId = await input({
          message: '输入 Chat ID:',
          default: webhook.chatId || ''
        });
        break;
      case 'secret':
        webhook.secret = await input({
          message: '输入签名密钥:',
          default: webhook.secret || ''
        });
        break;
      case 'back':
        return;
    }
  }
}

async function removeWebhookFlow(webhooks: WebhookConfig[]): Promise<void> {
  if (webhooks.length === 0) return;

  const index = await selectWebhook(webhooks, '选择要删除的 Webhook:');
  if (index === -1) return;

  const confirmed = await confirm({
    message: `确定要删除此 Webhook (${WEBHOOK_TYPE_LABELS[webhooks[index].type]})？`,
    default: false
  });

  if (confirmed) {
    webhooks.splice(index, 1);
    console.log('\n Webhook 已删除\n');
  }
}

async function toggleWebhookFlow(webhooks: WebhookConfig[]): Promise<void> {
  if (webhooks.length === 0) return;

  const index = await selectWebhook(webhooks, '选择要切换状态的 Webhook:');
  if (index === -1) return;

  webhooks[index].enabled = !webhooks[index].enabled;
  const status = webhooks[index].enabled ? '启用' : '禁用';
  console.log(`\n Webhook 已${status}\n`);
}

async function selectWebhook(webhooks: WebhookConfig[], message: string): Promise<number> {
  const choices = webhooks.map((w, i) => ({
    name: `${i + 1}. [${w.enabled ? '启用' : '禁用'}] ${WEBHOOK_TYPE_LABELS[w.type]}: ${truncateUrl(w.url)}`,
    value: i
  }));

  choices.push(
    new Separator() as any,
    { name: '取消', value: -1 }
  );

  return await select({
    message,
    choices
  });
}
