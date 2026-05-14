'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    console.log(`🔌 Attempting WebSocket connection to ${url}...`);
    const socket = new WebSocket(url);

    socket.onopen = () => {
      console.log('✅ WebSocket Connected');
      setIsConnected(true);
      reconnectAttempts.current = 0;
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    socket.onclose = () => {
      console.log('❌ WebSocket Disconnected');
      setIsConnected(false);
      
      // Exponential backoff reconnection
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      console.log(`🔄 Reconnecting in ${delay}ms...`);
      
      reconnectTimeout.current = setTimeout(() => {
        reconnectAttempts.current += 1;
        connect();
      }, delay);
    };

    socket.onerror = (error) => {
      console.error('WebSocket Error:', error);
      socket.close();
    };

    ws.current = socket;
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnection on manual close
        ws.current.close();
      }
    };
  }, [connect]);

  return { isConnected, lastMessage };
}
