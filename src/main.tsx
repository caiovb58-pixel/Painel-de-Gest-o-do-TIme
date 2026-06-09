import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Gracefully handle and suppress sandbox-related WebSocket and Vite HMR connection rejections
if (typeof window !== 'undefined') {
  const isWebSocketError = (err: any): boolean => {
    if (!err) return false;
    const msg = typeof err === 'string' ? err : String(err.message || err);
    const lowerMsg = msg.toLowerCase();
    return (
      lowerMsg.includes('websocket') ||
      lowerMsg.includes('ws://') ||
      lowerMsg.includes('wss://') ||
      lowerMsg.includes('failed to connect to websocket') ||
      lowerMsg.includes('closed without opened')
    );
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (isWebSocketError(event.reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    if (isWebSocketError(event.message) || isWebSocketError(event.error)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

