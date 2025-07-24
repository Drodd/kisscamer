# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Kiss Camera模拟器 - 移动端竖屏游戏，玩家扮演摄影师在演唱会捕捉情侣并推送到直播屏幕。

## Architecture
- **Frontend**: 纯HTML/CSS/JavaScript，无依赖框架
- **Layout**: 三层画面结构（直播屏幕→游戏场景→取景器）
- **Responsive**: 移动端优先，支持iPhone/Android竖屏

## File Structure
```
├── index.html          # 主游戏页面
├── style.css           # 移动端响应式样式
├── script.js           # 游戏逻辑核心
├── test.html           # 移动端测试页面
└── imgs/               # 游戏图片资源
```

## Key Components
- **Game Engine**: `KissCameraGame` class in script.js
- **Viewport**: 640×480取景器，支持横向滚动
- **Live Screen**: 250px圆形直播屏幕，3秒同步显示
- **Audience System**: 随机生成20名观众，自动识别情侣

## Development Commands
```bash
# 启动本地服务器
python3 -m http.server 8080

# 访问游戏
open http://localhost:8080

# 移动端测试
open http://localhost:8080/test.html
```

## Game Features
- 60秒倒计时
- 情侣识别算法（相邻男女观众）
- 触摸滑动+按钮控制
- 实时画面捕获与显示
- 得分系统（成功捕捉情侣+100分）

## Mobile Optimization
- 防止页面滚动（touch-action: manipulation）
- 防止长按菜单（-webkit-user-select: none）
- 触摸滑动支持
- 响应式布局适配