# 视频弹幕播放器 - SSE 部署方案

## 问题说明

原项目使用 WebSocket 实现实时弹幕功能，但在生产环境中，WebSocket 连接可能因为以下原因失败：

1. **防火墙限制**：企业防火墙可能阻止 WebSocket 连接
2. **负载均衡器配置**：某些负载均衡器不完全支持 WebSocket 协议
3. **Ingress 配置复杂**：Kubernetes Ingress 需要特殊配置才能支持 WebSocket
4. **代理服务器**：Nginx 等代理服务器可能未正确配置 WebSocket 支持

## 解决方案：Server-Sent Events (SSE)

为了解决这些问题，我们提供了基于 SSE 的替代方案：

### SSE 的优势

1. **标准 HTTP 协议**：SSE 使用标准 HTTP 协议，更容易穿透网络限制
2. **无需特殊配置**：不需要修改负载均衡器、Ingress 或防火墙配置
3. **自动重连**：浏览器原生支持 SSE 自动重连
4. **更简单**：实现更简单，维护成本更低

## 两种服务器模式

### 1. WebSocket 服务器 (server.js)

**适合场景**：
- 本地开发环境
- 网络环境完全可控的内网部署
- 需要双向通信的复杂场景

**启动方式**：
```bash
npm start
# 或
npm run dev:ws
```

**特点**：
- 支持全双工通信
- 实时性更好
- 需要特殊网络配置

### 2. SSE 服务器 (server-sse.js) ⭐ 推荐用于生产环境

**适合场景**：
- 生产环境部署
- 公网部署
- 有防火墙或代理的复杂网络环境
- Kubernetes 云原生部署

**启动方式**：
```bash
npm run start:sse
# 或
npm run dev
```

**特点**：
- 使用标准 HTTP
- 无需特殊配置
- 自动重连
- 单向通信（服务器到客户端）
- 发送弹幕使用 HTTP POST

## 部署配置

### Docker 部署

Dockerfile 已配置为默认使用 SSE 服务器：

```dockerfile
ENV USE_SSE=true
CMD ["node", "server-sse.js"]
```

### Kubernetes 部署

deployment.yaml 已配置：

```yaml
# ConfigMap
USE_SSE: "true"

# Ingress 配置（移除了 WebSocket 特定配置）
nginx.ingress.kubernetes.io/proxy-http-version: "1.1"
nginx.ingress.kubernetes.io/proxy-read-timeout: "86400"
nginx.ingress.kubernetes.io/proxy-send-timeout: "86400"
```

### 环境变量

可以通过环境变量控制使用哪种模式：

```bash
# 使用 SSE（推荐）
USE_SSE=true

# 使用 WebSocket
USE_SSE=false
```

## 客户端自动适配

`danmaku-client.js` 会根据配置自动选择使用 SSE 或 WebSocket：

```javascript
const client = new DanmakuClient({
  useSSE: window.USE_SSE !== false, // 默认使用 SSE
  apiBase: window.API_BASE || window.location.origin,
  onMessage: handleDanmakuMessage
});
```

## 功能对比

| 功能 | WebSocket | SSE |
|------|-----------|-----|
| 实时接收弹幕 | ✅ | ✅ |
| 发送弹幕 | ✅ | ✅ (HTTP POST) |
| 连接稳定性 | 需要特殊配置 | ✅ 标准HTTP |
| 自动重连 | 需要手动实现 | ✅ 浏览器原生 |
| 网络穿透性 | ⚠️ 可能受限 | ✅ 容易穿透 |
| 双向通信 | ✅ | ❌ 仅单向 |
| 浏览器支持 | ✅ 广泛 | ✅ 现代浏览器 |

## 推荐部署方案

### 生产环境（推荐）
```
使用 SSE 服务器 (server-sse.js)
- 环境变量: USE_SSE=true
- 无需额外配置
- 更稳定可靠
```

### 开发环境
```
使用 WebSocket 或 SSE 均可
- WebSocket: npm start
- SSE: npm run dev
```

## 故障排查

### 如果 SSE 连接失败

1. 检查服务器是否正常运行：
   ```bash
   curl http://your-domain/events
   ```

2. 检查网络连接：
   ```bash
   curl http://your-domain/
   ```

3. 检查浏览器控制台是否有错误

### 如果需要切换回 WebSocket

1. 修改环境变量：
   ```bash
   USE_SSE=false
   ```

2. 修改 Dockerfile：
   ```dockerfile
   CMD ["node", "server.js"]
   ```

3. 修改 deployment.yaml：
   ```yaml
   USE_SSE: "false"
   ```

4. 添加 Ingress WebSocket 配置（见原始配置）

## 技术架构

```
┌─────────────┐
│   客户端     │
│ (浏览器)     │
└──────┬──────┘
       │
       ├─ SSE: GET /events (接收弹幕)
       │
       └─ HTTP: POST /danmaku (发送弹幕)
              │
       ┌──────▼──────┐
       │  SSE 服务器  │
       │ (单向推送)   │
       └─────────────┘
```

## 总结

对于大多数生产环境部署，**强烈推荐使用 SSE 方案**，因为：

1. ✅ 更少的网络配置问题
2. ✅ 更好的兼容性
3. ✅ 更简单的维护
4. ✅ 足够的性能满足弹幕需求

如果需要更复杂的实时交互功能，可以考虑使用 WebSocket，但需要确保网络环境支持。
