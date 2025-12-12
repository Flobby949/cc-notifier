/**
 * Hook 设置菜单
 */

import { select, checkbox, Separator } from '@inquirer/prompts';
import { NotificationConfig, NotificationHookType } from '../../types';
import { editBoolean } from '../prompts';

const HOOK_TYPE_LABELS: Record<NotificationHookType, string> = {
  'permission_prompt': '权限请求提示',
  'idle_prompt': '空闲提示',
  'auth_success': '认证成功',
  'elicitation_dialog': '信息收集对话框'
};

const ALL_HOOK_TYPES: NotificationHookType[] = [
  'permission_prompt',
  'idle_prompt',
  'auth_success',
  'elicitation_dialog'
];

export async function showHookSettings(config: NotificationConfig): Promise<void> {
  while (true) {
    const enabledTypes = config.notificationHookTypes || [];
    const typesDisplay = enabledTypes.length > 0
      ? enabledTypes.map(t => HOOK_TYPE_LABELS[t]).join(', ')
      : '无';

    const choice = await select({
      message: 'Hook 设置:',
      choices: [
        {
          name: `enableNotificationHook: ${config.enableNotificationHook ? '启用' : '禁用'}`,
          value: 'enableNotificationHook',
          description: '是否启用 Notification 事件通知'
        },
        {
          name: `notificationHookTypes: ${enabledTypes.length} 个类型`,
          value: 'notificationHookTypes',
          description: typesDisplay
        },
        new Separator(),
        { name: '返回主菜单', value: 'back' }
      ]
    });

    switch (choice) {
      case 'enableNotificationHook':
        config.enableNotificationHook = await editBoolean(
          '启用 Notification Hook',
          config.enableNotificationHook
        );
        break;
      case 'notificationHookTypes':
        config.notificationHookTypes = await editHookTypes(config.notificationHookTypes || []);
        break;
      case 'back':
        return;
    }
  }
}

async function editHookTypes(currentTypes: NotificationHookType[]): Promise<NotificationHookType[]> {
  const result = await checkbox({
    message: '选择需要通知的 Hook 类型 (空格切换):',
    choices: ALL_HOOK_TYPES.map(type => ({
      name: HOOK_TYPE_LABELS[type],
      value: type,
      checked: currentTypes.includes(type)
    }))
  });
  return result as NotificationHookType[];
}
