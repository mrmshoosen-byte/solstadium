# SOL Stadium - Backend Architecture

## System Overview

```
┌─────────────────┐
│  React Frontend │
└────────┬────────┘
         │ WebSocket / REST
         ▼
┌─────────────────────────────────────────┐
│     Node.js Express Backend             │
│  - Matchmaking Service                  │
│  - Match Orchestration                  │
│  - Wallet Verification                  │
│  - Transaction Handling                 │
└────┬────────────────────────┬───────────┘
     │                        │
     ▼                        ▼
┌──────────────────┐  ┌──────────────────┐
│   PostgreSQL     │  │ Solana Blockchain│
│   (Match Data,   │  │ (SOL Transfers,  │
│    User Stats)   │  │  Smart Contract) │
└──────────────────┘  └──────────────────┘
```

## Technology Stack

```javascript
// Backend Dependencies
{
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.0",
    "@solana/web3.js": "^1.92.0",
    "@solana/spl-token": "^0.3.10",
    "pg": "^8.10.0",
    "dotenv": "^16.3.1",
    "jsonwebtoken": "^9.1.2",
    "bs58": "^5.0.0",
    "tweetnacl": "^1.0.3"
  }
}
```

## Core APIs

### 1. Authentication & Wallet Connection

```javascript
POST /api/auth/connect-wallet
Request:
{
  "walletAddress": "7gfSt...3k9Uj",
  "signedMessage": "base64_encoded_signature"
}

Response:
{
  "authToken": "jwt_token_here",
  "walletAddress": "7gfSt...3k9Uj",
  "balance": 2.5,
  "previousMatches": 45,
  "winRate": 0.58
}
```

### 2. Matchmaking

```javascript
POST /api/matches/find-opponent
Headers: { Authorization: "Bearer jwt_token" }
Request:
{
  "betAmount": 0.5,
  "walletAddress": "7gfSt...3k9Uj"
}

Response:
{
  "matchId": "match_abc123",
  "yourAddress": "7gfSt...3k9Uj",
  "opponentAddress": "opponent_wallet_xyz",
  "potAmount": 1.0,
  "status": "waiting_team_selection",
  "createdAt": "2024-05-26T10:30:00Z"
}

Matchmaking Logic:
- Queue all joining players
- Pair randomly (fair chance for all)
- Create escrow transaction
- Initialize match record in DB
- Emit WebSocket event to both players
```

### 3. Team Selection & Match Start

```javascript
POST /api/matches/:matchId/select-team
Headers: { Authorization: "Bearer jwt_token" }
Request:
{
  "teamName": "Argentina",
  "walletAddress": "7gfSt...3k9Uj"
}

Response:
{
  "matchId": "match_abc123",
  "yourTeam": "Argentina",
  "opponentTeam": "France",
  "status": "live",
  "matchStartedAt": "2024-05-26T10:31:00Z"
}

Team Selection Logic:
1. Lock both players' choices
2. Wait for opponent's selection (max 30 seconds)
3. Generate random final score
4. Determine winner
5. Initiate payout via smart contract
```

### 4. Match Results

```javascript
GET /api/matches/:matchId/result
Headers: { Authorization: "Bearer jwt_token" }

Response:
{
  "matchId": "match_abc123",
  "yourTeam": { "name": "Argentina", "score": 2 },
  "opponentTeam": { "name": "France", "score": 1 },
  "winner": "you",
  "potAmount": 1.0,
  "yourWinnings": 0.98,
  "platformFee": 0.02,
  "transactionHash": "5Z5jfVK9R8a3bQ2cX7yL4wN6pM8tK3hD9sF5gJ2lN",
  "status": "completed",
  "completedAt": "2024-05-26T10:32:15Z"
}
```

### 5. User Stats & History

```javascript
GET /api/users/:walletAddress/stats
Response:
{
  "walletAddress": "7gfSt...3k9Uj",
  "totalMatches": 45,
  "wins": 26,
  "losses": 17,
  "draws": 2,
  "winRate": 0.578,
  "totalVolumeSOL": 45.3,
  "totalWinningsSOL": 32.8,
  "favoriteTeam": "Argentina",
  "longestWinStreak": 7,
  "rank": 243
}
```

## Database Schema

```sql
-- Users Table
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

-- Matches Table
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
  winner VARCHAR(100), -- wallet address or 'draw'
  winner_payout DECIMAL(20, 8),
  platform_fee DECIMAL(20, 8),
  transaction_hash VARCHAR(88),
  status VARCHAR(50), -- 'pending', 'live', 'completed', 'failed'
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (player1_address) REFERENCES users(wallet_address),
  FOREIGN KEY (player2_address) REFERENCES users(wallet_address)
);

-- Transaction Log Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  from_wallet VARCHAR(100) NOT NULL,
  to_wallet VARCHAR(100),
  amount DECIMAL(20, 8) NOT NULL,
  type VARCHAR(50), -- 'bet', 'payout', 'fee'
  match_id VARCHAR(50),
  transaction_hash VARCHAR(88),
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (match_id) REFERENCES matches(id)
);
```

## Matchmaking Algorithm

```javascript
class MatchmakingService {
  constructor(db, solanaConnection) {
    this.waitingQueue = [];
    this.db = db;
    this.solana = solanaConnection;
  }

  async findOpponent(player) {
    // Add player to queue
    this.waitingQueue.push(player);

    // If we have 2+ players, pair them
    if (this.waitingQueue.length >= 2) {
      const player1 = this.waitingQueue.shift();
      const player2 = this.waitingQueue.shift();

      return await this.createMatch(player1, player2);
    }

    // Return matching status
    return {
      status: 'waiting',
      queuePosition: this.waitingQueue.indexOf(player),
      estimatedWait: Math.max(0, 30 - (this.waitingQueue.length * 5))
    };
  }

  async createMatch(player1, player2) {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create escrow account
    const escrowAccount = await this.createEscrow(
      player1.wallet,
      player2.wallet,
      player1.betAmount
    );

    // Save to DB
    await this.db.query(
      `INSERT INTO matches (id, player1_address, player2_address, bet_amount, total_pot, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [matchId, player1.wallet, player2.wallet, player1.betAmount, player1.betAmount * 2, 'pending']
    );

    return {
      matchId,
      player1: player1.wallet,
      player2: player2.wallet,
      potAmount: player1.betAmount * 2,
      escrowAccount
    };
  }

  async createEscrow(player1, player2, amount) {
    // Calls Solana smart contract to create escrow
    // Returns escrow account public key
  }
}
```

## Score Generation

```javascript
class MatchOrchestration {
  async generateMatch(team1, team2) {
    // Weighted random score generation
    const teamStrengths = {
      'Argentina': 0.92,
      'France': 0.90,
      'Brazil': 0.89,
      'Germany': 0.88,
      'Spain': 0.85,
      // ... other teams
    };

    const strength1 = teamStrengths[team1];
    const strength2 = teamStrengths[team2];

    // Score generation based on team strength
    const score1 = this.generateScore(strength1);
    const score2 = this.generateScore(strength2);

    return {
      [team1]: score1,
      [team2]: score2,
      winner: score1 > score2 ? team1 : score2 > score1 ? team2 : 'draw'
    };
  }

  generateScore(teamStrength) {
    // Poisson distribution for realistic scoring
    // Higher strength = more likely to score goals
    const lambda = teamStrength * 3; // Expected goals
    
    // Approximation of Poisson random variable
    let score = 0;
    let expMinusLambda = Math.exp(-lambda);
    let product = Math.random();
    
    while (product > expMinusLambda) {
      score++;
      product *= Math.random();
    }
    
    return Math.min(score, 5); // Cap at 5 goals for playability
  }
}
```

## Payout & Settlement Logic

```javascript
class PayoutService {
  async processWinnings(matchId, winner, amount) {
    try {
      // 1. Validate match and winner
      const match = await this.db.query(
        'SELECT * FROM matches WHERE id = $1',
        [matchId]
      );

      // 2. Calculate winnings (98% to winner, 2% platform fee)
      const platformFee = amount * 0.02;
      const winnerPayout = amount * 0.98;

      // 3. Call smart contract to distribute funds
      const txHash = await this.solanaContract.distributeFunds(
        winner,
        winnerPayout,
        process.env.PLATFORM_WALLET, // Your wallet: 5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU
        platformFee
      );

      // 4. Update database with transaction
      await this.db.query(
        `UPDATE matches SET 
          winner = $1, 
          winner_payout = $2, 
          platform_fee = $3,
          transaction_hash = $4,
          status = 'completed',
          completed_at = NOW()
        WHERE id = $5`,
        [winner, winnerPayout, platformFee, txHash, matchId]
      );

      // 5. Log transaction
      await this.logTransaction({
        fromWallet: 'escrow_account',
        toWallet: winner,
        amount: winnerPayout,
        type: 'payout',
        matchId,
        txHash
      });

      return { success: true, txHash, winnings: winnerPayout };
    } catch (error) {
      console.error('Payout failed:', error);
      // Refund both players if something goes wrong
      await this.refundMatch(matchId);
    }
  }

  async refundMatch(matchId) {
    // Return bet amounts to both players if match fails
  }
}
```

## WebSocket Events (Real-time Updates)

```javascript
// Client listens for:

// When opponent joins
socket.on('opponent_joined', (data) => {
  console.log('Opponent found:', data.opponentAddress);
});

// When opponent selects team
socket.on('opponent_selected_team', (data) => {
  console.log('Opponent picked:', data.teamName);
});

// Match starts - score generated
socket.on('match_started', (data) => {
  console.log('Final score:', data.scores);
  console.log('Winner:', data.winner);
});

// Transaction confirmed on blockchain
socket.on('payout_confirmed', (data) => {
  console.log('Winnings sent:', data.amount, 'SOL');
  console.log('TX:', data.txHash);
});

// Broadcast to all clients
socket.broadcast.emit('match_completed', {
  matchId,
  teams: [team1, team2],
  winner,
  pot: totalPot
});
```

## Error Handling & Edge Cases

```javascript
// Timeout handling - one player doesn't select team
const TEAM_SELECTION_TIMEOUT = 30000; // 30 seconds

async function monitorTeamSelection(matchId) {
  setTimeout(async () => {
    const match = await db.query(
      'SELECT * FROM matches WHERE id = $1 AND player2_team IS NULL',
      [matchId]
    );
    
    if (match.rows.length > 0) {
      // Refund both players - no valid match
      await refundMatch(matchId);
      await broadcastEvent('match_cancelled', matchId);
    }
  }, TEAM_SELECTION_TIMEOUT);
}

// Insufficient balance check
async function validateBet(walletAddress, betAmount) {
  const balance = await getWalletBalance(walletAddress);
  if (balance < betAmount) {
    throw new Error('Insufficient balance');
  }
  return true;
}

// Rate limiting - prevent spam
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10 // 10 requests per minute
});
app.post('/api/matches/find-opponent', limiter, findOpponent);
```

## Deployment Checklist

- [ ] Environment variables (.env)
  - `SOLANA_RPC_URL`
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `PLATFORM_WALLET=5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU`
  - `ESCROW_PROGRAM_ID`

- [ ] Database migrations
- [ ] Smart contract deployment
- [ ] Wallet permissions (sign authority)
- [ ] Rate limiting & DDoS protection
- [ ] Monitoring & alerting
- [ ] Transaction logging & audit trails
