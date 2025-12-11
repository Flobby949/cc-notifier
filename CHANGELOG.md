# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.7] - 2025-12-11

### Added

- `ccntf backup [path]` 命令，支持手动备份 Claude settings.json 配置文件
- 备份命令支持自定义路径或自动生成带时间戳的备份文件

### Changed

- GitHub workflow 优化：发行包打包前预安装生产依赖，用户下载后无需再执行 npm install
- 发行包中包含 package-lock.json 确保依赖版本一致
- setup.sh 优化：检测 node_modules 是否已存在，存在则跳过安装

### Fixed

- 修复 `ccntf hooks install` 会覆盖用户已有 hook 配置的严重问题，现在改为追加而非覆盖
- 改进去重检测逻辑，更精确地识别已安装的 hook，避免重复添加
- 移除 workflow 中对已删除的 setup.bat 的引用

## [0.0.6] - 2025-12-08

### Fixed

- CLI 延迟加载依赖，修复无 node_modules 时的报错
- hooks print/check/install 等命令不再需要 node-notifier
- CLI 使用动态项目路径，支持任意安装位置
- 修复 node-notifier 未声明为 dependencies 导致 release 包无法使用的问题
- 快速安装模式现在会自动安装运行时依赖

## [0.0.5] - 2025-12-08

### Added

- CLI 工具 `ccntf`，支持一键安装配置、测试通知、管理 hooks
- `ccntf hooks install` 自动安装 Claude hooks 配置
- `ccntf hooks print` 打印可复制的 hooks 配置
- `ccntf init` 初始化 webhook 配置文件
- `ccntf test` 测试通知功能
- `ccntf check` 检查 hooks 配置是否正确
- `ccntf clean` 清理日志和会话文件（保留活跃会话）
- `setup.sh` / `setup.bat` 交互式安装脚本

### Changed

- 重构 README，新增快速开始章节，详细内容折叠显示
- Release 打包包含安装脚本

## [0.0.4] - 2025-12-08

### Added

- 统一入口 `hook.js`，简化 hooks 配置
- Notification hook 支持（系统通知触发 webhook）
- 会话文件自动清理功能
- idle 通知超过 5 分钟后自动抑制

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

[0.0.7]: https://github.com/Flobby949/cc-notifier/compare/v0.0.6...v0.0.7
[0.0.6]: https://github.com/Flobby949/cc-notifier/compare/v0.0.5...v0.0.6
[0.0.5]: https://github.com/Flobby949/cc-notifier/compare/v0.0.4...v0.0.5
[0.0.4]: https://github.com/Flobby949/cc-notifier/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/Flobby949/cc-notifier/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/Flobby949/cc-notifier/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/Flobby949/cc-notifier/releases/tag/v0.0.1
