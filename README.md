# Sui Veto - DAO Voting Platform

Decentralized DAO voting platform built on Sui blockchain with level-based vote weighting, real-time notifications, and decentralized storage.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Contract Structure](#contract-structure)
- [Backend Structure](#backend-structure)
- [Frontend Structure](#frontend-structure)
- [Deployment](#deployment)
- [Getting Started](#getting-started)

---

## 🎯 Project Overview

Sui Veto is a DAO (Decentralized Autonomous Organization) platform that enables:
- Community creation and management
- User profiles with XP and leveling system
- Proposal creation and voting
- Level-based vote weighting
- Real-time notifications via Surflux
- Decentralized storage via Walrus

**Package ID (Testnet):** `0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45`

---

## 📦 Contract Structure

**Package ID (Testnet):** `0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45`

### ✅ Yapıldı (Completed)

#### Core Modules

- **`dao_app.move`** - Main module coordinating all sub-modules
  - ✅ Module initialization
  - ✅ Community creation
  - ✅ Profile creation
  - ✅ Join community functionality
  - ✅ NFT minting and redemption
  - ✅ Proposal creation
  - ✅ Vote casting with level-based weight
  - ✅ Proposal finalization
  - ✅ Proposal status updates

- **`commity.move`** - Community management
  - ✅ Community struct with dynamic fields
  - ✅ Create community
  - ✅ Add/remove members
  - ✅ Check membership
  - ✅ Dynamic field storage for members

- **`profile.move`** - User profile management
  - ✅ Profile struct with owner
  - ✅ Create profile
  - ✅ Member stats initialization
  - ✅ Get member stats per community
  - ✅ Dynamic field storage for stats

- **`member_stats.move`** - XP and leveling system
  - ✅ MemberStats struct (XP, level)
  - ✅ XP addition
  - ✅ Automatic level calculation (level = xp / 100 + 1)

- **`event_nft.move`** - Event NFT system
  - ✅ EventNFT struct
  - ✅ Mint NFT with XP value
  - ✅ Transfer NFT
  - ✅ Redeem NFT for XP
  - ✅ NFT destruction

- **`proposal.move`** - Proposal management
  - ✅ Proposal struct with voting data
  - ✅ Create proposal
  - ✅ Cast vote (with vote weight)
  - ✅ Update vote (change vote)
  - ✅ Finalize proposal
  - ✅ Check expiration
  - ✅ Status management (ACTIVE, PASSED, FAILED, EXPIRED)

- **`voting.move`** - Voting system
  - ✅ Vote struct
  - ✅ Vote weight calculation based on level
    - Level 1: 1x weight
    - Level 2-5: 1.5x weight
    - Level 6-10: 2x weight
    - Level 11+: 3x weight
  - ✅ Vote storage in dynamic fields
  - ✅ Vote retrieval and removal

- **`message_bridge.move`** - Message SDK integration (placeholder)
  - ✅ Placeholder functions for Sui Stack Messaging SDK
  - ✅ Message parsing functions

#### Contract Features

- ✅ Dynamic fields for membership and stats
- ✅ Level-based vote weighting
- ✅ Proposal deadline management
- ✅ Quorum threshold support
- ✅ Vote change support
- ✅ Clean code (no unnecessary comments)
- ✅ Published to Sui Testnet

### ⏳ Yapılacak (To Do)

- [ ] Sui Stack Messaging SDK full integration
- [ ] Advanced proposal features (categories, tags)
- [ ] Vote delegation system
- [ ] Multi-option voting
- [ ] Time-based vote weighting
- [ ] Proposal templates
- [ ] Governance token integration
- [ ] Event emission optimization

---

## 🔧 Backend Structure

### ✅ Yapıldı (Completed)

- [x] Project structure planning
- [x] Technology stack selection
- [x] Deployment platform selection (Railway)
- [x] Phase 1: Basic Infrastructure (✅ Tamamlandı)
- [x] Phase 2: Sui SDK Integration (✅ Tamamlandı)
- [x] Phase 3: API Framework Setup (✅ Tamamlandı)
- [x] Phase 4: Core Services - Transaction Builders (✅ Tamamlandı)
- [x] Phase 5: Surflux Integration - Event Processing & Notifications (✅ Tamamlandı)
- [x] Phase 6: Walrus Integration - Storage & Site Deployment (✅ Tamamlandı)
- [x] Phase 8: Authentication & Security (✅ Tamamlandı)

### ⏳ Yapılacak (To Do)

#### Phase 1: Basic Infrastructure (1-2 weeks) ✅ TAMAMLANDI

- [x] Node.js/TypeScript project setup
- [x] Package manager configuration (npm/yarn/pnpm)
- [x] TypeScript configuration
- [x] ESLint + Prettier setup
- [x] Environment variables (.env)
- [x] Git repository setup

#### Phase 2: Sui SDK Integration (1 week) ✅ TAMAMLANDI

- [x] `@mysten/sui.js` installation
- [x] Sui client configuration (testnet)
- [x] RPC provider setup
- [x] Package ID and contract address management

#### Phase 3: API Framework Setup (1 week) ✅ TAMAMLANDI

- [x] Framework selection (Express)
- [x] REST API structure
- [x] Middleware (CORS, body parser, error handling)
- [x] Request validation (Zod)
- [x] Logging (Winston)

#### Phase 4: Core Services (2-3 weeks)

**Profile Services:**
- [x] `POST /api/profile/create` - Create profile
- [x] `GET /api/profile/:address` - Get profile
- [x] `GET /api/profile/:address/stats/:commityId` - Get member stats

**Community Services:**
- [x] `POST /api/community/create` - Create community
- [x] `GET /api/community/:id` - Get community
- [x] `GET /api/community/:id/members` - Get members
- [x] `POST /api/community/:id/join` - Join community

**Proposal Services:**
- [x] `POST /api/proposal/create` - Create proposal
- [x] `GET /api/proposal/:id` - Get proposal
- [x] `GET /api/proposal/community/:commityId` - Get proposals by community
- [x] `POST /api/proposal/:id/vote` - Cast vote
- [x] `POST /api/proposal/:id/finalize` - Finalize proposal
- [x] `GET /api/proposal/:id/votes` - Get votes

**Transaction Services:**
- [x] Transaction builder helper (`TransactionBuilderService`)
- [x] Profile creation transaction builder
- [x] Community creation transaction builder
- [x] Join community transaction builder
- [x] Proposal creation transaction builder
- [x] Vote casting transaction builder
- [x] Proposal finalization transaction builder
- [x] Proposal status update transaction builder
- [ ] Transaction signer (ed25519) - Frontend'de yapılacak
- [ ] Gas estimation - Frontend'de yapılacak
- [ ] Transaction submission - Frontend'de yapılacak
- [ ] Transaction status tracking

#### Phase 5: Surflux Integration (2 weeks) ✅ TAMAMLANDI

- [x] Surflux API key setup (config)
- [x] Surflux SDK/Client installation (`SurfluxClient`)
- [x] Package Events subscription (ProposalCreated, VoteCasted, ProposalFinalized)
- [x] Address Events monitoring
- [x] Event parser and handlers (`EventProcessor`)
- [x] Event deduplication

**Real-time Notification System:**
- [x] `GET /api/notification/:address` - Get notifications
- [x] `GET /api/notification/:address/unread-count` - Get unread count
- [x] `POST /api/notification/:address/:notificationId/read` - Mark as read
- [x] `POST /api/notification/:address/read-all` - Mark all as read
- [x] Proposal created notifications
- [x] Vote casted notifications
- [x] Proposal status change notifications
- [ ] Real-time updates via Surflux Flux Streams (TODO: Frontend integration)
- [ ] Proposal deadline reminders (TODO: Background job)

#### Phase 6: Walrus Integration (2-3 weeks) ✅ TAMAMLANDI

**Content Storage:**
- [x] Walrus SDK/Client integration (`WalrusClient`)
- [x] `POST /api/storage/upload` - Upload content
- [x] `GET /api/storage/:blobId` - Get content
- [x] `GET /api/storage/:blobId/verify` - Verify blob
- [x] `GET /api/storage/:blobId/info` - Get blob info
- [x] `DELETE /api/storage/:blobId` - Delete content
- [ ] Proposal description/metadata storage (TODO: Integrate with proposal service)
- [ ] NFT metadata storage (TODO: Integrate with NFT service)

**Site Deployment:**
- [ ] `POST /api/sites/deploy` - Deploy site (TODO: Walrus Sites integration)
- [ ] `GET /api/sites/:siteId` - Get site info
- [ ] `POST /api/sites/:siteId/update` - Update site
- [ ] Frontend build process
- [ ] SuiNS name configuration
- [ ] CI/CD integration

#### Phase 7: Caching & Background Jobs (1-2 weeks)

- [ ] Upstash Redis setup (free tier)
- [ ] Cache strategy implementation
- [ ] Profile cache
- [ ] Community cache
- [ ] Proposal cache
- [ ] Vote cache
- [ ] BullMQ job queue setup
- [ ] Proposal expiration checker job
- [ ] Cache refresh jobs
- [ ] Notification delivery jobs

#### Phase 8: Authentication & Security (1-2 weeks) ✅ TAMAMLANDI

- [x] Sui wallet signature verification (`verifyPersonalMessage`)
- [x] JWT token generation (`AuthService`)
- [x] Nonce-based authentication (`generateNonce`)
- [x] Rate limiting (express-rate-limit - Phase 1'de eklendi)
- [x] `POST /api/auth/nonce` - Generate nonce
- [x] `POST /api/auth/authenticate` - Authenticate with signature
- [x] JWT middleware (`verifyJWT`)
- [ ] Session management (TODO: Optional enhancement)
- [ ] Input sanitization (TODO: Zod validation enhancement)
- [ ] API key management (TODO: For external integrations)

#### Phase 9: Testing & Deployment (1-2 weeks) 🚧 DEVAM EDİYOR

- [x] Unit tests (Jest)
  - [x] TransactionBuilder tests
  - [x] AuthService tests
  - [x] ProfileService tests (with mocks)
- [x] Integration tests
  - [x] API endpoint tests (supertest)
  - [x] Profile integration tests (real Sui address)
  - [x] Community integration tests
  - [x] SuiObjectFetcher tests (real blockchain calls)
- [ ] E2E tests
- [ ] Contract interaction tests
- [ ] Surflux event handling tests
- [ ] Walrus storage tests
- [ ] Railway deployment configuration
- [ ] Environment configurations
- [ ] Monitoring setup

---

## 🎨 Frontend Structure

### ✅ Yapıldı (Completed)

- [x] Project structure planning

### ⏳ Yapılacak (To Do)

#### Phase 1: Project Setup (1 week)

- [ ] Framework selection (React/Next.js/Vue)
- [ ] Project initialization
- [ ] TypeScript configuration
- [ ] UI library setup (Tailwind CSS/Material-UI)
- [ ] Sui wallet adapter integration
- [ ] Environment configuration

#### Phase 2: Core Components (2-3 weeks)

**Authentication:**
- [ ] Wallet connection component
- [ ] Profile creation form
- [ ] Profile display component

**Community:**
- [ ] Community list page
- [ ] Community creation form
- [ ] Community detail page
- [ ] Join community button
- [ ] Member list component

**Proposal:**
- [ ] Proposal list page
- [ ] Proposal creation form
- [ ] Proposal detail page
- [ ] Vote casting component
- [ ] Vote results display
- [ ] Proposal status indicator

**Profile:**
- [ ] Profile page
- [ ] XP and level display
- [ ] Member stats per community
- [ ] NFT redemption interface

#### Phase 3: Real-time Features (1-2 weeks)

- [ ] Surflux Flux Streams client setup (WebSocket)
- [ ] Notification component
- [ ] Real-time vote updates (via Surflux events)
- [ ] Proposal status updates (via Surflux events)
- [ ] Notification center
- [ ] Polling fallback for notifications API

#### Phase 4: Walrus Integration (1-2 weeks)

- [ ] Content upload interface
- [ ] Image/document upload
- [ ] Content display
- [ ] Site deployment interface
- [ ] SuiNS name configuration

#### Phase 5: Advanced Features (2-3 weeks)

- [ ] Proposal filtering and search
- [ ] Analytics dashboard
- [ ] User activity tracking
- [ ] Voting history
- [ ] Community statistics
- [ ] Responsive design
- [ ] Dark mode support

#### Phase 6: Testing & Deployment (1-2 weeks)

- [ ] Unit tests
- [ ] Component tests
- [ ] E2E tests
- [ ] Walrus site deployment
- [ ] SuiNS configuration
- [ ] CI/CD setup

---

## 🚀 Deployment

### Infrastructure

**Backend:**
- **Platform:** Railway (Free Tier)
- **Database:** Upstash Redis (Free Tier)
- **Event Streaming:** Surflux Flux Streams
- **Storage:** Walrus

**Frontend:**
- **Platform:** Walrus Sites
- **Domain:** SuiNS (optional)

### Environment Variables

**Backend (.env):**
# Sui
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
PACKAGE_ID=0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45

# Surflux
SURFLUX_API_KEY=your_api_key
SURFLUX_API_URL=https://api.surflux.dev

# Redis (Upstash)
UPSTASH_REDIS_URL=your_redis_url
UPSTASH_REDIS_TOKEN=your_redis_token

# Walrus
WALRUS_API_URL=your_walrus_url
WALRUS_API_KEY=your_walrus_key

# Server
PORT=3000
NODE_ENV=production**Frontend (.env):**
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_WS_URL=wss://your-backend.railway.app---

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- Sui CLI
- Git
- Railway account
- Surflux account
- Upstash account (for Redis)

### Contract Setup

cd Contract
sui move build
sui client publish --gas-budget 100000000### Backend Setup

cd Backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev### Frontend Setup

cd Frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev---

## 📚 Resources

- [Sui Documentation](https://docs.sui.io/)
- [Surflux Documentation](https://surflux.dev/docs/)
- [Walrus Documentation](https://docs.wal.app/)
- [Railway Documentation](https://docs.railway.app/)
- [Upstash Redis](https://upstash.com/)

---

## 📝 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Last Updated:** 2025-01-XX