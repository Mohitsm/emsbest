


import Salary from "../models/Salary.js"
import User from "../models/User.js"
import Payroll from "../models/Payroll.js"

/* =========================
   Create or Update Salary
   POST /api/salary
   Private (Admin/Super Admin)
========================= */
export const createOrUpdateSalary = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to manage salaries",
      })
    }

    const {
      userId,
      basicSalary,
      workingHoursPerDay = 8,
      workingDaysPerWeek = 5,
      lunchBreakHours = 1,
      overtimeRate = 1.5,
      // Allowances
      houseRentAllowance = 0,
      travelAllowance = 0,
      medicalAllowance = 0,
      specialAllowance = 0,
      // Deductions
      providentFund = 0,
      professionalTax = 0,
      incomeTax = 0,
      otherDeductions = 0,
      // Payment info
      currencyType = "INR",
      paymentMethod = "bank_transfer",
      bankAccount,
      effectiveFrom,
      effectiveTo,
      isActive = true,
      remark,
    } = req.body

    // Validation
    if (!userId || !basicSalary) {
      return res.status(400).json({
        success: false,
        message: "User ID and basic salary are required",
      })
    }

    if (basicSalary < 0) {
      return res.status(400).json({
        success: false,
        message: "Basic salary must be a positive number",
      })
    }

    // Check if user exists and belongs to same company
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    if (user.company !== req.user.company) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this user",
      })
    }

    // Check if salary record exists
    let salary = await Salary.findOne({ userId })

    if (salary) {
      // If updating active salary, check if it's being deactivated
      if (salary.isActive && !isActive) {
        // Check if there are any pending payrolls
        const currentYear = new Date().getFullYear()
        const currentMonth = new Date().getMonth() + 1
        
        const pendingPayrolls = await Payroll.find({
          userId,
          year: { $gte: currentYear },
          month: { $gte: currentMonth },
          paymentStatus: { $in: ["pending", "processing"] }
        })

        if (pendingPayrolls.length > 0) {
          return res.status(400).json({
            success: false,
            message: "Cannot deactivate salary with pending payrolls",
          })
        }
      }

      // Update existing salary
      salary.basicSalary = basicSalary
      salary.workingHoursPerDay = workingHoursPerDay
      salary.workingDaysPerWeek = workingDaysPerWeek
      salary.lunchBreakHours = lunchBreakHours
      salary.overtimeRate = overtimeRate
      
      // Update allowances
      salary.houseRentAllowance = houseRentAllowance
      salary.travelAllowance = travelAllowance
      salary.medicalAllowance = medicalAllowance
      salary.specialAllowance = specialAllowance
      
      // Update deductions
      salary.providentFund = providentFund
      salary.professionalTax = professionalTax
      salary.incomeTax = incomeTax
      salary.otherDeductions = otherDeductions
      
      // Update payment info
      salary.currencyType = currencyType
      salary.paymentMethod = paymentMethod
      if (bankAccount) salary.bankAccount = bankAccount
      if (effectiveFrom) salary.effectiveFrom = effectiveFrom
      if (effectiveTo) salary.effectiveTo = effectiveTo
      salary.isActive = isActive
      salary.remark = remark
      salary.updatedBy = req.user._id
    } else {
      // Create new salary
      salary = new Salary({
        userId,
        basicSalary,
        workingHoursPerDay,
        workingDaysPerWeek,
        lunchBreakHours,
        overtimeRate,
        houseRentAllowance,
        travelAllowance,
        medicalAllowance,
        specialAllowance,
        providentFund,
        professionalTax,
        incomeTax,
        otherDeductions,
        currencyType,
        paymentMethod,
        bankAccount,
        effectiveFrom: effectiveFrom || Date.now(),
        effectiveTo,
        isActive,
        remark,
        createdBy: req.user._id,
      })
    }

    await salary.save()

    // Populate user information
    const populatedSalary = await Salary.findById(salary._id)
      .populate("userId", "name email employeeId department company")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")

    res.status(200).json({
      success: true,
      message: salary.isActive ? "Salary information saved successfully" : "Salary information deactivated",
      data: populatedSalary,
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Salary information already exists for this user",
      })
    }
    res.status(500).json({
      success: false,
      message: "Error saving salary information",
      error: error.message,
    })
  }
}

/* =========================
   Get Salary Information
   GET /api/salary/:userId
   GET /api/salary/me (for current user)
   Private
========================= */
export const getSalary = async (req, res) => {
  try {
    let userId = req.params.userId
    
    // If no userId provided, use current user
    if (!userId || userId === "me") {
      userId = req.user._id
    }

    // Authorization: Users can only view their own salary
    if (req.user.role === "user" && req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view other user's salary",
      })
    }

    // For admin viewing other user's salary, check if user belongs to same company
    if (req.user.role !== "user") {
      const user = await User.findById(userId)
      if (!user || user.company !== req.user.company) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this user's salary",
        })
      }
    }

    const salary = await Salary.findOne({ userId })
      .populate("userId", "name email employeeId department company")
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")

    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary information not found",
      })
    }

    res.status(200).json({
      success: true,
      data: salary,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching salary information",
      error: error.message,
    })
  }
}

/* =========================
   Get All Salaries
   GET /api/salary/admin/all
   Private (Admin/Super Admin)
========================= */
export const getAllSalaries = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view all salaries",
      })
    }

    const {
      isActive,
      department,
      page = 1,
      limit = 20,
      search,
    } = req.query

    // Build query for users in the same company
    const userQuery = { company: req.user.company }
    
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

    // Get users matching the query
    const users = await User.find(userQuery).select("_id name email employeeId department company")

    if (users.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        total: 0,
        totalPages: 0,
        currentPage: parseInt(page),
        data: [],
      })
    }

    const userIds = users.map(user => user._id)

    // Build salary query
    const salaryQuery = { userId: { $in: userIds } }

    // Status filter
    if (isActive !== undefined) {
      salaryQuery.isActive = isActive === "true"
    }

    // Pagination
    const pageNumber = parseInt(page)
    const pageSize = parseInt(limit)
    const skip = (pageNumber - 1) * pageSize

    // Get salaries
    const salaries = await Salary.find(salaryQuery)
      .populate({
        path: "userId",
        select: "name email employeeId department company",
      })
      .populate("createdBy", "name email")
      .populate("updatedBy", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)

    // Filter out null user results
    const filteredSalaries = salaries.filter(salary => salary.userId !== null)

    // Get total count
    const total = await Salary.countDocuments(salaryQuery)

    res.status(200).json({
      success: true,
      count: filteredSalaries.length,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: pageNumber,
      data: filteredSalaries,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching salaries",
      error: error.message,
    })
  }
}

/* =========================
   Get Salary Statistics
   GET /api/salary/admin/stats
   Private (Admin/Super Admin)
========================= */


export const getSalaryStats = async (req, res) => {
  try {
    // 🔐 Authorization
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view salary statistics",
      })
    }

    // 🧑‍💼 Get all ACTIVE EMPLOYEES (role = user)
    const employees = await User.find({
      company: req.user.company,
      isActive: true,
      role: "user", // ✅ IMPORTANT FIX
    }).select("_id name department employeeId email company")

    const employeeIds = employees.map(emp => emp._id)

    // 💰 Active salary aggregation
    const activeSalaries = await Salary.aggregate([
      {
        $match: {
          userId: { $in: employeeIds },
          isActive: true,
        },
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },

          totalBasicSalary: { $sum: "$basicSalary" },
          avgBasicSalary: { $avg: "$basicSalary" },
          maxBasicSalary: { $max: "$basicSalary" },
          minBasicSalary: { $min: "$basicSalary" },

          totalAllowances: {
            $sum: {
              $add: [
                "$houseRentAllowance",
                "$travelAllowance",
                "$medicalAllowance",
                "$specialAllowance",
              ],
            },
          },

          totalDeductions: {
            $sum: {
              $add: [
                "$providentFund",
                "$professionalTax",
                "$incomeTax",
                "$otherDeductions",
              ],
            },
          },

          totalGrossSalary: {
            $sum: {
              $subtract: [
                {
                  $add: [
                    "$basicSalary",
                    "$houseRentAllowance",
                    "$travelAllowance",
                    "$medicalAllowance",
                    "$specialAllowance",
                  ],
                },
                {
                  $add: [
                    "$providentFund",
                    "$professionalTax",
                    "$incomeTax",
                    "$otherDeductions",
                  ],
                },
              ],
            },
          },
        },
      },
    ])

    // 📌 Employees WITH salary
    const salaryUserIds = await Salary.find({
      userId: { $in: employeeIds },
      isActive: true,
    }).distinct("userId")

    // ❌ Employees WITHOUT salary
    const employeesWithoutSalary = await User.find({
      _id: { $nin: salaryUserIds },
      company: req.user.company,
      isActive: true,
      role: "user", // ✅ IMPORTANT FIX
    }).select("name email employeeId department company")

    const totalEmployees = employees.length
    const totalWithSalary = activeSalaries[0]?.count || 0

    // 📊 Final response
    const stats = {
      overview: activeSalaries[0] || {
        count: 0,
        totalBasicSalary: 0,
        avgBasicSalary: 0,
        maxBasicSalary: 0,
        minBasicSalary: 0,
        totalGrossSalary: 0,
        totalAllowances: 0,
        totalDeductions: 0,
      },

      employeesWithoutSalary: {
        count: employeesWithoutSalary.length,
        employees: employeesWithoutSalary,
      },

      summary: {
        totalEmployees,
        totalWithSalary,
        percentageWithSalary:
          totalEmployees > 0
            ? Number(((totalWithSalary / totalEmployees) * 100).toFixed(2))
            : 0,
      },
    }

    return res.status(200).json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Salary Stats Error:", error)
    return res.status(500).json({
      success: false,
      message: "Error fetching salary statistics",
      error: error.message,
    })
  }
}


/* =========================
   Delete Salary
   DELETE /api/salary/:id
   Private (Admin/Super Admin)
========================= */
export const deleteSalary = async (req, res) => {
  try {
    // Authorization check
    if (!req.user.isAdmin()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete salary",
      })
    }

    const salary = await Salary.findById(req.params.id)
    if (!salary) {
      return res.status(404).json({
        success: false,
        message: "Salary information not found",
      })
    }

    // Check if user belongs to same company
    const user = await User.findById(salary.userId)
    if (!user || user.company !== req.user.company) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this salary",
      })
    }

    // Check if there are any payrolls associated with this salary
    const payrolls = await Payroll.countDocuments({ userId: salary.userId })
    if (payrolls > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete salary with existing payroll records",
      })
    }

    await salary.deleteOne()

    res.status(200).json({
      success: true,
      message: "Salary information deleted successfully",
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting salary",
      error: error.message,
    })
  }
}