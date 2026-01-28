import Attendance from "../models/Attendance.js"
import Holiday from "../models/Holiday.js"
import Leave from "../models/Leave.js"
import Salary from "../models/Salary.js"
import AdvancePayment from "../models/AdvancePayment.js"

// Helper function to calculate working days
const calculateWorkingDays = (year, month, weeklyOffDay = 0) => {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  let workingDays = 0
  let weeklyOffDays = 0
  
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const day = d.getDay()
    if (day === weeklyOffDay) {
      weeklyOffDays++
    } else {
      workingDays++
    }
  }
  
  return { workingDays, weeklyOffDays, totalCalendarDays: lastDay.getDate() }
}

// Helper function to calculate salary components
const calculateSalaryComponents = async (userId, year, month, company) => {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  
  // Get salary information
  const salary = await Salary.findOne({ userId })
  if (!salary) throw new Error("Salary information not found")
  
  // Calculate total calendar days and working days
  const { workingDays, weeklyOffDays, totalCalendarDays } = calculateWorkingDays(year, month, 0) // 0 = Sunday
  
  // Count holidays
  const holidays = await Holiday.find({
    date: { $gte: firstDay, $lte: lastDay },
    company: company,
  })
  const holidayDays = holidays.length
  
  // Count approved leaves
  const leaves = await Leave.find({
    userId,
    fromDate: { $gte: firstDay },
    toDate: { $lte: lastDay },
    status: "approved",
  })
  
  // Calculate leave days (excluding weekends and holidays)
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

export { calculateSalaryComponents, calculateWorkingDays }