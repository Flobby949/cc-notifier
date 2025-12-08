/**
 * 终端检测和激活模块
 */

import { execSync } from 'child_process';
import { TerminalApp, Platform } from '../types';

const platform = process.platform as Platform;

/**
 * 检测当前终端应用
 */
export function getTerminalApp(): TerminalApp {
  const termProgram = process.env.TERM_PROGRAM || '';

  if (platform === 'darwin') {
    if (termProgram.includes('Warp')) {
      return 'Warp';
    } else if (termProgram.includes('iTerm')) {
      return 'iTerm';
    }
    return 'Terminal';
  } else if (platform === 'win32') {
    if (process.env.WT_SESSION) {
      return 'WindowsTerminal';
    } else if (process.env.TERM_PROGRAM === 'vscode') {
      return 'VSCode';
    }
    return 'cmd';
  }

  return 'Terminal';
}

/**
 * macOS 终端 Bundle ID 映射
 */
export const macOSBundleIds: Record<string, string> = {
  'Warp': 'dev.warp.Warp-Stable',
  'iTerm': 'com.googlecode.iterm2',
  'Terminal': 'com.apple.Terminal'
};

/**
 * 激活 Windows 终端窗口
 */
export function activateWindowsTerminal(terminalApp: TerminalApp): void {
  if (platform !== 'win32') return;

  try {
    let processName: string;

    switch (terminalApp) {
      case 'WindowsTerminal':
        processName = 'WindowsTerminal';
        break;
      case 'VSCode':
        processName = 'Code';
        break;
      default:
        return;
    }

    const script = `
      Add-Type -AssemblyName Microsoft.VisualBasic
      $proc = Get-Process -Name ${processName} -ErrorAction SilentlyContinue | Select-Object -First 1
      if ($proc) { [Microsoft.VisualBasic.Interaction]::AppActivate($proc.Id) }
    `;
    execSync(`powershell -Command "${script.replace(/\n/g, ' ')}"`, { stdio: 'ignore', timeout: 5000 });
  } catch (error) {
    // 激活失败不影响主流程
  }
}

/**
 * 激活 macOS 终端窗口
 */
export function activateMacOSTerminal(terminalApp: TerminalApp): void {
  if (platform !== 'darwin') return;

  try {
    const bundleId = macOSBundleIds[terminalApp] || 'com.apple.Terminal';
    // 使用 -b 参数通过 Bundle ID 激活应用
    execSync(`open -b "${bundleId}"`, { stdio: 'ignore', timeout: 5000 });
  } catch (error) {
    // 激活失败不影响主流程
  }
}

/**
 * 激活终端窗口（跨平台）
 */
export function activateTerminalWindow(): void {
  const terminalApp = getTerminalApp();

  if (platform === 'darwin') {
    activateMacOSTerminal(terminalApp);
  } else if (platform === 'win32') {
    activateWindowsTerminal(terminalApp);
  }
}

export { platform };
