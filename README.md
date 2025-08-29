# CODEWITH - Real-time Collaborative C++ Code Editor

CODEWITH is a real-time code collaboration web application that allows multiple users to collaborate on C++ code in the same virtual room. It features **secure code execution** with containerized sandboxing and is **production-ready for Google Cloud Platform**.

## ✨ Features

### Collaboration
- 🏠 Create or join virtual rooms with unique room IDs
- 👥 Real-time multi-user code editing
- 🔄 Instant synchronization across all connected clients
- 💬 Live user presence indicators

### Code Execution
- ⚡ **Secure C++ code execution** with Docker containerization
- 🛡️ **Sandboxed environment** prevents system-level access
- ⏱️ **Timeout protection** (5-second execution limit)
- 📊 **Resource limits** to prevent memory/CPU abuse
- 🎯 **Real-time output** shared with all room participants

### Production Features
- 🐳 **Docker containerization** for consistent deployment
- ☁️ **Google Cloud Platform ready** with Cloud Run
- 🔒 **Security-first design** with non-root user execution
- 📈 **Auto-scaling** and pay-per-use pricing

## 🚀 Quick Deploy to Google Cloud

### Option 1: One-Click Deployment
```bash
# Clone the repository
git clone <your-repo-url>
cd codewith

# Run the quick deployment script
./quick-deploy.sh
```

### Option 2: Manual Deployment
Follow the detailed guide in [`deploy-to-gcp.md`](./deploy-to-gcp.md)

## 🛠️ Technologies Used

### Backend
- **Node.js**: Server runtime
- **Express.js**: Web framework
- **Socket.IO**: Real-time communication
- **Docker**: Containerization
- **G++**: C++ compiler for code execution

### Frontend  
- **React**: User interface
- **CodeMirror**: Code editor with C++ syntax highlighting
- **Bootstrap**: UI styling
- **Socket.IO Client**: Real-time updates

### Cloud Infrastructure
- **Google Cloud Run**: Serverless container hosting
- **Google Container Registry**: Docker image storage
- **Google Cloud Build**: CI/CD pipeline

## 🔧 Local Development

### Prerequisites
- Node.js 18+
- Docker
- G++ compiler (for code execution)

### Setup
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install

# Run with Docker Compose
cd ..
docker-compose up --build
```

### Manual Setup
```bash
# Terminal 1: Run server
cd server
npm start

# Terminal 2: Run client
cd client
npm start
```

## 🔒 Security Features

- **Containerized Execution**: C++ code runs in isolated Docker containers
- **Resource Limits**: Memory (1GB) and CPU constraints
- **Timeout Protection**: 5-second execution limit
- **Non-root Execution**: Code runs with limited user privileges
- **Input Sanitization**: Secure handling of user code
- **No Network Access**: Executed code cannot access external networks

## 💰 Cost Estimation (GCP)

- **Cloud Run**: ~$0.10-$5/month (scales to zero)
- **Container Registry**: ~$0.10/month for image storage
- **Cloud Build**: Free tier (120 build-minutes/day)

**Total estimated cost: $0.20-$5.10/month** for small to medium usage.

## 📊 Usage

1. 🌐 **Access your deployed URL** (from deployment output)
2. 🆔 **Enter a Room ID** or generate a new one
3. 👤 **Set your username**
4. 💻 **Write C++ code** in the editor
5. ▶️ **Click "Run Code"** to execute
6. 👥 **Share the room ID** with collaborators
7. 🎉 **Code together in real-time!**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with Docker
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

