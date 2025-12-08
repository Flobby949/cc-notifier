# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4] - 2025-12-08

### Added

- 统一入口 `hook.js`，简化 hooks 配置
- Notification hook 支持（系统通知触发 webhook）
- 会话文件自动清理功能

### Fixed

- 修复 Notification hook 的 webhook 消息标题

## [0.0.3] - 2025-12-08

### Added

- Windows 专用的 Claude Code Hooks 配置说明（需使用 `node` 命令运行脚本）

### Changed

- 优化 Release 打包结构，解压后直接得到 `cc-notifier` 目录
- 更新安装文档，简化用户操作步骤

## [0.0.2] - 2025-12-08

### Added

- 完善安装文档
- 添加 GitHub Actions 自动发布流程

## [0.0.1] - 2025-12-08

### Added

- 跨平台系统通知支持（macOS / Windows / Linux）
- 点击通知激活终端窗口（Warp、iTerm、Terminal、Windows Terminal、VS Code）
- 任务完成后自动激活终端窗口配置
- 语音播报支持（macOS / Windows）
- 多种 Webhook 支持：Slack、Discord、Telegram、钉钉、飞书、企业微信、自定义
- 任务耗时精确统计
- 日志自动清理（最多保留 500 条记录）
- 最小通知时长阈值配置
- MIT 开源协议

### Changed

- 模块化重构，提升代码可维护性

[0.0.4]: https://github.com/Flobby949/cc-notifier/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/Flobby949/cc-notifier/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/Flobby949/cc-notifier/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Flobby949/cc-notifier/releases/tag/v0.0.1
