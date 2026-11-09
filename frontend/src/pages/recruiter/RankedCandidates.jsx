import { useState, useEffect } from 'react';
import { 
  Users, 
  Briefcase, 
  Download, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ChevronRight, 
  Sparkles,
  Mail,
  UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import matchService from '../../services/match.service';
import api from '../../services/api';

export default function RankedCandidates() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [jobData, setJobData] = useState(null);
  const [rankedCandidates, setRankedCandidates] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Fetch recruiter jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        // If recruiter job endpoint exists or use active jobs
        const res = await api.get('/matches/ranked-jobs').catch(() => ({ data: { rankedJobs: [] } }));
        // Also query open jobs
        if (res.data?.rankedJobs?.length > 0) {
          const list = res.data.rankedJobs.map((rj) => rj.job);
          setJobs(list);
          setSelectedJobId(list[0]._id);
        }
      } catch (err) {
        // Handled silently
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  // Fetch candidates whenever selectedJobId changes
  const fetchCandidates = async (jobId) => {
    if (!jobId) return;
    try {
      setLoadingCandidates(true);
      const res = await matchService.getRankedCandidates(jobId);
      if (res.success) {
        setJobData(res.job);
        setRankedCandidates(res.rankedCandidates || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ranked candidates');
    } finally {
      setLoadingCandidates(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchCandidates(selectedJobId);
    }
  }, [selectedJobId]);

  const handleDownloadPdf = async (matchId) => {
    if (!matchId) return;
    try {
      setDownloadingPdf(true);
      toast.loading('Generating match report...', { id: 'cand-pdf' });
      await matchService.downloadMatchPdf(matchId);
      toast.success('Report downloaded!', { id: 'cand-pdf' });
    } catch (err) {
      toast.error('Failed to export PDF', { id: 'cand-pdf' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Candidate Ranking by Requisition"
        description="Explainable semantic matching rankings computed using 60% skill overlap and 40% semantic text similarity."
        actions={
          selectedJobId && (
            <button
              onClick={() => fetchCandidates(selectedJobId)}
              disabled={loadingCandidates}
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingCandidates ? 'animate-spin' : ''}`} />
              Refresh Candidate Rankings
            </button>
          )
        }
      />

      {loadingJobs ? (
        <div className="card p-12 text-center text-gray-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Loading position listings...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.length > 0 && (
            <div className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary-600" />
                Select Requisition:
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
                className="input text-xs max-w-md py-1.5"
              >
                {jobs.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.title} — {j.company}
                  </option>
                ))}
              </select>
            </div>
          )}

          {loadingCandidates ? (
            <div className="card p-12 text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary-600 mb-3" />
              <p className="text-sm font-medium">Ranking candidates against job requirements...</p>
            </div>
          ) : rankedCandidates.length === 0 ? (
            <div className="card p-12 text-center text-gray-500">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-800">No Evaluated Candidates Yet</p>
              <p className="text-xs text-gray-500 mt-1">
                Once candidates complete their CV profiles, they will automatically appear here ranked by compatibility.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Ranked Candidates ({rankedCandidates.length})
                </h3>
                <span className="text-xs text-gray-400">Sorted by Fit Score (Descending)</span>
              </div>

              {rankedCandidates.map((item, idx) => {
                const score = Math.round(item.overallScore || 0);

                return (
                  <div
                    key={item.candidate?._id || idx}
                    className="card p-4 hover:border-gray-300 transition-all bg-white"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                          #{idx + 1}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            {item.candidate?.name || 'Candidate'}
                            <span className="text-xs font-normal text-gray-400">
                              ({item.candidate?.headline || 'Applicant'})
                            </span>
                          </h4>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              {item.candidate?.email}
                            </span>
                          </div>
                          {item.explanation && (
                            <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100 line-clamp-2">
                              {item.explanation}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end sm:self-center">
                        <div className="text-right">
                          <div
                            className={`px-3 py-1 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 ${getScoreBadge(
                              score
                            )}`}
                          >
                            <Sparkles className="w-3 h-3" />
                            {score}% Overall Fit
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-end gap-2">
                            <span>Overlap: {Math.round(item.skillOverlapScore || 0)}%</span>
                            <span>•</span>
                            <span>Semantic: {Math.round(item.semanticSimilarityScore || 0)}%</span>
                          </div>
                        </div>

                        {item.matchId && (
                          <button
                            onClick={() => handleDownloadPdf(item.matchId)}
                            disabled={downloadingPdf}
                            className="btn-outline text-xs p-2 flex items-center gap-1"
                            title="Download PDF Match Report"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
