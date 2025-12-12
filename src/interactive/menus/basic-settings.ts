/**
 * 基础设置菜单
 */

import { select, Separator } from '@inquirer/prompts';
import { NotificationConfig } from '../../types';
import { editNumber, editBoolean } from '../prompts';
import { validateMinDuration } from '../validators';

export async function showBasicSettings(config: NotificationConfig): Promise<void> {
  while (true) {
    const choice = await select({
      message: '基础设置:',
      choices: [
        {
          name: `minDuration: ${config.minDuration} 秒`,
          value: 'minDuration',
          description: '任务耗时低于此值不发送通知'
        },
        {
          name: `enableLogging: ${config.enableLogging ? '启用' : '禁用'}`,
          value: 'enableLogging',
          description: '是否记录日志'
        },
        new Separator(),
        { name: '返回主菜单', value: 'back' }
      ]
    });

    switch (choice) {
      case 'minDuration':
        config.minDuration = await editNumber(
          '最小通知时长 (秒)',
          config.minDuration,
          validateMinDuration
        );
        break;
      case 'enableLogging':
        config.enableLogging = await editBoolean('启用日志记录', config.enableLogging);
        break;
      case 'back':
        return;
    }
  }
}
