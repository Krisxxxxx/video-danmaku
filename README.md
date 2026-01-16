# 视频弹幕播放器项目

一个支持实时弹幕的视频播放器，用户可以通过扫码在手机上发送弹幕。

## 功能特点

- 🎬 视频播放功能
- 💬 实时弹幕显示
- 📱 手机扫码发送弹幕
- 🎨 多种弹幕颜色选择
- 📊 在线人数和弹幕统计
- 🌐 WebSocket实时通信

## 项目结构

```
video-danmaku-project/
├── server.js          # Node.js 服务器
├── package.json       # 项目依赖配置
├── index.html         # 主页面（视频播放器）
├── mobile.html        # 移动端页面（弹幕发送器）
├── styles.css         # 主页面样式
├── mobile.css         # 移动端样式
├── client.js          # 主页面客户端脚本
├── mobile.js          # 移动端客户端脚本
├── qrcode.png         # 自动生成的二维码
└── sample.mp4         # 示例视频文件（需自行添加）
```

## 安装步骤

### 1. 安装 Node.js

确保已安装 Node.js（建议版本 14.x 或更高）

### 2. 安装依赖

```bash
cd video-danmaku-project
npm install
```

### 3. 添加视频文件

将视频文件命名为 `sample.mp4` 并放在项目根目录，或修改 `index.html` 中的视频路径。

## 运行项目

### 启动服务器

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动。

### 访问应用

1. **视频播放器页面**: 在浏览器中打开 `http://localhost:3000`
2. **移动端发送页面**: 扫描二维码或访问 `http://localhost:3000/mobile.html`

## 使用说明

### 在电脑上

1. 打开 `http://localhost:3000` 查看视频播放器
2. 播放视频，观看弹幕
3. 也可以直接在页面上发送弹幕

### 在手机上

1. 使用手机扫描页面上的二维码
2. 在弹出的页面中输入弹幕内容
3. 选择弹幕颜色
4. 点击"发送弹幕"按钮
5. 弹幕将实时显示在电脑的视频播放器上

## 技术栈

- **后端**: Node.js + WebSocket (ws)
- **前端**: HTML5 + CSS3 + JavaScript
- **二维码生成**: qrcode
- **实时通信**: WebSocket

## 注意事项

1. **网络环境**: 电脑和手机需要连接到同一局域网
2. **防火墙**: 确保 3000 端口未被防火墙阻止
3. **视频格式**: 支持 MP4 格式视频
4. **浏览器兼容**: 推荐使用现代浏览器（Chrome、Firefox、Safari、Edge）

## 本地网络访问

如果要在局域网内其他设备访问：

1. 查看电脑的本地 IP 地址（如：192.168.1.100）
2. 修改 `server.js` 中的端口监听（如果需要）
3. 在手机浏览器中访问 `http://192.168.1.100:3000/mobile.html`

## 常见问题

### Q: 二维码无法打开？

A: 请确保服务器已启动，且手机与电脑在同一网络。可以尝试直接在手机浏览器输入地址。

### Q: 弹幕发送失败？

A: 检查 WebSocket 连接状态，确保网络连接正常。

### Q: 视频无法播放？

A: 确认视频文件存在且格式为 MP4，检查浏览器是否支持该视频编码。

## 自定义配置

### 修改端口号

在 `server.js` 中修改 `PORT` 变量：

```javascript
const PORT = 3000; // 改为其他端口
```

### 修改弹幕颜色

在 `client.js` 和 `mobile.js` 中修改 `colors` 数组。

### 修改弹幕速度

在 `styles.css` 中修改动画时长：

```css
@keyframes moveLeft {
    from { transform: translateX(100%); }
    to { transform: translateX(-100%); }
}

.danmaku {
    animation: moveLeft 8s linear; /* 修改 8s 为其他值 */
}
```

## 许可证

MIT License

## 作者

Created with ❤️ by AI Assistant
