/* =========================
   Document Type Configuration
========================= */
export const DOCUMENT_TYPES = {
  AADHAR_CARD: {
    value: "aadhar_card",
    label: "Aadhar Card",
    description: "12-digit unique identity document",
    category: "identification",
    required: false,
    metadata: ["aadharNumber"],
  },
  PAN_CARD: {
    value: "pan_card",
    label: "PAN Card",
    description: "Permanent Account Number issued by Income Tax Department",
    category: "identification",
    required: false,
    metadata: ["panNumber"],
  },
  BANK_DETAILS: {
    value: "bank_details",
    label: "Bank Account Details",
    description: "Bank account verification document",
    category: "financial",
    required: false,
    metadata: ["bankAccountNumber", "bankName", "bankIFSC"],
  },
  BANK_PASSBOOK: {
    value: "bank_passbook",
    label: "Bank Passbook",
    description: "Bank passbook copy for account verification",
    category: "financial",
    required: false,
    metadata: ["bankName"],
  },
  CHEQUE_LEAF: {
    value: "cheque_leaf",
    label: "Cheque Leaf",
    description: "Cancelled cheque leaf",
    category: "financial",
    required: false,
    metadata: ["bankName"],
  },
  MARKSHEET_10TH: {
    value: "10th_marksheet",
    label: "10th Standard Marksheet",
    description: "Class 10 examination marksheet",
    category: "educational",
    required: false,
    metadata: [],
  },
  MARKSHEET_12TH: {
    value: "12th_marksheet",
    label: "12th Standard Marksheet",
    description: "Class 12 examination marksheet",
    category: "educational",
    required: false,
    metadata: [],
  },
  MARKSHEET_GRADUATION: {
    value: "graduation_marksheet",
    label: "Graduation Marksheet",
    description: "Bachelor's degree marksheet/transcript",
    category: "educational",
    required: false,
    metadata: [],
  },
  PRINTED_DOCUMENTS: {
    value: "printed_documents",
    label: "Printed Documents",
    description: "Other printed official documents",
    category: "other",
    required: false,
    metadata: ["documentName", "documentDescription"],
  },
  EMPLOYMENT_LETTER: {
    value: "employment_letter",
    label: "Employment Letter",
    description: "Current/previous employment confirmation letter",
    category: "employment",
    required: false,
    metadata: [],
  },
  OTHER: {
    value: "other",
    label: "Other Document",
    description: "Any other supporting document",
    category: "other",
    required: false,
    metadata: ["documentName", "documentDescription"],
  },
}

export const DOCUMENT_CATEGORIES = {
  identification: {
    label: "Identification Documents",
    types: ["aadhar_card", "pan_card"],
  },
  financial: {
    label: "Financial Documents",
    types: ["bank_details", "bank_passbook", "cheque_leaf"],
  },
  educational: {
    label: "Educational Documents",
    types: ["10th_marksheet", "12th_marksheet", "graduation_marksheet"],
  },
  employment: {
    label: "Employment Documents",
    types: ["employment_letter"],
  },
  other: {
    label: "Other Documents",
    types: ["printed_documents", "other"],
  },
}

/* =========================
   Validation Rules for Document Types
========================= */
export const VALIDATION_RULES = {
  aadhar_card: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload Aadhar card front/back (PDF or Image)",
  },
  pan_card: {
    maxSize: 5 * 1024 * 1024,
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload PAN card (PDF or Image)",
  },
  bank_passbook: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload bank passbook pages showing account holder name",
  },
  cheque_leaf: {
    maxSize: 5 * 1024 * 1024,
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload cancelled cheque leaf",
  },
  bank_details: {
    maxSize: 10 * 1024 * 1024,
    allowedFormats: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    description: "Upload bank details document",
  },
  "10th_marksheet": {
    maxSize: 5 * 1024 * 1024,
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload 10th standard marksheet",
  },
  "12th_marksheet": {
    maxSize: 5 * 1024 * 1024,
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload 12th standard marksheet",
  },
  graduation_marksheet: {
    maxSize: 10 * 1024 * 1024,
    allowedFormats: ["pdf", "jpg", "jpeg", "png"],
    description: "Upload graduation marksheet/degree certificate",
  },
  printed_documents: {
    maxSize: 15 * 1024 * 1024,
    allowedFormats: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    description: "Upload any printed official document",
  },
  employment_letter: {
    maxSize: 10 * 1024 * 1024,
    allowedFormats: ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
    description: "Upload employment letter on company letterhead",
  },
}

export default {
  DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  VALIDATION_RULES,
}
