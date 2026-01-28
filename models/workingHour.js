import mongoose from "mongoose"

const workingHourSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    hours: {
      type: Number,
      required: true,
      enum: [8, 9, 12],
    },
    lunchBreak: {
      type: Number,
      default: 0.75,
    },
    overtimeMultiplier: {
      type: Number,
      default: 1.5,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const WorkingHour = mongoose.model("WorkingHour", workingHourSchema)
export default WorkingHour
