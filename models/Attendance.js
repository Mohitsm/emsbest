
import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },
    punchInTime: Date,
    punchOutTime: Date,
    workingHours: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "on-leave", "holiday"],
      default: "present"
    },
    remark: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

// One attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// ✅ FIXED pre-save hook - Set adminId from user
attendanceSchema.pre("save", async function () {
  // Only process if userId exists
  if (this.userId) {
    const User = mongoose.model("User");
    const user = await User.findById(this.userId);
    
    if (user) {
      // Set adminId from user's adminId or createdBy
      if (user.adminId) {
        this.adminId = user.adminId;
      } else if (user.createdBy) {
        this.adminId = user.createdBy;
      }
    }
  }
});

attendanceSchema.plugin(mongoosePaginate);

const Attendance = mongoose.model("Attendance", attendanceSchema);
export default Attendance;