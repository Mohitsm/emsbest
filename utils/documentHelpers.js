import { DOCUMENT_TYPES, VALIDATION_RULES } from "../config/documentTypes.js"

/* =========================
   Document Type Helpers
========================= */

export const getDocumentTypeConfig = (documentType) => {
  return Object.values(DOCUMENT_TYPES).find((type) => type.value === documentType) || null
}

export const isValidDocumentType = (documentType) => {
  return Object.values(DOCUMENT_TYPES).some((type) => type.value === documentType)
}

export const getValidationRule = (documentType) => {
  return VALIDATION_RULES[documentType] || null
}

/* =========================
   Validation Helpers
========================= */

export const validateAadharNumber = (aadharNumber) => {
  if (!aadharNumber) return true // Optional field
  return /^\d{12}$/.test(aadharNumber)
}

export const validatePANNumber = (panNumber) => {
  if (!panNumber) return true // Optional field
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panNumber)
}

export const validateIFSCCode = (ifscCode) => {
  if (!ifscCode) return true // Optional field
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifscCode)
}

export const validateBankAccountNumber = (accountNumber) => {
  if (!accountNumber) return true // Optional field
  return /^\d{9,18}$/.test(accountNumber.toString())
}

export const validateFileSize = (fileSizeBytes, documentType) => {
  const rule = getValidationRule(documentType)
  if (!rule) return true
  return fileSizeBytes <= rule.maxSize
}

export const validateFileFormat = (mimeType, documentType) => {
  const rule = getValidationRule(documentType)
  if (!rule) return true

  // Map MIME types to format extensions
  const mimeToFormat = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  }

  const format = mimeToFormat[mimeType]
  return format && rule.allowedFormats.includes(format)
}

/* =========================
   Document Metadata Helpers
========================= */

export const extractMetadata = (documentType, metadataInput) => {
  const typeConfig = getDocumentTypeConfig(documentType)
  if (!typeConfig) return {}

  const metadata = {}
  const allowedFields = typeConfig.metadata || []

  // Validate and extract only allowed metadata fields
  allowedFields.forEach((field) => {
    if (metadataInput[field]) {
      // Validate specific fields
      if (field === "aadharNumber" && !validateAadharNumber(metadataInput[field])) {
        throw new Error("Invalid Aadhar number format")
      }
      if (field === "panNumber" && !validatePANNumber(metadataInput[field])) {
        throw new Error("Invalid PAN number format")
      }
      if (field === "bankIFSC" && !validateIFSCCode(metadataInput[field])) {
        throw new Error("Invalid IFSC code format")
      }
      if (field === "bankAccountNumber" && !validateBankAccountNumber(metadataInput[field])) {
        throw new Error("Invalid bank account number format")
      }

      metadata[field] = metadataInput[field]
    }
  })

  return metadata
}

/* =========================
   Document Formatting Helpers
========================= */

export const formatDocumentResponse = (document, includeCache = false) => {
  const response = {
    id: document._id,
    documentType: document.documentType,
    fileName: document.fileName,
    fileSize: document.fileSize,
    fileUrl: `/api/files/download/${document._id}`,
    verificationStatus: document.verificationStatus,
    uploadedAt: document.createdAt,
  }

  if (document.metadata) {
    response.metadata = maskSensitiveData(document.metadata, document.documentType)
  }

  if (document.verificationStatus === "verified") {
    response.verifiedAt = document.verificationDate
    response.verifiedBy = document.verifiedBy?.name || "Unknown"
  }

  if (document.verificationStatus === "rejected") {
    response.rejectionReason = document.rejectionReason
  }

  if (includeCache && document.cachedFile) {
    response.cachedFile = document.cachedFile
  }

  return response
}

/* =========================
   Security Helpers
========================= */

export const maskSensitiveData = (metadata, documentType) => {
  const masked = { ...metadata }

  if (metadata.aadharNumber) {
    masked.aadharNumber = metadata.aadharNumber.replace(/\d(?=\d{4})/g, "*")
  }

  if (metadata.panNumber) {
    masked.panNumber = metadata.panNumber.substring(0, 2) + "***" + metadata.panNumber.substring(5)
  }

  if (metadata.bankAccountNumber) {
    masked.bankAccountNumber = "*".repeat(metadata.bankAccountNumber.length - 4) + metadata.bankAccountNumber.slice(-4)
  }

  return masked
}

/* =========================
   Document Statistics
========================= */

export const getDocumentStatistics = (documents) => {
  const stats = {
    total: documents.length,
    byType: {},
    byStatus: {
      pending: 0,
      verified: 0,
      rejected: 0,
    },
    totalSize: 0,
  }

  documents.forEach((doc) => {
    // Count by type
    if (!stats.byType[doc.documentType]) {
      stats.byType[doc.documentType] = 0
    }
    stats.byType[doc.documentType]++

    // Count by status
    stats.byStatus[doc.verificationStatus]++

    // Total size
    stats.totalSize += doc.fileSize || 0
  })

  stats.totalSizeFormatted = formatBytes(stats.totalSize)

  return stats
}

export const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
}

/* =========================
   Document Export
========================= */
export default {
  getDocumentTypeConfig,
  isValidDocumentType,
  getValidationRule,
  validateAadharNumber,
  validatePANNumber,
  validateIFSCCode,
  validateBankAccountNumber,
  validateFileSize,
  validateFileFormat,
  extractMetadata,
  formatDocumentResponse,
  maskSensitiveData,
  getDocumentStatistics,
  formatBytes,
}
