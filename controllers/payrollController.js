

import Payroll from "../models/Payroll.js"
import Salary from "../models/Salary.js"
import User from "../models/User.js"
import AdvancePayment from "../models/AdvancePayment.js"
import Attendance from "../models/Attendance.js"
import Holiday from "../models/Holiday.js"
import Leave from "../models/Leave.js"
import ExcelJS from 'exceljs'; // Install with: npm install exceljs
import PDFDocument from 'pdfkit'; // Install with: npm install pdfkit
import { Parser } from 'json2csv'; // Install with: npm install json2csv

// Helper function to calculate working days
const calculateWorkingDays = (year, month) => {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  let workingDays = 0
  let weeklyOffDays = 0
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    // Count Sundays as weekly off days
    if (day === 0) {
      weeklyOffDays++
    } else {
      workingDays++
    }
  }
  
  return { workingDays, weeklyOffDays, totalCalendarDays: lastDay.getDate() }
}

// Helper function to calculate salary components
const calculateSalaryComponents = async (userId, year, month) => {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  // Get user information
  const user = await User.findById(userId)
  if (!user) throw new Error("User not found")
  
  // Get salary information
  const salary = await Salary.findOne({ userId })
  if (!salary) throw new Error("Salary information not found")
  
  // Calculate total calendar days and working days
  const { workingDays, weeklyOffDays, totalCalendarDays } = calculateWorkingDays(year, month)
  
  // Count holidays for the company
  const holidays = await Holiday.find({
    date: { $gte: firstDay, $lte: lastDay },
    company: user.company,
  })
  const holidayDays = holidays.length
  
  // Count approved leaves
  const leaves = await Leave.find({
    userId,
    fromDate: { $gte: firstDay },
    toDate: { $lte: lastDay },
    status: "approved",
  })
  
  // Calculate leave days (excluding Sundays and holidays)
  let leaveDays = 0
  leaves.forEach(leave => {
    const fromDate = new Date(leave.fromDate)
    const toDate = new Date(leave.toDate)
    
    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      // Skip Sundays
      if (day === 0) continue
      
      // Check if it's a holiday
      const isHoliday = holidays.some(holiday => 
        holiday.date.toDateString() === d.toDateString()
      )
      if (!isHoliday) {
        leaveDays++
      }
    }
  })
  
  // Get attendance records
  const attendances = await Attendance.find({
    userId,
    date: { $gte: firstDay, $lte: lastDay },
  })
  
  // Calculate attendance metrics
  let presentDays = 0
  let halfDays = 0
  let totalOvertimeHours = 0
  
  // Create a map of attendance dates
  const attendanceMap = {}
  attendances.forEach(attendance => {
    const dateStr = attendance.date.toISOString().split('T')[0]
    attendanceMap[dateStr] = {
      status: attendance.status,
      overtimeHours: attendance.overtimeHours || 0
    }
    
    if (attendance.status === "present") {
      presentDays++
    } else if (attendance.status === "half-day") {
      halfDays++
    }
    totalOvertimeHours += attendance.overtimeHours || 0
  })
  
  // Calculate absent days
  let absentDays = 0
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    // Skip Sundays
    if (day === 0) continue
    
    const dateStr = d.toISOString().split('T')[0]
    
    // Check if it's a holiday
    const isHoliday = holidays.some(holiday => 
      holiday.date.toISOString().split('T')[0] === dateStr
    )
    if (isHoliday) continue
    
    // Check if it's a leave day
    const isLeave = leaves.some(leave => {
      const leaveFrom = new Date(leave.fromDate)
      const leaveTo = new Date(leave.toDate)
      const currentDate = new Date(d)
      return currentDate >= leaveFrom && currentDate <= leaveTo
    })
    if (isLeave) continue
    
    // Check attendance
    const attendance = attendanceMap[dateStr]
    if (!attendance || (attendance.status !== "present" && attendance.status !== "half-day")) {
      absentDays++
    }
  }
  
  // Get advance payments for this month
  const advancePayments = await AdvancePayment.find({
    userId,
    month,
    year,
    status: "approved",
  })
  
  const totalAdvanceAmount = advancePayments.reduce((sum, ap) => sum + ap.amount, 0)
  
  // ================= CALCULATIONS =================
  
  // 1. Calculate per day salary based on calendar days
  const paidDaySalary = salary.basicSalary / totalCalendarDays
  
  // 2. Calculate per hour rate
  const paidHourRate = paidDaySalary / salary.workingHoursPerDay
  
  // 3. Calculate salary components
  const presentSalary = presentDays * paidDaySalary
  const halfDaySalary = halfDays * (paidDaySalary / 2)
  const holidaySalary = holidayDays * paidDaySalary
  const leaveSalary = leaveDays * paidDaySalary
  const overtimeSalary = totalOvertimeHours * paidHourRate * salary.overtimeRate
  
  // 4. Calculate total paid days
  const totalPaidDays = presentDays + holidayDays + leaveDays + (halfDays * 0.5)
  
  // 5. Calculate allowances
  const allowances = salary.houseRentAllowance + salary.travelAllowance + 
                     salary.medicalAllowance + salary.specialAllowance
  
  // 6. Calculate regular deductions
  const salaryDeductions = salary.providentFund + salary.professionalTax + 
                           salary.incomeTax + salary.otherDeductions
  
  // 7. Calculate absent deductions
  const absentDeductions = absentDays * paidDaySalary
  
  // 8. Calculate advance payment deduction
  const advancedPaymentDeduction = totalAdvanceAmount
  
  // 9. Calculate total deductions
  const totalDeductions = absentDeductions + salaryDeductions + advancedPaymentDeduction
  
  // 10. Calculate gross salary (earnings before deductions)
  const grossSalary = presentSalary + halfDaySalary + holidaySalary + 
                      leaveSalary + overtimeSalary + allowances
  
  // 11. Calculate net salary (gross - deductions)
  const netSalary = grossSalary - totalDeductions
  
  return {
    salary,
    totalCalendarDays,
    weeklyOffDays,
    totalWorkingDays: workingDays,
    holidayDays,
    leaveDays,
    presentDays,
    halfDays,
    absentDays,
    totalOvertimeHours,
    paidDaySalary,
    paidHourRate,
    presentSalary,
    halfDaySalary,
    holidaySalary,
    leaveSalary,
    overtimeSalary,
    totalPaidDays,
    allowances,
    salaryDeductions,
    absentDeductions,
    advancePayment: totalAdvanceAmount,
    advancedPaymentDeduction,
    totalDeductions,
    grossSalary,
    netSalary,
  }
}

/* =========================
   Generate Payroll
   POST /api/payroll/generate
   Private (Admin/Super Admin)
========================= */
export const generatePayroll = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to generate payroll",
      })
    }

    const { userId, month, year } = req.body

    // Validation
    if (!userId || !month || !year) {
      return res.status(400).json({
        success: false,
        message: "User ID, month, and year are required",
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      })
    }

    // Check if payroll already exists
    const existingPayroll = await Payroll.findOne({ userId, month, year })
    if (existingPayroll) {
      return res.status(400).json({
        success: false,
        message: "Payroll already generated for this month",
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

    // Calculate salary components
    const salaryData = await calculateSalaryComponents(userId, year, month)

    // Create payroll record
    const payroll = await Payroll.create({
      userId,
      month,
      year,
      basicSalary: salaryData.salary.basicSalary,
      totalCalendarDays: salaryData.totalCalendarDays,
      weeklyOffDays: salaryData.weeklyOffDays,
      totalWorkingDays: salaryData.totalWorkingDays,
      holidayDays: salaryData.holidayDays,
      leaveDays: salaryData.leaveDays,
      presentDays: salaryData.presentDays,
      halfDays: salaryData.halfDays,
      absentDays: salaryData.absentDays,
      overtimeHours: salaryData.totalOvertimeHours,
      paidDaySalary: salaryData.paidDaySalary,
      paidHourRate: salaryData.paidHourRate,
      presentSalary: salaryData.presentSalary,
      halfDaySalary: salaryData.halfDaySalary,
      holidaySalary: salaryData.holidaySalary,
      leaveSalary: salaryData.leaveSalary,
      overtimeSalary: salaryData.overtimeSalary,
      totalPaidDays: salaryData.totalPaidDays,
      allowances: salaryData.allowances,
      salaryDeductions: salaryData.salaryDeductions,
      absentDeductions: salaryData.absentDeductions,
      advancePayment: salaryData.advancePayment,
      advancedPaymentDeduction: salaryData.advancedPaymentDeduction,
      totalDeductions: salaryData.totalDeductions,
      grossSalary: salaryData.grossSalary,
      netSalary: salaryData.netSalary,
      generatedBy: req.user._id,
    })

    // Update advance payment status to deducted
    if (salaryData.advancePayment > 0) {
      await AdvancePayment.updateMany(
        {
          userId,
          month,
          year,
          status: "approved",
        },
        {
          status: "deducted",
          deductionStatus: "deducted",
          deductedAt: new Date(),
          updatedBy: req.user._id,
        }
      )
    }

    // Populate for response
    const populatedPayroll = await Payroll.findById(payroll._id)
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email")

    res.status(201).json({
      success: true,
      message: "Payroll generated successfully",
      data: populatedPayroll,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Payroll already exists for this user, month, and year",
      })
    }
    res.status(500).json({
      success: false,
      message: error.message || "Error generating payroll",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    })
  }
}

/* =========================
   Bulk Generate Payroll
   POST /api/payroll/bulk-generate
   Private (Admin/Super Admin)
========================= */
export const bulkGeneratePayroll = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to generate payroll",
      })
    }

    const { month, year, userIds } = req.body

    // Validation
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      })
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({
        success: false,
        message: "Month must be between 1 and 12",
      })
    }

    // Get users
    let users = []
    if (userIds && userIds.length > 0) {
      users = await User.find({ 
        _id: { $in: userIds }, 
        isActive: true,
        company: req.user.company 
      })
    } else {
      users = await User.find({ 
        isActive: true, 
        company: req.user.company 
      })
    }

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active users found",
      })
    }

    const results = {
      success: [],
      failed: [],
      total: users.length,
      generated: 0,
      skipped: 0,
    }

    // Process each user
    for (const user of users) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          userId: user._id,
          month,
          year,
        })

        if (existingPayroll) {
          results.skipped++
          results.failed.push({
            userId: user._id,
            name: user.name,
            error: "Payroll already exists",
          })
          continue
        }

        // Calculate salary components
        const salaryData = await calculateSalaryComponents(
          user._id,
          year,
          month
        )

        // Create payroll record
        const payroll = await Payroll.create({
          userId: user._id,
          month,
          year,
          basicSalary: salaryData.salary.basicSalary,
          totalCalendarDays: salaryData.totalCalendarDays,
          weeklyOffDays: salaryData.weeklyOffDays,
          totalWorkingDays: salaryData.totalWorkingDays,
          holidayDays: salaryData.holidayDays,
          leaveDays: salaryData.leaveDays,
          presentDays: salaryData.presentDays,
          halfDays: salaryData.halfDays,
          absentDays: salaryData.absentDays,
          overtimeHours: salaryData.totalOvertimeHours,
          paidDaySalary: salaryData.paidDaySalary,
          paidHourRate: salaryData.paidHourRate,
          presentSalary: salaryData.presentSalary,
          halfDaySalary: salaryData.halfDaySalary,
          holidaySalary: salaryData.holidaySalary,
          leaveSalary: salaryData.leaveSalary,
          overtimeSalary: salaryData.overtimeSalary,
          totalPaidDays: salaryData.totalPaidDays,
          allowances: salaryData.allowances,
          salaryDeductions: salaryData.salaryDeductions,
          absentDeductions: salaryData.absentDeductions,
          advancePayment: salaryData.advancePayment,
          advancedPaymentDeduction: salaryData.advancedPaymentDeduction,
          totalDeductions: salaryData.totalDeductions,
          grossSalary: salaryData.grossSalary,
          netSalary: salaryData.netSalary,
          generatedBy: req.user._id,
        })

        // Update advance payment status to deducted
        if (salaryData.advancePayment > 0) {
          await AdvancePayment.updateMany(
            {
              userId: user._id,
              month,
              year,
              status: "approved",
            },
            {
              status: "deducted",
              deductionStatus: "deducted",
              deductedAt: new Date(),
              updatedBy: req.user._id,
            }
          )
        }

        results.generated++
        results.success.push({
          userId: user._id,
          name: user.name,
          email: user.email,
          payrollId: payroll._id,
          netSalary: salaryData.netSalary,
          status: "generated",
        })
      } catch (error) {
        results.failed.push({
          userId: user._id,
          name: user.name,
          error: error.message,
        })
      }
    }

    res.status(201).json({
      success: true,
      message: `Bulk payroll generation completed. Generated: ${results.generated}, Skipped: ${results.skipped}`,
      data: results,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error in bulk payroll generation",
      error: error.message,
    })
  }
}

/* =========================
   Get User Payroll
   GET /api/payroll/user/:userId
   GET /api/payroll/user/me (for current user)
   Private
========================= */
export const getUserPayroll = async (req, res) => {
  try {
    let userId = req.params.userId
    
    // If no userId provided, use current user
    if (!userId || userId === "me") {
      userId = req.user._id
    }

    // Authorization: Users can only view their own payroll
    if (req.user.role === "user" && req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view other user's payroll",
      })
    }

    const { month, year, page = 1, limit = 10 } = req.query
    const query = { userId }

    // Add month/year filter if provided
    if (month && year) {
      query.month = parseInt(month)
      query.year = parseInt(year)
    }

    // Pagination
    const pageNumber = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNumber - 1) * pageSize

    // Get payrolls with pagination
    const payrolls = await Payroll.find(query)
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email")
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(pageSize)

    // Get total count for pagination info
    const total = await Payroll.countDocuments(query)

    res.status(200).json({
      success: true,
      count: payrolls.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      data: payrolls,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payroll",
      error: error.message,
    })
  }
}

/* =========================
   Get Payroll by ID
   GET /api/payroll/:id
   Private
========================= */
export const getPayrollById = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email")
      .populate("updatedBy", "name email")

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      })
    }

    // Authorization: Users can only view their own payroll
    if (req.user.role === "user" && req.user._id.toString() !== payroll.userId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this payroll",
      })
    }

    res.status(200).json({
      success: true,
      data: payroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payroll",
      error: error.message,
    })
  }
}

/* =========================
   Get All Payrolls (Admin)
   GET /api/payroll/admin/all
   Private (Admin/Super Admin)
========================= */
export const getAllPayrolls = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view all payrolls",
      })
    }

    const {
      month,
      year,
      userId,
      department,
      paymentStatus,
      page = 1,
      limit = 20,
      search,
    } = req.query

    // Step 1: Build userQuery for the company
    let userQuery = { company: req.user.company }

    // Department filter
    if (department && department !== "All") {
      userQuery.department = department
    }

    // Search functionality
    if (search) {
      userQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    // Get the user IDs that match the userQuery
    const companyUsers = await User.find(userQuery).select('_id')
    const companyUserIds = companyUsers.map(u => u._id)

    // If no users found, return empty
    if (companyUserIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
      })
    }

    // Step 2: Build the payroll query
    const query = { userId: { $in: companyUserIds } }

    // Other filters
    if (month) query.month = parseInt(month)
    if (year) query.year = parseInt(year)
    if (paymentStatus) query.paymentStatus = paymentStatus

    // If a specific userId is provided, we must ensure it's in the companyUserIds
    if (userId) {
      if (companyUserIds.includes(userId)) {
        query.userId = userId
      } else {
        // If the provided userId is not in the company, return empty
        return res.status(200).json({
          success: true,
          count: 0,
          total: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          data: [],
        })
      }
    }

    // Pagination
    const pageNumber = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNumber - 1) * pageSize

    // Get payrolls
    const payrolls = await Payroll.find(query)
      .populate({
        path: "userId",
        select: "name email employeeId department",
      })
      .populate({
        path: "generatedBy",
        select: "name email",
      })
      .sort({ year: -1, month: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)

    // Get total count for pagination
    const total = await Payroll.countDocuments(query)

    res.status(200).json({
      success: true,
      count: payrolls.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      data: payrolls,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payrolls",
      error: error.message,
    })
  }
}

/* =========================
   Update Payroll Status
   PUT /api/payroll/:id/status
   Private (Admin/Super Admin)
========================= */
export const updatePayrollStatus = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update payroll status",
      })
    }

    const { paymentStatus, paidDate, notes } = req.body

    // Validate payment status
    const validStatuses = ["pending", "paid", "processing", "failed"]
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Must be one of: ${validStatuses.join(", ")}`,
      })
    }

    // Find payroll
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      })
    }

    // Check if payroll is locked
    if (payroll.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Payroll is locked and cannot be modified",
      })
    }

    // Update fields
    if (paymentStatus) payroll.paymentStatus = paymentStatus
    if (paidDate) payroll.paidDate = new Date(paidDate)
    if (notes !== undefined) payroll.notes = notes
    
    // Set updated by
    payroll.updatedBy = req.user._id

    await payroll.save()

    // Get updated payroll with populated fields
    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate("userId", "name email")
      .populate("generatedBy", "name email")
      .populate("updatedBy", "name email")

    res.status(200).json({
      success: true,
      message: "Payroll status updated successfully",
      data: updatedPayroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating payroll status",
      error: error.message,
    })
  }
}

/* =========================
   Update Payroll Details
   PUT /api/payroll/:id
   Private (Admin/Super Admin)
========================= */
export const updatePayroll = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update payroll",
      })
    }

    const {
      presentDays,
      halfDays,
      absentDays,
      overtimeHours,
      salaryDeductions,
      advancePayment,
      notes,
      isLocked,
    } = req.body

    // Find payroll
    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      })
    }

    // Check if payroll is already locked
    if (payroll.isLocked && !isLocked) {
      return res.status(400).json({
        success: false,
        message: "Payroll is locked and cannot be modified",
      })
    }

    // Update basic fields
    if (presentDays !== undefined) payroll.presentDays = presentDays
    if (halfDays !== undefined) payroll.halfDays = halfDays
    if (absentDays !== undefined) payroll.absentDays = absentDays
    if (overtimeHours !== undefined) payroll.overtimeHours = overtimeHours
    if (salaryDeductions !== undefined) payroll.salaryDeductions = salaryDeductions
    if (advancePayment !== undefined) payroll.advancePayment = advancePayment
    if (notes !== undefined) payroll.notes = notes
    if (isLocked !== undefined) {
      payroll.isLocked = isLocked
      payroll.lockedAt = isLocked ? new Date() : null
      payroll.lockedBy = isLocked ? req.user._id : null
    }

    // Recalculate salary based on updated values
    const paidDaySalary = payroll.paidDaySalary
    payroll.presentSalary = payroll.presentDays * paidDaySalary
    payroll.halfDaySalary = payroll.halfDays * (paidDaySalary / 2)
    payroll.absentDeductions = payroll.absentDays * paidDaySalary
    payroll.advancedPaymentDeduction = payroll.advancePayment
    
    // Get salary info for overtime calculation
    const salaryInfo = await Salary.findOne({ userId: payroll.userId })
    if (salaryInfo) {
      const paidHourRate = paidDaySalary / salaryInfo.workingHoursPerDay
      payroll.overtimeSalary = payroll.overtimeHours * paidHourRate * salaryInfo.overtimeRate
      payroll.paidHourRate = paidHourRate
    }

    // Recalculate totals
    payroll.totalPaidDays = payroll.presentDays + payroll.holidayDays + 
                           payroll.leaveDays + (payroll.halfDays * 0.5)
    
    const totalMonthSalary = payroll.presentSalary + payroll.halfDaySalary + 
                            payroll.holidaySalary + payroll.leaveSalary
    
    payroll.grossSalary = totalMonthSalary + payroll.overtimeSalary + payroll.allowances
    payroll.totalDeductions = payroll.absentDeductions + payroll.salaryDeductions + payroll.advancedPaymentDeduction
    payroll.netSalary = payroll.grossSalary - payroll.totalDeductions
    
    // Set updated by
    payroll.updatedBy = req.user._id

    await payroll.save()

    // Get updated payroll
    const updatedPayroll = await Payroll.findById(payroll._id)
      .populate("userId", "name email")
      .populate("generatedBy", "name email")
      .populate("updatedBy", "name email")
      .populate("lockedBy", "name email")

    res.status(200).json({
      success: true,
      message: "Payroll updated successfully",
      data: updatedPayroll,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating payroll",
      error: error.message,
    })
  }
}

/* =========================
   Delete Payroll
   DELETE /api/payroll/:id
   Private (Admin/Super Admin)
========================= */
export const deletePayroll = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete payroll",
      })
    }

    const payroll = await Payroll.findById(req.params.id)
    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      })
    }

    // Check if payroll is locked
    if (payroll.isLocked) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a locked payroll",
      })
    }

    // Check if payroll is already paid
    if (payroll.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete a paid payroll",
      })
    }

    await payroll.deleteOne()

    res.status(200).json({
      success: true,
      message: "Payroll deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting payroll",
      error: error.message,
    })
  }
}

/* =========================
   Get Payroll Summary
   GET /api/payroll/admin/summary
   Private (Admin/Super Admin)
========================= */
export const getPayrollSummary = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view payroll summary",
      })
    }

    const { month, year } = req.query
    const query = {}

    // Get company users
    const companyUsers = await User.find({ 
      company: req.user.company 
    }).select("_id name department")
    
    query.userId = { $in: companyUsers.map(u => u._id) }

    // Month and year filter
    if (month && year) {
      query.month = parseInt(month)
      query.year = parseInt(year)
    }

    // Get payrolls with user information
    const payrolls = await Payroll.find(query)
      .populate("userId", "name department")
      .sort({ year: -1, month: -1 })

    // Calculate summary
    const summary = {
      totalPayrolls: payrolls.length,
      totalEmployees: new Set(payrolls.map(p => p.userId?._id?.toString()).filter(Boolean)).size,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0,
      totalSalaryDeductions: 0,
      totalAbsentDeductions: 0,
      totalAdvanceDeductions: 0,
      totalOvertimeHours: 0,
      totalOvertimeAmount: 0,
      totalPaidDays: 0,
      totalPresentDays: 0,
      totalHalfDays: 0,
      totalHolidayDays: 0,
      totalLeaveDays: 0,
      totalAbsentDays: 0,
      statusBreakdown: {
        pending: 0,
        paid: 0,
        processing: 0,
        failed: 0,
      },
      departmentBreakdown: {},
    }

    // Process each payroll
    payrolls.forEach(payroll => {
      // Basic totals
      summary.totalGrossSalary += payroll.grossSalary || 0
      summary.totalNetSalary += payroll.netSalary || 0
      summary.totalDeductions += payroll.totalDeductions || 0
      summary.totalSalaryDeductions += payroll.salaryDeductions || 0
      summary.totalAbsentDeductions += payroll.absentDeductions || 0
      summary.totalAdvanceDeductions += payroll.advancedPaymentDeduction || 0
      summary.totalOvertimeHours += payroll.overtimeHours || 0
      summary.totalOvertimeAmount += payroll.overtimeSalary || 0
      summary.totalPaidDays += payroll.totalPaidDays || 0
      summary.totalPresentDays += payroll.presentDays || 0
      summary.totalHalfDays += payroll.halfDays || 0
      summary.totalHolidayDays += payroll.holidayDays || 0
      summary.totalLeaveDays += payroll.leaveDays || 0
      summary.totalAbsentDays += payroll.absentDays || 0
      
      // Status breakdown
      summary.statusBreakdown[payroll.paymentStatus]++
      
      // Department breakdown
      if (payroll.userId && payroll.userId.department) {
        const dept = payroll.userId.department
        if (!summary.departmentBreakdown[dept]) {
          summary.departmentBreakdown[dept] = {
            count: 0,
            totalNetSalary: 0,
            totalEmployees: new Set(),
          }
        }
        summary.departmentBreakdown[dept].count++
        summary.departmentBreakdown[dept].totalNetSalary += payroll.netSalary || 0
        summary.departmentBreakdown[dept].totalEmployees.add(payroll.userId._id.toString())
      }
    })

    // Convert department breakdown to array
    const departmentArray = Object.entries(summary.departmentBreakdown).map(([dept, data]) => ({
      department: dept,
      payrollCount: data.count,
      totalNetSalary: data.totalNetSalary,
      employeeCount: data.totalEmployees.size,
      averageSalary: data.count > 0 ? data.totalNetSalary / data.count : 0,
    }))

    // Calculate averages
    summary.averageNetSalary = summary.totalPayrolls > 0 
      ? summary.totalNetSalary / summary.totalPayrolls 
      : 0
    summary.averageGrossSalary = summary.totalPayrolls > 0 
      ? summary.totalGrossSalary / summary.totalPayrolls 
      : 0
    summary.averageDeductions = summary.totalPayrolls > 0 
      ? summary.totalDeductions / summary.totalPayrolls 
      : 0
    summary.averageOvertimeHours = summary.totalPayrolls > 0 
      ? summary.totalOvertimeHours / summary.totalPayrolls 
      : 0

    res.status(200).json({
      success: true,
      data: {
        ...summary,
        departmentBreakdown: departmentArray,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payroll summary",
      error: error.message,
    })
  }
}

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/* =========================
   Download Payslip
   GET /api/payroll/:id/payslip
   Private
========================= */
export const downloadPayslip = async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email")

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      })
    }

    // Authorization check
    if (req.user.role === "user" && req.user._id.toString() !== payroll.userId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download this payslip",
      })
    }

    // Get salary information for allowances and deductions
    const salary = await Salary.findOne({ userId: payroll.userId })

    // Prepare payslip data
    const payslipData = {
      // Employee Information
      employee: {
        name: payroll.userId.name,
        employeeId: payroll.userId.employeeId,
        department: payroll.userId.department,
        email: payroll.userId.email,
      },
      
      // Payroll Period
      period: {
        month: payroll.month,
        year: payroll.year,
        monthYear: payroll.monthYear,
        generatedDate: payroll.createdAt,
        paymentDate: payroll.paidDate,
        totalCalendarDays: payroll.totalCalendarDays,
        weeklyOffDays: payroll.weeklyOffDays,
        totalWorkingDays: payroll.totalWorkingDays,
      },
      
      // Attendance Summary
      attendance: {
        presentDays: payroll.presentDays,
        halfDays: payroll.halfDays,
        holidayDays: payroll.holidayDays,
        leaveDays: payroll.leaveDays,
        absentDays: payroll.absentDays,
        paidDays: payroll.totalPaidDays,
        overtimeHours: payroll.overtimeHours,
      },
      
      // Salary Breakdown
      earnings: {
        basicSalary: payroll.basicSalary,
        presentSalary: payroll.presentSalary,
        halfDaySalary: payroll.halfDaySalary,
        holidaySalary: payroll.holidaySalary,
        leaveSalary: payroll.leaveSalary,
        overtimeSalary: payroll.overtimeSalary,
        allowances: payroll.allowances,
        perDayRate: payroll.paidDaySalary,
        perHourRate: payroll.paidHourRate,
      },
      
      // Deductions Breakdown
      deductions: {
        absentDeductions: payroll.absentDeductions,
        salaryDeductions: payroll.salaryDeductions,
        advanceDeductions: payroll.advancedPaymentDeduction,
        totalDeductions: payroll.totalDeductions,
      },
      
      // Totals
      totals: {
        totalEarnings: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netSalary: payroll.netSalary,
      },
      
      // Payment Information
      payment: {
        status: payroll.paymentStatus,
        method: salary?.paymentMethod || "bank_transfer",
        bankAccount: salary?.bankAccount,
        notes: payroll.notes,
      },
      
      // Generated By
      generatedBy: {
        name: payroll.generatedBy.name,
        email: payroll.generatedBy.email,
      },
    }

    res.status(200).json({
      success: true,
      message: "Payslip data retrieved successfully",
      data: payslipData,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error downloading payslip",
      error: error.message,
    })
  }
}

/* =========================
   Download All User Payslips (Excel)
   GET /api/payroll/admin/download-all-payslips/excel
   Private (Admin/Super Admin)
========================= */
export const downloadAllPayslipsExcel = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download payslips",
      });
    }

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get all payrolls for the given month and year
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    })
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email")
      .sort({ "userId.department": 1, "userId.name": 1 });

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payroll records found for the specified period",
      });
    }

    // Get bank details for all users
    const userIds = payrolls.map(p => p.userId._id);
    const salaries = await Salary.find({ userId: { $in: userIds } });

    // Create salary map for quick lookup
    const salaryMap = {};
    salaries.forEach(salary => {
      salaryMap[salary.userId.toString()] = salary;
    });

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    
    // 1. Main Payslip Sheet
    const payslipSheet = workbook.addWorksheet('Payslips');
    
    // Define columns
    payslipSheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Month', key: 'month', width: 10 },
      { header: 'Year', key: 'year', width: 10 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 25 },
      { header: 'IFSC Code', key: 'ifscCode', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Basic Salary', key: 'basicSalary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Total Allowances', key: 'allowances', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Overtime Amount', key: 'overtimeSalary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Gross Salary', key: 'grossSalary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Total Deductions', key: 'totalDeductions', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Net Salary', key: 'netSalary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Paid Date', key: 'paidDate', width: 15 },
    ];

    // Add data rows
    payrolls.forEach(payroll => {
      const salary = salaryMap[payroll.userId._id.toString()];
      const bankAccount = salary?.bankAccount || {};
      
      payslipSheet.addRow({
        employeeId: payroll.userId.employeeId || 'N/A',
        employeeName: payroll.userId.name,
        department: payroll.userId.department,
        month: payroll.month,
        year: payroll.year,
        accountNumber: bankAccount.accountNumber || 'N/A',
        bankName: bankAccount.bankName || 'N/A',
        ifscCode: bankAccount.ifscCode || 'N/A',
        branch: bankAccount.branch || 'N/A',
        basicSalary: payroll.basicSalary,
        allowances: payroll.allowances,
        overtimeSalary: payroll.overtimeSalary,
        grossSalary: payroll.grossSalary,
        totalDeductions: payroll.totalDeductions,
        netSalary: payroll.netSalary,
        paymentStatus: payroll.paymentStatus,
        paidDate: payroll.paidDate ? formatDate(payroll.paidDate) : 'Pending',
      });
    });

    // Add summary row
    const totalRow = payslipSheet.rowCount + 2;
    payslipSheet.getCell(`A${totalRow}`).value = 'TOTALS';
    payslipSheet.getCell(`A${totalRow}`).font = { bold: true };
    
    // Calculate totals
    const totals = payrolls.reduce((acc, payroll) => {
      acc.basicSalary += payroll.basicSalary;
      acc.allowances += payroll.allowances;
      acc.overtimeSalary += payroll.overtimeSalary;
      acc.grossSalary += payroll.grossSalary;
      acc.totalDeductions += payroll.totalDeductions;
      acc.netSalary += payroll.netSalary;
      return acc;
    }, {
      basicSalary: 0,
      allowances: 0,
      overtimeSalary: 0,
      grossSalary: 0,
      totalDeductions: 0,
      netSalary: 0,
    });

    payslipSheet.getCell(`J${totalRow}`).value = totals.basicSalary;
    payslipSheet.getCell(`K${totalRow}`).value = totals.allowances;
    payslipSheet.getCell(`L${totalRow}`).value = totals.overtimeSalary;
    payslipSheet.getCell(`M${totalRow}`).value = totals.grossSalary;
    payslipSheet.getCell(`N${totalRow}`).value = totals.totalDeductions;
    payslipSheet.getCell(`O${totalRow}`).value = totals.netSalary;

    // Format total row
    for (let col = 10; col <= 15; col++) {
      const cell = payslipSheet.getCell(totalRow, col);
      cell.font = { bold: true };
      cell.numFmt = '#,##0.00';
    }

    // 2. Attendance Summary Sheet
    const attendanceSheet = workbook.addWorksheet('Attendance Summary');
    
    attendanceSheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Present Days', key: 'presentDays', width: 12 },
      { header: 'Half Days', key: 'halfDays', width: 12 },
      { header: 'Leave Days', key: 'leaveDays', width: 12 },
      { header: 'Holiday Days', key: 'holidayDays', width: 12 },
      { header: 'Absent Days', key: 'absentDays', width: 12 },
      { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
      { header: 'Total Paid Days', key: 'totalPaidDays', width: 15 },
      { header: 'Working Days', key: 'workingDays', width: 15 },
    ];

    payrolls.forEach(payroll => {
      attendanceSheet.addRow({
        employeeId: payroll.userId.employeeId || 'N/A',
        employeeName: payroll.userId.name,
        department: payroll.userId.department,
        presentDays: payroll.presentDays,
        halfDays: payroll.halfDays,
        leaveDays: payroll.leaveDays,
        holidayDays: payroll.holidayDays,
        absentDays: payroll.absentDays,
        overtimeHours: payroll.overtimeHours,
        totalPaidDays: payroll.totalPaidDays,
        workingDays: payroll.totalWorkingDays,
      });
    });

    // 3. Payment Details Sheet
    const paymentSheet = workbook.addWorksheet('Payment Details');
    
    paymentSheet.columns = [
      { header: 'Employee ID', key: 'employeeId', width: 15 },
      { header: 'Employee Name', key: 'employeeName', width: 25 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Account Number', key: 'accountNumber', width: 20 },
      { header: 'Bank Name', key: 'bankName', width: 25 },
      { header: 'IFSC Code', key: 'ifscCode', width: 15 },
      { header: 'Branch', key: 'branch', width: 20 },
      { header: 'Net Salary', key: 'netSalary', width: 15, style: { numFmt: '#,##0.00' } },
      { header: 'Payment Status', key: 'paymentStatus', width: 15 },
      { header: 'Payment Method', key: 'paymentMethod', width: 15 },
    ];

    payrolls.forEach(payroll => {
      const salary = salaryMap[payroll.userId._id.toString()];
      const bankAccount = salary?.bankAccount || {};
      
      paymentSheet.addRow({
        employeeId: payroll.userId.employeeId || 'N/A',
        employeeName: payroll.userId.name,
        department: payroll.userId.department,
        accountNumber: bankAccount.accountNumber || 'N/A',
        bankName: bankAccount.bankName || 'N/A',
        ifscCode: bankAccount.ifscCode || 'N/A',
        branch: bankAccount.branch || 'N/A',
        netSalary: payroll.netSalary,
        paymentStatus: payroll.paymentStatus,
        paymentMethod: salary?.paymentMethod || 'N/A',
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=payslips_${month}_${year}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating Excel file",
      error: error.message,
    });
  }
};

/* =========================
   Download All User Payslips (PDF)
   GET /api/payroll/admin/download-all-payslips/pdf
   Private (Admin/Super Admin)
========================= */
export const downloadAllPayslipsPDF = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download payslips",
      });
    }

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get all payrolls
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    })
      .populate("userId", "name email employeeId department")
      .sort({ "userId.department": 1, "userId.name": 1 });

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No payroll records found for the specified period",
      });
    }

    // Get bank details
    const userIds = payrolls.map(p => p.userId._id);
    const salaries = await Salary.find({ userId: { $in: userIds } });
    const salaryMap = {};
    salaries.forEach(salary => {
      salaryMap[salary.userId.toString()] = salary;
    });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=payslip_summary_${month}_${year}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Add header
    doc.fontSize(20).text('Payroll Summary', { align: 'center' });
    doc.fontSize(12).text(`Period: ${month}/${year}`, { align: 'center' });
    doc.moveDown(2);

    // Add company info
    doc.fontSize(10)
       .text(`Generated By: ${req.user.name}`)
       .text(`Generated On: ${new Date().toLocaleDateString()}`)
       .moveDown();

    // Add summary table
    const tableTop = doc.y;
    const tableLeft = 50;
    const rowHeight = 30;
    const colWidths = [80, 120, 80, 80, 80];

    // Table headers
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .text('Employee ID', tableLeft, tableTop)
       .text('Employee Name', tableLeft + colWidths[0], tableTop)
       .text('Department', tableLeft + colWidths[0] + colWidths[1], tableTop)
       .text('Net Salary', tableLeft + colWidths[0] + colWidths[1] + colWidths[2], tableTop)
       .text('Status', tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], tableTop);

    // Table rows
    let yPos = tableTop + rowHeight;
    
    payrolls.forEach((payroll, index) => {
      const salary = salaryMap[payroll.userId._id.toString()];
      const bankAccount = salary?.bankAccount || {};
      
      doc.font('Helvetica')
         .fontSize(9)
         .text(payroll.userId.employeeId || 'N/A', tableLeft, yPos)
         .text(payroll.userId.name, tableLeft + colWidths[0], yPos)
         .text(payroll.userId.department, tableLeft + colWidths[0] + colWidths[1], yPos)
         .text(`₹${payroll.netSalary.toFixed(2)}`, tableLeft + colWidths[0] + colWidths[1] + colWidths[2], yPos)
         .text(payroll.paymentStatus, tableLeft + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], yPos);

      yPos += rowHeight;
      
      // Add page break if needed
      if (yPos > 750) {
        doc.addPage();
        yPos = 50;
      }
    });

    // Add totals
    const totals = payrolls.reduce((acc, payroll) => {
      acc.netSalary += payroll.netSalary;
      acc.grossSalary += payroll.grossSalary;
      acc.totalDeductions += payroll.totalDeductions;
      return acc;
    }, { netSalary: 0, grossSalary: 0, totalDeductions: 0 });

    doc.moveDown(2)
       .font('Helvetica-Bold')
       .fontSize(12)
       .text('Grand Totals:', { continued: true })
       .font('Helvetica')
       .text(` ₹${totals.netSalary.toFixed(2)} (Net Salary)`);

    doc.fontSize(10)
       .text(`Total Gross Salary: ₹${totals.grossSalary.toFixed(2)}`)
       .text(`Total Deductions: ₹${totals.totalDeductions.toFixed(2)}`)
       .text(`Total Employees: ${payrolls.length}`);

    // Add footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.fontSize(8)
         .text(
           `Page ${i + 1} of ${pageCount}`,
           50,
           doc.page.height - 50,
           { align: 'center', width: doc.page.width - 100 }
         );
    }

    doc.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating PDF file",
      error: error.message,
    });
  }
};

/* =========================
   Download Bank Payment CSV
   GET /api/payroll/admin/download-bank-payment-csv
   Private (Admin/Super Admin)
========================= */
export const downloadBankPaymentCSV = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download payment details",
      });
    }

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get all payrolls
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
      paymentStatus: { $in: ['pending', 'processing'] } // Only unpaid payrolls
    })
      .populate("userId", "name email employeeId department")
      .sort({ "userId.department": 1, "userId.name": 1 });

    if (payrolls.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No pending payroll records found for the specified period",
      });
    }

    // Get bank details
    const userIds = payrolls.map(p => p.userId._id);
    const salaries = await Salary.find({ userId: { $in: userIds } });
    const salaryMap = {};
    salaries.forEach(salary => {
      salaryMap[salary.userId.toString()] = salary;
    });

    // Prepare CSV data
    const csvData = payrolls.map(payroll => {
      const salary = salaryMap[payroll.userId._id.toString()];
      const bankAccount = salary?.bankAccount || {};
      
      return {
        'Employee ID': payroll.userId.employeeId || '',
        'Employee Name': payroll.userId.name,
        'Department': payroll.userId.department,
        'Account Number': bankAccount.accountNumber || '',
        'Bank Name': bankAccount.bankName || '',
        'IFSC Code': bankAccount.ifscCode || '',
        'Branch': bankAccount.branch || '',
        'Amount': payroll.netSalary.toFixed(2),
        'Payment Type': 'SALARY',
        'Remarks': `Salary for ${month}/${year}`,
        'Email': payroll.userId.email,
        'Phone': '',
        'Payment Status': payroll.paymentStatus,
      };
    });

    // Calculate totals
    const totalAmount = payrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0);
    
    // Add summary row
    csvData.push({
      'Employee ID': '',
      'Employee Name': 'TOTAL',
      'Department': '',
      'Account Number': '',
      'Bank Name': '',
      'IFSC Code': '',
      'Branch': '',
      'Amount': totalAmount.toFixed(2),
      'Payment Type': '',
      'Remarks': `Total for ${payrolls.length} employees`,
      'Email': '',
      'Phone': '',
      'Payment Status': '',
    });

    // Convert to CSV
    const fields = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Account Number',
      'Bank Name',
      'IFSC Code',
      'Branch',
      'Amount',
      'Payment Type',
      'Remarks',
      'Email',
      'Phone',
      'Payment Status',
    ];

    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);

    // Set response headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=bank_payment_${month}_${year}.csv`
    );

    // Send CSV
    res.send(csv);

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating CSV file",
      error: error.message,
    });
  }
};

/* =========================
   Download Individual Payslip (Detailed)
   GET /api/payroll/admin/download-payslip/:id
   Private (Admin/Super Admin)
========================= */
export const downloadDetailedPayslip = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to download payslip",
      });
    }

    const payroll = await Payroll.findById(req.params.id)
      .populate("userId", "name email employeeId department")
      .populate("generatedBy", "name email");

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: "Payroll not found",
      });
    }

    // Get salary information for bank details
    const salary = await Salary.findOne({ userId: payroll.userId });

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=payslip_${payroll.userId.employeeId}_${payroll.month}_${payroll.year}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('PAYSLIP', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12)
       .text(`Period: ${payroll.month}/${payroll.year}`, { align: 'center' })
       .moveDown();

    // Employee Information
    doc.fontSize(14).text('Employee Information', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10)
       .text(`Employee Name: ${payroll.userId.name}`)
       .text(`Employee ID: ${payroll.userId.employeeId || 'N/A'}`)
       .text(`Department: ${payroll.userId.department}`)
       .text(`Email: ${payroll.userId.email}`)
       .moveDown();

    // Bank Details
    if (salary?.bankAccount) {
      doc.fontSize(14).text('Bank Details', { underline: true });
      doc.moveDown(0.5);
      
      doc.fontSize(10)
         .text(`Bank Name: ${salary.bankAccount.bankName || 'N/A'}`)
         .text(`Account Number: ${salary.bankAccount.accountNumber || 'N/A'}`)
         .text(`IFSC Code: ${salary.bankAccount.ifscCode || 'N/A'}`)
         .text(`Branch: ${salary.bankAccount.branch || 'N/A'}`)
         .moveDown();
    }

    // Attendance Summary
    doc.fontSize(14).text('Attendance Summary', { underline: true });
    doc.moveDown(0.5);
    
    const attendanceData = [
      ['Present Days', payroll.presentDays],
      ['Half Days', payroll.halfDays],
      ['Leave Days', payroll.leaveDays],
      ['Holiday Days', payroll.holidayDays],
      ['Absent Days', payroll.absentDays],
      ['Overtime Hours', payroll.overtimeHours],
      ['Total Working Days', payroll.totalWorkingDays],
      ['Total Paid Days', payroll.totalPaidDays],
    ];

    attendanceData.forEach(([label, value]) => {
      doc.fontSize(10)
         .text(label, { continued: true })
         .text(`: ${value}`, { align: 'right' });
    });
    doc.moveDown();

    // Salary Breakdown
    doc.fontSize(14).text('Salary Breakdown', { underline: true });
    doc.moveDown(0.5);

    // Earnings
    doc.fontSize(12).text('Earnings', { underline: true });
    const earningsData = [
      ['Basic Salary', payroll.basicSalary],
      ['Present Salary', payroll.presentSalary],
      ['Half Day Salary', payroll.halfDaySalary],
      ['Holiday Salary', payroll.holidaySalary],
      ['Leave Salary', payroll.leaveSalary],
      ['Overtime Salary', payroll.overtimeSalary],
      ['Allowances', payroll.allowances],
    ];

    earningsData.forEach(([label, value]) => {
      doc.fontSize(10)
         .text(label, { continued: true })
         .text(`: ₹${value.toFixed(2)}`, { align: 'right' });
    });
    doc.moveDown(0.5);

    // Deductions
    doc.fontSize(12).text('Deductions', { underline: true });
    const deductionsData = [
      ['Absent Deductions', payroll.absentDeductions],
      ['Salary Deductions', payroll.salaryDeductions],
      ['Advance Payment', payroll.advancedPaymentDeduction],
    ];

    deductionsData.forEach(([label, value]) => {
      doc.fontSize(10)
         .text(label, { continued: true })
         .text(`: ₹${value.toFixed(2)}`, { align: 'right' });
    });
    doc.moveDown();

    // Totals
    doc.fontSize(14).text('Payment Summary', { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Gross Salary', { continued: true })
       .text(`: ₹${payroll.grossSalary.toFixed(2)}`, { align: 'right' })
       .moveDown(0.5);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Total Deductions', { continued: true })
       .text(`: ₹${payroll.totalDeductions.toFixed(2)}`, { align: 'right' })
       .moveDown(0.5);
    
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('NET SALARY', { continued: true })
       .text(`: ₹${payroll.netSalary.toFixed(2)}`, { align: 'right' })
       .moveDown();

    // Payment Information
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Payment Information')
       .moveDown(0.5);
    
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Payment Status: ${payroll.paymentStatus.toUpperCase()}`);
    
    if (payroll.paidDate) {
      doc.text(`Paid Date: ${formatDate(payroll.paidDate)}`);
    }
    
    if (salary?.paymentMethod) {
      doc.text(`Payment Method: ${salary.paymentMethod}`);
    }
    
    if (payroll.notes) {
      doc.moveDown()
         .text(`Notes: ${payroll.notes}`);
    }

    // Footer
    doc.moveDown(2)
       .fontSize(10)
       .text('Generated By:', { continued: true })
       .text(` ${payroll.generatedBy?.name || 'System'}`, { align: 'right' });
    
    doc.text('Generated On:', { continued: true })
       .text(` ${formatDate(payroll.createdAt)}`, { align: 'right' });

    doc.moveDown()
       .fontSize(8)
       .text('This is a computer-generated document and does not require a signature.', { align: 'center' });

    doc.end();

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating payslip PDF",
      error: error.message,
    });
  }
};

/* =========================
   Get Payroll Payment Summary
   GET /api/payroll/admin/payment-summary
   Private (Admin/Super Admin)
========================= */
export const getPaymentSummary = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view payment summary",
      });
    }

    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        success: false,
        message: "Month and year are required",
      });
    }

    // Get all payrolls
    const payrolls = await Payroll.find({
      month: parseInt(month),
      year: parseInt(year),
    })
      .populate("userId", "name email employeeId department")
      .sort({ "userId.department": 1, "userId.name": 1 });

    // Get bank details
    const userIds = payrolls.map(p => p.userId._id);
    const salaries = await Salary.find({ userId: { $in: userIds } });
    const salaryMap = {};
    salaries.forEach(salary => {
      salaryMap[salary.userId.toString()] = salary;
    });

    // Prepare response data
    const paymentData = payrolls.map(payroll => {
      const salary = salaryMap[payroll.userId._id.toString()];
      const bankAccount = salary?.bankAccount || {};
      
      return {
        payrollId: payroll._id,
        employeeId: payroll.userId.employeeId,
        employeeName: payroll.userId.name,
        department: payroll.userId.department,
        email: payroll.userId.email,
        bankDetails: {
          accountNumber: bankAccount.accountNumber,
          bankName: bankAccount.bankName,
          ifscCode: bankAccount.ifscCode,
          branch: bankAccount.branch,
        },
        salaryDetails: {
          basicSalary: payroll.basicSalary,
          allowances: payroll.allowances,
          overtimeSalary: payroll.overtimeSalary,
          grossSalary: payroll.grossSalary,
          deductions: payroll.totalDeductions,
          netSalary: payroll.netSalary,
        },
        paymentStatus: payroll.paymentStatus,
        paidDate: payroll.paidDate,
        paymentMethod: salary?.paymentMethod,
      };
    });

    // Calculate totals
    const totals = {
      totalEmployees: payrolls.length,
      totalNetSalary: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      totalGrossSalary: payrolls.reduce((sum, p) => sum + p.grossSalary, 0),
      totalDeductions: payrolls.reduce((sum, p) => sum + p.totalDeductions, 0),
      byStatus: {
        pending: payrolls.filter(p => p.paymentStatus === 'pending').length,
        processing: payrolls.filter(p => p.paymentStatus === 'processing').length,
        paid: payrolls.filter(p => p.paymentStatus === 'paid').length,
        failed: payrolls.filter(p => p.paymentStatus === 'failed').length,
      },
      byDepartment: {},
    };

    // Calculate department totals
    payrolls.forEach(payroll => {
      const dept = payroll.userId.department;
      if (!totals.byDepartment[dept]) {
        totals.byDepartment[dept] = {
          count: 0,
          totalNetSalary: 0,
          totalGrossSalary: 0,
        };
      }
      totals.byDepartment[dept].count++;
      totals.byDepartment[dept].totalNetSalary += payroll.netSalary;
      totals.byDepartment[dept].totalGrossSalary += payroll.grossSalary;
    });

    res.status(200).json({
      success: true,
      message: "Payment summary retrieved successfully",
      data: {
        period: { month, year },
        totals,
        paymentData,
        downloadLinks: {
          excel: `/api/payroll/admin/download-all-payslips/excel?month=${month}&year=${year}`,
          pdf: `/api/payroll/admin/download-all-payslips/pdf?month=${month}&year=${year}`,
          csv: `/api/payroll/admin/download-bank-payment-csv?month=${month}&year=${year}`,
        },
      },
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching payment summary",
      error: error.message,
    });
  }
};
