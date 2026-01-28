
import mongoose from "mongoose"

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    numberOfDays: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    document: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvalRemarks: {
      type: String,
    },
    year: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
  },
  {
    timestamps: true,
  },
)

// Index for faster queries
leaveSchema.index({ userId: 1, status: 1 })
leaveSchema.index({ approvedBy: 1, status: 1 })

const Leave = mongoose.model("Leave", leaveSchema)
export default Leave