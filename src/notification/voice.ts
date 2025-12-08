/**
 * 语音播报模块（跨平台）
 */

import { execSync } from 'child_process';
import { SessionData } from '../types';
import { platform } from './terminal';

/**
 * 发送语音通知
 */
export function speakNotification(session: SessionData): void {
  const message = session.duration
    ? `任务已完成，耗时 ${session.duration} 秒`
    : '任务已完成';

  try {
    if (platform === 'darwin') {
      speakMacOS(message);
    } else if (platform === 'win32') {
      speakWindows(message);
    }
    // Linux 暂不支持语音
  } catch (error) {
    console.error('语音通知失败:', error);
  }
}

/**
 * macOS 语音
 */
function speakMacOS(message: string): void {
  try {
    execSync(`say "${message}"`, { stdio: 'ignore', timeout: 10000 });
  } catch (error) {
    // 语音失败静默降级，不影响主流程
  }
}

/**
 * Windows 语音
 */
function speakWindows(message: string): void {
  try {
    const script = `Add-Type -AssemblyName System.Speech; (New-Object System.Speech.Synthesis.SpeechSynthesizer).Speak('${message}')`;
    execSync(`powershell -Command "${script}"`, { stdio: 'ignore', timeout: 10000 });
  } catch (error) {
    // 语音失败静默降级，不影响主流程
  }
}
