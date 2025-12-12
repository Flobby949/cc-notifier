/**
 * 会话设置菜单
 */

import { select, Separator } from '@inquirer/prompts';
import { NotificationConfig } from '../../types';
import { editBoolean, editNumber } from '../prompts';
import { validateSessionCleanupDays } from '../validators';

export async function showSessionSettings(config: NotificationConfig): Promise<void> {
  while (true) {
    const choice = await select({
      message: '会话设置:',
      choices: [
        {
          name: `enableSessionCleanup: ${config.enableSessionCleanup ? '启用' : '禁用'}`,
          value: 'enableSessionCleanup',
          description: '是否自动清理过期会话文件'
        },
        {
          name: `sessionCleanupDays: ${config.sessionCleanupDays} 天`,
          value: 'sessionCleanupDays',
          description: '会话文件保留天数'
        },
        new Separator(),
        { name: '返回主菜单', value: 'back' }
      ]
    });

    switch (choice) {
      case 'enableSessionCleanup':
        config.enableSessionCleanup = await editBoolean(
          '启用会话自动清理',
          config.enableSessionCleanup
        );
        break;
      case 'sessionCleanupDays':
        config.sessionCleanupDays = await editNumber(
          '会话文件保留天数',
          config.sessionCleanupDays,
          validateSessionCleanupDays
        );
        break;
      case 'back':
        return;
    }
  }
}
