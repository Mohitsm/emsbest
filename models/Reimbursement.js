
import mongoose from 'mongoose';

const reimbursementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    category: {
      type: String,
      enum: ['Travel', 'Food', 'Medical', 'Internet', 'Office Expense', 'Other'],
      required: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    proof: {
      type: String
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid'],
      default: 'pending'
    },

    adminRemarks: {
      type: String,
      trim: true
    },

    isPaid: {
      type: Boolean,
      default: false
    },

    isLocked: {
      type: Boolean,
      default: false
    },

    dateOfExpense: {
      type: Date,
      default: Date.now
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    },

    paidAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* =========================
   Indexes
========================= */
reimbursementSchema.index({ user: 1, createdAt: -1 });
reimbursementSchema.index({ createdByAdmin: 1, status: 1 });
reimbursementSchema.index({ status: 1, createdAt: -1 });

/* =========================
   Virtuals
========================= */
reimbursementSchema.virtual('statusText').get(function () {
  const statusMap = {
    pending: 'Pending Review',
    approved: 'Approved',
    rejected: 'Rejected',
    paid: 'Paid'
  };
  return statusMap[this.status] || this.status;
});

/* =========================
   Middleware (FIXED ✅)
========================= */
reimbursementSchema.pre('save', async function () {
  // Auto set createdByAdmin
  if (this.isNew && !this.createdByAdmin) {
    const User = mongoose.model('User');
    const user = await User.findById(this.user).select('createdBy');

    if (user?.createdBy) {
      this.createdByAdmin = user.createdBy;
    } else {
      this.createdByAdmin = this.user;
    }
  }

  // When approved
  if (this.isModified('status') && this.status === 'approved') {
    this.approvedAt = new Date();
  }

  // When paid
  if (this.isModified('status') && this.status === 'paid') {
    this.paidAt = new Date();
    this.isPaid = true;
  }
});

/* =========================
   Static Methods
========================= */

// Admin → own reimbursements
reimbursementSchema.statics.findByAdmin = function (adminId) {
  return this.find({ createdByAdmin: adminId })
    .populate('user', 'name email department shifts')
    .populate('approvedBy', 'name email')
    .sort('-createdAt');
};

// Admin stats
reimbursementSchema.statics.getStatsByAdmin = function (adminId) {
  return this.aggregate([
    {
      $match: { createdByAdmin: new mongoose.Types.ObjectId(adminId) }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        statuses: {
          $push: {
            status: '$_id',
            count: '$count',
            totalAmount: '$totalAmount'
          }
        },
        totalReimbursements: { $sum: '$count' },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

// Admin → reimbursements of created users
reimbursementSchema.statics.findByAdminUsers = async function (adminId) {
  const User = mongoose.model('User');

  const users = await User.find({ createdBy: adminId }).select('_id');
  const userIds = users.map(u => u._id);

  return this.find({ user: { $in: userIds } })
    .populate('user', 'name email department shifts')
    .populate('approvedBy', 'name')
    .sort('-createdAt');
};

/* =========================
   Export Model
========================= */
const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema);

export default Reimbursement;
