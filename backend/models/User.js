import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters long'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  avatar: {
    type: String,
    default: function() {
      // Generate avatar URL using the user's name
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=random&size=100`;
    }
  },
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  claimsCount: {
    type: Number,
    default: 0,
    min: [0, 'Claims count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for average points per claim
userSchema.virtual('averagePoints').get(function() {
  return this.claimsCount > 0 ? (this.totalPoints / this.claimsCount).toFixed(2) : 0;
});

// Index for efficient querying
userSchema.index({ totalPoints: -1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Pre-save middleware to update lastActivity
userSchema.pre('save', function(next) {
  if (this.isModified('totalPoints') || this.isModified('claimsCount')) {
    this.lastActivity = new Date();
  }
  next();
});

// Static method to get top users
userSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ totalPoints: -1, createdAt: 1 })
    .limit(limit)
    .select('-__v');
};

// Instance method to add points
userSchema.methods.addPoints = function(points) {
  this.totalPoints += points;
  this.claimsCount += 1;
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to deactivate user
userSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

export default mongoose.model('User', userSchema);