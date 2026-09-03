import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one subscription per admin
    },
    plan: {
      type: String,
      enum: ['Basic', 'Standard', 'Premium', 'Enterprise'],
      required: true,
    },
    maxUsers: {
      type: Number,
      required: true,
    },
    currentUsers: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

// Static method to get plan limits
subscriptionSchema.statics.getPlanLimits = function (plan) {
  const limits = {
    Basic: 100,
    Standard: 500,
    Premium: 1000,
    Enterprise: 10, // as per requirement (though seems low)
  };
  return limits[plan] || 0;
};

// Instance method to check if can add more users
subscriptionSchema.methods.canAddUser = function () {
  return this.currentUsers < this.maxUsers && this.status === 'active';
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
export default Subscription;