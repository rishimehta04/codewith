# Use Node.js LTS version with Ubuntu base for C++ support
FROM node:18-bullseye

# Install C++ compiler and essential tools
RUN apt-get update && apt-get install -y \
    g++ \
    gcc \
    make \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create temp directory for code execution
RUN mkdir -p /usr/src/app/temp && chmod 755 /usr/src/app/temp

# Create non-root user for security
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser
RUN chown -R nodeuser:nodeuser /usr/src/app

# Expose port
EXPOSE 3001

# Switch to non-root user
USER nodeuser

# Start the application
CMD ["node", "index.js"]
