import express from 'express';
import User from '../models/User.js';
import { validateUser, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all active users
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', sortBy = 'name' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {
      isActive: true,
      ...(search && {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      })
    };

    // Build sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortBy === 'totalPoints' ? -1 : 1;

    const [users, totalCount] = await Promise.all([
      User.find(searchQuery)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .select('-__v'),
      User.countDocuments(searchQuery)
    ]);

    res.json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalUsers: totalCount,
        hasNextPage: pageNum * limitNum < totalCount,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Failed to fetch user', error: error.message });
  }
});

/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Public
 */
router.post('/', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim()
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
        claimsCount: user.claimsCount,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    res.status(500).json({ message: 'Failed to create user', error: error.message });
  }
});

/**
 * @route   PUT /api/users/:id
 * @desc    Update user information
 * @access  Public
 */
router.put('/:id', validateUser, handleValidationErrors, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Check if email is being changed to an existing one
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.toLowerCase().trim() })
      },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    
    res.status(500).json({ message: 'Failed to update user', error: error.message });
  }
});

/**
 * @route   DELETE /api/users/:id
 * @desc    Deactivate user (soft delete)
 * @access  Public
 */
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-__v');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    console.error('Error deactivating user:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Failed to deactivate user', error: error.message });
  }
});

/**
 * @route   GET /api/users/stats/summary
 * @desc    Get user statistics summary
 * @access  Public
 */
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          totalPoints: { $sum: '$totalPoints' },
          totalClaims: { $sum: '$claimsCount' },
          averagePoints: { $avg: '$totalPoints' }
        }
      }
    ]);

    res.json(stats[0] || {
      totalUsers: 0,
      totalPoints: 0,
      totalClaims: 0,
      averagePoints: 0
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics', error: error.message });
  }
});

export default router;