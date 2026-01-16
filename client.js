// WebSocket connection - use dynamic host and protocol (ws:// or wss://)
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = wsProtocol + '//' + window.location.host;
console.log('Attempting WebSocket connection to:', wsUrl);

let ws = new WebSocket(wsUrl);
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 3000;

const danmakuContainer = document.getElementById('danmakuContainer');
const danmakuInput = document.getElementById('danmakuInput');
const sendDanmakuBtn = document.getElementById('sendDanmaku');
const onlineCountEl = document.getElementById('onlineCount');
const danmakuCountEl = document.getElementById('danmakuCount');

// WebSocket reconnection function
function connectWebSocket() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached. WebSocket connection failed.');
    return;
  }

  console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      reconnectAttempts = 0;
      onlineUsers++;
      onlineCountEl.textContent = onlineUsers;
      
      // Send connection message
      ws.send(JSON.stringify({
        type: 'connect'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'danmaku') {
          createDanmaku(data.text, data.color);
        } else if (data.type === 'onlineCount') {
          onlineCountEl.textContent = data.count;
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      onlineUsers = Math.max(0, onlineUsers - 1);
      onlineCountEl.textContent = onlineUsers;
      
      // Attempt to reconnect
      reconnectAttempts++;
      console.log(`Reconnecting in ${reconnectInterval / 1000} seconds...`);
      setTimeout(connectWebSocket, reconnectInterval);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket state:', ws.readyState);
      console.error('WebSocket URL:', wsUrl);
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    reconnectAttempts++;
    setTimeout(connectWebSocket, reconnectInterval);
  }
}

// Initial connection attempt
connectWebSocket();

// Set video URL from server configuration
if (window.VIDEO_URL) {
  const videoPlayer = document.getElementById('videoPlayer');
  const videoSource = document.getElementById('videoSource');
  if (videoSource && videoPlayer) {
    videoSource.src = window.VIDEO_URL;
    console.log('Video URL set:', window.VIDEO_URL);
    
    // Add video event listeners for debugging
    videoPlayer.addEventListener('loadstart', () => {
      console.log('Video loading started');
    });
    
    videoPlayer.addEventListener('loadedmetadata', () => {
      console.log('Video metadata loaded:', videoPlayer.duration);
    });
    
    videoPlayer.addEventListener('canplay', () => {
      console.log('Video can play');
    });
    
    videoPlayer.addEventListener('error', (e) => {
      console.error('Video error:', videoPlayer.error);
      const errorCode = videoPlayer.error ? videoPlayer.error.code : 'unknown';
      const errorMessage = videoPlayer.error ? videoPlayer.error.message : 'Unknown error';
      console.error('Error code:', errorCode, 'Error message:', errorMessage);
      
      // Show error message to user
      const videoContainer = document.querySelector('.video-container');
      if (videoContainer) {
        const errorMsg = document.createElement('div');
        errorMsg.className = 'video-error-message';
        errorMsg.innerHTML = `
          <h3>视频加载失败</h3>
          <p>错误代码: ${errorCode}</p>
          <p>错误信息: ${errorMessage}</p>
          <p>视频URL: ${window.VIDEO_URL}</p>
          <p class="error-hint">可能原因：</p>
          <ul>
            <li>视频服务器不支持跨域访问（CORS）</li>
            <li>视频文件不存在或无法访问</li>
            <li>网络连接问题</li>
          </ul>
        `;
        videoContainer.appendChild(errorMsg);
      }
    });
  }
}

let danmakuCount = 0;
let onlineUsers = 0;

// Danmaku colors
const colors = [
    '#FFFFFF',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFA500',
    '#FF69B4',
    '#98FB98'
];

// Random color selection
function getRandomColor() {
    return colors[Math.floor(Math.random() * colors.length)];
}

// Create and display danmaku
function createDanmaku(text, color = getRandomColor()) {
    const danmaku = document.createElement('div');
    danmaku.className = 'danmaku';
    danmaku.textContent = text;
    danmaku.style.color = color;
    
    // Random vertical position (0-45% of container height - upper half only)
    const topPosition = Math.random() * 45;
    danmaku.style.top = topPosition + '%';
    
    // Random animation duration (6-10 seconds)
    const duration = 6 + Math.random() * 4;
    danmaku.style.animationDuration = duration + 's';
    
    // Add to container
    danmakuContainer.appendChild(danmaku);
    
    // Remove after animation completes
    setTimeout(() => {
        if (danmaku.parentNode) {
            danmakuContainer.removeChild(danmaku);
        }
    }, duration * 1000);
    
    // Update count
    danmakuCount++;
    danmakuCountEl.textContent = danmakuCount;
}

// Send danmaku message
function sendDanmaku(text) {
    if (!text.trim()) return;
    
    const message = {
        type: 'danmaku',
        text: text,
        timestamp: Date.now()
    };
    
    ws.send(JSON.stringify(message));
    
    // Clear input
    danmakuInput.value = '';
}

// Event listeners
sendDanmakuBtn.addEventListener('click', () => {
    sendDanmaku(danmakuInput.value);
});

danmakuInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendDanmaku(danmakuInput.value);
    }
});

// Load QR code
window.addEventListener('load', () => {
    const qrCode = document.getElementById('qrCode');
    const qrCodeError = document.getElementById('qrCodeError');
    const videoPlayer = document.getElementById('videoPlayer');
    
    // Disable fullscreen functionality
    videoPlayer.removeAttribute('allowfullscreen');
    
    // Remove fullscreen button by disabling controls and customizing
    const originalControls = videoPlayer.controls;
    videoPlayer.controls = false;
    
    // Create custom controls without fullscreen button
    const customControls = document.createElement('div');
    customControls.className = 'custom-controls';
    customControls.innerHTML = `
        <button id="playPauseBtn" class="control-btn">▶️</button>
        <input type="range" id="progressBar" class="progress-bar" value="0" min="0" max="100" step="0.1">
        <span id="timeDisplay" class="time-display">0:00 / 0:00</span>
        <button id="muteBtn" class="control-btn">🔊</button>
        <input type="range" id="volumeBar" class="volume-bar" value="1" min="0" max="1" step="0.1">
    `;
    
    videoPlayer.parentNode.appendChild(customControls);
    
    // Play/Pause functionality
    const playPauseBtn = document.getElementById('playPauseBtn');
    playPauseBtn.addEventListener('click', () => {
        if (videoPlayer.paused) {
            videoPlayer.play();
            playPauseBtn.textContent = '⏸️';
        } else {
            videoPlayer.pause();
            playPauseBtn.textContent = '▶️';
        }
    });
    
    // Progress bar
    const progressBar = document.getElementById('progressBar');
    videoPlayer.addEventListener('timeupdate', () => {
        const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        progressBar.value = progress;
        updateTimeDisplay();
    });
    
    progressBar.addEventListener('input', () => {
        const time = (progressBar.value / 100) * videoPlayer.duration;
        videoPlayer.currentTime = time;
    });
    
    // Time display
    function updateTimeDisplay() {
        const current = formatTime(videoPlayer.currentTime);
        const duration = formatTime(videoPlayer.duration);
        document.getElementById('timeDisplay').textContent = `${current} / ${duration}`;
    }
    
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    // Mute button
    const muteBtn = document.getElementById('muteBtn');
    muteBtn.addEventListener('click', () => {
        videoPlayer.muted = !videoPlayer.muted;
        muteBtn.textContent = videoPlayer.muted ? '🔇' : '🔊';
    });
    
    // Volume bar
    const volumeBar = document.getElementById('volumeBar');
    volumeBar.addEventListener('input', () => {
        videoPlayer.volume = volumeBar.value;
        videoPlayer.muted = false;
        muteBtn.textContent = '🔊';
    });
    
    // Prevent fullscreen on double click
    videoPlayer.addEventListener('dblclick', (e) => {
        e.preventDefault();
    });
    
    // Prevent keyboard shortcuts for fullscreen
    document.addEventListener('keydown', (e) => {
        if (e.key === 'f' || e.key === 'F' || e.key === 'Enter' || e.key === ' ') {
            if (document.activeElement === videoPlayer) {
                e.preventDefault();
                e.stopPropagation();
            }
        }
    }, true);
    
    // Try to load QR code image
    qrCode.onerror = function() {
        this.style.display = 'none';
        qrCodeError.style.display = 'block';
        qrCodeError.textContent = 'QR码生成中，请刷新页面或稍后重试';
    };
    
    // Periodically check if QR code is available
    let checkCount = 0;
    const checkInterval = setInterval(() => {
        if (qrCode.complete && qrCode.naturalWidth > 0) {
            clearInterval(checkInterval);
        } else if (checkCount >= 10) {
            clearInterval(checkInterval);
            qrCodeError.style.display = 'block';
        }
        checkCount++;
    }, 1000);
});

// Update online count periodically
setInterval(() => {
    ws.send(JSON.stringify({
        type: 'ping'
    }));
}, 30000);
