// ClaimButton.jsx - Component for claiming points functionality
import React, { useState } from 'react';
import { Zap, Star, AlertCircle } from 'lucide-react';

const ClaimButton = ({ selectedUser, users, onClaimPoints, loading }) => {
  // State for showing claim result animation
  const [showResult, setShowResult] = useState(false);
  const [lastClaimedPoints, setLastClaimedPoints] = useState(null);

  // Handle claiming points for selected user
  const handleClaimPoints = async () => {
    if (!selectedUser) return;

    // Generate random points (1-10) as specified in requirements
    const randomPoints = Math.floor(Math.random() * 10) + 1;
    
    // Call parent function to claim points
    const success = await onClaimPoints(selectedUser, randomPoints);
    
    if (success) {
      // Show success animation
      setLastClaimedPoints(randomPoints);
      setShowResult(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowResult(false);
        setLastClaimedPoints(null);
      }, 3000);
    }
  };

  // Get selected user's name for display
  const getSelectedUserName = () => {
    if (!selectedUser || !users.length) return null;
    const user = users.find(u => u._id === selectedUser);
    return user ? user.name : null;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        Claim Points
      </h2>
      
      <div className="space-y-4">
        {/* Show selected user info */}
        {selectedUser && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-700">
              🎯 Claiming for: <span className="font-semibold">{getSelectedUserName()}</span>
            </p>
          </div>
        )}

        {/* Claim button */}
        <button
          onClick={handleClaimPoints}
          disabled={!selectedUser || loading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Claim Random Points (1-10)
            </>
          )}
        </button>

        {/* Success result animation */}
        {showResult && lastClaimedPoints && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center animate-pulse">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Star className="w-5 h-5" />
              <span className="font-semibold text-lg">
                🎉 +{lastClaimedPoints} points claimed!
              </span>
              <Star className="w-5 h-5" />
            </div>
            <p className="text-sm text-green-600 mt-1">
              Points added to {getSelectedUserName()}'s account
            </p>
          </div>
        )}

        {/* Help text when no user selected */}
        {!selectedUser && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">Please select a user to claim points</span>
            </div>
          </div>
        )}

        {/* Info about random points */}
        <div className="text-xs text-gray-500 text-center">
          <p>💡 Each claim awards 1-10 random points</p>
          <p>📊 Points are instantly added to the leaderboard</p>
        </div>
      </div>
    </div>
  );
};

export default ClaimButton;