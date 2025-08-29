const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const ACTIONS = require("./Actions");
const CodeExecutor = require("./codeExecutor");

// Middleware - Enhanced CORS for Cloud Run
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'CodeWith C++ Editor Server',
    endpoints: {
      health: '/health',
      socketio: '/socket.io/'
    }
  });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['polling', 'websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Initialize code executor
const codeExecutor = new CodeExecutor();

const userSocketMap = {};
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => {
      return {
        socketId,
        username: userSocketMap[socketId],
      };
    }
  );
};

io.on("connection", (socket) => {
  // console.log('Socket connected', socket.id);
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    // notify that new user join
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // sync the code
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });
  // when new user join the room all the code which are there are also shows on that persons editor
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  // Handle code execution
  socket.on(ACTIONS.RUN_CODE, async ({ roomId, code, language }) => {
    console.log(`🚀 Code execution request received:`, {
      roomId,
      language,
      codeLength: code ? code.length : 0,
      socketId: socket.id,
      username: userSocketMap[socket.id]
    });

    try {
      let result;
      
      if (language === 'cpp') {
        console.log('⚙️ Executing C++ code...');
        result = await codeExecutor.executeCppCode(code, roomId);
        console.log('📊 C++ execution result:', {
          success: result.success,
          type: result.type,
          outputLength: result.output ? result.output.length : 0,
          errorLength: result.error ? result.error.length : 0
        });
      } else {
        console.log(`❌ Unsupported language: ${language}`);
        result = {
          success: false,
          output: `Language '${language}' is not supported yet. Currently supported: C++`,
          type: 'unsupported-language'
        };
      }

      // Send result back to all clients in the room
      const responsePayload = {
        output: result.output,
        error: result.error,
        success: result.success,
        type: result.type
      };
      
      console.log('📤 Sending execution result to room:', roomId, responsePayload);
      io.in(roomId).emit(ACTIONS.CODE_OUTPUT, responsePayload);

    } catch (error) {
      console.error('💥 Code execution error:', error);
      const errorPayload = {
        output: '',
        error: `Server error: ${error.message}`,
        success: false,
        type: 'server-error'
      };
      
      console.log('📤 Sending error result to room:', roomId, errorPayload);
      io.in(roomId).emit(ACTIONS.CODE_OUTPUT, errorPayload);
    }
  });

  // leave room
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    // leave all the room
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
