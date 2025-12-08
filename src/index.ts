#!/usr/bin/env node

/**
 * Claude Code Webhook 通知器
 * 支持多种消息服务的任务完成通知
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// ============= 配置接口 =============

interface WebhookConfig {
  enabled: boolean;
  url: string;
  type: 'slack' | 'discord' | 'telegram' | 'dingtalk' | 'feishu' | 'wecom' | 'custom';
  token?: string;  // Telegram bot token
  chatId?: string;  // Telegram chat ID
  secret?: string;  // 钉钉、飞书签名密钥
}

interface NotificationConfig {
  minDuration: number;  // 最小通知时长（秒）
  enableMacOS: boolean;  // 是否启用 macOS 原生通知
  enableVoice: boolean;  // 是否启用语音
  enableLogging: boolean;  // 是否记录日志
  webhooks: WebhookConfig[];
}

interface SessionData {
  sessionId: string;
  stopReason: string;
  startTime?: number;
  duration?: number;
  projectPath?: string;
  toolCalls?: number;
}

// ============= 默认配置 =============

const CONFIG_PATH = path.join(os.homedir(), '.claude', 'webhook-config.json');
const LOG_FILE = path.join(os.homedir(), '.claude', 'webhook-notification.log');
const SESSION_DIR = path.join(os.homedir(), '.claude', '.sessions');

const DEFAULT_CONFIG: NotificationConfig = {
  minDuration: 10,
  enableMacOS: true,
  enableVoice: false,
  enableLogging: true,
  webhooks: [
    {
      enabled: false,
      url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
      type: 'slack'
    },
    {
      enabled: false,
      url: 'https://discord.com/api/webhooks/YOUR/WEBHOOK',
      type: 'discord'
    },
    {
      enabled: false,
      url: 'https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage',
      type: 'telegram',
      token: 'YOUR_BOT_TOKEN',
      chatId: 'YOUR_CHAT_ID'
    }
  ]
};

// ============= 工具函数 =============

function loadConfig(): NotificationConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(configData) };
    }
  } catch (error) {
    console.error('加载配置文件失败，使用默认配置:', error);
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: NotificationConfig): void {
  const configDir = path.dirname(CONFIG_PATH);
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

const MAX_LOG_LINES = 500;  // 最多保留 500 条日志记录

function log(message: string, config: NotificationConfig): void {
  if (!config.enableLogging) return;

  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const newEntry = `[${timestamp}] ${message}\n`;

  // 追加新日志
  fs.appendFileSync(LOG_FILE, newEntry);

  // 检查并清理过多的日志
  try {
    const content = fs.readFileSync(LOG_FILE, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length > MAX_LOG_LINES) {
      // 只保留最新的 MAX_LOG_LINES 条
      const trimmedContent = lines.slice(-MAX_LOG_LINES).join('\n') + '\n';
      fs.writeFileSync(LOG_FILE, trimmedContent);
    }
  } catch (error) {
    // 清理失败不影响主流程
  }
}

function getSessionData(input: string): SessionData {
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
      startTime = sessionData.taskStartTime;  // 使用任务开始时间
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

// ============= macOS 通知 =============

function getTerminalApp(): string {
  // 检测当前终端应用
  const termProgram = process.env.TERM_PROGRAM || '';

  if (termProgram.includes('Warp')) {
    return 'Warp';
  } else if (termProgram.includes('iTerm')) {
    return 'iTerm';
  } else if (termProgram.includes('Apple_Terminal') || termProgram === '') {
    return 'Terminal';
  }

  // 默认返回 Terminal
  return 'Terminal';
}

function sendMacOSNotification(session: SessionData): void {
  const title = session.stopReason.includes('error') ? '⚠️ 任务完成（有错误）' : '✅ 任务完成';
  const durationText = session.duration ? `耗时 ${session.duration} 秒` : '';
  const message = `会话: ${session.sessionId.substring(0, 8)}... ${durationText}`;
  const sound = session.stopReason.includes('error') ? 'Basso' : 'Glass';
  const terminalApp = getTerminalApp();

  try {
    // 使用 terminal-notifier，点击后激活对应的终端窗口
    const bundleIds: Record<string, string> = {
      'Warp': 'dev.warp.Warp-Stable',
      'iTerm': 'com.googlecode.iterm2',
      'Terminal': 'com.apple.Terminal'
    };
    const bundleId = bundleIds[terminalApp] || 'com.apple.Terminal';
    const command = `terminal-notifier -title "${title}" -message "${message}" -sound "${sound}" -activate "${bundleId}"`;
    execSync(command);
  } catch (error) {
    // 如果 terminal-notifier 失败，回退到原生通知
    try {
      const fallbackCommand = `osascript -e 'display notification "${message}" with title "${title}" sound name "${sound}"'`;
      execSync(fallbackCommand);
    } catch (fallbackError) {
      console.error('macOS 通知发送失败:', fallbackError);
    }
  }
}

function speakNotification(session: SessionData): void {
  try {
    const message = session.duration 
      ? `任务已完成，耗时 ${session.duration} 秒`
      : '任务已完成';
    execSync(`say "${message}"`);
  } catch (error) {
    console.error('语音通知失败:', error);
  }
}

// ============= Webhook 发送器 =============

async function sendSlackNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const color = session.stopReason.includes('error') ? 'danger' : 'good';
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  const fields: any[] = [
    {
      title: '会话 ID',
      value: session.sessionId.substring(0, 16),
      short: true
    },
    {
      title: '状态',
      value: session.stopReason,
      short: true
    }
  ];
  
  if (session.duration) {
    fields.push({
      title: '耗时',
      value: `${session.duration} 秒`,
      short: true
    });
  }
  
  if (session.projectPath) {
    fields.push({
      title: '项目路径',
      value: session.projectPath,
      short: false
    });
  }
  
  const payload = {
    text: `${emoji} Claude Code 任务完成`,
    attachments: [
      {
        color: color,
        fields: fields,
        footer: 'Claude Code Notifier',
        ts: Math.floor(Date.now() / 1000)
      }
    ]
  };
  
  await sendWebhook(webhook.url, payload);
}

async function sendDiscordNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const color = session.stopReason.includes('error') ? 0xED4245 : 0x57F287;
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  const fields: any[] = [
    {
      name: '会话 ID',
      value: `\`${session.sessionId.substring(0, 16)}\``,
      inline: true
    },
    {
      name: '状态',
      value: session.stopReason,
      inline: true
    }
  ];
  
  if (session.duration) {
    fields.push({
      name: '耗时',
      value: `${session.duration} 秒`,
      inline: true
    });
  }
  
  if (session.projectPath) {
    fields.push({
      name: '项目路径',
      value: `\`${session.projectPath}\``,
      inline: false
    });
  }
  
  const payload = {
    content: `${emoji} **Claude Code 任务完成**`,
    embeds: [
      {
        color: color,
        fields: fields,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Claude Code Notifier'
        }
      }
    ]
  };
  
  await sendWebhook(webhook.url, payload);
}

async function sendTelegramNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  let message = `${emoji} *Claude Code 任务完成*\n\n`;
  message += `*会话 ID:* \`${session.sessionId.substring(0, 16)}\`\n`;
  message += `*状态:* ${session.stopReason}\n`;
  
  if (session.duration) {
    message += `*耗时:* ${session.duration} 秒\n`;
  }
  
  if (session.projectPath) {
    message += `*项目:* \`${session.projectPath}\`\n`;
  }
  
  const url = `https://api.telegram.org/bot${webhook.token}/sendMessage`;
  const payload = {
    chat_id: webhook.chatId,
    text: message,
    parse_mode: 'Markdown'
  };
  
  await sendWebhook(url, payload);
}

async function sendDingTalkNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  let message = `${emoji} **Claude Code 任务完成**\n\n`;
  message += `> **会话 ID:** ${session.sessionId.substring(0, 16)}\n>\n`;
  message += `> **状态:** ${session.stopReason}\n>\n`;
  message += `> **耗时:** ${session.duration ? session.duration + ' 秒' : '未知'}\n>\n`;

  if (session.projectPath) {
    message += `> **项目:** ${session.projectPath}\n`;
  }
  
  const payload = {
    msgtype: 'markdown',
    markdown: {
      title: 'Claude Code 任务完成',
      text: message
    }
  };
  
  // 如果配置了签名，添加签名
  let url = webhook.url;
  if (webhook.secret) {
    const timestamp = Date.now();
    const crypto = require('crypto');
    const sign = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}\n${webhook.secret}`)
      .digest('base64');
    url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }
  
  await sendWebhook(url, payload);
}

async function sendFeishuNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  let message = `${emoji} **Claude Code 任务完成**\n`;
  message += `会话 ID: ${session.sessionId.substring(0, 16)}\n`;
  message += `状态: ${session.stopReason}\n`;
  
  if (session.duration) {
    message += `耗时: ${session.duration} 秒\n`;
  }
  
  if (session.projectPath) {
    message += `项目: ${session.projectPath}\n`;
  }
  
  const payload = {
    msg_type: 'text',
    content: {
      text: message
    }
  };
  
  // 如果配置了签名，添加签名
  let url = webhook.url;
  if (webhook.secret) {
    const timestamp = Math.floor(Date.now() / 1000);
    const crypto = require('crypto');
    const sign = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}\n${webhook.secret}`)
      .digest('base64');
    url += `&timestamp=${timestamp}&sign=${encodeURIComponent(sign)}`;
  }
  
  await sendWebhook(url, payload);
}

async function sendWeComNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const emoji = session.stopReason.includes('error') ? '⚠️' : '✅';
  
  let message = `${emoji} **Claude Code 任务完成**\n`;
  message += `> 会话ID: <font color="comment">${session.sessionId.substring(0, 16)}</font>\n`;
  message += `> 状态: ${session.stopReason}\n`;
  
  if (session.duration) {
    message += `> 耗时: <font color="info">${session.duration}秒</font>\n`;
  }
  
  if (session.projectPath) {
    message += `> 项目: ${session.projectPath}\n`;
  }
  
  const payload = {
    msgtype: 'markdown',
    markdown: {
      content: message
    }
  };
  
  await sendWebhook(webhook.url, payload);
}

async function sendCustomNotification(webhook: WebhookConfig, session: SessionData): Promise<void> {
  const payload = {
    title: 'Claude Code 任务完成',
    sessionId: session.sessionId,
    stopReason: session.stopReason,
    duration: session.duration,
    projectPath: session.projectPath,
    timestamp: new Date().toISOString()
  };
  
  await sendWebhook(webhook.url, payload);
}

async function sendWebhook(url: string, payload: any): Promise<void> {
  const https = require('https');
  const http = require('http');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    
    const req = client.request(options, (res: any) => {
      let responseData = '';
      
      res.on('data', (chunk: any) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ============= 主函数 =============

async function main(): Promise<void> {
  // 读取配置
  const config = loadConfig();
  
  // 如果配置文件不存在，创建示例配置
  if (!fs.existsSync(CONFIG_PATH)) {
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
  
  // 发送 macOS 通知
  if (config.enableMacOS) {
    sendMacOSNotification(session);
  }
  
  // 发送语音通知
  if (config.enableVoice) {
    speakNotification(session);
  }
  
  // 发送 Webhook 通知
  const webhookPromises: Promise<void>[] = [];
  
  for (const webhook of config.webhooks) {
    if (!webhook.enabled) continue;
    
    try {
      let promise: Promise<void>;
      
      switch (webhook.type) {
        case 'slack':
          promise = sendSlackNotification(webhook, session);
          break;
        case 'discord':
          promise = sendDiscordNotification(webhook, session);
          break;
        case 'telegram':
          promise = sendTelegramNotification(webhook, session);
          break;
        case 'dingtalk':
          promise = sendDingTalkNotification(webhook, session);
          break;
        case 'feishu':
          promise = sendFeishuNotification(webhook, session);
          break;
        case 'wecom':
          promise = sendWeComNotification(webhook, session);
          break;
        case 'custom':
          promise = sendCustomNotification(webhook, session);
          break;
        default:
          console.warn(`未知的 webhook 类型: ${webhook.type}`);
          continue;
      }
      
      webhookPromises.push(
        promise.then(() => {
          log(`Webhook 发送成功: ${webhook.type}`, config);
        }).catch((error) => {
          log(`Webhook 发送失败 (${webhook.type}): ${error.message}`, config);
        })
      );
    } catch (error: any) {
      log(`Webhook 发送异常 (${webhook.type}): ${error.message}`, config);
    }
  }
  
  // 等待所有 webhook 完成
  await Promise.allSettled(webhookPromises);
  
  // 记录日志
  const durationText = session.duration ? `${session.duration}s` : 'unknown';
  const logMessage = [
    '任务完成',
    `  会话 ID: ${session.sessionId.substring(0, 16)}`,
    `  状态: ${session.stopReason}`,
    `  耗时: ${durationText}`,
    session.projectPath ? `  项目: ${session.projectPath}` : null
  ].filter(Boolean).join('\n');
  log(logMessage, config);
}

// 运行
main().catch((error) => {
  console.error('程序运行失败:', error);
  process.exit(1);
});
