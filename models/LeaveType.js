
import mongoose from "mongoose"

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ["Casual Leave", "Sick Leave", "Annual Leave", "Unpaid Leave", "Maternity Leave", "Paternity Leave", "Bereavement Leave", "Compensatory Off", "Study Leave"],
    },
    daysPerYear: {
      type: Number,
      required: true,
      default: 0,
    },
    company: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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

// Unique constraint for name and company combination
leaveTypeSchema.index(
  { name: 1, company: 1 },
  { unique: true, name: "name_1_company_1" }
)

const LeaveType = mongoose.model("LeaveType", leaveTypeSchema)
export default LeaveType