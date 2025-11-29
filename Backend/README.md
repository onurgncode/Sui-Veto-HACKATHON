# Sui Veto Backend

Backend API for Sui Veto DAO Voting Platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Railway account (for deployment)
- Upstash Redis account (free tier)
- Surflux API key
- Walrus API credentials

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Environment Variables

See `.env.example` for all required environment variables.

## 📁 Project Structure

```
src/
├── config/          # Configuration files (Sui, Redis, etc.)
├── middleware/      # Express middleware
├── modules/         # Feature modules (modular structure)
│   ├── profile/
│   │   ├── profile.controller.ts
│   │   ├── profile.service.ts
│   │   ├── profile.routes.ts
│   │   └── profile.types.ts
│   ├── community/
│   │   ├── community.controller.ts
│   │   ├── community.service.ts
│   │   ├── community.routes.ts
│   │   └── community.types.ts
│   ├── proposal/
│   │   ├── proposal.controller.ts
│   │   ├── proposal.service.ts
│   │   ├── proposal.routes.ts
│   │   └── proposal.types.ts
│   └── ...          # Other modules (voting, event-nft, notification)
├── routes/          # Main route aggregator
├── types/           # Shared TypeScript types
├── utils/           # Utility functions
└── index.ts         # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

## 🚢 Deployment

### Railway

1. Connect your GitHub repository to Railway
2. Create a new project
3. Add environment variables in Railway dashboard
4. Deploy automatically on push to main branch

### Manual Docker Deployment

```bash
# Build Docker image
docker build -t sui-veto-backend .

# Run container
docker run -p 3000:3000 --env-file .env sui-veto-backend
```

## 📚 API Documentation

API endpoints will be documented here as they are implemented.

### Health Check

```
GET /health
```

Returns server health status.

## 🔐 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Zod
- Environment variable protection

## 📝 License

MIT

