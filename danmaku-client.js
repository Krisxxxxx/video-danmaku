/**
 * Danmaku Client - Supports both WebSocket and SSE
 */
class DanmakuClient {
  constructor(options = {}) {
    this.useSSE = options.useSSE !== false; // Default to SSE
    this.apiBase = options.apiBase || window.location.origin;
    this.onMessage = options.onMessage || (() => {});
    this.onConnect = options.onConnect || (() => {});
    this.onError = options.onError || (() => {});
    this.onDisconnect = options.onDisconnect || (() => {});
    
    this.connection = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect() {
    if (this.useSSE) {
      this.connectSSE();
    } else {
      this.connectWebSocket();
    }
  }

  // SSE Connection
  connectSSE() {
    console.log('[SSE] Connecting to danmaku server...');
    
    try {
      this.connection = new EventSource(`${this.apiBase}/events`);
      
      this.connection.onopen = () => {
        console.log('[SSE] Connected successfully');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.onConnect();
      };
      
      this.connection.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] Received message:', data);
          this.onMessage(data);
        } catch (error) {
          console.error('[SSE] Error parsing message:', error);
        }
      };
      
      this.connection.onerror = (error) => {
        console.error('[SSE] Connection error:', error);
        this.connected = false;
        this.onError(error);
        
        // SSE auto-reconnects, but we can force a reconnect after delay
        this.reconnectSSE();
      };
      
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      this.onError(error);
    }
  }

  reconnectSSE() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[SSE] Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[SSE] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.connected) {
        this.connection.close();
        this.connectSSE();
      }
    }, this.reconnectDelay);
  }

  // WebSocket Connection
  connectWebSocket() {
    console.log('[WebSocket] Connecting to danmaku server...');
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss://' : 'ws://';
    const wsUrl = `${wsProtocol}${window.location.host}`;
    
    this.connection = new WebSocket(wsUrl);
    
    this.connection.onopen = () => {
      console.log('[WebSocket] Connected successfully');
      this.connected = true;
      this.reconnectAttempts = 0;
      this.onConnect();
    };
    
    this.connection.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WebSocket] Received message:', data);
        this.onMessage(data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    };
    
    this.connection.onerror = (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.onError(error);
    };
    
    this.connection.onclose = () => {
      console.log('[WebSocket] Connection closed');
      this.connected = false;
      this.onDisconnect();
      this.reconnectWebSocket();
    };
  }

  reconnectWebSocket() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnect attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`[WebSocket] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.connected) {
        this.connectWebSocket();
      }
    }, this.reconnectDelay);
  }

  // Send danmaku via HTTP POST (works for both SSE and WebSocket)
  async sendDanmaku(text, options = {}) {
    const payload = {
      type: 'danmaku',
      text: text,
      color: options.color || '#FFFFFF',
      fontSize: options.fontSize || 24,
      speed: options.speed || 5,
      position: options.position || 'random',
      timestamp: Date.now()
    };
    
    try {
      const response = await fetch(`${this.apiBase}/danmaku`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Danmaku] Sent successfully:', result);
      return result;
      
    } catch (error) {
      console.error('[Danmaku] Failed to send:', error);
      throw error;
    }
  }

  // Get danmaku history
  async getHistory() {
    try {
      const response = await fetch(`${this.apiBase}/danmaku`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result.messages || [];
      
    } catch (error) {
      console.error('[History] Failed to fetch:', error);
      return [];
    }
  }

  // Clear danmaku history
  async clearHistory() {
    try {
      const response = await fetch(`${this.apiBase}/danmaku`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('[Clear] History cleared:', result);
      return result;
      
    } catch (error) {
      console.error('[Clear] Failed to clear history:', error);
      throw error;
    }
  }

  disconnect() {
    console.log('[Client] Disconnecting...');
    this.connected = false;
    
    if (this.connection) {
      if (this.useSSE) {
        this.connection.close();
      } else {
        this.connection.close();
      }
    }
    
    this.connection = null;
  }

  isConnected() {
    return this.connected;
  }
}

// Auto-detect best connection method and initialize
window.DanmakuClient = DanmakuClient;
