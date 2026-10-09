const express = require('express');
const router = express.Router();
const { getProfile, updateProfileSkills } = require('../controllers/candidateController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// All candidate routes require authentication and candidate role
router.use(authenticate);
router.use(authorizeRoles('candidate'));

router.get('/profile', getProfile);
router.put('/profile/skills', updateProfileSkills);

module.exports = router;
