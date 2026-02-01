// import mongoose from "mongoose";

// const educationSchema = new mongoose.Schema({
//   degree: {
//     type: String,
//     required: true,
//   },
//   institution: {
//     type: String,
//     required: true,
//   },
//   year: {
//     type: String,
//     required: true,
//   },
//   percentage: {
//     type: String,
//   },
//   grade: {
//     type: String,
//   },
//   specialization: {
//     type: String,
//   },
// });

// const experienceSchema = new mongoose.Schema({
//   position: {
//     type: String,
//     required: true,
//   },
//   company: {
//     type: String,
//     required: true,
//   },
//   duration: {
//     type: String,
//     required: true,
//   },
//   description: {
//     type: String,
//   },
//   location: {
//     type: String,
//   },
//   type: {
//     type: String,
//     enum: ["Full-time", "Part-time", "Contract", "Internship"],
//     default: "Full-time",
//   },
// });

// const skillSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//   },
//   level: {
//     type: String,
//     enum: ["Beginner", "Intermediate", "Expert", "Advanced"],
//     default: "Intermediate",
//   },
// });

// const userProfileSchema = new mongoose.Schema(
//   {
//     userId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       unique: true,
//     },
//     phone: {
//       type: String,
//     },
//     address: {
//       type: String,
//     },
//     birthDate: {
//       type: Date,
//     },
//     position: {
//       type: String,
//     },
//     avatar: {
//       type: String,
//       default: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
//     },
//     coverPhoto: {
//       type: String,
//     },
//     bio: {
//       type: String,
//     },
//     username: {
//       type: String,
//     },
//     education: [educationSchema],
//     experience: [experienceSchema],
//     skills: [skillSchema],
    
//     // Social links
//     linkedin: {
//       type: String,
//     },
//     github: {
//       type: String,
//     },
//     twitter: {
//       type: String,
//     },
    
//     // Emergency contact
//     emergencyContact: {
//       name: String,
//       phone: String,
//       relationship: String,
//     },
    
//     // Additional info
//     bloodGroup: {
//       type: String,
//       enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", null],
//     },
//     maritalStatus: {
//       type: String,
//       enum: ["Single", "Married", "Divorced", "Widowed", null],
//     },
    
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//   }
// );

// // Indexes
// userProfileSchema.index({ username: 1 }, { unique: true, sparse: true });
// userProfileSchema.index({ position: 1 });
// userProfileSchema.index({ isActive: 1 });

// // Virtual populate to get user data
// userProfileSchema.virtual("user", {
//   ref: "User",
//   localField: "userId",
//   foreignField: "_id",
//   justOne: true,
// });

// // Pre-save to ensure username uniqueness
// userProfileSchema.pre("save", async function () {
//   if (this.isModified("username") && this.username) {
//     const existing = await mongoose
//       .model("UserProfile")
//       .findOne({
//         username: this.username,
//         _id: { $ne: this._id },
//       });

//     if (existing) {
//       throw new Error("Username already exists");
//     }
//   }
// });


// const UserProfile = mongoose.model("UserProfile", userProfileSchema);
// export default UserProfile;

// models/UserProfile.js
import mongoose from "mongoose";

const educationSchema = new mongoose.Schema({
  degree: {
    type: String,
    required: [true, 'Degree is required'],
    trim: true
  },
  institution: {
    type: String,
    required: [true, 'Institution is required'],
    trim: true
  },
  year: {
    type: String,
    required: [true, 'Year is required'],
    trim: true
  },
  percentage: {
    type: String,
    trim: true
  },
  grade: {
    type: String,
    trim: true
  },
  specialization: {
    type: String,
    trim: true
  },
}, { _id: true, timestamps: false });

const experienceSchema = new mongoose.Schema({
  position: {
    type: String,
    required: [true, 'Position is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company is required'],
    trim: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ["Full-time", "Part-time", "Contract", "Internship"],
    default: "Full-time",
  },
}, { _id: true, timestamps: false });

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Skill name is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced", "Expert"],
    default: "Intermediate",
  },
}, { _id: true, timestamps: false });

const userProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    birthDate: {
      type: Date,
    },
    position: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      default: "https://api.dicebear.com/7.x/avataaars/svg?seed=User",
    },
    coverPhoto: {
      type: String,
    },
    bio: {
      type: String,
      trim: true
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [skillSchema],
    
    // Social links
    linkedin: {
      type: String,
      trim: true
    },
    github: {
      type: String,
      trim: true
    },
    twitter: {
      type: String,
      trim: true
    },
    
    // Emergency contact
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    
    // Additional info
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-", null],
    },
    maritalStatus: {
      type: String,
      enum: ["Single", "Married", "Divorced", "Widowed", null],
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userProfileSchema.index({ username: 1 }, { unique: true, sparse: true });
userProfileSchema.index({ position: 1 });
userProfileSchema.index({ isActive: 1 });

// Virtual populate to get user data
userProfileSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Pre-save to ensure username uniqueness
userProfileSchema.pre("save", async function () {
  if (this.isModified("username") && this.username) {
    const existing = await mongoose
      .model("UserProfile")
      .findOne({
        username: this.username,
        _id: { $ne: this._id },
      });

    if (existing) {
      throw new Error("Username already exists");
    }
  }
});

const UserProfile = mongoose.model("UserProfile", userProfileSchema);
export default UserProfile;