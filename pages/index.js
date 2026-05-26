import React, { useState } from 'react';
import { Connection } from '@solana/web3.js';
import { Wallet, Trophy } from 'lucide-react';

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
  ];

  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      const provider = window.solana;

      if (!provider?.isPhantom) {
        throw new Error('Install Phantom Wallet');
      }

      const response = await provider.connect();

      const connection = new Connection(RPC_URL, 'confirmed');

      const balance = await connection.getBalance(response.publicKey);

      setUserWallet({
        address:
          response.publicKey.toString().slice(0, 8) +
          '...' +
          response.publicKey.toString().slice(-4),
        balance: balance / 1_000_000_000,
      });

      setScreen('betting');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      if (window.solana?.disconnect) {
        await window.solana.disconnect();
      }
    } catch (err) {
      console.error(err);
    }

    setUserWallet(null);
    setBetAmount('');
    setSelectedTeam(null);
    setMatchData(null);
    setScreen('home');
  };

  const findMatch = async () => {
    setLoading(true);

    setTimeout(() => {
      setMatchData({
        betAmount: parseFloat(betAmount),
        status: 'waiting',
      });

      setScreen('match');
      setLoading(false);
    }, 1500);
  };

  const confirmTeam = async () => {
    setLoading(true);

    setTimeout(() => {
      const yourScore = Math.floor(Math.random() * 5);
      const opponentScore = Math.floor(Math.random() * 5);

      setMatchData({
        ...matchData,
        status: 'finished',
        yourTeam: selectedTeam,
        opponentTeam:
          TEAMS[Math.floor(Math.random() * TEAMS.length)],
        yourScore,
        opponentScore,
        yourWinnings:
          yourScore > opponentScore
            ? matchData.betAmount * 2 * 0.98
            : 0,
      });

      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white">
      <div className="relative z-10 border-b border-purple-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-lime-400" />
            <h1 className="text-2xl font-black">
              SOL STADIUM
            </h1>
          </div>

          {userWallet && (
            <button
              onClick={disconnect}
              className="px-4 py-2 bg-red-500 rounded-lg"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12">
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 rounded-lg">
            {error}
          </div>
        )}

        {!userWallet && screen === 'home' && (
          <div className="text-center">
            <h2 className="text-5xl font-black mb-6">
              World Cup Betting
            </h2>

            <p className="text-gray-300 mb-8">
              Connect Phantom and challenge players.
            </p>

            <button
              onClick={connectWallet}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-lime-400 to-purple-500 text-black rounded-xl font-black flex items-center gap-3 mx-auto"
            >
              <Wallet className="w-6 h-6" />

              {loading
                ? 'Connecting...'
                : 'Connect Phantom Wallet'}
            </button>
          </div>
        )}

        {screen === 'betting' && userWallet && (
          <div className="max-w-2xl mx-auto bg-black/30 p-8 rounded-2xl">
            <h2 className="text-3xl font-black mb-6">
              Ready to Bet?
            </h2>

            <div className="mb-6">
              <p>Wallet: {userWallet.address}</p>
              <p>
                Balance:{' '}
                {userWallet.balance.toFixed(3)} SOL
              </p>
            </div>

            <input
              type="number"
              value={betAmount}
              onChange={(e) =>
                setBetAmount(e.target.value)
              }
              placeholder="0.1"
              className="w-full p-4 rounded-lg bg-slate-800 mb-6"
            />

            <button
              onClick={findMatch}
              disabled={!betAmount || loading}
              className="w-full py-4 bg-lime-400 text-black rounded-xl font-black"
            >
              {loading
                ? 'Finding opponent...'
                : 'Find Opponent'}
            </button>
          </div>
        )}

        {screen === 'match' &&
          matchData &&
          matchData.status !== 'finished' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black mb-6">
                Pick Your Team
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-8">
                {TEAMS.map((team) => (
                  <button
                    key={team.name}
                    onClick={() =>
                      setSelectedTeam(team)
                    }
                    className={`p-4 rounded-xl border ${
                      selectedTeam?.name === team.name
                        ? 'border-lime-400'
                        : 'border-purple-500'
                    }`}
                  >
                    <div className="text-4xl">
                      {team.flag}
                    </div>

                    <div>{team.name}</div>
                  </button>
                ))}
              </div>

              <button
                onClick={confirmTeam}
                disabled={!selectedTeam || loading}
                className="w-full py-4 bg-purple-500 rounded-xl font-black"
              >
                {loading
                  ? 'Playing...'
                  : 'Play Match'}
              </button>
            </div>
          )}

        {screen === 'match' &&
          matchData &&
          matchData.status === 'finished' && (
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-5xl font-black mb-8">
                {matchData.yourWinnings > 0
                  ? '🎉 YOU WIN!'
                  : '😢 YOU LOST'}
              </h2>

              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="bg-black/30 p-6 rounded-xl">
                  <div className="text-5xl">
                    {matchData.yourTeam.flag}
                  </div>

                  <div className="text-3xl font-black">
                    {matchData.yourScore}
                  </div>
                </div>

                <div className="bg-black/30 p-6 rounded-xl">
                  <div className="text-5xl">
                    {matchData.opponentTeam.flag}
                  </div>

                  <div className="text-3xl font-black">
                    {matchData.opponentScore}
                  </div>
                </div>
              </div>

              {matchData.yourWinnings > 0 && (
                <p className="text-4xl text-lime-400 font-black mb-8">
                  Won{' '}
                  {matchData.yourWinnings.toFixed(3)} SOL
                </p>
              )}

              <button
                onClick={() => {
                  setScreen('betting');
                  setSelectedTeam(null);
                  setBetAmount('');
                  setMatchData(null);
                }}
                className="px-8 py-4 bg-lime-400 text-black rounded-xl font-black"
              >
                Play Again
              </button>
            </div>
          )}
      </div>
    </div>
  );
}