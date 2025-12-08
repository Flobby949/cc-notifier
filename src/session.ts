/**
 * 会话管理模块
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SessionData } from './types';

const SESSION_DIR = path.join(os.homedir(), '.claude', '.sessions');

export function getSessionData(input: string): SessionData {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || 'unknown';
    const stopReason = data.stop_reason || 'completed';

    // 读取任务开始时间（每次用户提问时记录）
    const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
    let startTime: number | undefined;
    let duration: number | undefined;
    let projectPath: string | undefined = data.project_path;

    if (fs.existsSync(sessionFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf-8'));
      startTime = sessionData.taskStartTime;
      if (startTime) {
        duration = Math.floor(Date.now() / 1000 - startTime);
      }
      // 从会话文件读取项目路径（如果 Stop hook 没有提供）
      if (!projectPath && sessionData.projectPath) {
        projectPath = sessionData.projectPath;
      }
    }

    return {
      sessionId,
      stopReason,
      startTime,
      duration,
      projectPath,
      toolCalls: data.tool_calls
    };
  } catch (error) {
    console.error('解析会话数据失败:', error);
    return {
      sessionId: 'unknown',
      stopReason: 'unknown'
    };
  }
}

export function formatSessionLog(session: SessionData): string {
  const durationText = session.duration ? `${session.duration}s` : 'unknown';
  return [
    '任务完成',
    `  会话 ID: ${session.sessionId.substring(0, 16)}`,
    `  状态: ${session.stopReason}`,
    `  耗时: ${durationText}`,
    session.projectPath ? `  项目: ${session.projectPath}` : null
  ].filter(Boolean).join('\n');
}

export { SESSION_DIR };
