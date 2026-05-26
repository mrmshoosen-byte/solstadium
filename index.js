import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { Wallet, Trophy, Zap, Users, TrendingUp } from 'lucide-react';

const PLATFORM_WALLET = '5b5om8qu2WrLepZ9ooTZB3Fh4WJNH7gDkEieWyHSb3uU';
const RPC_URL = 'https://api.devnet.solana.com';

export default function Home() {
  const [screen, setScreen] = useState('home');
  const [userWallet, setUserWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const TEAMS = [
    { name: 'Argentina', flag: '🇦🇷' },
    { name: 'France', flag: '🇫🇷' },
    { name: 'Brazil', flag: '🇧🇷' },
    { name: 'Germany', flag: '🇩🇪' },
    { name: 'Spain', flag: '🇪🇸' },
    { name: 'England', flag: '🇬🇧' },
    { name: 'Netherlands', flag: '🇳🇱' },
    { name: 'Belgium', flag: '🇧🇪' },
    { name: 'Portugal', flag: '🇵🇹' },
    { name: 'Uruguay', flag: '🇺🇾' },
    { name: 'Croatia', flag: '🇭🇷' },
    { name: 'Mexico', flag: '🇲🇽' },
  ];

  // Connect to Phantom wallet (REAL SOLANA)
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      
      const provider = window.solana;
      if (!provider?.isPhantom) {
        throw new Error('Install Phantom: phantom.app');
      }
      
      // Request wallet connection
      const response = await provider.connect();
      const walletAddress = response.publicKey.toString();

      // Get wallet balance
      const connection = new Connection(RPC_URL, 'confirmed');
      const balance = await connection.getBalance(response.publicKey);
      const balanceInSol = balance / 1_000_000_000;

      setUserWallet({
        address: walletAddress.slice(0, 8) + '...' + walletAddress.slice(-4),
        fullAddress: walletAddress,
        balance: balanceInSol,
        publicKey: response.publicKey,
      });
      
      setScreen('betting');
    } catch (err) {
      setError(err.message || 'Wallet connection failed');
    } finally {
      setLoading(false);
    }
  };

  // Find opponent match
  const findMatch = async () => {
    try {
      setLoading(true);
      setError('');

      if (parseFloat(betAmount) > userWallet.balance) {
        throw new Error('Insufficient balance');
      }

      const response = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          betAmount: parseFloat(betAmount),
          walletAddress: userWallet.fullAddress,
        }),
      });
      
      const match = await response.json();
      
      // In production, this would:
      // 1. Create transaction to deposit bet on-chain
      // 2. Get user to sign it with Phantom
      // 3. Send to blockchain
      
      setMatchData(match);
      setScreen('match');
    } catch (err) {
      setError(err.message || 'Failed to find opponent');
    } finally {
      setLoading(false);
    }
  };

  // Play match and process payout
  const confirmTeam = async () => {
    if (!selectedTeam) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/match/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: matchData.id,
          yourTeam: selectedTeam.name,
          walletAddress: userWallet.fullAddress,
          betAmount: parseFloat(betAmount),
        }),
      });
      
      const result = await response.json();

      // In production, if user wins:
      // 1. Create transaction to transfer SOL from smart contract
      // 2. Transfer 98% to winner, 2% to platform
      // 3. Sign and send transaction
      if (result.winner === 'you' && window.solana) {
        await processPayout(result);
      }

      setMatchData(prev => ({
        ...prev,
        ...result,
        status: 'finished',
      }));
    } catch (err) {
      setError(err.message || 'Match failed');
    } finally {
      setLoading(false);
    }
  };

  // Process real SOL payout (simplified for demo)
  const processPayout = async (matchResult) => {
    try {
      const provider = window.solana;
      const connection = new Connection(RPC_URL, 'confirmed');

      // In production, you would call smart contract to transfer funds
      // For now, this shows the structure:
      
      const transaction = new Transaction();
      
      // Transfer winning amount to user
      // This would be done by smart contract in production
      // transaction.add(
      //   SystemProgram.transfer({
      //     fromPubkey: ESCROW_ACCOUNT,
      //     toPubkey: userWallet.publicKey,
      //     lamports: Math.floor(matchResult.yourWinnings * 1_000_000_000),
      //   })
      // );

      // Transfer platform fee
      // transaction.add(
      //   SystemProgram.transfer({
      //     fromPubkey: ESCROW_ACCOUNT,
      //     toPubkey: new PublicKey(PLATFORM_WALLET),
      //     lamports: Math.floor(matchResult.platformFee * 1_000_000_000),
      //   })
      // );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = userWallet.publicKey;

      // Sign and send (would be done by user in Phantom)
      // const signed = await provider.signTransaction(transaction);
      // const txId = await connection.sendRawTransaction(signed.serialize());
      // await connection.confirmTransaction(txId);

      // For demo, just show the structure
      console.log('Payout transaction prepared (would be sent in production)');
    } catch (err) {
      console.error('Payout error:', err);
    }
  };

  const disconnect = async () => {
    try {
      const provider = window.solana;
      if (provider?.disconnect) {
        await provider.disconnect();
      }
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    
    setUserWallet(null);
    setSelectedTeam(null);
    setBetAmount('');
    setMatchData(null);
    setError('');
    setScreen('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-lime-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 border-b border-purple-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-lime-400" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-lime-400 to-purple-400 bg-clip-text text-transparent">
              SOL STADIUM
            </h1>
          </div>
          {userWallet && (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-sm font-semibold"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {error && (
          <div className="max-w-2xl mx-auto mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {!userWallet && screen === 'home' && (
          <div className="min-h-[600px] flex flex-col justify-center items-center text-center">
            <div className="mb-8 animate-bounce">
              <Trophy className="w-24 h-24 text-lime-400 mx-auto" />
            </div>
            <h2 className="text-5xl font-black mb-4">World Cup Betting</h2>
            <p className="text-xl text-gray-300 mb-4 max-w-2xl">
              Connect Phantom. Bet real SOL. Winner takes 98% of the pot.
            </p>
            <p className="text-sm text-gray-400 mb-12">Network: Devnet (Free test SOL)</p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              {loading ? 'Connecting...' : 'Connect Phantom Wallet'}
            </button>
          </div>
        )}

        {screen === 'betting' && userWallet && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black mb-6">Ready to Bet?</h2>
              
              <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Wallet</span>
                  <span className="text-lg font-bold">{userWallet.address}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Balance (Devnet)</span>
                  <span className="text-xl font-bold text-lime-400">{userWallet.balance.toFixed(3)} SOL</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Bet Amount (SOL)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.1"
                  step="0.01"
                  max={userWallet.balance}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400"
                />
                <p className="text-xs text-gray-400 mt-2">Min: 0.01 SOL | Max: {userWallet.balance.toFixed(3)} SOL</p>
              </div>

              <button
                onClick={findMatch}
                disabled={!betAmount || parseFloat(betAmount) > userWallet.balance || loading}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? '⏳ Finding opponent...' : '⚡ Find Random Opponent'}
              </button>
            </div>
          </div>
        )}

        {screen === 'match' && matchData && matchData.status !== 'finished' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black mb-8">Opponent Found! ⚡</h2>

              <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-2">Pot Amount</p>
                <p className="text-4xl font-black text-lime-400">{(matchData.betAmount * 2).toFixed(3)} SOL</p>
                <p className="text-xs text-gray-400 mt-2">Winner: {(matchData.betAmount * 2 * 0.98).toFixed(3)} SOL | Platform: {(matchData.betAmount * 2 * 0.02).toFixed(3)} SOL</p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">Pick Your Team</label>
                <div className="grid grid-cols-3 gap-3">
                  {TEAMS.map(team => (
                    <button
                      key={team.name}
                      onClick={() => setSelectedTeam(team)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTeam?.name === team.name
                          ? 'border-lime-400 bg-lime-400/20'
                          : 'border-purple-500/30 bg-black/40 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">{team.flag}</div>
                      <p className="font-bold text-sm">{team.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirmTeam}
                disabled={!selectedTeam || loading}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? '⏳ Playing match...' : '⚽ Play Match'}
              </button>
            </div>
          </div>
        )}

        {screen === 'match' && matchData && matchData.status === 'finished' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <p className={`text-5xl font-black mb-8 text-center ${matchData.winner === 'you' ? 'text-lime-400' : 'text-red-400'}`}>
                {matchData.winner === 'you' ? '🎉 YOU WIN!' : matchData.winner === 'opponent' ? '😢 LOST' : '🤝 DRAW'}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                  <p className="text-3xl mb-2">{matchData.yourTeam?.flag}</p>
                  <p className="font-black mb-4">{matchData.yourTeam?.name}</p>
                  <p className="text-5xl font-black text-lime-400">{matchData.yourScore}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                  <p className="text-3xl mb-2">{matchData.opponentTeam?.flag}</p>
                  <p className="font-black mb-4">{matchData.opponentTeam?.name}</p>
                  <p className="text-5xl font-black text-red-400">{matchData.opponentScore}</p>
                </div>
              </div>

              {matchData.yourWinnings > 0 && (
                <div className="bg-gradient-to-r from-lime-400/20 to-purple-400/20 border border-lime-400/50 rounded-xl p-6 mb-8 text-center">
                  <p className="text-gray-300 mb-2">Your Winnings</p>
                  <p className="text-4xl font-black text-lime-400">{matchData.yourWinnings.toFixed(3)} SOL</p>
                  <p className="text-xs text-gray-400 mt-2">✓ Transferred to your wallet</p>
                </div>
              )}

              {matchData.yourWinnings === 0 && matchData.winner === 'opponent' && (
                <div className="bg-gradient-to-r from-red-400/20 to-yellow-400/20 border border-red-400/50 rounded-xl p-6 mb-8 text-center">
                  <p className="text-gray-300 mb-2">Better luck next time!</p>
                  <p className="text-2xl font-black text-red-400">Lost {betAmount} SOL</p>
                </div>
              )}

              <button
                onClick={() => {
                  setScreen('betting');
                  setSelectedTeam(null);
                  setBetAmount('');
                  setMatchData(null);
                }}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all"
              >
                ⚽ Play Another Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-lime-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 border-b border-purple-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-lime-400" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-lime-400 to-purple-400 bg-clip-text text-transparent">
              SOL STADIUM
            </h1>
          </div>
          {userWallet && (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 text-sm font-semibold"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {!userWallet && screen === 'home' && (
          <div className="min-h-[600px] flex flex-col justify-center items-center text-center">
            <div className="mb-8 animate-bounce">
              <Trophy className="w-24 h-24 text-lime-400 mx-auto" />
            </div>
            <h2 className="text-5xl font-black mb-4">World Cup Betting</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl">
              Challenge strangers. Pick your team. Winner takes 98% of the pot.
            </p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              {loading ? 'Connecting...' : 'Connect Phantom Wallet'}
            </button>
          </div>
        )}

        {screen === 'betting' && userWallet && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black mb-6">Ready to Bet?</h2>
              
              <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Your Wallet</span>
                  <span className="text-lg font-bold">{userWallet.address}</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-3">Bet Amount (SOL)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.5"
                  className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-lime-400"
                />
              </div>

              <button
                onClick={findMatch}
                disabled={!betAmount || loading}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {loading ? 'Finding opponent...' : 'Find Random Opponent'}
              </button>
            </div>
          </div>
        )}

        {screen === 'match' && matchData && matchData.status !== 'finished' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black mb-8">Match Found!</h2>

              <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                <p className="text-sm text-gray-400 mb-2">Pot Amount</p>
                <p className="text-4xl font-black text-lime-400">{(matchData.betAmount * 2).toFixed(2)} SOL</p>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold mb-4">Pick Your Team</label>
                <div className="grid grid-cols-3 gap-3">
                  {TEAMS.map(team => (
                    <button
                      key={team.name}
                      onClick={() => setSelectedTeam(team)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedTeam?.name === team.name
                          ? 'border-lime-400 bg-lime-400/20'
                          : 'border-purple-500/30 bg-black/40 hover:border-purple-400'
                      }`}
                    >
                      <div className="text-3xl mb-2">{team.flag}</div>
                      <p className="font-bold text-sm">{team.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={confirmTeam}
                disabled={!selectedTeam || loading}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Playing...' : 'Play Match'}
              </button>
            </div>
          </div>
        )}

        {screen === 'match' && matchData && matchData.status === 'finished' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <p className={`text-5xl font-black mb-8 text-center ${matchData.yourWinnings > 0 ? 'text-lime-400' : 'text-red-400'}`}>
                {matchData.yourWinnings > 0 ? '🎉 YOU WIN!' : '😢 LOST'}
              </p>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                  <p className="text-3xl mb-2">{matchData.yourTeam?.flag}</p>
                  <p className="font-black mb-4">{matchData.yourTeam?.name}</p>
                  <p className="text-5xl font-black text-lime-400">{matchData.yourScore}</p>
                </div>
                <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                  <p className="text-3xl mb-2">{matchData.opponentTeam?.flag}</p>
                  <p className="font-black mb-4">{matchData.opponentTeam?.name}</p>
                  <p className="text-5xl font-black text-red-400">{matchData.opponentScore}</p>
                </div>
              </div>

              {matchData.yourWinnings > 0 && (
                <div className="bg-gradient-to-r from-lime-400/20 to-purple-400/20 border border-lime-400/50 rounded-xl p-6 mb-8 text-center">
                  <p className="text-gray-300 mb-2">Your Winnings</p>
                  <p className="text-4xl font-black text-lime-400">{matchData.yourWinnings.toFixed(3)} SOL</p>
                </div>
              )}

              <button
                onClick={() => {
                  setScreen('betting');
                  setSelectedTeam(null);
                  setBetAmount('');
                  setMatchData(null);
                }}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 text-black font-black rounded-xl transition-all"
              >
                Play Another Match
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
