import mongoose from "mongoose"

const advancePaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: String,
    },
    employeeName: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "deducted"],
      default: "pending",
    },
    deductionStatus: {
      type: String,
      enum: ["pending", "deducted", "partially_deducted"],
      default: "pending",
    },
    deductedAmount: {
      type: Number,
      default: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
    },
    deductedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
)

// Virtual for month-year
advancePaymentSchema.virtual("monthYear").get(function () {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]
  return `${monthNames[this.month - 1]} ${this.year}`
})

// Indexes
advancePaymentSchema.index({ userId: 1, month: 1, year: 1 })
advancePaymentSchema.index({ status: 1 })
advancePaymentSchema.index({ deductionStatus: 1 })
advancePaymentSchema.index({ createdBy: 1 })

// Pre-save middleware
advancePaymentSchema.pre("save", function () {
  if (typeof this.amount === "number") {
    this.amount = Math.round(this.amount * 100) / 100
  }
  if (typeof this.deductedAmount === "number") {
    this.deductedAmount = Math.round(this.deductedAmount * 100) / 100
  }
  if (typeof this.balanceAmount === "number") {
    this.balanceAmount = Math.round(this.balanceAmount * 100) / 100
  }
})

const AdvancePayment = mongoose.model("AdvancePayment", advancePaymentSchema)
export default AdvancePayment