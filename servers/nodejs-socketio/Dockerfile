FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY *.js ./

# Expose WebSocket port
EXPOSE 8080

# Default command
CMD ["npm", "start"]

