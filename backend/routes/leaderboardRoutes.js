import express from 'express';
import User from '../models/User.js';
import Claim from '../models/Claim.js';

const router = express.Router();

/**
 * @route   GET /api/leaderboard
 * @desc    Get leaderboard with top users
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 10, includeStats = false } = req.query;
    const limitNum = parseInt(limit);

    // Get top users
    const topUsers = await User.getTopUsers(limitNum);

    // Add ranking to users
    const leaderboard = topUsers.map((user, index) => ({
      ...user.toObject(),
      rank: index + 1,
      badge: getRankBadge(index + 1)
    }));

    let stats = null;
    if (includeStats === 'true') {
      // Get additional statistics
      const [userStats, claimStats] = await Promise.all([
        User.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              totalPoints: { $sum: '$totalPoints' },
              averagePoints: { $avg: '$totalPoints' },
              maxPoints: { $max: '$totalPoints' }
            }
          }
        ]),
        Claim.aggregate([
          { $match: { isValid: true } },
          {
            $group: {
              _id: null,
              totalClaims: { $sum: 1 },
              totalPointsClaimed: { $sum: '$points' },
              averageClaimPoints: { $avg: '$points' }
            }
          }
        ])
      ]);

      stats = {
        users: userStats[0] || { totalUsers: 0, totalPoints: 0, averagePoints: 0, maxPoints: 0 },
        claims: claimStats[0] || { totalClaims: 0, totalPointsClaimed: 0, averageClaimPoints: 0 }
      };
    }

    res.json({
      leaderboard,
      stats,
      meta: {
        totalShown: leaderboard.length,
        requestedLimit: limitNum,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch leaderboard', error: error.message });
  }
});

/**
 * @route   GET /api/leaderboard/user/:userId/position
 * @desc    Get a specific user's position in the leaderboard
 * @access  Public
 */
router.get('/user/:userId/position', async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    // Get user's rank
    const usersAbove = await User.countDocuments({
      isActive: true,
      totalPoints: { $gt: user.totalPoints }
    });

    const rank = usersAbove + 1;

    // Get users around this user's position
    const context = 2; // Show 2 users above and below
    const contextUsers = await User.find({ isActive: true })
      .sort({ totalPoints: -1, createdAt: 1 })
      .skip(Math.max(0, rank - context - 1))
      .limit(context * 2 + 1);

    const contextWithRanks = contextUsers.map((u, index) => ({
      ...u.toObject(),
      rank: Math.max(1, rank - context) + index,
      badge: getRankBadge(Math.max(1, rank - context) + index),
      isCurrentUser: u._id.toString() === userId
    }));

    res.json({
      user: {
        ...user.toObject(),
        rank,
        badge: getRankBadge(rank)
      },
      context: contextWithRanks,
      meta: {
        totalUsers: await User.countDocuments({ isActive: true }),
        percentile: Math.round((1 - (rank - 1) / await User.countDocuments({ isActive: true })) * 100)
      }
    });
  } catch (error) {
    console.error('Error fetching user position:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Failed to fetch user position', error: error.message });
  }
});

/**
 * @route   GET /api/leaderboard/top/:period
 * @desc    Get top users for a specific time period
 * @access  Public
 */
router.get('/top/:period', async (req, res) => {
  try {
    const { period } = req.params;
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit);

    // Calculate date range based on period
    const dateRange = getDateRange(period);
    if (!dateRange) {
      return res.status(400).json({ message: 'Invalid period. Use: today, week, month, year' });
    }

    // Get top users for the period based on claims
    const topUsers = await Claim.aggregate([
      {
        $match: {
          isValid: true,
          createdAt: { $gte: dateRange.start, $lte: dateRange.end }
        }
      },
      {
        $group: {
          _id: '$userId',
          periodPoints: { $sum: '$points' },
          periodClaims: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $match: {
          'user.isActive': true
        }
      },
      {
        $project: {
          _id: '$user._id',
          name: '$user.name',
          email: '$user.email',
          avatar: '$user.avatar',
          totalPoints: '$user.totalPoints',
          claimsCount: '$user.claimsCount',
          periodPoints: 1,
          periodClaims: 1,
          createdAt: '$user.createdAt'
        }
      },
      {
        $sort: { periodPoints: -1, periodClaims: -1 }
      },
      {
        $limit: limitNum
      }
    ]);

    const leaderboard = topUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
      badge: getRankBadge(index + 1)
    }));

    res.json({
      leaderboard,
      period: {
        name: period,
        start: dateRange.start,
        end: dateRange.end
      },
      meta: {
        totalShown: leaderboard.length,
        requestedLimit: limitNum,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching period leaderboard:', error);
    res.status(500).json({ message: 'Failed to fetch period leaderboard', error: error.message });
  }
});

/**
 * Helper function to get rank badge
 */
function getRankBadge(rank) {
  if (rank === 1) return { emoji: '🥇', name: 'Gold', color: '#FFD700' };
  if (rank === 2) return { emoji: '🥈', name: 'Silver', color: '#C0C0C0' };
  if (rank === 3) return { emoji: '🥉', name: 'Bronze', color: '#CD7F32' };
  if (rank <= 10) return { emoji: '🏆', name: 'Top 10', color: '#4CAF50' };
  if (rank <= 50) return { emoji: '⭐', name: 'Top 50', color: '#2196F3' };
  return { emoji: '🎖️', name: 'Ranked', color: '#9E9E9E' };
}

/**
 * Helper function to get date range for period
 */
function getDateRange(period) {
  const now = new Date();
  const start = new Date();
  
  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }
  
  return { start, end: now };
}

export default router;