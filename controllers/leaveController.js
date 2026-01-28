

import Leave from "../models/Leave.js"
import LeaveType from "../models/LeaveType.js"
import Attendance from "../models/Attendance.js"
import User from "../models/User.js"
import mongoose from "mongoose"

/* =========================
   Create Leave Type (Admin)
   POST /api/leaves/types
========================= */
export const createLeaveType = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { name, daysPerYear, description } = req.body

    if (!name || daysPerYear === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and daysPerYear are required",
      })
    }

    const leaveType = await LeaveType.create({
      name,
      daysPerYear,
      description,
      company: req.user.company,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Leave type created successfully",
      data: leaveType,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Leave type with this name already exists for your company",
      })
    }
    res.status(500).json({
      success: false,
      message: "Error creating leave type",
      error: err.message,
    })
  }
}

/* =========================
   Get All Leave Types
   GET /api/leaves/types
========================= */
export const getLeaveTypes = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({ company: req.user.company }).populate("createdBy", "name email")

    res.status(200).json({
      success: true,
      count: leaveTypes.length,
      data: leaveTypes,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave types",
      error: err.message,
    })
  }
}

/* =========================
   Apply for Leave
   POST /api/leaves/apply
   Private
========================= */
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, fromDate, toDate, reason, document } = req.body

    if (!leaveTypeId || !fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      })
    }

    const leaveType = await LeaveType.findById(leaveTypeId)
    if (!leaveType) {
      return res.status(404).json({
        success: false,
        message: "Leave type not found",
      })
    }

    const from = new Date(fromDate)
    const to = new Date(toDate)
    
    // Validate dates
    if (from > to) {
      return res.status(400).json({
        success: false,
        message: "From date cannot be after to date",
      })
    }

    if (from < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot apply for leave in the past",
      })
    }

    const numberOfDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1

    // Get total leave balance
    const currentYear = new Date().getFullYear()
    const approvedLeaves = await Leave.aggregate([
      {
        $match: {
          userId: req.user._id,
          leaveTypeId: new mongoose.Types.ObjectId(leaveTypeId),
          status: "approved",
          year: currentYear,
        },
      },
      {
        $group: {
          _id: null,
          totalDays: { $sum: "$numberOfDays" },
        },
      },
    ])

    const usedDays = approvedLeaves.length > 0 ? approvedLeaves[0].totalDays : 0
    const remainingDays = leaveType.daysPerYear - usedDays

    if (numberOfDays > remainingDays) {
      return res.status(400).json({
        success: false,
        message: `Only ${remainingDays} days remaining for ${leaveType.name}. Requested: ${numberOfDays} days`,
      })
    }

    const leave = await Leave.create({
      userId: req.user._id,
      leaveTypeId,
      fromDate: from,
      toDate: to,
      numberOfDays,
      reason,
      document: document || null,
      year: currentYear,
    })

    // Populate the response
    const populatedLeave = await Leave.findById(leave._id)
      .populate("leaveTypeId", "name")
      .populate("userId", "name email")

    res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      data: populatedLeave,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error applying leave",
      error: err.message,
    })
  }
}

/* =========================
   Get Leave Balance
   GET /api/leaves/balance
   Private
========================= */
export const getLeaveBalance = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear()
    const leaveTypes = await LeaveType.find({ company: req.user.company })

    const balances = await Promise.all(
      leaveTypes.map(async (type) => {
        const approvedLeaves = await Leave.aggregate([
          {
            $match: {
              userId: req.user._id,
              leaveTypeId: type._id,
              status: "approved",
              year: currentYear,
            },
          },
          {
            $group: {
              _id: null,
              totalDays: { $sum: "$numberOfDays" },
            },
          },
        ])

        const usedDays = approvedLeaves.length > 0 ? approvedLeaves[0].totalDays : 0

        return {
          leaveTypeId: type._id,
          leaveTypeName: type.name,
          totalDaysPerYear: type.daysPerYear,
          usedDays,
          remainingDays: type.daysPerYear - usedDays,
          description: type.description,
        }
      }),
    )

    // Calculate total balances
    const totalAllotted = balances.reduce((sum, balance) => sum + balance.totalDaysPerYear, 0)
    const totalUsed = balances.reduce((sum, balance) => sum + balance.usedDays, 0)
    const totalRemaining = balances.reduce((sum, balance) => sum + balance.remainingDays, 0)

    res.status(200).json({
      success: true,
      year: currentYear,
      summary: {
        totalAllotted,
        totalUsed,
        totalRemaining,
      },
      data: balances,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave balance",
      error: err.message,
    })
  }
}

/* =========================
   Get My Leave Requests
   GET /api/leaves/my-leaves
   Private
========================= */
export const getMyLeaves = async (req, res) => {
  try {
    const { status, year } = req.query
    const query = { userId: req.user._id }

    if (status) query.status = status
    if (year) query.year = parseInt(year)

    const leaves = await Leave.find(query)
      .populate("leaveTypeId", "name description")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })

    // Calculate statistics
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
    }

    res.status(200).json({
      success: true,
      stats: stats,
      count: leaves.length,
      data: leaves,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave requests",
      error: err.message,
    })
  }
}

/* =========================
   Get All Leave Requests (Admin - Filtered by admin's users)
   GET /api/leaves/admin/all
   Private (Admin/Super Admin)
========================= */
export const getAllLeaveRequests = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { status, userId, year, leaveTypeId } = req.query
    const query = {}

    // If admin (not super_admin), only show leaves of users they created
    if (req.user.role === "admin") {
      // Get all users created by this admin
      const usersCreatedByAdmin = await User.find({ 
        createdBy: req.user._id 
      }).select('_id')
      
      const userIds = usersCreatedByAdmin.map(user => user._id)
      
      // If specific userId is provided, check if it belongs to admin's users
      if (userId) {
        if (!userIds.includes(new mongoose.Types.ObjectId(userId))) {
          return res.status(403).json({
            success: false,
            message: "Not authorized to view leaves for this user",
          })
        }
        query.userId = userId
      } else {
        // Filter by all users created by this admin
        query.userId = { $in: userIds }
      }
    } else if (userId) {
      // For super_admin, if userId is provided, filter by that user
      query.userId = userId
    }

    // Add other filters
    if (status) query.status = status
    if (year) query.year = parseInt(year)
    if (leaveTypeId) query.leaveTypeId = leaveTypeId

    const leaves = await Leave.find(query)
      .populate({
        path: "userId",
        select: "name email department role createdBy",
        populate: {
          path: "createdBy",
          select: "name email"
        }
      })
      .populate("leaveTypeId", "name")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })

    // Calculate statistics
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
    }

    // Get unique users for filter options
    const uniqueUsers = [...new Set(leaves.map(leave => leave.userId?._id.toString()))]
    const userDetails = leaves.reduce((acc, leave) => {
      if (leave.userId && !acc[leave.userId._id]) {
        acc[leave.userId._id] = {
          id: leave.userId._id,
          name: leave.userId.name,
          email: leave.userId.email,
          department: leave.userId.department
        }
      }
      return acc
    }, {})

    res.status(200).json({
      success: true,
      count: leaves.length,
      stats: stats,
      filters: {
        users: Object.values(userDetails),
        years: [...new Set(leaves.map(l => l.year))].sort((a, b) => b - a)
      },
      data: leaves,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave requests",
      error: err.message,
    })
  }
}

/* =========================
   Approve/Reject Leave (Admin)
   PUT /api/leaves/:id/status
   Private (Admin/Super Admin)
========================= */
export const updateLeaveStatus = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { status, approvalRemarks } = req.body

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      })
    }

    const leave = await Leave.findById(req.params.id)
      .populate("leaveTypeId", "name")
      .populate("userId", "name email createdBy")

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // If admin (not super_admin), check if they can approve this leave
    if (req.user.role === "admin") {
      const user = await User.findById(leave.userId._id)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to approve/reject this leave request",
        })
      }
    }

    // Check if leave is already processed
    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Leave request is already ${leave.status}`,
      })
    }

    // Check leave balance if approving
    if (status === "approved") {
      const currentYear = new Date().getFullYear()
      const approvedLeaves = await Leave.aggregate([
        {
          $match: {
            userId: leave.userId._id,
            leaveTypeId: leave.leaveTypeId._id,
            status: "approved",
            year: currentYear,
            _id: { $ne: leave._id }
          },
        },
        {
          $group: {
            _id: null,
            totalDays: { $sum: "$numberOfDays" },
          },
        },
      ])

      const usedDays = approvedLeaves.length > 0 ? approvedLeaves[0].totalDays : 0
      const remainingDays = leave.leaveTypeId.daysPerYear - usedDays

      if (leave.numberOfDays > remainingDays) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve. Only ${remainingDays} days remaining for ${leave.leaveTypeId.name}. Requested: ${leave.numberOfDays} days`,
        })
      }
    }

    leave.status = status
    leave.approvedBy = req.user._id
    if (approvalRemarks) leave.approvalRemarks = approvalRemarks

    await leave.save()

    // If approved, update attendance records for those dates
    if (status === "approved") {
      const startDate = new Date(leave.fromDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(leave.toDate)
      endDate.setHours(0, 0, 0, 0)

      const dates = []
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d))
      }

      await Promise.all(
        dates.map((date) =>
          Attendance.findOneAndUpdate(
            { userId: leave.userId._id, date },
            {
              isLeave: true,
              leaveType: leave.leaveTypeId.name,
              status: "on-leave",
              leaveId: leave._id
            },
            { upsert: true },
          ),
        ),
      )
    }

    // Populate the updated leave
    const updatedLeave = await Leave.findById(leave._id)
      .populate("leaveTypeId", "name")
      .populate("userId", "name email")
      .populate("approvedBy", "name email")

    res.status(200).json({
      success: true,
      message: `Leave ${status} successfully`,
      data: updatedLeave,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating leave status",
      error: err.message,
    })
  }
}

/* =========================
   Get Leaves for Specific Admin (Super Admin Only)
   GET /api/leaves/admin/:adminId
   Private (Super Admin Only)
========================= */
export const getLeavesByAdminId = async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Only super admin can access this endpoint",
      })
    }

    const { adminId } = req.params
    const { status, year, leaveTypeId } = req.query

    // Verify the admin exists
    const admin = await User.findOne({ 
      _id: adminId,
      role: { $in: ["admin", "super_admin"] }
    })
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      })
    }

    // Get all users created by this admin
    const usersCreatedByAdmin = await User.find({ 
      createdBy: adminId 
    }).select('_id name email department')
    
    const userIds = usersCreatedByAdmin.map(user => user._id)

    if (userIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No users found for this admin",
        count: 0,
        stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
        data: [],
        adminInfo: {
          name: admin.name,
          email: admin.email,
          role: admin.role,
          department: admin.department
        },
        users: usersCreatedByAdmin
      })
    }

    const query = {
      userId: { $in: userIds }
    }

    // Add other filters
    if (status) query.status = status
    if (year) query.year = parseInt(year)
    if (leaveTypeId) query.leaveTypeId = leaveTypeId

    const leaves = await Leave.find(query)
      .populate("userId", "name email department")
      .populate("leaveTypeId", "name")
      .populate("approvedBy", "name email")
      .sort({ createdAt: -1 })

    // Calculate statistics
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
    }

    // Calculate leave statistics by user
    const userStats = usersCreatedByAdmin.map(user => {
      const userLeaves = leaves.filter(leave => leave.userId._id.toString() === user._id.toString())
      const approvedDays = userLeaves
        .filter(l => l.status === 'approved')
        .reduce((sum, leave) => sum + leave.numberOfDays, 0)
      
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        totalLeaves: userLeaves.length,
        pendingLeaves: userLeaves.filter(l => l.status === 'pending').length,
        approvedDays: approvedDays
      }
    })

    res.status(200).json({
      success: true,
      count: leaves.length,
      stats: stats,
      adminInfo: {
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department
      },
      userStats: userStats,
      users: usersCreatedByAdmin,
      data: leaves,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaves by admin",
      error: err.message,
    })
  }
}

/* =========================
   Get Leaves Approved by Specific Admin
   GET /api/leaves/admin/approved-by/:adminId
   Private (Admin/Super Admin)
========================= */
export const getLeavesApprovedByAdmin = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { adminId } = req.params
    const { status, startDate, endDate } = req.query

    // Build query
    const query = { approvedBy: adminId }

    if (status) query.status = status
    
    // Date range filtering
    if (startDate || endDate) {
      query.$and = []
      if (startDate) {
        query.$and.push({ fromDate: { $gte: new Date(startDate) } })
      }
      if (endDate) {
        query.$and.push({ toDate: { $lte: new Date(endDate) } })
      }
    }

    const leaves = await Leave.find(query)
      .populate("userId", "name email employeeId department")
      .populate("leaveTypeId", "name")
      .populate("approvedBy", "name email role")
      .sort({ createdAt: -1 })

    // Get admin info
    const admin = await User.findById(adminId).select("name email role department")

    // Calculate statistics
    const stats = {
      total: leaves.length,
      pending: leaves.filter(l => l.status === 'pending').length,
      approved: leaves.filter(l => l.status === 'approved').length,
      rejected: leaves.filter(l => l.status === 'rejected').length,
      totalDaysApproved: leaves
        .filter(l => l.status === 'approved')
        .reduce((sum, leave) => sum + leave.numberOfDays, 0)
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      stats: stats,
      adminInfo: admin,
      data: leaves,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leaves approved by admin",
      error: err.message,
    })
  }
}

/* =========================
   Get Leave Statistics
   GET /api/leaves/stats
   Private
========================= */
export const getLeaveStats = async (req, res) => {
  try {
    let query = {}
    
    if (req.user.role === "user") {
      query.userId = req.user._id
    } else if (req.user.role === "admin") {
      // Get all users created by this admin
      const usersCreatedByAdmin = await User.find({ 
        createdBy: req.user._id 
      }).select('_id')
      const userIds = usersCreatedByAdmin.map(user => user._id)
      query.userId = { $in: userIds }
    }

    const currentYear = new Date().getFullYear()
    query.year = currentYear

    const leaves = await Leave.find(query)
      .populate("leaveTypeId", "name")
      .populate("userId", "name email")

    // Calculate statistics
    const stats = {
      totalLeaves: leaves.length,
      pendingLeaves: leaves.filter(l => l.status === 'pending').length,
      approvedLeaves: leaves.filter(l => l.status === 'approved').length,
      rejectedLeaves: leaves.filter(l => l.status === 'rejected').length,
      totalDays: leaves.reduce((sum, l) => sum + l.numberOfDays, 0),
      approvedDays: leaves
        .filter(l => l.status === 'approved')
        .reduce((sum, l) => sum + l.numberOfDays, 0),
      byMonth: Array(12).fill(0).map((_, i) => ({
        month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
        count: leaves.filter(l => new Date(l.fromDate).getMonth() === i).length
      })),
      byLeaveType: {},
      byUser: {}
    }

    // Group by leave type
    leaves.forEach(leave => {
      const typeName = leave.leaveTypeId?.name || 'Unknown'
      if (!stats.byLeaveType[typeName]) {
        stats.byLeaveType[typeName] = { count: 0, days: 0 }
      }
      stats.byLeaveType[typeName].count++
      stats.byLeaveType[typeName].days += leave.numberOfDays
    })

    // Group by user (for admin/super admin)
    if (req.user.role !== "user") {
      leaves.forEach(leave => {
        const userName = leave.userId?.name || 'Unknown'
        if (!stats.byUser[userName]) {
          stats.byUser[userName] = { count: 0, days: 0 }
        }
        stats.byUser[userName].count++
        stats.byUser[userName].days += leave.numberOfDays
      })
    }

    res.status(200).json({
      success: true,
      year: currentYear,
      data: stats,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave statistics",
      error: err.message,
    })
  }
}

/* =========================
   Get Single Leave Request
   GET /api/leaves/:id
   Private
========================= */
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("leaveTypeId", "name description daysPerYear")
      .populate("userId", "name email department")
      .populate("approvedBy", "name email")

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // Check authorization
    if (req.user.role === "user" && !leave.userId._id.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this leave request",
      })
    }

    // Check authorization for admin
    if (req.user.role === "admin") {
      const user = await User.findById(leave.userId._id)
      if (user && user.createdBy && !user.createdBy.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this leave request",
        })
      }
    }

    res.status(200).json({
      success: true,
      data: leave,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching leave request",
      error: err.message,
    })
  }
}

/* =========================
   Update Leave Request (User)
   PUT /api/leaves/:id
   Private
========================= */
export const updateLeave = async (req, res) => {
  try {
    const { reason, document } = req.body
    const leave = await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // Check authorization - only the user who created the leave can update it
    if (!leave.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this leave request",
      })
    }

    // Only pending leaves can be updated
    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be updated",
      })
    }

    // Update fields
    if (reason) leave.reason = reason
    if (document !== undefined) leave.document = document

    await leave.save()

    const updatedLeave = await Leave.findById(leave._id)
      .populate("leaveTypeId", "name")
      .populate("userId", "name email")

    res.status(200).json({
      success: true,
      message: "Leave request updated successfully",
      data: updatedLeave,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating leave request",
      error: err.message,
    })
  }
}

/* =========================
   Cancel Leave Request (User)
   DELETE /api/leaves/:id
   Private
========================= */
export const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      })
    }

    // Check authorization - only the user who created the leave can cancel it
    if (!leave.userId.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this leave request",
      })
    }

    // Only pending leaves can be cancelled
    if (leave.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Only pending leave requests can be cancelled",
      })
    }

    await leave.deleteOne()

    res.status(200).json({
      success: true,
      message: "Leave request cancelled successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error cancelling leave request",
      error: err.message,
    })
  }
}