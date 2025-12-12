/**
 * 主菜单
 */

import { select, Separator } from '@inquirer/prompts';
import { NotificationConfig } from '../../types';
import { showBasicSettings } from './basic-settings';
import { showNotificationSettings } from './notification-settings';
import { showSessionSettings } from './session-settings';
import { showHookSettings } from './hook-settings';
import { showWebhookMenu } from './webhook-menu';

export type MainMenuAction = 'save' | 'exit' | 'continue';

export async function showMainMenu(config: NotificationConfig): Promise<MainMenuAction> {
  const choice = await select({
    message: '选择配置类别:',
    choices: [
      { name: '基础设置', value: 'basic', description: 'minDuration, enableLogging' },
      { name: '通知设置', value: 'notification', description: '系统通知、语音、窗口激活' },
      { name: '会话设置', value: 'session', description: '会话清理相关' },
      { name: 'Hook 设置', value: 'hook', description: 'Notification Hook 相关' },
      { name: 'Webhook 管理', value: 'webhook', description: '管理 Webhook 配置' },
      new Separator(),
      { name: '保存并退出', value: 'save' },
      { name: '不保存退出', value: 'exit' }
    ]
  });

  switch (choice) {
    case 'basic':
      await showBasicSettings(config);
      return 'continue';
    case 'notification':
      await showNotificationSettings(config);
      return 'continue';
    case 'session':
      await showSessionSettings(config);
      return 'continue';
    case 'hook':
      await showHookSettings(config);
      return 'continue';
    case 'webhook':
      await showWebhookMenu(config);
      return 'continue';
    case 'save':
      return 'save';
    case 'exit':
      return 'exit';
    default:
      return 'continue';
  }
}
