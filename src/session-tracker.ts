#!/usr/bin/env node

/**
 * Claude Code 会话追踪器
 * 记录会话开始时间，用于计算任务耗时
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
    
    // 记录会话开始时间
    const sessionFile = path.join(SESSION_DIR, `${sessionId}.json`);
    const sessionData = {
      sessionId,
      startTime: Math.floor(Date.now() / 1000),
      projectPath: data.project_path || process.cwd()
    };
    
    fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
  } catch (error) {
    console.error('处理会话数据失败:', error);
  }
}

main();
