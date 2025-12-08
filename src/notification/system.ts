/**
 * 系统通知模块（跨平台）
 */

import { execSync } from 'child_process';
import notifier from 'node-notifier';
import { SessionData } from '../types';
import { platform, getTerminalApp, macOSBundleIds, activateWindowsTerminal } from './terminal';

/**
 * 发送系统通知（跨平台入口）
 */
export function sendSystemNotification(session: SessionData): void {
  const title = session.stopReason.includes('error') ? '⚠️ 任务完成（有错误）' : '✅ 任务完成';
  const durationText = session.duration ? `耗时 ${session.duration} 秒` : '';
  const message = `会话: ${session.sessionId.substring(0, 8)}... ${durationText}`;

  if (platform === 'darwin') {
    sendMacOSNotification(title, message, session.stopReason.includes('error'));
  } else if (platform === 'win32') {
    sendWindowsNotification(title, message);
  } else {
    sendGenericNotification(title, message);
  }
}

/**
 * macOS 通知
 */
function sendMacOSNotification(title: string, message: string, isError: boolean): void {
  const sound = isError ? 'Basso' : 'Glass';
  const terminalApp = getTerminalApp();
  const bundleId = macOSBundleIds[terminalApp] || 'com.apple.Terminal';

  try {
    const command = `terminal-notifier -title "${title}" -message "${message}" -sound "${sound}" -activate "${bundleId}"`;
    execSync(command);
  } catch (error) {
    // 回退到原生通知
    try {
      const fallbackCommand = `osascript -e 'display notification "${message}" with title "${title}" sound name "${sound}"'`;
      execSync(fallbackCommand);
    } catch (fallbackError) {
      console.error('macOS 通知发送失败:', fallbackError);
    }
  }
}

/**
 * Windows 通知
 */
function sendWindowsNotification(title: string, message: string): void {
  const terminalApp = getTerminalApp();

  notifier.notify({
    title: title,
    message: message,
    sound: true,
    wait: true
  }, (err, response, metadata) => {
    if (metadata?.activationType === 'clicked') {
      activateWindowsTerminal(terminalApp);
    }
  });
}

/**
 * 通用通知（Linux 等平台）
 */
function sendGenericNotification(title: string, message: string): void {
  notifier.notify({
    title: title,
    message: message,
    sound: true
  });
}
