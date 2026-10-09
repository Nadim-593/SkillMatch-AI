const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.resolve(__dirname, '../../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Memory storage so file buffer is readily available to forward to AI microservice
// and also safely write to disk if needed
const storage = multer.memoryStorage();

const allowedMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/octet-stream', // Some browsers send docx as octet-stream
];

const allowedExtensions = ['.pdf', '.docx'];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    const error = new Error('Invalid file type. Only PDF (.pdf) and Word (.docx) documents are supported.');
    error.statusCode = 400;
    return cb(error, false);
  }

  // Also check MIME type if provided
  if (file.mimetype && !allowedMimeTypes.includes(file.mimetype) && file.mimetype !== 'application/octet-stream') {
    const error = new Error(`Unsupported MIME type: ${file.mimetype}. Please upload a valid PDF or DOCX file.`);
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const maxFileSizeMB = parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10);

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxFileSizeMB * 1024 * 1024, // in bytes
    files: 1,
  },
});

module.exports = {
  upload,
  uploadDir,
};
