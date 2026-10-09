const express = require('express');
const router = express.Router();
const {
  matchCandidateToJob,
  getRankedJobsForCandidate,
  getRankedCandidatesForJob,
  getMatchDetails,
  downloadMatchPdf,
  getCandidateMatchHistory,
} = require('../controllers/matchController');
const { authenticate, authorizeRoles } = require('../middleware/auth');

router.use(authenticate);

// Candidate routes
router.get('/ranked-jobs', authorizeRoles('candidate'), getRankedJobsForCandidate);
router.get('/history', authorizeRoles('candidate'), getCandidateMatchHistory);

// Recruiter routes
router.get('/ranked-candidates/:jobId', authorizeRoles('recruiter', 'admin'), getRankedCandidatesForJob);

// Common matching & report routes
router.post('/calculate', matchCandidateToJob);
router.get('/:id', getMatchDetails);
router.get('/:id/pdf', downloadMatchPdf);

module.exports = router;
