<<<<<<< HEAD
# SOL Stadium - World Cup Betting

A Solana-powered World Cup betting platform. Pick a team, bet SOL, and win against random opponents.

## 🚀 Deploy in 3 Steps

### Step 1: Create GitHub Repo

1. Go to **github.com** → Sign in
2. Click **New** (top left)
3. Name it: `world-cup-betting`
4. Click **Create repository**

### Step 2: Push Code to GitHub

Open your terminal and run:

```bash
# Clone the GitHub repo (replace YOUR_USERNAME)
git clone https://github.com/YOUR_USERNAME/world-cup-betting.git
cd world-cup-betting

# Copy all files from this folder into the repo folder
# Then run:
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to **vercel.com** → Sign up (use GitHub account)
2. Click **New Project**
3. Select your `world-cup-betting` repo
4. Click **Import**
5. Click **Deploy**
6. **Done!** Your site is live in 2 minutes

---

## ✅ File Structure

```
world-cup-betting/
├── pages/
│   ├── index.js              ← Main app
│   ├── _app.js               ← App config
│   └── api/
│       └── match/
│           ├── create.js      ← Create match
│           └── play.js        ← Play match
├── styles/
│   └── globals.css           ← Styling
├── package.json              ← Dependencies
├── next.config.js            ← Next.js config
├── tailwind.config.js        ← Tailwind config
├── postcss.config.js         ← PostCSS config
└── README.md                 ← This file
```

---

## 🔌 Features

✅ **Phantom Wallet Integration** - Users connect their own wallet  
✅ **Random Matchmaking** - Each game finds a random opponent  
✅ **12 World Cup Teams** - Pick Argentina, France, Brazil, etc.  
✅ **Instant Results** - Match finishes immediately  
✅ **Simulated Winnings** - Shows payout (real blockchain in next phase)  
✅ **Beautiful UI** - Dark theme with lime/purple colors  
✅ **No Database** - Everything runs serverless on Vercel  

---

## 🎮 How It Works

1. **Connect Wallet** - Click "Connect Phantom Wallet"
2. **Enter Bet Amount** - Type how much SOL you want to bet
3. **Find Opponent** - System finds random player
4. **Pick Team** - Choose your World Cup team
5. **Play** - Scores generate randomly based on team strength
6. **Win or Lose** - See your winnings instantly

---

## 🛠 What's NOT Included (Yet)

- Real Solana blockchain integration (coming next)
- Smart contract for escrow (coming next)
- Actual money transfers (coming next)
- Database for match history (coming next)

**This is a demo/prototype.** It simulates the betting experience. To add real Solana integration, you'll need to:
- Deploy a smart contract
- Connect it to the backend
- Enable real wallet transactions

---

## 🤝 How to Add Real Solana Integration

### Option A: Use Thirdweb (Easiest)
1. Go to **thirdweb.com**
2. Create a contract dashboard
3. They'll give you API keys
4. Update `pages/api/match/play.js` to call their API
5. Deploy again

### Option B: Deploy Smart Contract (Advanced)
1. Install Anchor: https://book.anchor-lang.com
2. Create a Solana program
3. Deploy to Solana Devnet/Mainnet
4. Update API to interact with contract
5. Move real SOL through the smart contract

---

## 📝 Environment Variables (Optional)

For real Solana integration, add to Vercel:
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add these:
```
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your_contract_id
PLATFORM_WALLET=5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU
```

---

## 🎯 Your Wallet Address

For payouts, your wallet is:
```
5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU
```

This will receive 2% of every pot when you add real Solana integration.

---

## 📱 Mobile Friendly

Works on:
- Desktop ✅
- Mobile ✅
- Tablet ✅

---

## ❌ Common Issues

**Issue: "Install Phantom wallet"**
- Go to phantom.app and install the extension
- Reload the page

**Issue: "Deploy failed"**
- Check that all files are in the repo
- Try deploying again from Vercel dashboard

**Issue: "Page is blank"**
- Wait 2-3 minutes for build to complete
- Refresh browser
- Check Vercel deployment logs

---

## 📚 Useful Links

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Phantom Wallet**: https://phantom.app
- **Solana Docs**: https://docs.solana.com
- **Thirdweb**: https://thirdweb.com

---

## 💰 Next: Real Money Integration

When you're ready to add real Solana:

1. **Smart Contract**: Deploy Anchor contract (handles escrow + payouts)
2. **Real Transactions**: Update API to call smart contract
3. **Wallet Connect**: Enable real SOL transfers
4. **Test on Devnet**: Use free test SOL first
5. **Launch on Mainnet**: Go live with real money

---

## ⚖️ Legal

**YOU are responsible for:**
- Gambling licenses (varies by country)
- Terms of service
- User verification (KYC/AML)
- Tax compliance

Consult a lawyer before accepting real money.

---

## 🤖 Support

Need help? Check:
1. This README
2. Vercel deployment logs
3. Browser console (F12)
4. Network tab to see API errors

---

**Deployed site will be live at:** `https://your-app-name.vercel.app`

Good luck! 🚀
=======
# solstadium
>>>>>>> e43c607ed6c33f92f1970940a936ca5720d438dc
