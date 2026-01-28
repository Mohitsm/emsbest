

import mongoose from "mongoose"

const salarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    workingHoursPerDay: {
      type: Number,
      required: true,
      default: 8,
      min: 1,
      max: 24,
    },
    workingDaysPerWeek: {
      type: Number,
      default: 5,
      min: 1,
      max: 7,
    },
    lunchBreakHours: {
      type: Number,
      default: 1,
      min: 0,
    },
    overtimeRate: {
      type: Number,
      required: true,
      default: 1.5,
      min: 1,
    },
    // Allowance components
    houseRentAllowance: {
      type: Number,
      default: 0,
    },
    travelAllowance: {
      type: Number,
      default: 0,
    },
    medicalAllowance: {
      type: Number,
      default: 0,
    },
    specialAllowance: {
      type: Number,
      default: 0,
    },
    // Deduction components
    providentFund: {
      type: Number,
      default: 0,
    },
    professionalTax: {
      type: Number,
      default: 0,
    },
    incomeTax: {
      type: Number,
      default: 0,
    },
    otherDeductions: {
      type: Number,
      default: 0,
    },
    // Additional information
    currencyType: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "cash", "cheque", "online"],
      default: "bank_transfer",
    },
    bankAccount: {
      accountNumber: String,
      bankName: String,
      ifscCode: String,
      branch: String,
    },
    effectiveFrom: {
      type: Date,
      default: Date.now,
    },
    effectiveTo: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    remark: {
      type: String,
    },
    // Audit trail
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Virtual for total allowance
salarySchema.virtual("totalAllowance").get(function () {
  return this.houseRentAllowance + this.travelAllowance + 
         this.medicalAllowance + this.specialAllowance
})

// Virtual for total deductions
salarySchema.virtual("totalDeductions").get(function () {
  return this.providentFund + this.professionalTax + 
         this.incomeTax + this.otherDeductions
})

// Virtual for gross salary (basic + allowances)
salarySchema.virtual("grossSalary").get(function () {
  return this.basicSalary + this.totalAllowance
})

// Virtual for net salary (gross - deductions)
salarySchema.virtual("netSalary").get(function () {
  return this.grossSalary - this.totalDeductions
})

// Indexes
salarySchema.index({ userId: 1 }, { unique: true })
salarySchema.index({ isActive: 1 })
salarySchema.index({ effectiveFrom: 1, effectiveTo: 1 })

// Pre-save middleware for rounding
salarySchema.pre("save", function () {
  const financialFields = [
    "basicSalary",
    "houseRentAllowance",
    "travelAllowance",
    "medicalAllowance",
    "specialAllowance",
    "providentFund",
    "professionalTax",
    "incomeTax",
    "otherDeductions",
  ]

  financialFields.forEach((field) => {
    if (typeof this[field] === "number") {
      this[field] = Math.round(this[field] * 100) / 100
    }
  })
})

const Salary = mongoose.model("Salary", salarySchema)
export default Salary