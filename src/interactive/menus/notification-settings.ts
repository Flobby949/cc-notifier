/**
 * 通知设置菜单
 */

import { select, Separator } from '@inquirer/prompts';
import { NotificationConfig } from '../../types';
import { editBoolean } from '../prompts';

export async function showNotificationSettings(config: NotificationConfig): Promise<void> {
  while (true) {
    const choice = await select({
      message: '通知设置:',
      choices: [
        {
          name: `enableSystemNotification: ${config.enableSystemNotification ? '启用' : '禁用'}`,
          value: 'enableSystemNotification',
          description: '是否启用桌面通知'
        },
        {
          name: `enableVoice: ${config.enableVoice ? '启用' : '禁用'}`,
          value: 'enableVoice',
          description: '是否启用语音播报'
        },
        {
          name: `autoActivateWindow: ${config.autoActivateWindow ? '启用' : '禁用'}`,
          value: 'autoActivateWindow',
          description: '任务完成后是否自动激活终端窗口'
        },
        new Separator(),
        { name: '返回主菜单', value: 'back' }
      ]
    });

    switch (choice) {
      case 'enableSystemNotification':
        config.enableSystemNotification = await editBoolean(
          '启用桌面通知',
          config.enableSystemNotification
        );
        break;
      case 'enableVoice':
        config.enableVoice = await editBoolean('启用语音播报', config.enableVoice);
        break;
      case 'autoActivateWindow':
        config.autoActivateWindow = await editBoolean(
          '自动激活终端窗口',
          config.autoActivateWindow
        );
        break;
      case 'back':
        return;
    }
  }
}
