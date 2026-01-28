import WorkingHour from "../models/workingHour.js"

/* =========================
   Create Working Hour Template (Admin)
========================= */
export const createWorkingHour = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { name, hours, lunchBreak, overtimeMultiplier, description } = req.body

    if (!name || hours === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name and working hours are required",
      })
    }

    if (![8, 9, 12].includes(hours)) {
      return res.status(400).json({
        success: false,
        message: "Working hours must be 8, 9, or 12",
      })
    }

    const workingHour = await WorkingHour.create({
      company: req.user.company,
      name,
      hours,
      lunchBreak: lunchBreak || 0.75,
      overtimeMultiplier: overtimeMultiplier || 1.5,
      description,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Working hour template created successfully",
      data: workingHour,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating working hour template",
      error: err.message,
    })
  }
}

/* =========================
   Get All Working Hour Templates
========================= */
export const getWorkingHours = async (req, res) => {
  try {
    const workingHours = await WorkingHour.find({
      company: req.user.company,
      isActive: true,
    }).populate("createdBy", "name email")

    res.status(200).json({
      success: true,
      count: workingHours.length,
      data: workingHours,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching working hour templates",
      error: err.message,
    })
  }
}

/* =========================
   Get Default Working Hour
========================= */
export const getDefaultWorkingHour = async (req, res) => {
  try {
    const defaultHour = await WorkingHour.findOne({
      company: req.user.company,
      isActive: true,
    }).sort({ createdAt: 1 })

    if (!defaultHour) {
      return res.status(404).json({
        success: false,
        message: "No working hour template found. Admin must create one.",
        defaultSuggestion: { hours: 8, lunchBreak: 0.75 },
      })
    }

    res.status(200).json({
      success: true,
      data: defaultHour,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching default working hour",
      error: err.message,
    })
  }
}

/* =========================
   Update Working Hour Template (Admin)
========================= */
export const updateWorkingHour = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { id } = req.params
    const { name, hours, lunchBreak, overtimeMultiplier, description, isActive } = req.body

    const workingHour = await WorkingHour.findById(id)
    if (!workingHour) {
      return res.status(404).json({
        success: false,
        message: "Working hour template not found",
      })
    }

    if (name) workingHour.name = name
    if (hours) {
      if (![8, 9, 12].includes(hours)) {
        return res.status(400).json({
          success: false,
          message: "Working hours must be 8, 9, or 12",
        })
      }
      workingHour.hours = hours
    }
    if (lunchBreak) workingHour.lunchBreak = lunchBreak
    if (overtimeMultiplier) workingHour.overtimeMultiplier = overtimeMultiplier
    if (description) workingHour.description = description
    if (isActive !== undefined) workingHour.isActive = isActive

    await workingHour.save()

    res.status(200).json({
      success: true,
      message: "Working hour template updated successfully",
      data: workingHour,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating working hour template",
      error: err.message,
    })
  }
}
