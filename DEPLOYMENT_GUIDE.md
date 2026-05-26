# SOL Stadium - Complete Deployment Guide

## Quick Start Overview

```
Frontend (React)
    ↓
Backend (Node.js/Express)
    ↓
Smart Contract (Solana)
    ↓
Database (PostgreSQL)
```

---

## Phase 1: Smart Contract Deployment

### 1.1 Set Up Anchor Environment

```bash
# Install Anchor (if not already installed)
curl -sSf https://sh.rustup.rs | sh
curl -sSf https://dl.solana.com/install | sh

# Install Anchor CLI
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Create new Anchor project
anchor init world_cup_betting
cd world_cup_betting
```

### 1.2 Configure Solana Network

```bash
# Use Devnet for testing (free SOL)
solana config set --url devnet

# Get free SOL for testing
solana airdrop 10

# Check balance
solana balance
```

### 1.3 Update Smart Contract

```bash
# Replace programs/world_cup_betting/src/lib.rs with the provided solana_contract.rs
cp solana_contract.rs programs/world_cup_betting/src/lib.rs
```

### 1.4 Build & Deploy

```bash
# Build the contract
anchor build

# Get your program ID from target/idl/
cat target/idl/world_cup_betting.json | jq '.metadata.address'

# Update declare_id! in lib.rs with your program ID
# declare_id!("YOUR_PROGRAM_ID_HERE");

# Rebuild
anchor build

# Deploy to Devnet
anchor deploy

# For Mainnet (when ready)
# solana config set --url mainnet-beta
# anchor deploy
```

---

## Phase 2: Backend Setup

### 2.1 Initialize Node Project

```bash
mkdir backend
cd backend
npm init -y

npm install express ws @solana/web3.js @solana/spl-token pg dotenv jsonwebtoken cors helmet
npm install --save-dev nodemon
```

### 2.2 Create Backend Structure

```
backend/
├── src/
│   ├── server.js           # Main Express app
│   ├── middleware/
│   │   ├── auth.js         # JWT authentication
│   │   └── validation.js   # Input validation
│   ├── routes/
│   │   ├── auth.js         # /api/auth routes
│   │   ├── matches.js      # /api/matches routes
│   │   └── users.js        # /api/users routes
│   ├── services/
│   │   ├── matchmaking.js  # Matchmaking logic
│   │   ├── payout.js       # Payout processing
│   │   └── solana.js       # Solana interactions
│   ├── db/
│   │   ├── pool.js         # Database connection
│   │   └── migrations/     # SQL migrations
│   └── config/
│       └── constants.js    # Configuration
├── .env                    # Environment variables
└── package.json
```

### 2.3 Create .env File

```env
# Server Config
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/world_cup_betting

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_NETWORK=devnet

# Smart Contract
SOLANA_PROGRAM_ID=YOUR_DEPLOYED_PROGRAM_ID_HERE

# Your Wallet
PLATFORM_WALLET_ADDRESS=5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU
PLATFORM_WALLET_SECRET_KEY=your_private_key_base58

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRY=7d

# CORS
FRONTEND_URL=http://localhost:3000
```

### 2.4 Create Main Server File

```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const WebSocket = require('ws');
const http = require('http');

const authRoutes = require('./routes/auth');
const matchRoutes = require('./routes/matches');
const userRoutes = require('./routes/users');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/users', userRoutes);

// WebSocket handling
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('message', (message) => {
    console.log('Received:', message);
    // Handle real-time events
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SOL Stadium backend running on port ${PORT}`);
});
```

### 2.5 Database Setup

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Create database
createdb world_cup_betting

# Run migrations
npm run migrate
```

### 2.6 Create Migration File

```sql
-- migrations/001_create_tables.sql

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(100) UNIQUE NOT NULL,
  balance DECIMAL(20, 8) DEFAULT 0,
  total_matches INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW()
);

CREATE TABLE matches (
  id VARCHAR(50) PRIMARY KEY,
  player1_address VARCHAR(100) NOT NULL,
  player2_address VARCHAR(100) NOT NULL,
  player1_team VARCHAR(50),
  player2_team VARCHAR(50),
  player1_score INT,
  player2_score INT,
  bet_amount DECIMAL(20, 8) NOT NULL,
  total_pot DECIMAL(20, 8) NOT NULL,
  winner VARCHAR(100),
  winner_payout DECIMAL(20, 8),
  platform_fee DECIMAL(20, 8),
  transaction_hash VARCHAR(88),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (player1_address) REFERENCES users(wallet_address),
  FOREIGN KEY (player2_address) REFERENCES users(wallet_address)
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(100) NOT NULL,
  to_wallet VARCHAR(100),
  amount DECIMAL(20, 8) NOT NULL,
  type VARCHAR(50),
  match_id VARCHAR(50),
  transaction_hash VARCHAR(88),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

### 2.7 Start Backend

```bash
npm run dev
# Server should run on http://localhost:3001
```

---

## Phase 3: Frontend Deployment

### 3.1 Create React App

```bash
npx create-react-app frontend
cd frontend

npm install react-router-dom axios lucide-react
```

### 3.2 Add Frontend Component

```bash
# Copy WorldCupBetting.jsx to src/components/
cp WorldCupBetting.jsx src/components/

# Update src/App.js
cat > src/App.js << 'EOF'
import React from 'react';
import WorldCupBetting from './components/WorldCupBetting';

function App() {
  return <WorldCupBetting />;
}

export default App;
EOF
```

### 3.3 Environment Variables

```bash
# Create .env
echo "REACT_APP_API_URL=http://localhost:3001" > .env
echo "REACT_APP_SOLANA_NETWORK=devnet" >> .env
```

### 3.4 Start Frontend

```bash
npm start
# Opens http://localhost:3000
```

---

## Phase 4: Integration Testing

### 4.1 Test Wallet Connection

```javascript
// Test in browser console
const phantomProvider = window.solana;
if (phantomProvider?.isPhantom) {
  console.log('Phantom detected');
  const response = await phantomProvider.connect();
  console.log('Connected:', response.publicKey.toString());
}
```

### 4.2 Test Match Creation

```bash
curl -X POST http://localhost:3001/api/matches/find-opponent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "betAmount": 0.5,
    "walletAddress": "7gfSt...3k9Uj"
  }'
```

### 4.3 Test Smart Contract

```javascript
// Test contract interaction
const { Connection, PublicKey } = require('@solana/web3.js');

const connection = new Connection('https://api.devnet.solana.com');
const programId = new PublicKey('YOUR_PROGRAM_ID');

// Fetch program account
const accounts = await connection.getProgramAccounts(programId);
console.log('Accounts:', accounts);
```

---

## Phase 5: Production Deployment

### 5.1 Smart Contract (Mainnet)

```bash
# Switch to mainnet
solana config set --url mainnet-beta

# Update in lib.rs: declare_id!("YOUR_MAINNET_PROGRAM_ID");
anchor build
anchor deploy

# Verify deployment
solana program show YOUR_MAINNET_PROGRAM_ID
```

### 5.2 Backend (AWS/DigitalOcean/Vercel)

```bash
# Example: Deploy to Railway or Heroku
# 1. Connect Git repo
# 2. Set environment variables
# 3. Deploy with: git push heroku main

# Or deploy to AWS EC2:
# 1. Create EC2 instance
# 2. Install Node.js and PostgreSQL
# 3. Clone repo and run: npm start
# 4. Use PM2 for process management
npm install -g pm2
pm2 start src/server.js
pm2 save
```

### 5.3 Frontend (Vercel/Netlify)

```bash
npm run build

# Deploy to Vercel
npm install -g vercel
vercel --prod

# Or GitHub Pages
npm run build
npm install gh-pages --save-dev
# Add to package.json: "homepage": "https://username.github.io/repo"
```

### 5.4 Domain & HTTPS

```
1. Register domain (Namecheap, GoDaddy)
2. Set DNS to point to your hosting
3. Enable HTTPS (automatic with Vercel/Netlify)
4. Update CORS in backend for production domain
```

---

## Security Checklist

- [ ] Never expose private keys in code
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/TLS on all endpoints
- [ ] Implement rate limiting on API routes
- [ ] Validate all user input server-side
- [ ] Use parameterized SQL queries (prevent injection)
- [ ] Implement JWT token expiry
- [ ] Add logging and monitoring
- [ ] Regular security audits
- [ ] Fund insurance (use Saber or Ironforge)

---

## Monitoring & Logging

### 4.1 Set Up Monitoring

```bash
npm install winston pino-pretty

# Log all transactions
logger.info({
  event: 'match_completed',
  matchId,
  winner,
  winnings,
  txHash
});
```

### 4.2 Track Blockchain Transactions

```javascript
const { Helius } = require('helius-sdk');
const helius = new Helius('YOUR_API_KEY');

const txs = await helius.getAllTransactions({
  address: 'YOUR_WALLET'
});
```

---

## Troubleshooting

### Smart Contract Won't Deploy

```bash
# Check Rust version
rustc --version

# Update
rustup update

# Check Anchor version
anchor --version

# Rebuild
anchor clean
anchor build
```

### Database Connection Error

```bash
# Check PostgreSQL is running
pg_isready

# Verify DATABASE_URL
psql $DATABASE_URL -c "SELECT 1"
```

### CORS Issues

```javascript
// Update backend CORS
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

### Solana RPC Rate Limits

```javascript
// Add backoff retry
const retryRpc = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
      }
    }
  }
};
```

---

## Next Steps

1. **Test on Devnet** - Run full flow with testnet SOL
2. **Audit Smart Contract** - Use Soteria or Halborn
3. **Load Testing** - Test with 100+ concurrent users
4. **Mainnet Beta** - Launch with low bet limits
5. **Legal Compliance** - Consult gambling attorney
6. **Insurance** - Consider protocol insurance (Ironforge)

---

## Support

- Anchor Docs: https://docs.rs/anchor-lang/latest/anchor_lang/
- Solana Docs: https://docs.solana.com
- Phantom API: https://docs.phantom.app
- Contact: Your email/support channel
