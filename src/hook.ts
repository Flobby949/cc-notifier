#!/usr/bin/env node

/**
 * Claude Code Hooks 统一入口
 * 支持所有 hook 事件：Stop、UserPromptSubmit、SessionEnd、Notification
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig, saveConfig, configExists, CONFIG_PATH } from './config';
import { getSessionData, formatSessionLog, SESSION_DIR } from './session';
import { sendSystemNotification, speakNotification, activateTerminalWindow } from './notification';
import { sendAllWebhooks } from './webhook';
import { log } from './logger';
import { SessionData } from './types';

/**
 * Hook 输入的基础接口
 */
interface HookInput {
  session_id: string;
  hook_event_name: string;
  [key: string]: any;
}

/**
 * 获取通知类型的中文描述
 */
function getNotificationTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    permission_prompt: '权限请求',
    idle_prompt: '等待输入',
    auth_success: '认证成功',
    elicitation_dialog: 'MCP 输入'
  };
  return labels[type] || type;
}

// idle 通知超时时间（毫秒），超过此时间不再发送 idle 通知
const IDLE_NOTIFICATION_TIMEOUT = 5 * 60 * 1000; // 5 分钟

/**
 * 检查 idle 通知是否应该被抑制（超过 5 分钟）
 * 返回 true 表示应该抑制（不发送通知）
 */
function shouldSuppressIdleNotification(sessionId: string): boolean {
  const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
  const now = Date.now();

  try {
    if (fs.existsSync(sessionFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      const firstIdleTime = sessionData.firstIdleNotificationTime;

      if (firstIdleTime) {
        // 如果距离首次 idle 通知超过 5 分钟，抑制通知
        if (now - firstIdleTime > IDLE_NOTIFICATION_TIMEOUT) {
          return true;
        }
      } else {
        // 首次 idle 通知，记录时间
        sessionData.firstIdleNotificationTime = now;
        fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      }
    } else {
      // 会话文件不存在，创建并记录首次 idle 时间
      if (!fs.existsSync(SESSION_DIR)) {
        fs.mkdirSync(SESSION_DIR, { recursive: true });
      }
      fs.writeFileSync(sessionFile, JSON.stringify({
        firstIdleNotificationTime: now
      }, null, 2));
    }
  } catch {
    // 出错时不抑制通知
  }

  return false;
}

/**
 * 处理 Stop 事件 - 任务完成通知
 */
async function handleStop(input: HookInput, rawInput: string): Promise<void> {
  const config = loadConfig();

  // 如果配置文件不存在，创建示例配置
  if (!configExists()) {
    saveConfig(config);
    console.log(`已创建配置文件: ${CONFIG_PATH}`);
    console.log('请编辑配置文件后再运行');
    return;
  }

  // 解析会话数据
  const session = getSessionData(rawInput);

  // 检查最小时长限制
  if (session.duration !== undefined && session.duration < config.minDuration) {
    log(`任务时长 ${session.duration}s 小于最小阈值 ${config.minDuration}s，跳过通知`, config);
    return;
  }

  // 发送系统通知（跨平台）
  if (config.enableSystemNotification) {
    sendSystemNotification(session);
  }

  // 发送语音通知
  if (config.enableVoice) {
    speakNotification(session);
  }

  // 自动激活终端窗口
  if (config.autoActivateWindow) {
    activateTerminalWindow();
  }

  // 发送 Webhook 通知
  await sendAllWebhooks(config.webhooks, session, config);

  // 记录日志
  log(formatSessionLog(session), config);
}

/**
 * 处理 UserPromptSubmit 事件 - 记录任务开始时间
 */
function handleUserPromptSubmit(input: HookInput): void {
  // 确保目录存在
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const sessionId = input.session_id || 'unknown';

  if (sessionId === 'unknown') {
    return;
  }

  // 每次用户提交问题时，更新任务开始时间
  const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
  const sessionData = {
    sessionId,
    taskStartTime: Math.floor(Date.now() / 1000),
    projectPath: input.project_path || process.cwd()
  };

  fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
}

/**
 * 处理 SessionEnd 事件 - 清理旧会话文件
 */
function handleSessionEnd(input: HookInput): void {
  const config = loadConfig();

  // 检查是否启用会话清理
  if (!config.enableSessionCleanup) {
    return;
  }

  const maxAgeDays = config.sessionCleanupDays ?? 7;
  const currentSessionId = input.session_id;

  // 检查目录是否存在
  if (!fs.existsSync(SESSION_DIR)) {
    return;
  }

  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(SESSION_DIR);

    for (const file of files) {
      // 只处理 .json 文件
      if (!file.endsWith('.json')) {
        continue;
      }

      // 跳过当前会话
      if (currentSessionId && file.includes(currentSessionId)) {
        continue;
      }

      const filePath = path.join(SESSION_DIR, file);

      try {
        const stats = fs.statSync(filePath);

        // 检查文件是否超过保留期限
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch {
        // 忽略单个文件的错误
      }
    }
  } catch {
    // 忽略目录读取错误
  }

  // 输出结果（仅在有删除时）
  if (deletedCount > 0 && config.enableLogging) {
    console.log(`已清理 ${deletedCount} 个旧会话文件`);
  }
}

/**
 * 处理 Notification 事件 - 权限请求等通知
 */
async function handleNotification(input: HookInput): Promise<void> {
  const config = loadConfig();

  // 检查是否启用通知 hook
  if (!config.enableNotificationHook) {
    return;
  }

  // 检查是否需要处理此类型的通知
  const allowedTypes = config.notificationHookTypes || ['permission_prompt', 'idle_prompt'];
  if (!allowedTypes.includes(input.notification_type)) {
    return;
  }

  // 对于 idle_prompt 类型，检查是否超过 5 分钟，超过则不再通知
  if (input.notification_type === 'idle_prompt') {
    if (shouldSuppressIdleNotification(input.session_id)) {
      return;
    }
  }

  const typeLabel = getNotificationTypeLabel(input.notification_type);
  const title = `Claude Code ${typeLabel}`;
  const message = input.message || '需要您的操作';

  // 构造 SessionData 用于通知
  const session: SessionData = {
    sessionId: input.session_id,
    stopReason: input.notification_type,
    projectPath: input.cwd
  };

  // 发送系统通知
  if (config.enableSystemNotification) {
    sendSystemNotification({
      ...session,
      stopReason: message
    }, title);
  }

  // 发送语音通知
  if (config.enableVoice) {
    speakNotification({
      ...session,
      stopReason: typeLabel
    });
  }

  // 自动激活终端窗口
  if (config.autoActivateWindow) {
    activateTerminalWindow();
  }

  // 发送 Webhook 通知
  await sendAllWebhooks(config.webhooks, {
    ...session,
    stopReason: `${typeLabel}: ${message}`
  }, config);

  // 记录日志
  log(`[${typeLabel}] ${message}`, config);
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  // 读取 stdin
  let rawInput = '';
  try {
    rawInput = fs.readFileSync(0, 'utf-8');
  } catch {
    return;
  }

  // 解析输入
  let input: HookInput;
  try {
    input = JSON.parse(rawInput);
  } catch {
    return;
  }

  // 根据 hook_event_name 分发到不同的处理函数
  switch (input.hook_event_name) {
    case 'Stop':
      await handleStop(input, rawInput);
      break;
    case 'UserPromptSubmit':
      handleUserPromptSubmit(input);
      break;
    case 'SessionEnd':
      handleSessionEnd(input);
      break;
    case 'Notification':
      await handleNotification(input);
      break;
    default:
      // 未知事件，静默忽略
      break;
  }
}

// 运行
main().catch(() => {
  process.exit(0);
});
