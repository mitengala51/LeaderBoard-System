import mongoose from 'mongoose';

const claimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  points: {
    type: Number,
    required: [true, 'Points are required'],
    min: [1, 'Points must be at least 1'],
    max: [10, 'Points cannot exceed 10']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    default: 'Random points claim'
  },
  claimType: {
    type: String,
    enum: ['random', 'bonus', 'manual'],
    default: 'random'
  },
  isValid: {
    type: Boolean,
    default: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: {
      type: String,
      default: 'web'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
claimSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Index for efficient querying
claimSchema.index({ userId: 1, createdAt: -1 });
claimSchema.index({ createdAt: -1 });
claimSchema.index({ isValid: 1 });

// Static method to get user's claim history
claimSchema.statics.getUserClaimHistory = function(userId, limit = 50) {
  return this.find({ userId, isValid: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email avatar')
    .select('-__v');
};

// Static method to get recent claims for all users
claimSchema.statics.getRecentClaims = function(limit = 20) {
  return this.find({ isValid: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email avatar')
    .select('-__v');
};

// Static method to get total points claimed today
claimSchema.statics.getTodayStats = function() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay },
        isValid: true
      }
    },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$points' },
        totalClaims: { $sum: 1 },
        averagePoints: { $avg: '$points' }
      }
    }
  ]);
};

// Pre-save middleware for validation
claimSchema.pre('save', function(next) {
  // Ensure points are within valid range
  if (this.points < 1 || this.points > 10) {
    return next(new Error('Points must be between 1 and 10'));
  }
  next();
});

// Post-save middleware to update user's total points
claimSchema.post('save', async function(doc) {
  try {
    if (doc.isValid) {
      const User = mongoose.model('User');
      await User.findByIdAndUpdate(
        doc.userId,
        {
          $inc: { 
            totalPoints: doc.points,
            claimsCount: 1
          },
          $set: { lastActivity: new Date() }
        }
      );
    }
  } catch (error) {
    console.error('Error updating user points:', error);
  }
});

export default mongoose.model('Claim', claimSchema);