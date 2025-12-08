#!/usr/bin/env node

/**
 * Claude Code 会话文件清理器
 * 在会话结束时自动清理旧的会话文件
 * 支持 macOS / Windows / Linux
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadConfig } from './config';

interface SessionEndInput {
  session_id: string;
  hook_event_name: string;
  reason: string;
}

interface CleanupResult {
  deletedCount: number;
  deletedFiles: string[];
  errors: string[];
}

/**
 * 获取会话目录路径（跨平台）
 */
function getSessionsDir(): string {
  return path.join(os.homedir(), '.claude', '.sessions');
}

/**
 * 清理旧的会话文件
 * @param maxAgeDays 保留最近多少天的文件
 * @param currentSessionId 当前会话 ID（不删除）
 */
function cleanOldSessions(maxAgeDays: number, currentSessionId?: string): CleanupResult {
  const result: CleanupResult = {
    deletedCount: 0,
    deletedFiles: [],
    errors: []
  };

  const sessionsDir = getSessionsDir();

  // 检查目录是否存在
  if (!fs.existsSync(sessionsDir)) {
    return result;
  }

  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  try {
    const files = fs.readdirSync(sessionsDir);

    for (const file of files) {
      // 只处理 .json 文件
      if (!file.endsWith('.json')) {
        continue;
      }

      // 跳过当前会话
      if (currentSessionId && file.includes(currentSessionId)) {
        continue;
      }

      const filePath = path.join(sessionsDir, file);

      try {
        const stats = fs.statSync(filePath);

        // 检查文件是否超过保留期限
        if (now - stats.mtimeMs > maxAgeMs) {
          fs.unlinkSync(filePath);
          result.deletedCount++;
          result.deletedFiles.push(file);
        }
      } catch (error) {
        result.errors.push(`删除 ${file} 失败: ${error}`);
      }
    }
  } catch (error) {
    result.errors.push(`读取会话目录失败: ${error}`);
  }

  return result;
}

/**
 * 主函数
 */
async function main(): Promise<void> {
  // 读取配置
  const config = loadConfig();

  // 检查是否启用会话清理
  if (!config.enableSessionCleanup) {
    return;
  }

  // 读取 stdin
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf-8');
  } catch (error) {
    // stdin 读取失败时静默退出
    return;
  }

  // 解析输入
  let sessionEndInput: SessionEndInput;
  try {
    sessionEndInput = JSON.parse(input);
  } catch (error) {
    return;
  }

  // 确认是 SessionEnd 事件
  if (sessionEndInput.hook_event_name !== 'SessionEnd') {
    return;
  }

  // 执行清理
  const maxAgeDays = config.sessionCleanupDays ?? 7;
  const result = cleanOldSessions(maxAgeDays, sessionEndInput.session_id);

  // 输出结果（仅在有删除时）
  if (result.deletedCount > 0 && config.enableLogging) {
    console.log(`已清理 ${result.deletedCount} 个旧会话文件`);
  }

  // 输出错误
  if (result.errors.length > 0) {
    console.error('清理过程中出现错误:', result.errors.join('; '));
  }
}

// 运行
main().catch(() => {
  // 静默处理错误，不影响 Claude Code 运行
  process.exit(0);
});
