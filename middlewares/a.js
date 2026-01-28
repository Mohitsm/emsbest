// // import multer from 'multer';
// // import path from 'path';
// // import fs from 'fs';
// // import { v4 as uuidv4 } from 'uuid';

// // // Ensure upload directory exists
// // const uploadDir = 'uploads/announcements';
// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// // }

// // // Configure storage
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + '-' + uuidv4();
// //     const extension = path.extname(file.originalname).toLowerCase();
// //     const fileName = file.fieldname + '-' + uniqueSuffix + extension;
// //     cb(null, fileName);
// //   }
// // });

// // // File filter
// // const fileFilter = (req, file, cb) => {
// //   const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;
// //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
// //   const mimetype = allowedTypes.test(file.mimetype);

// //   if (mimetype && extname) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only image, PDF, and document files are allowed!'));
// //   }
// // };

// // // Create multer instance with limits
// // const upload = multer({
// //   storage: storage,
// //   fileFilter: fileFilter,
// //   limits: {
// //     fileSize: 10 * 1024 * 1024, // 10MB limit per file
// //     files: 5 // Maximum 5 files
// //   }
// // });

// // // Middleware for single file upload
// // export const uploadSingle = (fieldName) => {
// //   return upload.single(fieldName);
// // };

// // // Middleware for multiple file uploads
// // export const uploadMultiple = (fieldName, maxCount = 5) => {
// //   return upload.array(fieldName, maxCount);
// // };

// // // Middleware for mixed uploads (files and fields)
// // export const uploadMixed = (fields) => {
// //   return upload.fields(fields);
// // };

// // // Clean up uploaded files on error
// // export const cleanupUploadedFiles = (req) => {
// //   if (req.files) {
// //     const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
// //     files.forEach(file => {
// //       fs.unlink(file.path, (err) => {
// //         if (err) console.error('Error deleting file:', err);
// //       });
// //     });
// //   }
// // };

// // // Get file info for storage
// // export const getFileInfo = (file) => {
// //   return {
// //     fileName: file.filename,
// //     fileUrl: `/uploads/announcements/${file.filename}`,
// //     fileType: file.mimetype,
// //     fileSize: file.size,
// //     originalName: file.originalname
// //   };
// // };

// // middlewares/a.js
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { v4 as uuidv4 } from 'uuid';

// // Ensure upload directories exist
// const ensureUploadDir = (dir) => {
//   if (!fs.existsSync(dir)) {
//     fs.mkdirSync(dir, { recursive: true });
//   }
// };

// // Configure storage
// const storage = (uploadDir) => multer.diskStorage({
//   destination: function (req, file, cb) {
//     const dir = path.join(process.cwd(), 'uploads', uploadDir);
//     ensureUploadDir(dir);
//     cb(null, dir);
//   },
//   filename: function (req, file, cb) {
//     const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   }
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//   // Allowed file types
//   const allowedMimeTypes = [
//     'image/jpeg',
//     'image/png',
//     'image/gif',
//     'application/pdf',
//     'application/msword',
//     'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//     'application/vnd.ms-excel',
//     'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//     'text/plain'
//   ];

//   if (allowedMimeTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     cb(new Error(`Invalid file type. Only ${allowedMimeTypes.join(', ')} are allowed.`), false);
//   }
// };

// // Create multer instance
// export const uploadMixed = (fields, uploadDir = 'general') => {
//   return multer({
//     storage: storage(uploadDir),
//     fileFilter: fileFilter,
//     limits: {
//       fileSize: 10 * 1024 * 1024, // 10MB max file size
//       files: 5 // Max 5 files
//     }
//   }).fields(fields);
// };

// // Get file info
// export const getFileInfo = (file) => {
//   return {
//     fileName: file.filename,
//     originalName: file.originalname,
//     fileType: file.mimetype,
//     fileSize: file.size,
//     uploadedAt: new Date()
//   };
// };

// // Cleanup uploaded files on error
// export const cleanupUploadedFiles = (req) => {
//   if (!req.files) return;

//   Object.values(req.files).forEach(files => {
//     const fileArray = Array.isArray(files) ? files : [files];
//     fileArray.forEach(file => {
//       const filePath = path.join(process.cwd(), 'uploads', file.destination, file.filename);
//       if (fs.existsSync(filePath)) {
//         fs.unlinkSync(filePath);
//       }
//     });
//   });
// };

// // Single file upload
// export const uploadSingle = (fieldName, uploadDir = 'general') => {
//   return multer({
//     storage: storage(uploadDir),
//     fileFilter: fileFilter,
//     limits: {
//       fileSize: 5 * 1024 * 1024 // 5MB max file size
//     }
//   }).single(fieldName);
// };

// // Array upload
// export const uploadArray = (fieldName, maxCount = 5, uploadDir = 'general') => {
//   return multer({
//     storage: storage(uploadDir),
//     fileFilter: fileFilter,
//     limits: {
//       fileSize: 10 * 1024 * 1024, // 10MB max file size
//       files: maxCount
//     }
//   }).array(fieldName, maxCount);
// };

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure upload directories exist
const ensureUploadDirs = () => {
  const dirs = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), 'uploads', 'announcements'),
    path.join(process.cwd(), 'uploads', 'profiles')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

ensureUploadDirs();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = 'uploads';
    
    if (req.baseUrl.includes('announcements')) {
      uploadPath = path.join(uploadPath, 'announcements');
    } else if (req.baseUrl.includes('users')) {
      uploadPath = path.join(uploadPath, 'profiles');
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Maximum 5 files
  }
});

// Helper function to get file info
export const getFileInfo = (file) => {
  return {
    fileName: file.filename,
    originalName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedAt: new Date()
  };
};

// Helper function to clean up uploaded files on error
export const cleanupUploadedFiles = (req) => {
  if (req.files) {
    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    files.forEach(file => {
      const filePath = path.join(file.destination, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  }
};

export default upload;