
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    role: {
      type: String,
      enum: ['super_admin', 'admin', 'user'],
      default: 'user'
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    company: {
      type: String,
      required: true
    },

    department: {
      type: String,
      enum: ['Engineering', 'HR', 'Sales', 'Marketing', 'Finance', 'Operations'],
      default: 'Operations'
    },

    shifts: {
      type: String,
      enum: [
        'Morning (9 AM - 6 PM)',
        'Flexible (10 AM - 7 PM)',
        'Night (7 PM - 4 AM)',
        'General (8 AM - 5 PM)'
      ],
      default: 'General (8 AM - 5 PM)'
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    isActive: {
      type: Boolean,
      default: true
    },

    lastPasswordChange: {
      type: Date,
      default: Date.now
    },

   
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* =========================
   VIRTUAL RELATIONS
========================= */
userSchema.virtual('managedUsers', {
  ref: 'User',
  localField: '_id',
  foreignField: 'adminId'
});

userSchema.virtual('attendanceRecords', {
  ref: 'Attendance',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('leaves', {
  ref: 'Leave',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('salary', {
  ref: 'Salary',
  localField: '_id',
  foreignField: 'userId'
});

userSchema.virtual('reimbursements', {
  ref: 'Reimbursement',
  localField: '_id',
  foreignField: 'user'
});

userSchema.virtual('announcements', {
  ref: 'Announcement',
  localField: '_id',
  foreignField: 'adminId'
});

/* =========================
   PASSWORD HASH (SAFE)
========================= */
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.lastPasswordChange = Date.now();
});

/* =========================
   INSTANCE METHODS
========================= */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.isSuperAdmin = function () {
  return this.role === 'super_admin';
};

userSchema.methods.isAdmin = function () {
  return this.role === 'admin' || this.role === 'super_admin';
};

userSchema.methods.isManagedBy = function (adminId) {
  return this.createdBy && this.createdBy.toString() === adminId.toString();
};

userSchema.methods.getAdminHierarchy = async function () {
  if (this.role === 'super_admin') {
    return { admin: null, superAdmin: this._id };
  }
  
  if (this.role === 'admin') {
    return { admin: this._id, superAdmin: null };
  }
  
  if (this.role === 'user') {
    const admin = await mongoose.model('User').findById(this.createdBy);
    return { 
      admin: this.createdBy, 
      superAdmin: admin?.role === 'super_admin' ? this.createdBy : null 
    };
  }
  
  return { admin: null, superAdmin: null };
};

/* =========================
   STATIC METHODS
========================= */
userSchema.statics.getAdminUsers = function () {
  return this.find({ role: { $in: ['admin', 'super_admin'] } })
    .select('_id name email role company department isActive createdAt')
    .sort('name');
};

userSchema.statics.getUsersByAdmin = function (adminId) {
  return this.find({ 
    $or: [
      { adminId: adminId },
      { createdBy: adminId }
    ],
    role: 'user'
  })
    .select('_id name email department shifts isActive createdAt')
    .sort('-createdAt');
};

// Get all admins with stats
userSchema.statics.getAllAdminsWithStats = async function () {
  return this.aggregate([
    {
      $match: {
        role: { $in: ['admin', 'super_admin'] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'createdBy',
        as: 'managedUsers'
      }
    },
    {
      $lookup: {
        from: 'announcements',
        localField: '_id',
        foreignField: 'adminId',
        as: 'announcements'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        company: 1,
        department: 1,
        shifts: 1,
        isActive: 1,
        createdAt: 1,
        totalManagedUsers: { $size: '$managedUsers' },
        activeManagedUsers: {
          $size: {
            $filter: {
              input: '$managedUsers',
              as: 'user',
              cond: { $eq: ['$$user.isActive', true] }
            }
          }
        },
        totalAnnouncements: { $size: '$announcements' },
        activeAnnouncements: {
          $size: {
            $filter: {
              input: '$announcements',
              as: 'ann',
              cond: { $eq: ['$$ann.isActive', true] }
            }
          }
        }
      }
    },
    {
      $sort: { name: 1 }
    }
  ]);
};

// Get admin by ID with detailed stats
userSchema.statics.getAdminByIdWithStats = async function (adminId) {
  const result = await this.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(adminId),
        role: { $in: ['admin', 'super_admin'] }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'createdBy',
        as: 'managedUsers'
      }
    },
    {
      $lookup: {
        from: 'announcements',
        localField: '_id',
        foreignField: 'adminId',
        as: 'announcements'
      }
    },
    {
      $lookup: {
        from: 'reimbursements',
        localField: '_id',
        foreignField: 'createdByAdmin',
        as: 'adminReimbursements'
      }
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        role: 1,
        company: 1,
        department: 1,
        shifts: 1,
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        profilePicture: 1,
        managedUsers: {
          $map: {
            input: '$managedUsers',
            as: 'user',
            in: {
              _id: '$$user._id',
              name: '$$user.name',
              email: '$$user.email',
              department: '$$user.department',
              shifts: '$$user.shifts',
              isActive: '$$user.isActive',
              createdAt: '$$user.createdAt'
            }
          }
        },
        announcements: {
          $map: {
            input: '$announcements',
            as: 'ann',
            in: {
              _id: '$$ann._id',
              title: '$$ann.title',
              priority: '$$ann.priority',
              isActive: '$$ann.isActive',
              createdAt: '$$ann.createdAt'
            }
          }
        },
        stats: {
          totalManagedUsers: { $size: '$managedUsers' },
          activeManagedUsers: {
            $size: {
              $filter: {
                input: '$managedUsers',
                as: 'user',
                cond: { $eq: ['$$user.isActive', true] }
              }
            }
          },
          totalAnnouncements: { $size: '$announcements' },
          activeAnnouncements: {
            $size: {
              $filter: {
                input: '$announcements',
                as: 'ann',
                cond: { $eq: ['$$ann.isActive', true] }
              }
            }
          },
          totalReimbursements: { $size: '$adminReimbursements' },
          pendingReimbursements: {
            $size: {
              $filter: {
                input: '$adminReimbursements',
                as: 'reimbursement',
                cond: { $eq: ['$$reimbursement.status', 'pending'] }
              }
            }
          }
        }
      }
    }
  ]);

  return result[0] || null;
};

// Get all users managed by admin (for announcements targeting)
userSchema.statics.getManagedUsersByAdmin = function (adminId) {
  return this.find({
    $or: [
      { adminId: adminId },
      { createdBy: adminId }
    ],
    role: 'user',
    isActive: true
  })
    .select('_id name email department shifts createdAt')
    .sort('name');
};

// Check if user belongs to admin
userSchema.statics.isUserUnderAdmin = async function (userId, adminId) {
  const user = await this.findById(userId);
  if (!user) return false;
  
  if (user.role === 'super_admin') return true;
  if (user.role === 'admin' && user._id.toString() === adminId.toString()) return true;
  
  return user.createdBy && user.createdBy.toString() === adminId.toString();
};

const User = mongoose.model('User', userSchema);
export default User;