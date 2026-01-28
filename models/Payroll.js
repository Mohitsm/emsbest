

import mongoose from "mongoose"

const payrollSchema = new mongoose.Schema(
  {
    // ================= USER =================
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // ================= PERIOD =================
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

    // ================= BASE SALARY =================
    basicSalary: {
      type: Number,
      required: true,
    },
    totalCalendarDays: {
      type: Number,
      required: true,
    },
    weeklyOffDays: {
      type: Number,
      default: 0,
    },
    totalWorkingDays: {
      type: Number,
      required: true,
    },

    // ================= ATTENDANCE =================
    holidayDays: {
      type: Number,
      default: 0,
    },
    leaveDays: {
      type: Number,
      default: 0,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    halfDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
    },

    // ================= RATES =================
    paidDaySalary: {
      type: Number,
      required: true,
    },
    paidHourRate: {
      type: Number,
      required: true,
    },

    // ================= EARNINGS =================
    presentSalary: {
      type: Number,
      default: 0,
    },
    halfDaySalary: {
      type: Number,
      default: 0,
    },
    holidaySalary: {
      type: Number,
      default: 0,
    },
    leaveSalary: {
      type: Number,
      default: 0,
    },
    overtimeSalary: {
      type: Number,
      default: 0,
    },

    totalPaidDays: {
      type: Number,
      default: 0,
    },

    // ================= ALLOWANCES =================
    allowances: {
      type: Number,
      default: 0,
    },

    // ================= DEDUCTIONS =================
    salaryDeductions: {
      type: Number,
      default: 0,
    },
    absentDeductions: {
      type: Number,
      default: 0,
    },
    advancePayment: {
      type: Number,
      default: 0,
    },
    advancedPaymentDeduction: {
      type: Number,
      default: 0,
    },
    totalDeductions: {
      type: Number,
      default: 0,
    },

    // ================= TOTAL =================
    grossSalary: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
    },

    // ================= PAYMENT =================
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "failed"],
      default: "pending",
    },
    paidDate: Date,
    payslipUrl: String,
    notes: String,

    // ================= AUDIT =================
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: Date,
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// ================= VIRTUAL =================
payrollSchema.virtual("monthYear").get(function () {
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ]
  return `${monthNames[this.month - 1]} ${this.year}`
})

// ================= INDEXES =================
payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true })
payrollSchema.index({ paymentStatus: 1 })
payrollSchema.index({ month: 1, year: 1 })
payrollSchema.index({ generatedBy: 1 })

// ================= PRE-SAVE MIDDLEWARE =================
payrollSchema.pre("save", function () {
  if (this.isLocked) return

  const financialFields = [
    "basicSalary",
    "paidDaySalary",
    "paidHourRate",
    "presentSalary",
    "halfDaySalary",
    "holidaySalary",
    "leaveSalary",
    "overtimeSalary",
    "allowances",
    "salaryDeductions",
    "absentDeductions",
    "advancePayment",
    "advancedPaymentDeduction",
    "totalDeductions",
    "grossSalary",
    "netSalary",
  ]

  financialFields.forEach((field) => {
    if (typeof this[field] === "number") {
      this[field] = Math.round(this[field] * 100) / 100
    }
  })
})

// ================= MODEL =================
const Payroll = mongoose.model("Payroll", payrollSchema)
export default Payroll