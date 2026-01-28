

import mongoose from 'mongoose';

/* =========================
   SCHEMA
========================= */
const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },

    content: {
      type: String,
      required: true,
      trim: true
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },

    targetAudience: {
      type: [String],
      enum: [
        'all',
        'admin',
        'user',
        'super_admin',
        'Engineering',
        'HR',
        'Sales',
        'Marketing',
        'Finance',
        'Operations'
      ],
      default: ['all']
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    validUntil: {
      type: Date,
      index: true
    },

    tags: [{ type: String, trim: true }],

    attachments: [
      {
        fileName: { type: String, required: true },
        originalName: { type: String, required: true },
        fileType: { type: String, required: true },
        fileSize: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now }
      }
    ],

    views: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        viewedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    viewCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        delete ret.views;
        return ret;
      }
    },
    toObject: {
      virtuals: true,
      transform(_, ret) {
        delete ret.views;
        return ret;
      }
    }
  }
);

/* =========================
   INDEXES
========================= */
announcementSchema.index({ adminId: 1, createdAt: -1 });
announcementSchema.index({ isActive: 1, validUntil: 1 });
announcementSchema.index({ targetAudience: 1 });
announcementSchema.index({ priority: 1 });
announcementSchema.index({ createdAt: -1 });

/* =========================
   VIRTUALS
========================= */
announcementSchema.virtual('isExpired').get(function () {
  if (!this.validUntil) return false;
  return new Date() > this.validUntil;
});

/* =========================
   MIDDLEWARE
========================= */

// Auto assign adminId
announcementSchema.pre('save', async function () {
  if (!this.isNew) return;

  try {
    const User = mongoose.model('User');
    const creator = await User.findById(this.createdBy);

    if (!creator) {
      this.adminId = this.createdBy;
      return;
    }

    if (['admin', 'super_admin'].includes(creator.role)) {
      this.adminId = creator._id;
    } else if (creator.role === 'user' && creator.createdBy) {
      this.adminId = creator.createdBy;
    } else {
      this.adminId = this.createdBy;
    }
  } catch (err) {
    console.error('adminId auto-assign failed:', err);
    this.adminId = this.createdBy;
  }
});

// ✅ SAFE FILE CLEANUP (NO next() USED)
announcementSchema.pre('remove', async function () {
  try {
    if (!this.attachments?.length) return;

    const fs = await import('fs');
    const path = await import('path');

    for (const file of this.attachments) {
      const filePath = path.join(
        process.cwd(),
        'uploads',
        'announcements',
        file.fileName
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (err) {
    console.error('File cleanup failed:', err);
  }
});

/* =========================
   METHODS
========================= */

// Track views
announcementSchema.methods.trackView = async function (userId) {
  const viewed = this.views.some(
    v => v.userId.toString() === userId.toString()
  );

  if (!viewed) {
    this.views.push({ userId });
    this.viewCount += 1;
    await this.save();
  }
};

// Access control
announcementSchema.methods.canAccess = function (user) {
  if (user.role === 'super_admin') return true;
  if (!this.isActive) return false;
  if (this.validUntil && new Date() > this.validUntil) return false;

  if (this.targetAudience.includes('all')) return true;
  if (this.targetAudience.includes(user.role)) return true;
  if (this.targetAudience.includes(user.department)) return true;

  if (
    user.role === 'user' &&
    user.createdBy?.toString() === this.adminId?.toString()
  ) {
    return true;
  }

  if (
    user.role === 'admin' &&
    user._id.toString() === this.adminId?.toString()
  ) {
    return true;
  }

  return false;
};

/* =========================
   MODEL
========================= */
const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
