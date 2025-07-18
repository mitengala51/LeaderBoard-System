// Leaderboard.jsx - Component for displaying the live-updating leaderboard
import React from 'react';
import { Trophy, Clock } from 'lucide-react';

const Leaderboard = ({ leaderboard, loading, lastUpdate }) => {
  // Function to get rank badge styling based on position
  const getRankBadge = (rank) => {
    if (rank === 1) return { emoji: '🥇', color: 'text-yellow-500', bg: 'bg-yellow-50' };
    if (rank === 2) return { emoji: '🥈', color: 'text-gray-500', bg: 'bg-gray-50' };
    if (rank === 3) return { emoji: '🥉', color: 'text-orange-500', bg: 'bg-orange-50' };
    return { emoji: '🏆', color: 'text-blue-500', bg: 'bg-blue-50' };
  };

  // Format timestamp for display
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header with title and last update time */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-purple-600" />
          Leaderboard
        </h2>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Last updated: {formatTime(lastUpdate)}
        </div>
      </div>
      
      {/* Loading state */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      ) : leaderboard.length === 0 ? (
        // Empty state when no users exist
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No users yet. Add some users to get started!</p>
        </div>
      ) : (
        // Leaderboard list
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const badge = getRankBadge(user.rank);
            return (
              <div
                key={user._id}
                className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md ${
                  index < 3 
                    ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* User info with rank badge */}
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${badge.bg}`}>
                      {badge.emoji}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 text-lg">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  {/* Points display */}
                  <div className="text-right">
                    <div className="text-2xl font-bold text-purple-600">{user.totalPoints}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;