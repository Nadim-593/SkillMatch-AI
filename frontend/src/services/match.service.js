import api from './api';

export const matchService = {
  // Candidate: get jobs ranked by fit score
  getRankedJobs: async () => {
    const res = await api.get('/matches/ranked-jobs');
    return res.data;
  },

  // Candidate: get match history
  getMatchHistory: async () => {
    const res = await api.get('/matches/history');
    return res.data;
  },

  // Recruiter: get candidates ranked for a job
  getRankedCandidates: async (jobId) => {
    const res = await api.get(`/matches/ranked-candidates/${jobId}`);
    return res.data;
  },

  // Calculate or retrieve match
  calculateMatch: async (jobId, candidateId = null) => {
    const res = await api.post('/matches/calculate', { jobId, candidateId });
    return res.data;
  },

  // Get full match details including skill gap and learning recommendations
  getMatchDetails: async (matchId) => {
    const res = await api.get(`/matches/${matchId}`);
    return res.data;
  },

  // Download PDF report
  downloadMatchPdf: async (matchId, filename = `SkillMatch-Report-${matchId}.pdf`) => {
    const res = await api.get(`/matches/${matchId}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export default matchService;
