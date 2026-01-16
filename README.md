# 视频弹幕播放器项目

一个支持实时弹幕的视频播放器，用户可以通过扫码在手机上发送弹幕。

## 功能特点

- 🎬 视频播放功能
- 💬 实时弹幕显示
- 📱 手机扫码发送弹幕
- 🎨 多种弹幕颜色选择
- 📊 在线人数和弹幕统计
- 🌐 双模式实时通信（WebSocket / SSE）
- 🔄 自动重连机制
- 🏢 生产环境优化（SSE 模式）

## 项目结构

```
video-danmaku-project/
├── server.js          # WebSocket 服务器（可选）
├── server-sse.js      # SSE 服务器（推荐用于生产环境）
├── package.json       # 项目依赖配置
├── index.html         # 主页面（视频播放器）
├── mobile.html        # 移动端页面（弹幕发送器）
├── styles.css         # 主页面样式
├── mobile.css         # 移动端样式
├── danmaku-client.js  # 通用客户端（支持 WebSocket 和 SSE）
├── qrcode.png         # 自动生成的二维码
├── Dockerfile         # Docker 镜像构建文件
├── SSE-README.md      # SSE 详细文档
└── sample.mp4         # 示例视频文件（需自行添加）
```

## 通信模式

本项目支持两种实时通信模式：

### 1. WebSocket 模式
- 适合：本地开发、内网环境
- 特点：双向通信、实时性好
- 需要：特殊网络配置支持

### 2. SSE 模式 ⭐ 生产推荐
- 适合：生产环境、公网部署、复杂网络环境
- 特点：标准 HTTP、自动重连、无需特殊配置
- 优势：更容易穿透防火墙和代理

> 💡 **生产环境默认使用 SSE 模式**，无需任何网络配置调整。

## 安装步骤

### 1. 安装 Node.js

确保已安装 Node.js（建议版本 14.x 或更高）

### 2. 安装依赖

```bash
cd video-danmaku-project
npm install
```

### 3. 添加视频文件

将视频文件命名为 `sample.mp4` 并放在项目根目录，或修改配置中的视频路径。

## 运行项目

### 本地开发

**使用 WebSocket（默认）：**
```bash
npm start
```

**使用 SSE（推荐）：**
```bash
npm run start:sse
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
4. 查看连接状态和统计数据

### 在手机上

1. 使用手机扫描页面上的二维码
2. 在弹出的页面中输入弹幕内容
3. 选择弹幕颜色
4. 点击"发送弹幕"按钮
5. 弹幕将实时显示在电脑的视频播放器上

## 技术栈

- **后端**: Node.js
- **实时通信**: WebSocket (ws) / Server-Sent Events (SSE)
- **前端**: HTML5 + CSS3 + JavaScript
- **二维码生成**: qrcode
- **容器化**: Docker

## 生产部署

### Docker 部署

```bash
# 构建镜像
docker build -t video-danmaku-app .

# 运行容器
docker run -p 3000:3000 -e USE_SSE=true video-danmaku-app
```

## 环境配置

### 本地开发环境变量

```bash
# 使用 SSE（推荐）
USE_SSE=true npm run start:sse

# 使用 WebSocket
USE_SSE=false npm start
```

### 生产环境变量

```bash
NODE_ENV=production
PORT=3000
USE_SSE=true
USE_HTTPS=true
DOMAIN=your-domain.com
```

## 注意事项

1. **网络环境**: 
   - 本地：电脑和手机需要连接到同一局域网
   - 生产：需要配置域名和 HTTPS

2. **防火墙**: 
   - 确保服务端口（默认 3000）未被阻止
   - SSE 模式无需特殊防火墙配置

3. **视频格式**: 支持 MP4 格式视频

4. **浏览器兼容**: 
   - 推荐使用现代浏览器（Chrome、Firefox、Safari、Edge）
   - SSE 支持所有现代浏览器

## 监控和日志

### 查看服务器日志

```bash
# Docker
docker logs -f container_id
```

### 健康检查

生产环境配置了健康检查：

```bash
# 检查服务状态
curl http://your-domain/
```

## 本地网络访问

如果要在局域网内其他设备访问：

1. 查看电脑的本地 IP 地址（如：192.168.1.100）
2. 在手机浏览器中访问 `http://192.168.1.100:3000/mobile.html`

## 常见问题

### Q: 弹幕发送失败？

**A**: 
- 检查连接状态显示
- SSE 模式会自动重连
- 检查浏览器控制台错误信息
- 确认服务器正常运行

### Q: 视频无法播放？

**A**: 
- 确认视频文件存在且格式为 MP4
- 检查浏览器是否支持该视频编码
- 查看浏览器控制台的错误信息

### Q: 二维码无法打开？

**A**: 
- 确保服务器已启动
- 手机与电脑在同一网络（本地）
- 生产环境确保域名可访问
- 尝试直接在手机浏览器输入地址

### Q: 生产环境弹幕不显示？

**A**: 
- SSE 模式已优化，无需特殊配置
- 检查网络连接
- 查看浏览器控制台
- 确认 USE_SSE=true 环境变量已设置

### Q: 如何切换通信模式？

**A**: 
- **本地**: 修改启动命令或环境变量
- **生产**: 修改环境变量 USE_SSE 的值
- 详见 [SSE-README.md](SSE-README.md)

## 自定义配置

### 修改端口号

**开发环境**：
```bash
# 修改命令行参数
PORT=3001 npm run start:sse
```

**生产环境**：
修改环境变量中的 PORT 配置

### 修改弹幕颜色

在 `mobile.html` 中修改颜色选择按钮：

```html
<button class="color-btn" data-color="#FFFFFF" style="background: #FFFFFF;"></button>
<!-- 添加更多颜色 -->
```

### 修改弹幕速度

在 `index.html` 的 `displayDanmaku` 函数中修改：

```javascript
const duration = (data.speed || 5) * 1000; // 调整速度值
```

### 修改弹幕历史记录数量

在 `server-sse.js` 中修改：

```javascript
const MAX_HISTORY = 100; // 修改历史记录数量
```

## 性能优化

### SSE 模式优化

- ✅ 自动重连机制
- ✅ 心跳保持（30秒）
- ✅ 长连接超时配置（86400秒）
- ✅ 连接池管理

### 缓存策略

- 静态资源浏览器缓存
- CDN 加速（生产环境）
- 视频流式传输

## 安全建议

1. **启用 HTTPS**：生产环境必须使用 HTTPS
2. **输入验证**：前端已实现长度限制和 XSS 防护
3. **速率限制**：建议在生产环境添加 API 速率限制
4. **CORS 配置**：根据需要配置跨域策略

## 故障排查

详细的故障排查指南请查看 [SSE-README.md](SSE-README.md)

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关文档

- [SSE 部署详细文档](SSE-README.md)
- [Docker 部署指南](#docker-部署)

## 作者

Created with ❤️ by AI Assistant

---

**提示**: 生产环境推荐使用 SSE 模式，无需特殊网络配置，更稳定可靠！
