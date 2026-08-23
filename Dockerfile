# Use Node.js 22 LTS (supports native SQLite DatabaseSync)
FROM node:22-alpine

WORKDIR /app

# Copy root and backend package definitions
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --omit=dev

# Copy entire repository source code
WORKDIR /app
COPY . .

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Start unified server
CMD ["node", "backend/src/server.js"]
