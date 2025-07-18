import express from 'express';
import Claim from '../models/Claim.js';
import User from '../models/User.js';
import { validateClaim, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   POST /api/claims
 * @desc    Create a new claim (claim points for a user)
 * @access  Public
 */
router.post('/', validateClaim, handleValidationErrors, async (req, res) => {
  try {
    const { userId, points, description, claimType = 'random' } = req.body;

    // Verify user exists and is active
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

    // Generate random points if not provided (for random claims)
    const claimPoints = claimType === 'random' && !points 
      ? Math.floor(Math.random() * 10) + 1 
      : points;

    // Create new claim
    const claim = new Claim({
      userId,
      points: claimPoints,
      description: description || `Random ${claimPoints} points claim`,
      claimType,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        source: 'web'
      }
    });

    await claim.save();

    // Populate user data for response
    await claim.populate('userId', 'name email avatar totalPoints');

    res.status(201).json({
      message: 'Points claimed successfully',
      claim: {
        _id: claim._id,
        userId: claim.userId,
        points: claim.points,
        description: claim.description,
        claimType: claim.claimType,
        createdAt: claim.createdAt,
        formattedDate: claim.formattedDate
      }
    });
  } catch (error) {
    console.error('Error creating claim:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    
    res.status(500).json({ message: 'Failed to create claim', error: error.message });
  }
});

/**
 * @route   GET /api/claims
 * @desc    Get all claims with optional filters
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      claimType,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filterQuery = { isValid: true };

    if (userId) {
      filterQuery.userId = userId;
    }

    if (claimType) {
      filterQuery.claimType = claimType;
    }

    if (startDate || endDate) {
      filterQuery.createdAt = {};
      if (startDate) filterQuery.createdAt.$gte = new Date(startDate);
      if (endDate) filterQuery.createdAt.$lte = new Date(endDate);
    }

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [claims, totalCount] = await Promise.all([
      Claim.find(filterQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email avatar')
        .select('-__v'),
      Claim.countDocuments(filterQuery)
    ]);

    res.json({
      claims,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalClaims: totalCount,
        hasNextPage: pageNum * limitNum < totalCount,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
});

/**
 * @route   GET /api/claims/user/:userId
 * @desc    Get claim history for a specific user
 * @access  Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const claims = await Claim.getUserClaimHistory(userId, parseInt(limit));

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
        claimsCount: user.claimsCount
      },
      claims
    });
  } catch (error) {
    console.error('Error fetching user claims:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Failed to fetch user claims', error: error.message });
  }
});

/**
 * @route   GET /api/claims/recent
 * @desc    Get recent claims across all users
 * @access  Public
 */
router.get('/recent', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const claims = await Claim.getRecentClaims(parseInt(limit));

    res.json({
      claims,
      count: claims.length
    });
  } catch (error) {
    console.error('Error fetching recent claims:', error);
    res.status(500).json({ message: 'Failed to fetch recent claims', error: error.message });
  }
});

/**
 * @route   GET /api/claims/stats/today
 * @desc    Get today's claim statistics
 * @access  Public
 */
router.get('/stats/today', async (req, res) => {
  try {
    const stats = await Claim.getTodayStats();

    res.json(stats[0] || {
      totalPoints: 0,
      totalClaims: 0,
      averagePoints: 0
    });
  } catch (error) {
    console.error('Error fetching today stats:', error);
    res.status(500).json({ message: 'Failed to fetch today statistics', error: error.message });
  }
});

/**
 * @route   GET /api/claims/stats/summary
 * @desc    Get overall claim statistics
 * @access  Public
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Claim.aggregate([
      { $match: { isValid: true } },
      {
        $group: {
          _id: null,
          totalClaims: { $sum: 1 },
          totalPoints: { $sum: '$points' },
          averagePoints: { $avg: '$points' },
          minPoints: { $min: '$points' },
          maxPoints: { $max: '$points' }
        }
      }
    ]);

    const pointsDistribution = await Claim.aggregate([
      { $match: { isValid: true } },
      {
        $group: {
          _id: '$points',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: stats[0] || {
        totalClaims: 0,
        totalPoints: 0,
        averagePoints: 0,
        minPoints: 0,
        maxPoints: 0
      },
      pointsDistribution
    });
  } catch (error) {
    console.error('Error fetching claim stats:', error);
    res.status(500).json({ message: 'Failed to fetch claim statistics', error: error.message });
  }
});

/**
 * @route   DELETE /api/claims/:id
 * @desc    Invalidate a claim (soft delete)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { isValid: false },
      { new: true }
    ).populate('userId', 'name email avatar');

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Update user's total points (subtract the invalidated claim)
    await User.findByIdAndUpdate(
      claim.userId._id,
      {
        $inc: { 
          totalPoints: -claim.points,
          claimsCount: -1
        }
      }
    );

    res.json({
      message: 'Claim invalidated successfully',
      claim
    });
  } catch (error) {
    console.error('Error invalidating claim:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Claim not found' });
    }
    
    res.status(500).json({ message: 'Failed to invalidate claim', error: error.message });
  }
});

export default router;