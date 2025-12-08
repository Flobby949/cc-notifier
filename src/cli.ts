#!/usr/bin/env node

/**
 * Claude Code Notifier CLI
 * 命令行工具，支持 hooks 测试等功能
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, configExists, CONFIG_PATH, DEFAULT_CONFIG } from './config';
import { SESSION_DIR } from './session';
import { LOG_FILE } from './logger';
import { SessionData } from './types';

// 延迟加载依赖（避免在不需要时加载 node-notifier）
let notificationModule: typeof import('./notification') | null = null;
let webhookModule: typeof import('./webhook') | null = null;

async function getNotificationModule() {
  if (!notificationModule) {
    notificationModule = await import('./notification');
  }
  return notificationModule;
}

async function getWebhookModule() {
  if (!webhookModule) {
    webhookModule = await import('./webhook');
  }
  return webhookModule;
}

const VERSION = '0.0.6';

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
Claude Code Notifier CLI v${VERSION}

Usage: ccntf <command> [options]

Commands:
  init            初始化 webhook 配置文件
  hooks [action]  管理 Claude hooks 配置
                  action: show, install, print (默认: show)
  test [type]     测试 hooks 通知功能
                  type: stop, notification, all (默认: all)
  config          显示当前配置
  check           检查 Claude hooks 配置是否正确
  clean [type]    清理日志和会话文件
                  type: log, session, all (默认: all)
  help            显示帮助信息
  version         显示版本号

Examples:
  ccntf init              # 初始化 webhook 配置文件
  ccntf hooks             # 显示当前 Claude hooks 配置
  ccntf hooks install     # 自动安装 hooks 到 Claude 配置
  ccntf hooks print       # 打印 hooks 配置 JSON（可复制）
  ccntf test              # 测试所有通知
  ccntf test stop         # 测试 Stop 事件通知
  ccntf test notification # 测试 Notification 事件通知
  ccntf config            # 显示当前配置
  ccntf check             # 检查 Claude hooks 配置
  ccntf clean             # 清理所有日志和会话文件
  ccntf clean log         # 仅清理日志文件
  ccntf clean session     # 仅清理会话文件
`);
}

/**
 * 显示版本号
 */
function showVersion(): void {
  console.log(`v${VERSION}`);
}

/**
 * 初始化配置文件
 */
function initConfig(force: boolean = false): void {
  if (configExists() && !force) {
    console.log('配置文件已存在:', CONFIG_PATH);
    console.log('使用 --force 强制覆盖');
    return;
  }

  saveConfig(DEFAULT_CONFIG);
  console.log('配置文件已创建:', CONFIG_PATH);
  console.log('\n请编辑配置文件以启用所需的通知方式');
}

/**
 * 显示当前配置
 */
function showConfig(): void {
  const config = loadConfig();
  console.log('配置文件路径:', CONFIG_PATH);
  console.log('\n当前配置:');
  console.log(JSON.stringify(config, null, 2));
}

const IS_WINDOWS = process.platform === 'win32';
const CLAUDE_SETTINGS_PATH = path.join(os.homedir(), '.claude', 'settings.json');
const HOOK_SCRIPT_PATH = path.join(os.homedir(), '.claude', 'notifier', 'dist', 'hook.js');

// 需要配置的 hook 事件
const REQUIRED_HOOKS = ['Stop', 'UserPromptSubmit', 'SessionEnd', 'Notification'];

/**
 * 获取适合当前平台的 hook 命令路径
 */
function getHookCommandPath(): string {
  if (IS_WINDOWS) {
    // Windows 使用正斜杠或反斜杠都可以，但推荐使用 node 执行
    return 'node "%USERPROFILE%\\.claude\\notifier\\dist\\hook.js"';
  }
  return '~/.claude/notifier/dist/hook.js';
}

interface ClaudeSettings {
  hooks?: {
    [key: string]: Array<{
      hooks: Array<{
        type: string;
        command: string;
      }>;
    }>;
  };
}

/**
 * 检查 Claude hooks 配置
 */
function checkHooks(): void {
  console.log('检查 Claude Code hooks 配置...\n');
  console.log(`平台: ${IS_WINDOWS ? 'Windows' : process.platform}`);

  // 检查 settings.json 是否存在
  if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    console.log('✗ Claude 配置文件不存在:', CLAUDE_SETTINGS_PATH);
    console.log('\n请先运行 Claude Code 以生成配置文件');
    return;
  }

  // 检查 hook.js 是否存在
  if (!fs.existsSync(HOOK_SCRIPT_PATH)) {
    console.log('✗ Hook 脚本不存在:', HOOK_SCRIPT_PATH);
    console.log('\n请先运行 npm run build 编译项目');
    return;
  }
  console.log('✓ Hook 脚本存在:', HOOK_SCRIPT_PATH);

  // 读取配置
  let settings: ClaudeSettings;
  try {
    settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8'));
  } catch {
    console.log('✗ 无法解析配置文件');
    return;
  }

  if (!settings.hooks) {
    console.log('✗ 未配置任何 hooks');
    console.log('\n建议配置:');
    printHooksConfig();
    return;
  }

  console.log('\nHooks 配置状态:');

  let allConfigured = true;
  const missingHooks: string[] = [];

  for (const hookName of REQUIRED_HOOKS) {
    const hookConfig = settings.hooks[hookName];

    if (!hookConfig || hookConfig.length === 0) {
      console.log(`  ✗ ${hookName}: 未配置`);
      missingHooks.push(hookName);
      allConfigured = false;
      continue;
    }

    // 检查是否配置了正确的命令
    const commands = hookConfig.flatMap(h => h.hooks?.map(hh => hh.command) || []);
    const hasCorrectCommand = commands.some(cmd => {
      if (!cmd) return false;
      // 匹配各种可能的路径格式
      return cmd.includes('notifier/dist/hook.js') ||
             cmd.includes('notifier\\dist\\hook.js') ||
             cmd.includes('cc-hook');
    });

    if (hasCorrectCommand) {
      console.log(`  ✓ ${hookName}: 已配置`);
    } else {
      console.log(`  ⚠ ${hookName}: 已配置但命令可能不正确`);
      console.log(`    当前: ${commands.join(', ')}`);
      allConfigured = false;
    }
  }

  if (allConfigured) {
    console.log('\n✓ 所有 hooks 配置正确!');
  } else if (missingHooks.length > 0) {
    console.log('\n缺少以下 hooks 配置:', missingHooks.join(', '));
    console.log('\n建议在 ~/.claude/settings.json 中添加:');
    printHooksConfig(missingHooks);
  }
}

/**
 * 打印 hooks 配置示例
 */
function printHooksConfig(hooks: string[] = REQUIRED_HOOKS): void {
  const hookCommand = getHookCommandPath();
  const config: Record<string, any> = {};
  for (const hook of hooks) {
    config[hook] = [{
      hooks: [{
        type: 'command',
        command: hookCommand
      }]
    }];
  }
  console.log(JSON.stringify({ hooks: config }, null, 2));

  if (IS_WINDOWS) {
    console.log('\n注意: Windows 用户需要使用 node 执行脚本');
  }
}

/**
 * 生成 hooks 配置对象
 */
function generateHooksConfig(): Record<string, any> {
  const hookCommand = getHookCommandPath();
  const config: Record<string, any> = {};
  for (const hook of REQUIRED_HOOKS) {
    config[hook] = [{
      hooks: [{
        type: 'command',
        command: hookCommand
      }]
    }];
  }
  return config;
}

/**
 * 管理 Claude hooks 配置
 */
function manageHooks(action: string): void {
  switch (action) {
    case 'show':
      // 显示当前配置
      if (!fs.existsSync(CLAUDE_SETTINGS_PATH)) {
        console.log('Claude 配置文件不存在:', CLAUDE_SETTINGS_PATH);
        return;
      }
      try {
        const settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8'));
        if (settings.hooks) {
          console.log('当前 Claude hooks 配置:\n');
          console.log(JSON.stringify({ hooks: settings.hooks }, null, 2));
        } else {
          console.log('当前未配置任何 hooks');
        }
      } catch {
        console.log('无法读取配置文件');
      }
      break;

    case 'print':
      // 打印可复制的配置
      console.log('将以下配置添加到 ~/.claude/settings.json:\n');
      printHooksConfig();
      break;

    case 'install':
      // 自动安装 hooks
      installHooks();
      break;

    default:
      console.error(`未知操作: ${action}`);
      console.log('可用操作: show, install, print');
      process.exit(1);
  }
}

/**
 * 自动安装 hooks 到 Claude 配置
 */
function installHooks(): void {
  console.log('安装 hooks 到 Claude 配置...\n');

  // 检查 hook.js 是否存在
  if (!fs.existsSync(HOOK_SCRIPT_PATH)) {
    console.log('✗ Hook 脚本不存在:', HOOK_SCRIPT_PATH);
    console.log('  请先运行 npm run build 编译项目');
    return;
  }

  // 读取或创建配置
  let settings: any = {};
  if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    try {
      settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS_PATH, 'utf-8'));
      console.log('✓ 读取现有配置文件');
    } catch {
      console.log('⚠ 无法解析现有配置，将创建新配置');
    }
  } else {
    console.log('✓ 创建新配置文件');
    // 确保目录存在
    const configDir = path.dirname(CLAUDE_SETTINGS_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  // 备份现有配置
  if (fs.existsSync(CLAUDE_SETTINGS_PATH)) {
    const backupPath = CLAUDE_SETTINGS_PATH + '.backup';
    fs.copyFileSync(CLAUDE_SETTINGS_PATH, backupPath);
    console.log('✓ 已备份原配置到:', backupPath);
  }

  // 生成新的 hooks 配置
  const newHooks = generateHooksConfig();

  // 合并配置
  if (!settings.hooks) {
    settings.hooks = {};
  }

  let updated = 0;
  let skipped = 0;
  for (const [hookName, hookConfig] of Object.entries(newHooks)) {
    if (settings.hooks[hookName]) {
      // 检查是否已经配置了我们的 hook
      const existingCommands = JSON.stringify(settings.hooks[hookName]);
      if (existingCommands.includes('notifier/dist/hook.js') || existingCommands.includes('cc-hook')) {
        skipped++;
        continue;
      }
    }
    settings.hooks[hookName] = hookConfig;
    updated++;
  }

  // 写入配置
  fs.writeFileSync(CLAUDE_SETTINGS_PATH, JSON.stringify(settings, null, 2));

  console.log('');
  if (updated > 0) {
    console.log(`✓ 已安装 ${updated} 个 hooks`);
  }
  if (skipped > 0) {
    console.log(`  跳过 ${skipped} 个已存在的 hooks`);
  }
  console.log('✓ 配置已保存到:', CLAUDE_SETTINGS_PATH);
  console.log('\n请重启 Claude Code 以使配置生效');
}

/**
 * 清理日志文件
 */
function cleanLog(): number {
  if (fs.existsSync(LOG_FILE)) {
    fs.unlinkSync(LOG_FILE);
    return 1;
  }
  return 0;
}

/**
 * 清理会话文件
 * @param keepActiveMinutes 保留最近活跃的会话（分钟），默认 30 分钟
 */
function cleanSessions(keepActiveMinutes: number = 30): { deleted: number; skipped: number } {
  if (!fs.existsSync(SESSION_DIR)) {
    return { deleted: 0, skipped: 0 };
  }

  const now = Date.now();
  const activeThreshold = keepActiveMinutes * 60 * 1000;

  let deleted = 0;
  let skipped = 0;
  const files = fs.readdirSync(SESSION_DIR);

  for (const file of files) {
    if (!file.endsWith('.json')) continue;

    const filePath = path.join(SESSION_DIR, file);
    try {
      const stats = fs.statSync(filePath);
      // 跳过最近活跃的会话
      if (now - stats.mtimeMs < activeThreshold) {
        skipped++;
        continue;
      }
      fs.unlinkSync(filePath);
      deleted++;
    } catch {
      // 忽略单个文件错误
    }
  }

  return { deleted, skipped };
}

/**
 * 清理命令
 */
function clean(type: string): void {
  switch (type) {
    case 'log':
      const logDeleted = cleanLog();
      if (logDeleted) {
        console.log('✓ 日志文件已清理');
      } else {
        console.log('✗ 日志文件不存在');
      }
      break;

    case 'session':
      const sessionResult = cleanSessions();
      if (sessionResult.deleted > 0) {
        console.log(`✓ 已清理 ${sessionResult.deleted} 个会话文件`);
      } else {
        console.log('✗ 没有会话文件需要清理');
      }
      if (sessionResult.skipped > 0) {
        console.log(`  跳过 ${sessionResult.skipped} 个活跃会话（30分钟内）`);
      }
      break;

    case 'all':
      console.log('清理日志和会话文件...\n');
      const logResult = cleanLog();
      const sessResult = cleanSessions();

      if (logResult) {
        console.log('✓ 日志文件已清理');
      } else {
        console.log('✗ 日志文件不存在');
      }

      if (sessResult.deleted > 0) {
        console.log(`✓ 已清理 ${sessResult.deleted} 个会话文件`);
      } else {
        console.log('✗ 没有会话文件需要清理');
      }
      if (sessResult.skipped > 0) {
        console.log(`  跳过 ${sessResult.skipped} 个活跃会话（30分钟内）`);
      }

      console.log('\n清理完成!');
      break;

    default:
      console.error(`未知的清理类型: ${type}`);
      console.log('可用类型: log, session, all');
      process.exit(1);
  }
}

/**
 * 测试 Stop 事件通知
 */
async function testStopNotification(): Promise<void> {
  console.log('测试 Stop 事件通知...\n');

  const config = loadConfig();
  const session: SessionData = {
    sessionId: 'test-session-' + Date.now(),
    stopReason: 'end_turn',
    duration: 30,
    projectPath: process.cwd()
  };

  // 测试系统通知
  if (config.enableSystemNotification) {
    console.log('✓ 发送系统通知...');
    const { sendSystemNotification } = await getNotificationModule();
    sendSystemNotification(session, 'Claude Code 测试');
  } else {
    console.log('✗ 系统通知已禁用');
  }

  // 测试语音通知
  if (config.enableVoice) {
    console.log('✓ 发送语音通知...');
    const { speakNotification } = await getNotificationModule();
    speakNotification(session);
  } else {
    console.log('✗ 语音通知已禁用');
  }

  // 测试终端激活
  if (config.autoActivateWindow) {
    console.log('✓ 激活终端窗口...');
    const { activateTerminalWindow } = await getNotificationModule();
    activateTerminalWindow();
  } else {
    console.log('✗ 终端激活已禁用');
  }

  // 测试 Webhook
  const enabledWebhooks = config.webhooks.filter(w => w.enabled);
  if (enabledWebhooks.length > 0) {
    console.log(`✓ 发送 Webhook 通知 (${enabledWebhooks.length} 个)...`);
    const { sendAllWebhooks } = await getWebhookModule();
    await sendAllWebhooks(config.webhooks, session, config);
    console.log('  Webhook 发送完成');
  } else {
    console.log('✗ 没有启用的 Webhook');
  }

  console.log('\nStop 事件测试完成!');
}

/**
 * 测试 Notification 事件通知
 */
async function testNotificationHook(): Promise<void> {
  console.log('测试 Notification 事件通知...\n');

  const config = loadConfig();

  if (!config.enableNotificationHook) {
    console.log('✗ Notification hook 已禁用');
    console.log('  请在配置文件中设置 enableNotificationHook: true');
    return;
  }

  const session: SessionData = {
    sessionId: 'test-session-' + Date.now(),
    stopReason: '权限请求: 测试通知',
    projectPath: process.cwd()
  };

  // 测试系统通知
  if (config.enableSystemNotification) {
    console.log('✓ 发送系统通知...');
    const { sendSystemNotification } = await getNotificationModule();
    sendSystemNotification(session, 'Claude Code 权限请求');
  } else {
    console.log('✗ 系统通知已禁用');
  }

  // 测试语音通知
  if (config.enableVoice) {
    console.log('✓ 发送语音通知...');
    const { speakNotification } = await getNotificationModule();
    speakNotification({
      ...session,
      stopReason: '权限请求'
    });
  } else {
    console.log('✗ 语音通知已禁用');
  }

  // 测试终端激活
  if (config.autoActivateWindow) {
    console.log('✓ 激活终端窗口...');
    const { activateTerminalWindow } = await getNotificationModule();
    activateTerminalWindow();
  } else {
    console.log('✗ 终端激活已禁用');
  }

  // 测试 Webhook
  const enabledWebhooks = config.webhooks.filter(w => w.enabled);
  if (enabledWebhooks.length > 0) {
    console.log(`✓ 发送 Webhook 通知 (${enabledWebhooks.length} 个)...`);
    const { sendAllWebhooks } = await getWebhookModule();
    await sendAllWebhooks(config.webhooks, session, config);
    console.log('  Webhook 发送完成');
  } else {
    console.log('✗ 没有启用的 Webhook');
  }

  console.log('\nNotification 事件测试完成!');
}

/**
 * 测试所有通知
 */
async function testAll(): Promise<void> {
  await testStopNotification();
  console.log('\n' + '='.repeat(50) + '\n');
  await testNotificationHook();
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  switch (command) {
    case 'init':
      const force = args.includes('--force') || args.includes('-f');
      initConfig(force);
      break;

    case 'hooks':
      const hooksAction = args[1] || 'show';
      manageHooks(hooksAction);
      break;

    case 'test':
      const testType = args[1] || 'all';
      switch (testType) {
        case 'stop':
          await testStopNotification();
          break;
        case 'notification':
          await testNotificationHook();
          break;
        case 'all':
          await testAll();
          break;
        default:
          console.error(`未知的测试类型: ${testType}`);
          console.log('可用类型: stop, notification, all');
          process.exit(1);
      }
      break;

    case 'config':
      showConfig();
      break;

    case 'check':
      checkHooks();
      break;

    case 'clean':
      const cleanType = args[1] || 'all';
      clean(cleanType);
      break;

    case 'version':
    case '-v':
    case '--version':
      showVersion();
      break;

    case 'help':
    case '-h':
    case '--help':
      showHelp();
      break;

    default:
      console.error(`未知命令: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// 运行
main().catch((err) => {
  console.error('错误:', err.message);
  process.exit(1);
});
