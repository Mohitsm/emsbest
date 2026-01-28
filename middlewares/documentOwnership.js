import Document from '../models/Document.js';

export const checkDocumentOwnership = async (req, res, next) => {
  try {
    const documentId = req.params.id;
    const userId = req.user._id;

    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Admin and super admin can access any document
    if (req.user.isAdmin()) {
      req.document = document;
      return next();
    }

    // Check if user owns the document
    if (document.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    req.document = document;
    next();
  } catch (error) {
    console.error('Document ownership check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

export const checkUserDocuments = (req, res, next) => {
  const requestedUserId = req.params.userId;
  const currentUserId = req.user._id.toString();

  // Admin and super admin can view any user's documents
  if (req.user.isAdmin()) {
    return next();
  }

  // Users can only view their own documents
  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these documents'
    });
  }

  next();
};