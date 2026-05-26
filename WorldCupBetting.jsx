import React, { useState, useEffect } from 'react';
import { Wallet, Shield, Trophy, Zap, Users, TrendingUp } from 'lucide-react';

export default function WorldCupBetting() {
  const [screen, setScreen] = useState('home');
  const [userWallet, setUserWallet] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [matchId, setMatchId] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const TEAMS = [
    { name: 'Argentina', flag: '🇦🇷', seed: 1 },
    { name: 'France', flag: '🇫🇷', seed: 2 },
    { name: 'Brazil', flag: '🇧🇷', seed: 3 },
    { name: 'Germany', flag: '🇩🇪', seed: 4 },
    { name: 'Spain', flag: '🇪🇸', seed: 5 },
    { name: 'England', flag: '🇬🇧', seed: 6 },
    { name: 'Netherlands', flag: '🇳🇱', seed: 7 },
    { name: 'Belgium', flag: '🇧🇪', seed: 8 },
    { name: 'Portugal', flag: '🇵🇹', seed: 9 },
    { name: 'Uruguay', flag: '🇺🇾', seed: 10 },
    { name: 'Croatia', flag: '🇭🇷', seed: 11 },
    { name: 'Mexico', flag: '🇲🇽', seed: 12 },
  ];

  // Simulate connecting wallet
  const connectWallet = async () => {
    setLoading(true);
    setTimeout(() => {
      setUserWallet({
        address: '7gfSt...3k9Uj',
        balance: 2.5,
      });
      setLoading(false);
      setScreen('betting');
    }, 800);
  };

  // Simulate finding a match
  const findMatch = async () => {
    setLoading(true);
    setTimeout(() => {
      const newMatchId = Math.random().toString(36).substring(7);
      setMatchId(newMatchId);
      setMatchData({
        id: newMatchId,
        player1: 'You',
        player1Address: userWallet.address,
        player2: 'Opponent_' + Math.random().toString(36).substring(7),
        player2Address: 'Phantom_wallet_' + Math.random().toString(36).substring(5),
        status: 'waiting_team_selection',
        totalPot: parseFloat(betAmount) * 2,
      });
      setLoading(false);
      setScreen('match');
    }, 1200);
  };

  // Simulate team selection and match start
  const confirmTeam = async () => {
    if (!selectedTeam) return;
    setLoading(true);
    setTimeout(() => {
      const opponentTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
      const score1 = Math.floor(Math.random() * 5);
      const score2 = Math.floor(Math.random() * 5);
      const winner = score1 > score2 ? 'You' : score2 > score1 ? 'Opponent' : 'Draw';
      
      setMatchData(prev => ({
        ...prev,
        status: 'finished',
        yourTeam: selectedTeam,
        opponentTeam: opponentTeam,
        finalScore: { [selectedTeam.name]: score1, [opponentTeam.name]: score2 },
        winner: winner,
        yourWinnings: winner === 'You' ? matchData.totalPot * 0.98 : 0,
      }));
      setLoading(false);
    }, 2000);
  };

  const disconnect = () => {
    setUserWallet(null);
    setSelectedTeam(null);
    setBetAmount('');
    setMatchId(null);
    setMatchData(null);
    setScreen('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-lime-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
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
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-all text-sm font-semibold flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {!userWallet && screen === 'home' && (
          <div className="min-h-[600px] flex flex-col justify-center items-center text-center">
            <div className="mb-8 animate-bounce">
              <Trophy className="w-24 h-24 text-lime-400 mx-auto" />
            </div>
            <h2 className="text-5xl font-black mb-4 bg-gradient-to-r from-lime-300 via-purple-300 to-lime-300 bg-clip-text text-transparent">
              World Cup Betting
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl">
              Challenge strangers. Pick your team. Place your bet. Winner takes 98% of the pot.
            </p>
            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black text-lg rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center gap-3"
            >
              <Wallet className="w-6 h-6" />
              {loading ? 'Connecting...' : 'Connect Phantom Wallet'}
            </button>
            <p className="text-gray-400 text-sm mt-6">Mainnet • Solana • No KYC</p>
          </div>
        )}

        {screen === 'betting' && userWallet && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl mb-8">
              <h2 className="text-3xl font-black mb-6">Ready to Bet?</h2>
              
              <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-400">Your Balance</span>
                  <span className="text-2xl font-bold text-lime-400">{userWallet.balance} SOL</span>
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-300 mb-3">Bet Amount (SOL)</label>
                <input
                  type="number"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  placeholder="0.5"
                  max={userWallet.balance}
                  className="w-full bg-black/60 border border-purple-500/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all"
                />
              </div>

              <button
                onClick={findMatch}
                disabled={!betAmount || parseFloat(betAmount) > userWallet.balance || loading}
                className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    Finding opponent...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Find Random Opponent
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {screen === 'match' && matchData && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-500/10 to-lime-500/5 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-xl">
              <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Shield className="w-8 h-8 text-lime-400" />
                Match {matchData.id.toUpperCase()}
              </h2>

              {matchData.status === 'waiting_team_selection' && (
                <>
                  <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                      <div className="text-center">
                        <p className="text-gray-400 mb-2">You</p>
                        <p className="text-2xl font-black">{userWallet.address}</p>
                      </div>
                      <div className="text-gray-500 font-black">VS</div>
                      <div className="text-center">
                        <p className="text-gray-400 mb-2">Opponent</p>
                        <p className="text-2xl font-black">{matchData.player2}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 rounded-xl p-6 mb-8 border border-purple-500/20">
                    <p className="text-sm text-gray-400 mb-4">Total Pot</p>
                    <p className="text-4xl font-black text-lime-400">{matchData.totalPot.toFixed(2)} SOL</p>
                    <p className="text-xs text-gray-500 mt-2">Winner takes 98% (2% platform fee)</p>
                  </div>

                  <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-300 mb-4">Pick Your Team</label>
                    <div className="grid grid-cols-3 gap-3">
                      {TEAMS.map(team => (
                        <button
                          key={team.name}
                          onClick={() => setSelectedTeam(team)}
                          className={`p-4 rounded-lg border-2 transition-all transform ${
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
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        Generating Score...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Confirm & Play
                      </>
                    )}
                  </button>
                </>
              )}

              {matchData.status === 'finished' && (
                <>
                  <div className="text-center mb-8">
                    <p className={`text-5xl font-black mb-4 ${matchData.winner === 'You' ? 'text-lime-400' : matchData.winner === 'Draw' ? 'text-yellow-400' : 'text-red-400'}`}>
                      {matchData.winner === 'You' ? '🎉 YOU WIN!' : matchData.winner === 'Draw' ? '🤝 DRAW' : '😢 LOST'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                      <p className="text-3xl mb-2">{matchData.yourTeam.flag}</p>
                      <p className="font-black mb-4">{matchData.yourTeam.name}</p>
                      <p className="text-5xl font-black text-lime-400">{matchData.finalScore[matchData.yourTeam.name]}</p>
                    </div>
                    <div className="bg-black/40 rounded-xl p-6 border border-purple-500/20 text-center">
                      <p className="text-3xl mb-2">{matchData.opponentTeam.flag}</p>
                      <p className="font-black mb-4">{matchData.opponentTeam.name}</p>
                      <p className="text-5xl font-black text-red-400">{matchData.finalScore[matchData.opponentTeam.name]}</p>
                    </div>
                  </div>

                  {matchData.yourWinnings > 0 && (
                    <div className="bg-gradient-to-r from-lime-400/20 to-purple-400/20 border border-lime-400/50 rounded-xl p-6 mb-8 text-center">
                      <p className="text-gray-300 mb-2">Your Winnings</p>
                      <p className="text-4xl font-black text-lime-400">{matchData.yourWinnings.toFixed(3)} SOL</p>
                      <p className="text-xs text-gray-400 mt-2">Processing to your wallet...</p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setScreen('betting');
                      setSelectedTeam(null);
                      setBetAmount('');
                      setMatchId(null);
                      setMatchData(null);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-lime-400 to-purple-500 hover:from-lime-300 hover:to-purple-400 text-black font-black rounded-xl transition-all"
                  >
                    Play Another Match
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="relative z-10 border-t border-purple-500/20 backdrop-blur-xl mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-3 gap-8">
          <div className="text-center">
            <Users className="w-6 h-6 text-lime-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Active Players</p>
            <p className="text-2xl font-black">2,847</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Total Volume</p>
            <p className="text-2xl font-black">12,450 SOL</p>
          </div>
          <div className="text-center">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Live Matches</p>
            <p className="text-2xl font-black">342</p>
          </div>
        </div>
      </div>
    </div>
  );
}
