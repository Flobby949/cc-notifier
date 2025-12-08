#!/usr/bin/env node

/**
 * Claude Code Webhook 通知器
 * 支持多种消息服务的任务完成通知
 */

import * as fs from 'fs';
import { loadConfig, saveConfig, configExists, CONFIG_PATH } from './config';
import { getSessionData, formatSessionLog } from './session';
import { sendSystemNotification, speakNotification } from './notification';
import { sendAllWebhooks } from './webhook';
import { log } from './logger';

async function main(): Promise<void> {
  // 读取配置
  const config = loadConfig();

  // 如果配置文件不存在，创建示例配置
  if (!configExists()) {
    saveConfig(config);
    console.log(`已创建配置文件: ${CONFIG_PATH}`);
    console.log('请编辑配置文件后再运行');
    return;
  }

  // 读取 stdin
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf-8');
  } catch (error) {
    console.error('读取 stdin 失败:', error);
    process.exit(1);
  }

  // 解析会话数据
  const session = getSessionData(input);

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

  // 发送 Webhook 通知
  await sendAllWebhooks(config.webhooks, session, config);

  // 记录日志
  log(formatSessionLog(session), config);
}

// 运行
main().catch((error) => {
  console.error('程序运行失败:', error);
  process.exit(1);
});
