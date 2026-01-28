


import mongoose from "mongoose"

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: [
        "pan_card",
        "aadhar_card",
        "bank_details",
        "bank_passbook",
        "cheque_leaf",
        "10th_marksheet",
        "12th_marksheet",
        "graduation_marksheet",
        "printed_documents",
        "employment_letter",
        "other",
      ],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    metadata: {
      aadharNumber: String, // For Aadhar card
      panNumber: String, // For PAN card
      bankAccountNumber: String, // For bank documents
      bankName: String,
      bankIFSC: String,
      documentName: String, // For printed documents
      documentDescription: String,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verificationDate: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    remarks: {
      type: String,
      default: "",
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

const Document = mongoose.model("Document", documentSchema)
export default Document