import {io} from 'socket.io-client';
import { config } from './config';

export const initSocket = async () =>{
    const options = {
        'force new connection': true,
        reconnectionAttempts : 'Infinity',
        timeout: 30000, // Increased timeout
        transports: ['polling', 'websocket'], // Try polling first, then websocket
        upgrade: true,
        rememberUpgrade: false,
        forceNew: true,
        'connect timeout': 30000,
        // Add better error handling
        reconnectionDelay: 1000,
        maxReconnectionDelay: 5000,
        reconnection: true
    };
    
    // Use WebSocket URL if available, fallback to server URL
    const serverUrl = config.wsUrl || config.serverUrl;
    console.log('Connecting to server:', serverUrl); // Debug log
    
    const socket = io(serverUrl, options);
    
    // Add connection event listeners for debugging
    socket.on('connect', () => {
        console.log('✅ Socket connected successfully:', socket.id);
    });
    
    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
    });
    
    socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
    });
    
    return socket;
}
