import AdvancePayment from "../models/AdvancePayment.js"
import User from "../models/User.js"
import Payroll from "../models/Payroll.js"

/* =========================
   Create Advance Payment
   POST /api/advance-payments
   Private (Admin/Super Admin)
========================= */
export const createAdvancePayment = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create advance payments",
      })
    }

    const { userId, amount, month, year, reason } = req.body

    // Validation
    if (!userId || !amount || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "User ID, amount, month, and year are required",
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      })
    }

    // Get user information
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Check if user belongs to same company
    if (user.company !== req.user.company) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this user",
      })
    }

    // Create advance payment
    const advancePayment = await AdvancePayment.create({
      userId,
      employeeId: user.employeeId,
      employeeName: user.name,
      amount,
      month,
      year,
      reason,
      balanceAmount: amount,
      createdBy: req.user._id,
    })

    const populatedAdvance = await AdvancePayment.findById(advancePayment._id)
      .populate("userId", "name email employeeId department")
      .populate("createdBy", "name email")

    res.status(201).json({
      success: true,
      message: "Advance payment created successfully",
      data: populatedAdvance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating advance payment",
      error: error.message,
    })
  }
}

/* =========================
   Get Advance Payments
   GET /api/advance-payments
   Private
========================= */
export const getAdvancePayments = async (req, res) => {
  try {
    const {
      userId,
      month,
      year,
      status,
      deductionStatus,
      page = 1,
      limit = 10,
      search,
    } = req.query

    const query = {}

    // Authorization: Users can only view their own advance payments
    if (req.user.role === "user") {
      query.userId = req.user._id
    } else {
      // Admin can view all advance payments for their company
      if (userId) {
        const user = await User.findById(userId)
        if (user && user.company === req.user.company) {
          query.userId = userId
        }
      } else {
        // Get all users in the company
        const companyUsers = await User.find({ 
          company: req.user.company 
        }).select("_id")
        query.userId = { $in: companyUsers.map(u => u._id) }
      }
    }

    // Apply filters
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)
    if (status) query.status = status
    if (deductionStatus) query.deductionStatus = deductionStatus

    // Search functionality
    if (search) {
      const users = await User.find({
        company: req.user.company,
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id")
      
      query.userId = { $in: users.map(u => u._id) }
    }

    // Pagination
    const pageNumber = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNumber - 1) * pageSize

    // Get advance payments
    const advancePayments = await AdvancePayment.find(query)
      .populate("userId", "name email employeeId department")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)

    // Get total count
    const total = await AdvancePayment.countDocuments(query)

    res.status(200).json({
      success: true,
      count: advancePayments.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      data: advancePayments,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching advance payments",
      error: error.message,
    })
  }
}

/* =========================
   Get Advance Payment by ID
   GET /api/advance-payments/:id
   Private
========================= */
export const getAdvancePaymentById = async (req, res) => {
  try {
    const advancePayment = await AdvancePayment.findById(req.params.id)
      .populate("userId", "name email employeeId department")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")

    if (!advancePayment) {
      return res.status(404).json({
        success: false,
        message: "Advance payment not found",
      })
    }

    // Authorization check
    if (req.user.role === "user" && 
        req.user._id.toString() !== advancePayment.userId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this advance payment",
      })
    }

    res.status(200).json({
      success: true,
      data: advancePayment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching advance payment",
      error: error.message,
    })
  }
}

/* =========================
   Update Advance Payment Status
   PUT /api/advance-payments/:id/status
   Private (Admin/Super Admin)
========================= */
export const updateAdvancePaymentStatus = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update advance payment status",
      })
    }

    const { status, reason } = req.body

    // Validate status
    const validStatuses = ["pending", "approved", "rejected", "deducted"]
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      })
    }

    // Find advance payment
    const advancePayment = await AdvancePayment.findById(req.params.id)
    if (!advancePayment) {
      return res.status(404).json({
        success: false,
        message: "Advance payment not found",
      })
    }

    // Check if already deducted
    if (advancePayment.deductionStatus === "deducted" && status !== "deducted") {
      return res.status(400).json({
        success: false,
        message: "Cannot change status of a deducted advance payment",
      })
    }

    // Update status
    advancePayment.status = status
    if (reason) advancePayment.reason = reason
    advancePayment.updatedBy = req.user._id

    // If status is deducted, update deduction info
    if (status === "deducted") {
      advancePayment.deductionStatus = "deducted"
      advancePayment.deductedAt = new Date()
    }

    await advancePayment.save()

    const updatedAdvance = await AdvancePayment.findById(advancePayment._id)
      .populate("userId", "name email employeeId")
      .populate("updatedBy", "name email")

    res.status(200).json({
      success: true,
      message: "Advance payment status updated successfully",
      data: updatedAdvance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating advance payment status",
      error: error.message,
    })
  }
}

/* =========================
   Update Advance Payment
   PUT /api/advance-payments/:id
   Private (Admin/Super Admin)
========================= */
export const updateAdvancePayment = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update advance payment",
      })
    }

    const { amount, reason } = req.body

    // Find advance payment
    const advancePayment = await AdvancePayment.findById(req.params.id)
    if (!advancePayment) {
      return res.status(404).json({
        success: false,
        message: "Advance payment not found",
      })
    }

    // Check if already deducted
    if (advancePayment.deductionStatus === "deducted") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a deducted advance payment",
      })
    }

    // Update fields
    if (amount !== undefined && amount > 0) {
      advancePayment.amount = amount
      advancePayment.balanceAmount = amount - advancePayment.deductedAmount
    }
    if (reason !== undefined) advancePayment.reason = reason
    advancePayment.updatedBy = req.user._id

    await advancePayment.save()

    const updatedAdvance = await AdvancePayment.findById(advancePayment._id)
      .populate("userId", "name email employeeId")
      .populate("updatedBy", "name email")

    res.status(200).json({
      success: true,
      message: "Advance payment updated successfully",
      data: updatedAdvance,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating advance payment",
      error: error.message,
    })
  }
}

/* =========================
   Delete Advance Payment
   DELETE /api/advance-payments/:id
   Private (Admin/Super Admin)
========================= */
export const deleteAdvancePayment = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete advance payment",
      })
    }

    const advancePayment = await AdvancePayment.findById(req.params.id)
    if (!advancePayment) {
      return res.status(404).json({
        success: false,
        message: "Advance payment not found",
      })
    }

    // Check if already deducted
    if (advancePayment.deductionStatus === "deducted") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a deducted advance payment",
      })
    }

    await advancePayment.deleteOne()

    res.status(200).json({
      success: true,
      message: "Advance payment deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting advance payment",
      error: error.message,
    })
  }
}

/* =========================
   Get Advance Payment Summary
   GET /api/advance-payments/summary
   Private (Admin/Super Admin)
========================= */
export const getAdvancePaymentSummary = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view advance payment summary",
      })
    }

    const { month, year } = req.query

    // Get all users in the company
    const companyUsers = await User.find({ 
      company: req.user.company 
    }).select("_id")

    const query = { userId: { $in: companyUsers.map(u => u._id) } }
    
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)

    // Get advance payments
    const advancePayments = await AdvancePayment.find(query)
      .populate("userId", "name employeeId department")

    // Calculate summary
    const summary = {
      totalAdvancePayments: advancePayments.length,
      totalAmount: 0,
      totalDeducted: 0,
      totalBalance: 0,
      statusBreakdown: {
        pending: 0,
        approved: 0,
        rejected: 0,
        deducted: 0,
      },
      deductionStatusBreakdown: {
        pending: 0,
        deducted: 0,
        partially_deducted: 0,
      },
      monthlyBreakdown: {},
    }

    advancePayments.forEach(ap => {
      // Total amounts
      summary.totalAmount += ap.amount
      summary.totalDeducted += ap.deductedAmount
      summary.totalBalance += ap.balanceAmount

      // Status breakdown
      summary.statusBreakdown[ap.status]++
      summary.deductionStatusBreakdown[ap.deductionStatus]++

      // Monthly breakdown
      const monthKey = `${ap.month}/${ap.year}`
      if (!summary.monthlyBreakdown[monthKey]) {
        summary.monthlyBreakdown[monthKey] = {
          count: 0,
          totalAmount: 0,
          month: ap.month,
          year: ap.year,
        }
      }
      summary.monthlyBreakdown[monthKey].count++
      summary.monthlyBreakdown[monthKey].totalAmount += ap.amount
    })

    // Convert to arrays
    summary.monthlyBreakdown = Object.values(summary.monthlyBreakdown)
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.month - a.month
      })

    res.status(200).json({
      success: true,
      data: summary,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching advance payment summary",
      error: error.message,
    })
  }
}

/* =========================
   USER → Create Advance Payment Request
   POST /api/advance-payments
========================= */
export const createAdvancePaymentUser = async (req, res) => {
  try {
    // Only USER can create request
    if (req.user.role !== "user") {
      return res.status(403).json({
        success: false,
        message: "Only employees can request advance payments",
      })
    }

    const { amount, month, year, reason } = req.body

    // Validation
    if (!amount || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "Amount, month, and year are required",
      })
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      })
    }

    const advancePayment = await AdvancePayment.create({
      userId: req.user._id,
      employeeId: req.user.employeeId,
      employeeName: req.user.name,
      amount,
      month,
      year,
      reason,
      balanceAmount: amount,
      status: "pending",
      deductionStatus: "pending",
      createdBy: req.user._id // ✅ FIX
    })

    res.status(201).json({
      success: true,
      message: "Advance payment request submitted",
      data: advancePayment,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating advance payment",
      error: error.message,
    })
  }
}
