FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
# Use --legacy-peer-deps if needed
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build TypeScript (requires devDependencies like typescript, tsx)
RUN npm run build

# Remove devDependencies to reduce image size (after build)
RUN npm prune --production

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]

