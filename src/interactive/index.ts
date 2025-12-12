/**
 * 交互式配置入口
 */

import { confirm } from '@inquirer/prompts';
import { loadConfig, saveConfig } from '../config';
import { showMainMenu } from './menus/main-menu';

export async function startInteractiveConfig(): Promise<void> {
  let config = loadConfig();
  let modified = false;

  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   Claude Code Notifier - 交互式配置        ║');
  console.log('╚════════════════════════════════════════════╝\n');

  while (true) {
    const result = await showMainMenu(config);

    if (result === 'save') {
      saveConfig(config);
      console.log('\n✓ 配置已保存!\n');
      break;
    } else if (result === 'exit') {
      if (modified) {
        const confirmExit = await confirm({
          message: '有未保存的更改，确定要退出吗?',
          default: false
        });
        if (!confirmExit) continue;
      }
      console.log('\n配置未保存。\n');
      break;
    }
    // 'continue' 表示继续在循环中
    modified = true;
  }
}
