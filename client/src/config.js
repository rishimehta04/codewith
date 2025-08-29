// Configuration for the application
export const config = {
  // Server URL - this will be replaced during build
  serverUrl: process.env.REACT_APP_SERVER_URL || 
            window.location.hostname === 'localhost' 
              ? 'http://localhost:3001'
              : 'https://codewith-server-480351516786.us-central1.run.app',
  
  // WebSocket URL - for Socket.IO connections
  wsUrl: process.env.REACT_APP_WS_URL || 
         window.location.hostname === 'localhost'
           ? 'ws://localhost:3001'
           : 'wss://codewith-server-480351516786.us-central1.run.app'
};

console.log('App configuration:', config);
