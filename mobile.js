// WebSocket connection - use dynamic host and protocol (ws:// or wss://)
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = wsProtocol + '//' + window.location.host;
console.log('Attempting WebSocket connection to:', wsUrl);

let ws = new WebSocket(wsUrl);
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectInterval = 3000;

const danmakuInput = document.getElementById('danmakuInput');
const sendBtn = document.getElementById('sendBtn');
const connectionStatus = document.getElementById('connectionStatus');
const charCount = document.getElementById('charCount');
const colorBtns = document.querySelectorAll('.color-btn');
const recentList = document.getElementById('recentList');
const toast = document.getElementById('toast');

let selectedColor = '#FFFFFF';
let recentDanmaku = [];
const MAX_RECENT = 10;

// WebSocket reconnection function
function connectWebSocket() {
  if (reconnectAttempts >= maxReconnectAttempts) {
    console.error('Max reconnection attempts reached. WebSocket connection failed.');
    updateStatus(false);
    showToast('连接失败，请刷新页面', 'error');
    return;
  }

  console.log(`Reconnection attempt ${reconnectAttempts + 1}/${maxReconnectAttempts}`);
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('Connected to WebSocket server');
      reconnectAttempts = 0;
      updateStatus(true);
      
      // Send connection message
      ws.send(JSON.stringify({
        type: 'connect'
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'onlineCount') {
          console.log('Online count:', data.count);
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
      updateStatus(false);
      
      // Attempt to reconnect
      reconnectAttempts++;
      console.log(`Reconnecting in ${reconnectInterval / 1000} seconds...`);
      setTimeout(connectWebSocket, reconnectInterval);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      console.error('WebSocket state:', ws.readyState);
      console.error('WebSocket URL:', wsUrl);
      updateStatus(false);
    };
  } catch (error) {
    console.error('Failed to create WebSocket connection:', error);
    updateStatus(false);
    reconnectAttempts++;
    setTimeout(connectWebSocket, reconnectInterval);
  }
}

// Initial connection attempt
connectWebSocket();

// Show toast message
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = 'toast show ' + type;
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Update connection status
function updateStatus(connected) {
    if (connected) {
        connectionStatus.textContent = '已连接';
        connectionStatus.className = 'status-value connected';
        sendBtn.disabled = false;
    } else {
        connectionStatus.textContent = '未连接';
        connectionStatus.className = 'status-value disconnected';
        sendBtn.disabled = true;
    }
}

// Update character count
function updateCharCount() {
    const count = danmakuInput.value.length;
    charCount.textContent = count;
    
    if (count >= 100) {
        charCount.style.color = '#dc3545';
    } else if (count >= 80) {
        charCount.style.color = '#ffc107';
    } else {
        charCount.style.color = '#999';
    }
}

// Send danmaku
function sendDanmaku() {
    const text = danmakuInput.value.trim();
    
    if (!text) {
        showToast('请输入弹幕内容', 'error');
        return;
    }
    
    if (ws.readyState !== WebSocket.OPEN) {
        showToast('连接已断开，请刷新页面', 'error');
        return;
    }
    
    const message = {
        type: 'danmaku',
        text: text,
        color: selectedColor,
        timestamp: Date.now()
    };
    
    try {
        ws.send(JSON.stringify(message));
        showToast('发送成功！');
        
        // Add to recent list
        addRecentDanmaku(text, selectedColor);
        
        // Clear input
        danmakuInput.value = '';
        updateCharCount();
        
        // Remove focus from textarea to close keyboard
        danmakuInput.blur();
    } catch (error) {
        console.error('Error sending danmaku:', error);
        showToast('发送失败，请重试', 'error');
    }
}

// Add danmaku to recent list
function addRecentDanmaku(text, color) {
    const item = {
        text: text,
        color: color,
        time: new Date().toLocaleTimeString()
    };
    
    recentDanmaku.unshift(item);
    
    // Keep only recent items
    if (recentDanmaku.length > MAX_RECENT) {
        recentDanmaku.pop();
    }
    
    updateRecentList();
}

// Update recent list display
function updateRecentList() {
    if (recentDanmaku.length === 0) {
        recentList.innerHTML = '<p class="empty-message">暂无发送记录</p>';
        return;
    }
    
    recentList.innerHTML = recentDanmaku.map(item => `
        <div class="recent-item">
            <div class="recent-color" style="background: ${item.color};"></div>
            <div class="recent-text">${escapeHtml(item.text)}</div>
            <div class="recent-time">${item.time}</div>
        </div>
    `).join('');
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Handle color selection
colorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons
        colorBtns.forEach(b => b.classList.remove('active'));
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Update selected color
        selectedColor = btn.dataset.color;
    });
});

// Event listeners
sendBtn.addEventListener('click', sendDanmaku);

danmakuInput.addEventListener('input', updateCharCount);

danmakuInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendDanmaku();
    }
});

// Handle page visibility
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
        if (ws.readyState !== WebSocket.OPEN) {
            showToast('正在重新连接...', 'success');
        }
    }
});

// Initialize on page load
window.addEventListener('load', () => {
    updateCharCount();
    console.log('Mobile danmaku sender loaded');
});
