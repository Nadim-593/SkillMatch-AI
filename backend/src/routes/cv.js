const express = require('express');
const router = express.Router();
const { uploadCv, submitManualText, getMyCv } = require('../controllers/cvController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// All CV endpoints require candidate role
router.use(authenticate);
router.use(authorizeRoles('candidate'));

router.post('/upload', upload.single('file'), uploadCv);
router.post('/manual-text', submitManualText);
router.get('/my-cv', getMyCv);

module.exports = router;
