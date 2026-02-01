// // // // // // import multer from "multer";
// // // // // // import path from "path";
// // // // // // import fs from "fs";
// // // // // // import { v4 as uuidv4 } from "uuid";

// // // // // // // Ensure upload directory exists
// // // // // // const uploadDir = "uploads/profiles";
// // // // // // if (!fs.existsSync(uploadDir)) {
// // // // // //   fs.mkdirSync(uploadDir, { recursive: true });
// // // // // // }

// // // // // // // Configure storage
// // // // // // const storage = multer.diskStorage({
// // // // // //   destination: function (req, file, cb) {
// // // // // //     cb(null, uploadDir);
// // // // // //   },
// // // // // //   filename: function (req, file, cb) {
// // // // // //     const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
// // // // // //     cb(null, uniqueName);
// // // // // //   },
// // // // // // });

// // // // // // // File filter
// // // // // // const fileFilter = (req, file, cb) => {
// // // // // //   const allowedTypes = /jpeg|jpg|png|gif|webp/;
// // // // // //   const extname = allowedTypes.test(
// // // // // //     path.extname(file.originalname).toLowerCase()
// // // // // //   );
// // // // // //   const mimetype = allowedTypes.test(file.mimetype);

// // // // // //   if (mimetype && extname) {
// // // // // //     return cb(null, true);
// // // // // //   } else {
// // // // // //     cb(new Error("Only image files are allowed"));
// // // // // //   }
// // // // // // };

// // // // // // // Create upload instance
// // // // // // const upload = multer({
// // // // // //   storage: storage,
// // // // // //   limits: {
// // // // // //     fileSize: 5 * 1024 * 1024, // 5MB
// // // // // //   },
// // // // // //   fileFilter: fileFilter,
// // // // // // });

// // // // // // // Middleware for single file upload
// // // // // // export const uploadAvatar = upload.single("avatar");

// // // // // // // Middleware for multiple files (avatar and cover)
// // // // // // export const uploadProfileImages = upload.fields([
// // // // // //   { name: "avatar", maxCount: 1 },
// // // // // //   { name: "coverPhoto", maxCount: 1 },
// // // // // // ]);

// // // // // // // Middleware to save file URLs to request
// // // // // // export const processUploadedFiles = (req, res, next) => {
// // // // // //   if (req.files) {
// // // // // //     // Process avatar
// // // // // //     if (req.files["avatar"]) {
// // // // // //       req.body.avatar = `/uploads/profiles/${req.files["avatar"][0].filename}`;
// // // // // //     }
    
// // // // // //     // Process cover photo
// // // // // //     if (req.files["coverPhoto"]) {
// // // // // //       req.body.coverPhoto = `/uploads/profiles/${req.files["coverPhoto"][0].filename}`;
// // // // // //     }
// // // // // //   } else if (req.file) {
// // // // // //     req.body.avatar = `/uploads/profiles/${req.file.filename}`;
// // // // // //   }
  
// // // // // //   next();
// // // // // // };

// // // // // // // Clean up old files middleware
// // // // // // export const cleanupOldFiles = async (oldData, newData) => {
// // // // // //   if (oldData.avatar && newData.avatar && oldData.avatar !== newData.avatar) {
// // // // // //     const oldPath = oldData.avatar.replace("/uploads/profiles/", "uploads/profiles/");
// // // // // //     if (fs.existsSync(oldPath)) {
// // // // // //       fs.unlinkSync(oldPath);
// // // // // //     }
// // // // // //   }
  
// // // // // //   if (oldData.coverPhoto && newData.coverPhoto && oldData.coverPhoto !== newData.coverPhoto) {
// // // // // //     const oldPath = oldData.coverPhoto.replace("/uploads/profiles/", "uploads/profiles/");
// // // // // //     if (fs.existsSync(oldPath)) {
// // // // // //       fs.unlinkSync(oldPath);
// // // // // //     }
// // // // // //   }
// // // // // // };


// // // // // import multer from 'multer';
// // // // // import path from 'path';
// // // // // import fs from 'fs';

// // // // // // Ensure upload directory exists
// // // // // const uploadDir = 'uploads/profiles';
// // // // // if (!fs.existsSync(uploadDir)) {
// // // // //   fs.mkdirSync(uploadDir, { recursive: true });
// // // // // }

// // // // // // Configure storage
// // // // // const storage = multer.diskStorage({
// // // // //   destination: (req, file, cb) => {
// // // // //     cb(null, uploadDir);
// // // // //   },
// // // // //   filename: (req, file, cb) => {
// // // // //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// // // // //     const ext = path.extname(file.originalname);
// // // // //     cb(null, `${req.user._id}-${uniqueSuffix}${ext}`);
// // // // //   }
// // // // // });

// // // // // // File filter
// // // // // const fileFilter = (req, file, cb) => {
// // // // //   const allowedTypes = /jpeg|jpg|png|gif|webp/;
// // // // //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
// // // // //   const mimetype = allowedTypes.test(file.mimetype);

// // // // //   if (mimetype && extname) {
// // // // //     return cb(null, true);
// // // // //   } else {
// // // // //     cb(new Error('Only image files are allowed!'));
// // // // //   }
// // // // // };

// // // // // // Create upload instance
// // // // // const upload = multer({
// // // // //   storage: storage,
// // // // //   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
// // // // //   fileFilter: fileFilter
// // // // // });

// // // // // // Middleware for avatar upload
// // // // // export const uploadAvatar = upload.single('avatar');

// // // // // // Middleware for cover photo upload
// // // // // export const uploadCover = upload.single('coverPhoto');

// // // // // // Remove old file helper
// // // // // export const removeOldFile = (filePath) => {
// // // // //   if (filePath && !filePath.includes('dicebear.com')) {
// // // // //     const fullPath = path.join(process.cwd(), filePath);
// // // // //     if (fs.existsSync(fullPath)) {
// // // // //       fs.unlinkSync(fullPath);
// // // // //     }
// // // // //   }
// // // // // };
// // // // import multer from 'multer';
// // // // import path from 'path';
// // // // import fs from 'fs';
// // // // import { fileURLToPath } from 'url';

// // // // const __filename = fileURLToPath(import.meta.url);
// // // // const __dirname = path.dirname(__filename);

// // // // // Ensure uploads directory exists
// // // // const uploadDir = path.join(__dirname, '../../uploads');
// // // // if (!fs.existsSync(uploadDir)) {
// // // //   fs.mkdirSync(uploadDir, { recursive: true });
// // // //   console.log('Created uploads directory:', uploadDir);
// // // // }

// // // // // Configure storage
// // // // const storage = multer.diskStorage({
// // // //   destination: function (req, file, cb) {
// // // //     cb(null, uploadDir);
// // // //   },
// // // //   filename: function (req, file, cb) {
// // // //     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
// // // //     const ext = path.extname(file.originalname);
// // // //     const filename = file.fieldname + '-' + uniqueSuffix + ext;
// // // //     console.log('Saving file:', filename);
// // // //     cb(null, filename);
// // // //   }
// // // // });

// // // // // File filter
// // // // const fileFilter = (req, file, cb) => {
// // // //   const allowedTypes = /jpeg|jpg|png|gif|webp/;
// // // //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
// // // //   const mimetype = allowedTypes.test(file.mimetype);

// // // //   if (mimetype && extname) {
// // // //     return cb(null, true);
// // // //   } else {
// // // //     cb(new Error('Error: Images only (jpeg, jpg, png, gif, webp)!'), false);
// // // //   }
// // // // };

// // // // // Create multer instances with error handling
// // // // const createUploadMiddleware = (fieldName) => {
// // // //   return (req, res, next) => {
// // // //     const upload = multer({
// // // //       storage: storage,
// // // //       fileFilter: fileFilter,
// // // //       limits: { fileSize: 5 * 1024 * 1024 } // 5MB
// // // //     }).single(fieldName);

// // // //     upload(req, res, function (err) {
// // // //       if (err instanceof multer.MulterError) {
// // // //         // A Multer error occurred when uploading
// // // //         return res.status(400).json({
// // // //           success: false,
// // // //           message: `Upload error: ${err.message}`
// // // //         });
// // // //       } else if (err) {
// // // //         // An unknown error occurred
// // // //         return res.status(400).json({
// // // //           success: false,
// // // //           message: err.message
// // // //         });
// // // //       }
// // // //       // Everything went fine
// // // //       next();
// // // //     });
// // // //   };
// // // // };

// // // // export const uploadAvatarMiddleware = createUploadMiddleware('avatar');
// // // // export const uploadCoverMiddleware = createUploadMiddleware('coverPhoto');

// // // // // Remove old file utility
// // // // export const removeOldFile = async (filePath) => {
// // // //   try {
// // // //     if (filePath && !filePath.startsWith('http') && filePath.startsWith('/uploads/')) {
// // // //       const filename = path.basename(filePath);
// // // //       const fullPath = path.join(uploadDir, filename);
      
// // // //       if (fs.existsSync(fullPath)) {
// // // //         await fs.promises.unlink(fullPath);
// // // //         console.log('Removed old file:', fullPath);
// // // //       }
// // // //     }
// // // //   } catch (error) {
// // // //     console.error('Error removing old file:', error);
// // // //   }
// // // // };


// // // import multer from 'multer';
// // // import path from 'path';
// // // import fs from 'fs';
// // // import { fileURLToPath } from 'url';

// // // const __filename = fileURLToPath(import.meta.url);
// // // const __dirname = path.dirname(__filename);

// // // const uploadDir = path.join(__dirname, '../../public/uploads/profiles');

// // // if (!fs.existsSync(uploadDir)) {
// // //   fs.mkdirSync(uploadDir, { recursive: true });
// // // }

// // // const storage = multer.diskStorage({
// // //   destination: (req, file, cb) => cb(null, uploadDir),
// // //   filename: (req, file, cb) => {
// // //     const ext = path.extname(file.originalname);
// // //     cb(null, `${file.fieldname}-${Date.now()}${ext}`);
// // //   }
// // // });

// // // const fileFilter = (req, file, cb) => {
// // //   const allowed = /jpeg|jpg|png|webp/;
// // //   allowed.test(file.mimetype)
// // //     ? cb(null, true)
// // //     : cb(new Error('Only images allowed'));
// // // };

// // // const upload = multer({
// // //   storage,
// // //   fileFilter,
// // //   limits: { fileSize: 5 * 1024 * 1024 }
// // // });

// // // export const uploadAvatarMiddleware = upload.single('avatar');
// // // export const uploadCoverMiddleware = upload.single('coverPhoto');
// // import multer from 'multer';
// // import path from 'path';
// // import fs from 'fs';
// // import { fileURLToPath } from 'url';

// // const __filename = fileURLToPath(import.meta.url);
// // const __dirname = path.dirname(__filename);

// // // Create upload directory
// // const uploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'profiles');
// // if (!fs.existsSync(uploadDir)) {
// //   fs.mkdirSync(uploadDir, { recursive: true });
// //   console.log(`Created upload directory: ${uploadDir}`);
// // }

// // // Configure storage
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, uploadDir);
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
// //     const ext = path.extname(file.originalname).toLowerCase();
// //     const filename = `${file.fieldname}-${uniqueName}${ext}`;
// //     console.log(`Uploading file: ${filename} to ${uploadDir}`);
// //     cb(null, filename);
// //   }
// // });

// // // File filter
// // const fileFilter = (req, file, cb) => {
// //   const allowedTypes = /jpeg|jpg|png|webp|gif/;
// //   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
// //   const mimetype = allowedTypes.test(file.mimetype);

// //   if (extname && mimetype) {
// //     cb(null, true);
// //   } else {
// //     cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
// //   }
// // };

// // // Create multer instance
// // const upload = multer({
// //   storage,
// //   fileFilter,
// //   limits: { 
// //     fileSize: 5 * 1024 * 1024 // 5MB limit
// //   }
// // });

// // export const uploadAvatarMiddleware = upload.single('avatar');
// // export const uploadCoverMiddleware = upload.single('coverPhoto');

// // // Middleware to handle upload errors
// // export const handleUploadError = (err, req, res, next) => {
// //   if (err instanceof multer.MulterError) {
// //     if (err.code === 'LIMIT_FILE_SIZE') {
// //       return res.status(400).json({
// //         success: false,
// //         message: 'File size too large. Maximum size is 5MB.'
// //       });
// //     }
// //     return res.status(400).json({
// //       success: false,
// //       message: err.message
// //     });
// //   } else if (err) {
// //     return res.status(400).json({
// //       success: false,
// //       message: err.message
// //     });
// //   }
// //   next();
// // };
// import multer from 'multer';
// import path from 'path';
// import fs from 'fs';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// /* =========================
//    PATH CONFIGURATION - MUST MATCH app.js
// ========================= */
// console.log('\n=== PROFILE UPLOAD CONFIG ===');

// // Calculate the SAME path as in app.js
// // This file is in: project/middlewares/profileUpload.js
// // We need to go up one level to get to project root
// const projectRoot = path.join(__dirname, '..');
// console.log('ProfileUpload.js location:', __dirname);
// console.log('Calculated project root:', projectRoot);

// const uploadDir = path.join(projectRoot, 'public', 'uploads', 'profiles');
// console.log('Upload directory (must match server):', uploadDir);

// // Create directory if it doesn't exist
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
//   console.log(`Created upload directory: ${uploadDir}`);
// }

// // Verify this matches app.js
// console.log('Directory exists:', fs.existsSync(uploadDir));

// /* =========================
//    MULTER CONFIGURATION
// ========================= */
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
//     const ext = path.extname(file.originalname).toLowerCase();
//     const filename = `${file.fieldname}-${uniqueName}${ext}`;
    
//     console.log(`\nFile upload details:`);
//     console.log(`- Fieldname: ${file.fieldname}`);
//     console.log(`- Filename: ${filename}`);
//     console.log(`- Saved to: ${path.join(uploadDir, filename)}`);
    
//     cb(null, filename);
//   }
// });

// // File filter
// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp|gif/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);

//   if (extname && mimetype) {
//     cb(null, true);
//   } else {
//     cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif)'));
//   }
// };

// // Create multer instance
// const upload = multer({
//   storage,
//   fileFilter,
//   limits: { 
//     fileSize: 5 * 1024 * 1024 // 5MB limit
//   }
// });

// export const uploadAvatarMiddleware = upload.single('avatar');
// export const uploadCoverMiddleware = upload.single('coverPhoto');

// // Middleware to handle upload errors
// export const handleUploadError = (err, req, res, next) => {
//   if (err instanceof multer.MulterError) {
//     if (err.code === 'LIMIT_FILE_SIZE') {
//       return res.status(400).json({
//         success: false,
//         message: 'File size too large. Maximum size is 5MB.'
//       });
//     }
//     return res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   } else if (err) {
//     return res.status(400).json({
//       success: false,
//       message: err.message
//     });
//   }
//   next();
// };

// middlewares/profileUpload.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root directory
const projectRoot = process.cwd();
const uploadDir = path.join(projectRoot, 'public', 'uploads', 'profiles');

console.log('📁 Multer Configuration:');
console.log('Project Root:', projectRoot);
console.log('Upload Directory:', uploadDir);

// Create directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('✓ Created upload directory');
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${file.fieldname}-${uniqueName}${ext}`;
    
    console.log(`📤 Saving file: ${filename}`);
    console.log(`   Destination: ${uploadDir}`);
    
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

export const uploadAvatarMiddleware = upload.single('avatar');
export const uploadCoverMiddleware = upload.single('coverPhoto');

// Error handling middleware
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  next();
};