const http = require('http');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 3000;
const DOMAIN = process.env.DOMAIN || `localhost:${PORT}`;
const USE_HTTPS = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
const VIDEO_URL = process.env.VIDEO_URL || './heng.mp4';
const USE_SSE = process.env.USE_SSE !== 'false';  // Default to SSE

// Store all connected SSE clients
const sseClients = new Set();

// Store danmaku messages (in-memory, can be replaced with Redis)
const danmakuHistory = [];
// Unlimited danmaku history - no MAX_HISTORY limit

// Broadcast danmaku to all SSE clients
function broadcastDanmaku(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error writing to SSE client:', error);
      client.end();
      sseClients.delete(client);
    }
  });
}

// Broadcast online count to all SSE clients
function broadcastOnlineCount() {
  const message = `data: ${JSON.stringify({ type: 'stats', online: sseClients.size })}\n\n`;
  
  sseClients.forEach((client) => {
    try {
      client.write(message);
    } catch (error) {
      console.error('Error writing to SSE client:', error);
      client.end();
      sseClients.delete(client);
    }
  });
}

// Store danmaku in history
function storeDanmaku(data) {
  danmakuHistory.push({
    ...data,
    timestamp: Date.now()
  });
  // Unlimited history - no truncation
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // SSE endpoint
  if (req.url === '/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    console.log('New SSE client connected');
    sseClients.add(res);

    // Send welcome message and history
    res.write(`data: ${JSON.stringify({ type: 'welcome', message: 'Connected to danmaku server' })}\n\n`);
    
    // Send recent danmaku history
    if (danmakuHistory.length > 0) {
      res.write(`data: ${JSON.stringify({ type: 'history', messages: danmakuHistory })}\n\n`);
    }
    
    // Send initial online count
    res.write(`data: ${JSON.stringify({ type: 'stats', online: sseClients.size })}\n\n`);
    
    // Broadcast online count to all clients
    broadcastOnlineCount();

    // Send keepalive every 30 seconds
    const keepalive = setInterval(() => {
      try {
        res.write(': keepalive\n\n');
      } catch (error) {
        clearInterval(keepalive);
        sseClients.delete(res);
      }
    }, 30000);

    req.on('close', () => {
      console.log('SSE client disconnected. Total clients:', sseClients.size - 1);
      clearInterval(keepalive);
      sseClients.delete(res);
      
      // Broadcast updated online count
      broadcastOnlineCount();
    });

    return;
  }

  // POST endpoint for sending danmaku
  if (req.url === '/danmaku' && req.method === 'POST') {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        console.log('Received danmaku:', data);
        
        storeDanmaku(data);
        broadcastDanmaku(data);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Danmaku sent' }));
      } catch (error) {
        console.error('Error parsing danmaku:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
      }
    });

    return;
  }

  // GET endpoint for danmaku history
  if (req.url === '/danmaku' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, messages: danmakuHistory }));
    return;
  }

  // DELETE endpoint for clearing danmaku history
  if (req.url === '/danmaku' && req.method === 'DELETE') {
    const count = danmakuHistory.length;
    danmakuHistory.length = 0; // Clear the array
    
    console.log(`Danmaku history cleared. Removed ${count} messages.`);
    
    // Broadcast clear event to all clients
    const clearEvent = `data: ${JSON.stringify({ type: 'clear', message: 'Danmaku history cleared' })}\n\n`;
    sseClients.forEach((client) => {
      try {
        client.write(clearEvent);
      } catch (error) {
        console.error('Error broadcasting clear event:', error);
        client.end();
        sseClients.delete(client);
      }
    });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `Cleared ${count} danmaku messages` }));
    return;
  }

  // Serve static files
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
      // Inject config into HTML files
      if (filePath === './index.html' || filePath === './mobile.html') {
        const configScript = `
          <script>
            window.VIDEO_URL = '${VIDEO_URL}';
            window.USE_SSE = ${USE_SSE};
            window.API_BASE = '${USE_HTTPS ? 'https://' : 'http://'}${DOMAIN}';
          </script>
        `;
        const injectedContent = content.toString().replace('</head>', configScript + '</head>');
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(injectedContent, 'utf-8');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    }
  });
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
  console.log(`Using SSE: ${USE_SSE}`);
  console.log(`Video URL: ${VIDEO_URL}`);
  
  const qrCodeDataURL = await generateQRCode();
  
  if (qrCodeDataURL) {
    const qrCodeImage = qrCodeDataURL.split(',')[1];
    const buffer = Buffer.from(qrCodeImage, 'base64');
    fs.writeFileSync('qrcode.png', buffer);
    console.log('QR code generated: qrcode.png');
    console.log(`QR code URL: ${protocol}${DOMAIN}/mobile.html`);
  }
  
  // Broadcast online count every 5 seconds
  setInterval(() => {
    broadcastOnlineCount();
  }, 5000);
});
