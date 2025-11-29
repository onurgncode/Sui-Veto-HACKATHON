# Sui Veto Frontend

Frontend application for Sui Veto DAO Voting Platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- Sui wallet (Sui Wallet, Suiet, etc.)

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

# Preview production build
npm run preview
```

### Environment Variables

See `.env.example` for all required environment variables.

## 📁 Project Structure

```
src/
├── components/      # Reusable components
│   ├── GridScan.tsx
│   └── Galaxy.tsx
├── config/          # Configuration files
│   └── api.ts
├── screens/         # Screen components
│   ├── LoginScreen.tsx
│   ├── NicknameScreen.tsx
│   ├── ExplorerScreen.tsx
│   ├── MyCommunityScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── CreateCommunityScreen.tsx
│   ├── CommunityDetailScreen.tsx
│   ├── ProposalListScreen.tsx
│   ├── ProposalDetailScreen.tsx
│   └── CreateProposalScreen.tsx
├── services/        # API services
│   ├── authService.ts
│   ├── profileService.ts
│   ├── communityService.ts
│   └── proposalService.ts
├── styles/          # Global styles
│   └── liquid-glass.css
├── utils/           # Utility functions
│   └── formatters.ts
└── App.tsx          # Main application component
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## ✅ Yapıldı (Completed)

### Phase 1: Project Setup ✅
- [x] React + TypeScript project setup
- [x] Vite build tool
- [x] TypeScript configuration
- [x] ESLint + Prettier setup
- [x] Environment variables (.env)
- [x] Sui wallet adapter integration (`@mysten/dapp-kit`)
- [x] Radix UI components
- [x] Project structure

### Phase 2: Core Components ✅

**Authentication:**
- [x] Wallet connection component
- [x] Login screen with Galaxy background
- [x] Custom sign modal
- [x] Signature verification flow
- [x] Nonce caching (20 minutes)
- [x] Auto-login on wallet connection
- [x] Profile existence check
- [x] ZkLogin detection and error handling
- [x] Signature format handling

**Profile:**
- [x] Profile creation form (NicknameScreen)
- [x] Profile display component
- [x] On-chain profile fetching
- [x] Profile existence check with retry mechanism
- [x] Profile navigation logic

**Community:**
- [x] Community list page (ExplorerScreen)
- [x] Community creation form (CreateCommunityScreen)
- [x] My Community screen (MyCommunityScreen)
  - [x] List of communities user is a member of
  - [x] Community cards with click handlers
- [x] Community detail page (CommunityDetailScreen)
  - [x] Community information display
  - [x] Member list
  - [x] Channel placeholder
  - [x] Voting button placeholder
- [x] Join community functionality
- [x] All communities fetching from package

**UI/UX:**
- [x] Modern dark-veil design
- [x] GridScan background component
- [x] Apple-style design system
- [x] Liquid glass effects
- [x] Smooth transitions
- [x] Responsive design
- [x] Header with wallet panel
- [x] Navigation tabs (Explorer, My Community, Profile)
- [x] Overlay system for modals
- [x] Custom wallet connection modal

**Services:**
- [x] API client setup
- [x] Authentication service
- [x] Profile service
- [x] Community service
- [x] Proposal service
- [x] Error handling
- [x] Request/response interceptors

**Utilities:**
- [x] Address formatter
- [x] Timestamp formatter

## ⏳ Yapılacak (To Do)

### Phase 2: Core Components (Devam)

**Proposal:**
- [x] Proposal list page (ProposalListScreen)
- [x] Proposal creation form (CreateProposalScreen)
- [x] Proposal detail page (ProposalDetailScreen)
- [x] Vote casting component (integrated in ProposalDetailScreen)
- [x] Vote results display (integrated in ProposalDetailScreen)
- [x] Proposal status indicator (badge system)
- [ ] Proposal filtering and search

**Profile:**
- [ ] XP and level display (per community)
- [ ] Member stats per community
- [ ] NFT redemption interface
- [ ] Activity history

**Community:**
- [ ] Community settings
- [ ] Member management
- [ ] Community statistics
- [ ] Leave community functionality

### Phase 3: Real-time Features
- [ ] Surflux Flux Streams client setup (WebSocket)
- [ ] Notification component
- [ ] Real-time vote updates (via Surflux events)
- [ ] Proposal status updates (via Surflux events)
- [ ] Notification center
- [ ] Polling fallback for notifications API

### Phase 4: Walrus Integration
- [ ] Content upload interface
- [ ] Image/document upload
- [ ] Content display
- [ ] Site deployment interface
- [ ] SuiNS name configuration

### Phase 5: Advanced Features
- [ ] Proposal filtering and search
- [ ] Analytics dashboard
- [ ] User activity tracking
- [ ] Voting history
- [ ] Community statistics
- [ ] Dark mode toggle (already dark, but can add light mode)
- [ ] Accessibility improvements
- [ ] Keyboard shortcuts
- [ ] PWA support

### Phase 6: Testing & Deployment
- [ ] Unit tests
- [ ] Component tests
- [ ] E2E tests
- [ ] Walrus site deployment
- [ ] SuiNS configuration
- [ ] CI/CD setup
- [ ] Performance optimization
- [ ] Bundle size optimization

### Phase 7: Message System
- [ ] Sui Stack Messaging SDK integration
- [ ] Message channel display
- [ ] Message sending interface
- [ ] Message history
- [ ] Real-time message updates

### Phase 8: Voting System
- [x] Vote casting UI (integrated in ProposalDetailScreen)
- [x] Vote weight display (shown in vote list)
- [x] Vote history (displayed in ProposalDetailScreen)
- [ ] Proposal creation from messages
- [x] Proposal voting interface (ProposalDetailScreen)
- [x] Vote results visualization (ProposalDetailScreen with charts)

## 🎨 Design System

### Colors
- Background: `#000000` (Black)
- Primary: `rgba(255, 255, 255, 0.95)` (White with opacity)
- Accent: `rgba(139, 92, 246, 0.9)` to `rgba(236, 72, 153, 0.9)` (Purple to Pink gradient)
- Grid Lines: `#392e4e`
- Scan Color: `#FF9FFC`

### Typography
- Font Family: `-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif`
- Monospace: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace`

### Components
- Liquid glass cards with blur effects
- Apple-style buttons and inputs
- Smooth transitions (`cubic-bezier(0.4, 0, 0.2, 1)`)
- GridScan background for modern look

## 📚 Key Features

### Authentication Flow
1. User connects wallet
2. System checks for existing profile
3. If profile exists, navigate to Explorer
4. If no profile, show NicknameScreen
5. After nickname creation, navigate to Explorer
6. Nonce is cached for 20 minutes

### Community Flow
1. Explorer shows all communities
2. User can create new community
3. My Community shows user's joined communities
4. Clicking a community opens CommunityDetailScreen
5. Community detail shows members and channel

### Navigation
- Explorer: Main screen with all communities
- My Community: User's joined communities
- Profile: User profile and stats
- All screens open as overlays on Explorer

## 🚢 Deployment

### Walrus Sites

1. Build the project: `npm run build`
2. Deploy to Walrus Sites
3. Configure SuiNS name (optional)

### Environment Variables

```
VITE_SUI_NETWORK=testnet
VITE_PACKAGE_ID=0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45
VITE_API_URL=http://localhost:3000
```

## 📝 License

MIT

