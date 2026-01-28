import Holiday from "../models/Holiday.js"

/* =========================
   Create Holiday (Admin)
========================= */
export const createHoliday = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { name, date, description, type } = req.body

    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: "Name and date are required",
      })
    }

    // Check if holiday already exists
    const existingHoliday = await Holiday.findOne({ date: new Date(date) })
    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: "Holiday already exists for this date",
      })
    }

    const holiday = await Holiday.create({
      name,
      date: new Date(date),
      description,
      type: type || "company",
      company: req.user.company,
      createdBy: req.user._id,
    })

    res.status(201).json({
      success: true,
      message: "Holiday created successfully",
      data: holiday,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error creating holiday",
      error: err.message,
    })
  }
}

/* =========================
   Get All Holidays
========================= */
export const getHolidays = async (req, res) => {
  try {
    const { year } = req.query

    const filter = { company: req.user.company }
    if (year) {
      const startDate = new Date(year, 0, 1)
      const endDate = new Date(year, 11, 31)
      filter.date = { $gte: startDate, $lte: endDate }
    }

    const holidays = await Holiday.find(filter).populate("createdBy", "name email").sort({ date: 1 })

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error fetching holidays",
      error: err.message,
    })
  }
}

/* =========================
   Update Holiday (Admin)
========================= */
export const updateHoliday = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { id } = req.params
    const { name, date, description, type } = req.body

    const holiday = await Holiday.findById(id)
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      })
    }

    if (name) holiday.name = name
    if (date) holiday.date = new Date(date)
    if (description) holiday.description = description
    if (type) holiday.type = type

    await holiday.save()

    res.status(200).json({
      success: true,
      message: "Holiday updated successfully",
      data: holiday,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error updating holiday",
      error: err.message,
    })
  }
}

/* =========================
   Delete Holiday (Admin)
========================= */
export const deleteHoliday = async (req, res) => {
  try {
    if (!["admin", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const { id } = req.params

    const holiday = await Holiday.findByIdAndDelete(id)
    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: "Holiday not found",
      })
    }

    res.status(200).json({
      success: true,
      message: "Holiday deleted successfully",
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error deleting holiday",
      error: err.message,
    })
  }
}

/* =========================
   Check if Date is Holiday
========================= */
export const isHoliday = async (req, res) => {
  try {
    const { date } = req.query

    const holiday = await Holiday.findOne({
      date: { $gte: new Date(date), $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000) },
    })

    res.status(200).json({
      success: true,
      isHoliday: !!holiday,
      data: holiday,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error checking holiday",
      error: err.message,
    })
  }
}
