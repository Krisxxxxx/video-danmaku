const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const https = require('https');

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `localhost:${PORT}`;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
const VIDEO_URL = process.env.VIDEO_URL || './heng.mp4';
const PROXY_VIDEO = process.env.PROXY_VIDEO !== 'false';  // Default to false (local video)

// Video proxy function
function proxyVideo(req, res) {
  const url = new URL(VIDEO_URL);
  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname + url.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  console.log('Proxying video request to:', VIDEO_URL);

  const proxyReq = (url.protocol === 'https:' ? https : http).request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (error) => {
    console.error('Video proxy error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Failed to proxy video', details: error.message }));
  });

  proxyReq.end();
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Handle video proxy requests
  if (req.url === '/proxy-video' && PROXY_VIDEO) {
    proxyVideo(req, res);
    return;
  }

  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4',
  };

  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code, 'utf-8');
      }
    } else {
      // Inject video URL into index.html
      if (filePath === './index.html') {
        const proxyUrl = PROXY_VIDEO ? '/proxy-video' : VIDEO_URL;
        const script = `<script>window.VIDEO_URL = '${proxyUrl}';</script>`;
        const injectedContent = content.toString().replace('</head>', script + '</head>');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(injectedContent, 'utf-8');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    }
  });
});

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Store all connected clients
const clients = new Set();

// WebSocket upgrade logging
server.on('upgrade', (request, socket, head) => {
  console.log('WebSocket upgrade request received');
  console.log('Request URL:', request.url);
  console.log('Request headers:', JSON.stringify(request.headers, null, 2));
  
  // Check if this is a WebSocket upgrade request
  const upgradeHeader = request.headers.upgrade || '';
  const connectionHeader = request.headers.connection || '';
  
  console.log('Upgrade header:', upgradeHeader);
  console.log('Connection header:', connectionHeader);
  
  if (upgradeHeader.toLowerCase() !== 'websocket') {
    console.error('Invalid upgrade header:', upgradeHeader);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
    return;
  }
});

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  console.log('Client connected from:', req.socket.remoteAddress);
  console.log('Total clients:', clients.size + 1);
  
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to danmaku server'
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data.type, data.text || '');
      
      // Broadcast danmaku to all connected clients
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected. Total clients:', clients.size - 1);
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
  
  ws.on('pong', () => {
    // Handle pong for keepalive
    ws.isAlive = true;
  });
});

// WebSocket keepalive check
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

// Generate QR code for mobile access
const generateQRCode = async () => {
  try {
    const protocol = USE_HTTPS ? 'https://' : 'http://';
    const mobileUrl = `${protocol}${DOMAIN}/mobile.html`;
    const qrCodeDataURL = await QRCode.toDataURL(mobileUrl);
    console.log(`QR code generated for: ${mobileUrl}`);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
};

// Start server
server.listen(PORT, async () => {
  const protocol = USE_HTTPS ? 'https://' : 'http://';
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Public URL: ${protocol}${DOMAIN}/`);
  const qrCodeDataURL = await generateQRCode();
  
  if (qrCodeDataURL) {
    // Save QR code as image
    const qrCodeImage = qrCodeDataURL.split(',')[1];
    const buffer = Buffer.from(qrCodeImage, 'base64');
    fs.writeFileSync('qrcode.png', buffer);
    console.log('QR code generated: qrcode.png');
    console.log(`QR code URL: ${protocol}${DOMAIN}/mobile.html`);
  }
});
