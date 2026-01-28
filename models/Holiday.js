import mongoose from "mongoose"

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["national", "regional", "company"],
      default: "company",
    },
    company: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

const Holiday = mongoose.model("Holiday", holidaySchema)
export default Holiday
