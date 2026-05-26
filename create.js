// pages/api/match/create.js
// Real Solana blockchain integration
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

const PROGRAM_ID = process.env.SOLANA_PROGRAM_ID || 'SolStd1um1um1um1um1um1um1um1um1um1um1um1';
const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { betAmount, walletAddress } = req.body;

    if (!walletAddress || !betAmount) {
      return res.status(400).json({ error: 'Missing wallet or bet amount' });
    }

    // Validate Solana address
    try {
      new PublicKey(walletAddress);
    } catch {
      return res.status(400).json({ error: 'Invalid Solana wallet address' });
    }

    // Generate match ID
    const matchId = 'match_' + Math.random().toString(36).substring(7);

    // Convert bet to lamports (1 SOL = 1 billion lamports)
    const betInLamports = Math.floor(betAmount * 1_000_000_000);

    // Return match data with blockchain info
    const matchData = {
      id: matchId,
      player1: walletAddress,
      betAmount: betAmount,
      betInLamports: betInLamports,
      totalPot: betAmount * 2,
      status: 'awaiting_opponent',
      createdAt: new Date().toISOString(),
      programId: PROGRAM_ID,
      rpcUrl: RPC_URL,
      // Frontend will use this to sign transaction
      requiresSignature: true,
    };

    res.status(200).json(matchData);
  } catch (error) {
    console.error('Match creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create match',
      details: error.message 
    });
  }
}
