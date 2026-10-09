const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

// Public route to view jobs
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes for recruiters and admins
router.post('/', authenticate, authorizeRoles('recruiter', 'admin'), createJob);
router.put('/:id', authenticate, authorizeRoles('recruiter', 'admin'), updateJob);
router.delete('/:id', authenticate, authorizeRoles('recruiter', 'admin'), deleteJob);

module.exports = router;
