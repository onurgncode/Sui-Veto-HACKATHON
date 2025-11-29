# Sui Veto Backend

Backend API for Sui Veto DAO Voting Platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Railway account (for deployment)
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
├── config/          # Configuration files (Sui, etc.)
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
│   ├── event-nft/
│   │   ├── event-nft.controller.ts
│   │   ├── event-nft.service.ts
│   │   ├── event-nft.routes.ts
│   │   └── event-nft.types.ts
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.routes.ts
│       └── auth.types.ts
├── services/        # Core services
│   ├── transactionBuilder.ts
│   ├── suiObjectFetcher.ts
│   └── authService.ts
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

## ✅ Yapıldı (Completed)

### Phase 1: Basic Infrastructure ✅
- [x] Node.js/TypeScript project setup
- [x] Package manager configuration (npm)
- [x] TypeScript configuration
- [x] ESLint + Prettier setup
- [x] Environment variables (.env)
- [x] Git repository setup
- [x] Winston logging
- [x] Error handling middleware
- [x] Rate limiting
- [x] CORS configuration
- [x] Helmet security headers
- [x] Compression middleware

### Phase 2: Sui SDK Integration ✅
- [x] `@mysten/sui.js` installation
- [x] Sui client configuration (testnet)
- [x] RPC provider setup
- [x] Package ID and contract address management
- [x] SuiObjectFetcher service
  - [x] Get object by ID
  - [x] Get owned objects (with pagination)
  - [x] Get dynamic fields
  - [x] Get profile by owner
  - [x] Get community by ID
  - [x] Get proposal by ID
  - [x] Get all communities (from package)
  - [x] Get communities by member

### Phase 3: API Framework Setup ✅
- [x] Express.js framework
- [x] REST API structure
- [x] Middleware (CORS, body parser, error handling)
- [x] Request validation (Zod)
- [x] Logging (Winston)
- [x] Modular route structure
- [x] Health check endpoint

### Phase 4: Core Services ✅

**Profile Services:**
- [x] `POST /api/profile/create` - Create profile transaction
- [x] `GET /api/profile/:address` - Get profile
- [x] `GET /api/profile/:address/stats/:commityId` - Get member stats
- [x] Profile service implementation
- [x] Profile controller
- [x] Profile routes

**Community Services:**
- [x] `GET /api/community` - Get all communities
- [x] `GET /api/community/member/:address` - Get communities by member
- [x] `POST /api/community` - Create community transaction
- [x] `GET /api/community/:id` - Get community
- [x] `GET /api/community/:id/members` - Get members
- [x] `POST /api/community/:id/join` - Join community transaction
- [x] Community service implementation
- [x] Community controller
- [x] Community routes

**Proposal Services:**
- [x] `POST /api/proposal/create` - Create proposal transaction
- [x] `GET /api/proposal/:id` - Get proposal
- [x] `GET /api/proposal/community/:commityId` - Get proposals by community
- [x] `POST /api/proposal/:id/vote` - Cast vote transaction
- [x] `POST /api/proposal/:id/finalize` - Finalize proposal transaction
- [x] `GET /api/proposal/:id/votes` - Get votes

**Event NFT Services:**
- [x] `GET /api/event-nft/:id` - Get event NFT
- [x] `GET /api/event-nft/owner/:owner` - Get event NFTs by owner
- [x] `GET /api/event-nft/community/:commityId` - Get event NFTs by community
- [x] `POST /api/event-nft/mint` - Mint event NFT transaction
- [x] Event NFT service implementation
- [x] Event NFT controller
- [x] Event NFT routes

**Transaction Services:**
- [x] Transaction builder helper (`TransactionBuilderService`)
- [x] Profile creation transaction builder
- [x] Community creation transaction builder
- [x] Join community transaction builder
- [x] Proposal creation transaction builder
- [x] Vote casting transaction builder
- [x] Proposal finalization transaction builder
- [x] Proposal status update transaction builder
- [x] Event NFT mint transaction builder

### Phase 5: Surflux Integration ✅
- [x] Surflux API key setup (config)
- [x] Surflux SDK/Client installation
- [x] Package Events subscription
- [x] Address Events monitoring
- [x] Event parser and handlers
- [x] Event deduplication

**Real-time Notification System:**
- [x] `GET /api/notification/:address` - Get notifications
- [x] `GET /api/notification/:address/unread-count` - Get unread count
- [x] `POST /api/notification/:address/:notificationId/read` - Mark as read
- [x] `POST /api/notification/:address/read-all` - Mark all as read
- [x] Proposal created notifications
- [x] Vote casted notifications
- [x] Proposal status change notifications

### Phase 6: Walrus Integration ✅
- [x] Walrus SDK/Client integration
- [x] `POST /api/storage/upload` - Upload content
- [x] `GET /api/storage/:blobId` - Get content
- [x] `GET /api/storage/:blobId/verify` - Verify blob
- [x] `GET /api/storage/:blobId/info` - Get blob info
- [x] `DELETE /api/storage/:blobId` - Delete content

### Phase 8: Authentication & Security ✅
- [x] Sui wallet signature verification (`verifyPersonalMessage`)
- [x] JWT token generation (`AuthService`)
- [x] Nonce-based authentication (`generateNonce`)
- [x] Nonce caching (20 minutes)
- [x] Rate limiting (express-rate-limit)
- [x] `POST /api/auth/nonce` - Generate nonce
- [x] `POST /api/auth/authenticate` - Authenticate with signature
- [x] JWT middleware (`verifyJWT`)
- [x] ZkLogin detection and error handling
- [x] Signature format handling (hex, base64, SerializedSignature)

### Phase 9: Testing ✅
- [x] Unit tests (Jest)
  - [x] TransactionBuilder tests
  - [x] AuthService tests
  - [x] ProfileService tests (with mocks)
- [x] Integration tests
  - [x] API endpoint tests (supertest)
  - [x] Profile integration tests (real Sui address)
  - [x] Community integration tests
  - [x] SuiObjectFetcher tests (real blockchain calls)

## ⏳ Yapılacak (To Do)

### Phase 4: Core Services (Devam)
- [x] Event NFT module implementation
- [ ] Transaction status tracking
- [ ] Transaction history endpoint
- [ ] Gas estimation helper

### Phase 5: Surflux Integration (Devam)
- [x] Surflux client structure (placeholder implementation)
- [ ] Real-time WebSocket connection for Flux Streams
- [ ] Historical event fetching API integration
- [ ] Real-time updates via Surflux Flux Streams (Frontend integration)
- [ ] Proposal deadline reminders (Background job)
- [ ] Event replay mechanism

### Phase 6: Walrus Integration (Devam)
- [x] Walrus client structure (placeholder implementation)
- [ ] Walrus API integration (blob upload, read, verify, delete)
- [ ] Proposal description/metadata storage (Integrate with proposal service)
- [ ] NFT metadata storage (Integrate with NFT service)
- [ ] `POST /api/sites/deploy` - Deploy site (Walrus Sites integration)
- [ ] `GET /api/sites/:siteId` - Get site info
- [ ] `POST /api/sites/:siteId/update` - Update site
- [ ] Frontend build process
- [ ] SuiNS name configuration
- [ ] CI/CD integration

### Phase 7: Caching & Background Jobs
- [ ] Cache strategy implementation
- [ ] Profile cache
- [ ] Community cache
- [ ] Proposal cache
- [ ] Vote cache
- [ ] Background job queue setup
- [ ] Proposal expiration checker job
- [ ] Cache refresh jobs
- [ ] Notification delivery jobs



### Phase 9: Testing & Deployment (Devam)
- [ ] E2E tests
- [ ] Contract interaction tests
- [ ] Surflux event handling tests
- [ ] Walrus storage tests
- [ ] Railway deployment configuration
- [ ] Environment configurations
- [ ] Monitoring setup
- [ ] Performance testing
- [ ] Load testing

### Phase 10: Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Code documentation
- [ ] Deployment guide
- [ ] Troubleshooting guide

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

### Health Check

```
GET /health
```

Returns server health status.

### Authentication

```
POST /api/auth/nonce
Body: { address: string }
Response: { success: true, data: { nonce: string, message: string } }

POST /api/auth/authenticate
Body: { address: string, signature: string, message: string }
Response: { success: true, data: { token: string } }
```

### Profile

```
GET /api/profile/:address
Response: { success: true, data: { profile: { id, nickname, owner } } }

GET /api/profile/:address/stats/:commityId
Response: { success: true, data: { stats: { xp, level } } }
```

### Community

```
GET /api/community
Response: { success: true, data: { communities: Community[], total: number } }

GET /api/community/member/:address
Response: { success: true, data: { communities: Community[], total: number } }

GET /api/community/:id
Response: { success: true, data: { community: Community, memberCount: number } }

GET /api/community/:id/members
Response: { success: true, data: { members: CommunityMember[], total: number } }

POST /api/community
Body: { name: string }
Response: { success: true, data: { transaction: { transactionBlock: string } } }

POST /api/community/:id/join
Body: { profileId: string }
Response: { success: true, data: { transaction: { transactionBlock: string } } }
```

### Event NFT

```
GET /api/event-nft/:id
Response: { success: true, data: { nft: { id, commityId, xp, owner } } }

GET /api/event-nft/owner/:owner
Response: { success: true, data: { nfts: EventNFT[], total: number } }

GET /api/event-nft/community/:commityId
Response: { success: true, data: { nfts: EventNFT[], total: number } }

POST /api/event-nft/mint
Body: { commityId: string, xp: number, recipient: string }
Response: { success: true, data: { transaction: { transactionBlock: string } } }
```

### Proposal

```
POST /api/proposal/create
Body: { commityId, messageId, title, description, deadline, quorumThreshold }
Response: { success: true, data: { transaction: { transactionBlock: string } } }

GET /api/proposal/:id
Response: { success: true, data: { proposal: Proposal } }

GET /api/proposal/community/:commityId
Response: { success: true, data: { proposals: Proposal[] } }

POST /api/proposal/:id/vote
Body: { profileId, commityId, voteType }
Response: { success: true, data: { transaction: { transactionBlock: string } } }

POST /api/proposal/:id/finalize
Response: { success: true, data: { transaction: { transactionBlock: string } } }

GET /api/proposal/:id/votes
Response: { success: true, data: { votes: Vote[] } }
```

### Storage

```
POST /api/storage/upload
Body: { data: string (base64), epochs?: number }
Response: { success: true, data: { blobId: string, suiObjectId: string } }

GET /api/storage/:blobId
Response: { success: true, data: { content: string (base64) } }

GET /api/storage/:blobId/verify
Response: { success: true, data: { verified: boolean } }

GET /api/storage/:blobId/info
Response: { success: true, data: { info: BlobInfo } }

DELETE /api/storage/:blobId
Response: { success: true, data: { deleted: boolean } }
```

### Notification

```
GET /api/notification/:address
Response: { success: true, data: { notifications: Notification[] } }

GET /api/notification/:address/unread-count
Response: { success: true, data: { count: number } }

POST /api/notification/:address/:notificationId/read
Response: { success: true, data: { read: boolean } }

POST /api/notification/:address/read-all
Response: { success: true, data: { read: number } }
```

## 🔐 Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Zod
- Environment variable protection
- JWT token authentication
- Sui wallet signature verification
- Nonce-based authentication

## 📝 License

MIT
