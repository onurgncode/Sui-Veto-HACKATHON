FROM node:18-alpine

WORKDIR /app

# Copy package files from Backend directory
COPY Backend/package*.json ./

# Install ALL dependencies (including devDependencies for TypeScript build)
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy Backend source code
COPY Backend/ .

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

