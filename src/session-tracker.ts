#!/usr/bin/env node

/**
 * Claude Code 任务追踪器
 * 记录每次任务（用户提问）的开始时间，用于计算单次任务耗时
 *
 * 配置为 Notification hook，在用户每次提交问题时触发
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SESSION_DIR = path.join(os.homedir(), '.claude', '.sessions');

function main(): void {
  // 确保目录存在
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }
  
  // 读取 stdin
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf-8');
  } catch (error) {
    console.error('读取 stdin 失败:', error);
    process.exit(1);
  }
  
  // 解析数据
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id || 'unknown';
    
    if (sessionId === 'unknown') {
      console.error('无法获取会话 ID');
      return;
    }
    
    // 每次用户提交问题时，更新任务开始时间
    // 这样计算的耗时是单次任务的耗时，而不是整个会话的耗时
    const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
    const sessionData = {
      sessionId,
      taskStartTime: Math.floor(Date.now() / 1000),  // 任务开始时间
      projectPath: data.project_path || process.cwd()
    };

    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('处理会话数据失败:', error);
  }
}

main();
