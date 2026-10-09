import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Download, 
  ExternalLink, 
  BookOpen, 
  RefreshCw, 
  ChevronRight, 
  Sparkles,
  Layers,
  Building,
  MapPin
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import matchService from '../../services/match.service';

export default function MatchesView() {
  const [rankedJobs, setRankedJobs] = useState([]);
  const [selectedJobMatch, setSelectedJobMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [learningResources, setLearningResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchRankedJobs = async () => {
    try {
      setLoading(true);
      const data = await matchService.getRankedJobs();
      if (data.success) {
        setRankedJobs(data.rankedJobs || []);
        // Auto-select first job if available and none selected
        if (data.rankedJobs && data.rankedJobs.length > 0 && !selectedJobMatch) {
          handleSelectMatch(data.rankedJobs[0]);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load ranked jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankedJobs();
  }, []);

  const handleSelectMatch = async (item) => {
    setSelectedJobMatch(item);
    if (!item.job?._id) return;

    try {
      setDetailsLoading(true);
      // Either retrieve by existing matchId or calculate
      if (item.matchId) {
        const res = await matchService.getMatchDetails(item.matchId);
        setMatchDetails(res.matchResult);
        setLearningResources(res.learningResources || []);
      } else {
        const res = await matchService.calculateMatch(item.job._id);
        setMatchDetails(res.matchResult);
        setLearningResources(res.learningResources || []);
        // Update rankedJobs with matchId
        setRankedJobs((prev) =>
          prev.map((pj) =>
            pj.job._id === item.job._id ? { ...pj, matchId: res.matchResult._id, overallScore: res.matchResult.overallScore } : pj
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to compute match details');
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDownloadPdf = async (matchId) => {
    if (!matchId) {
      toast.error('No match record available to generate PDF');
      return;
    }
    try {
      setDownloadingPdf(true);
      toast.loading('Generating PDF report...', { id: 'pdf-toast' });
      await matchService.downloadMatchPdf(matchId);
      toast.success('Report downloaded successfully!', { id: 'pdf-toast' });
    } catch (err) {
      toast.error('Failed to download PDF report', { id: 'pdf-toast' });
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
        title="AI Job Matches & Skill Gap Analysis"
        description="Ranked job compatibility based on 60% skill overlap and 40% semantic text similarity."
        actions={
          <button
            onClick={fetchRankedJobs}
            disabled={loading}
            className="btn-outline text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Rankings
          </button>
        }
      />

      {loading ? (
        <div className="card p-12 text-center text-gray-500">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin text-primary-600 mb-3" />
          <p className="text-sm font-medium">Evaluating semantic compatibility across active positions...</p>
        </div>
      ) : rankedJobs.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Briefcase className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <p className="text-sm font-semibold text-gray-800">No Open Jobs Available</p>
          <p className="text-xs text-gray-500 mt-1">Check back later once recruiters publish open postings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Ranked List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">
              Ranked Positions ({rankedJobs.length})
            </h3>
            <div className="space-y-2.5">
              {rankedJobs.map((item, idx) => {
                const isSelected = selectedJobMatch?.job?._id === item.job._id;
                const score = Math.round(item.overallScore || 0);

                return (
                  <div
                    key={item.job._id}
                    onClick={() => handleSelectMatch(item)}
                    className={`card p-4 cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-primary-500 ring-2 ring-primary-100 bg-primary-50/20 shadow-sm'
                        : 'hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[10px] font-bold text-gray-400">#{idx + 1}</span>
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-1">{item.job.title}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3 text-gray-400" />
                            {item.job.company}
                          </span>
                          {item.job.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {item.job.location}
                            </span>
                          )}
                        </div>
                      </div>

                      <div
                        className={`px-2.5 py-1 rounded-full border text-xs font-bold flex flex-col items-center ${getScoreBadge(
                          score
                        )}`}
                      >
                        <span>{score}%</span>
                        <span className="text-[9px] font-normal uppercase opacity-80">Fit</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                      <span className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />
                        {item.matchedCount || 0} matched
                      </span>
                      <span className="flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        {item.missingCount || 0} missing
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Match Breakdown */}
          <div className="lg:col-span-7 space-y-5">
            {detailsLoading ? (
              <div className="card p-12 text-center text-gray-500">
                <RefreshCw className="w-7 h-7 mx-auto animate-spin text-primary-500 mb-2" />
                <p className="text-xs">Computing hybrid match breakdown & learning pathways...</p>
              </div>
            ) : matchDetails ? (
              <>
                {/* Score Summary Card */}
                <div className="card p-5 border-l-4 border-l-primary-600 bg-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded mb-1">
                        <Sparkles className="w-3 h-3" />
                        Hybrid AI Fit Analysis
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{selectedJobMatch?.job?.title}</h3>
                      <p className="text-xs text-gray-500">{selectedJobMatch?.job?.company}</p>
                    </div>

                    {matchDetails._id && (
                      <button
                        onClick={() => handleDownloadPdf(matchDetails._id)}
                        disabled={downloadingPdf}
                        className="btn-primary text-xs flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {downloadingPdf ? 'Downloading...' : 'Export PDF'}
                      </button>
                    )}
                  </div>

                  {/* 3 Metrics Cards */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-blue-600 uppercase">Overall Fit</p>
                      <p className="text-xl font-black text-blue-800 mt-0.5">
                        {Math.round(matchDetails.overallScore || 0)}
                        <span className="text-xs font-normal text-blue-600">/100</span>
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 border border-emerald-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Skill Overlap (60%)</p>
                      <p className="text-xl font-black text-emerald-800 mt-0.5">
                        {Math.round(matchDetails.skillOverlapScore || 0)}%
                      </p>
                    </div>

                    <div className="bg-purple-50/60 border border-purple-100 rounded-lg p-3 text-center">
                      <p className="text-[10px] font-bold text-purple-600 uppercase">Semantic Sim (40%)</p>
                      <p className="text-xl font-black text-purple-800 mt-0.5">
                        {Math.round(matchDetails.semanticSimilarityScore || 0)}%
                      </p>
                    </div>
                  </div>

                  {matchDetails.explanation && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-700 leading-relaxed">
                      <span className="font-semibold text-gray-900">Summary: </span>
                      {matchDetails.explanation}
                    </div>
                  )}
                </div>

                {/* Skill Categorization Grid */}
                <div className="space-y-4">
                  {/* Matched Skills */}
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Matched Skills ({(matchDetails.matchedSkills || []).length})
                      </h4>
                    </div>
                    {(matchDetails.matchedSkills || []).length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No matching skills detected in CV profile.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {matchDetails.matchedSkills.map((s, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
                            title={s.explanation || s.evidence}
                          >
                            <span>{s.normalizedName || s.skillName}</span>
                            <span className="text-[10px] bg-emerald-200/60 px-1 py-0.2 rounded text-emerald-900">
                              {s.category || 'Skill'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Partial Skills */}
                  {(matchDetails.partialSkills || []).length > 0 && (
                    <div className="card p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                          Partially Matched Skills ({matchDetails.partialSkills.length})
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchDetails.partialSkills.map((s, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
                            title={s.explanation}
                          >
                            <span>{s.normalizedName || s.skillName}</span>
                            <span className="text-[10px] bg-amber-200/60 px-1 py-0.2 rounded text-amber-900">
                              {s.category || 'Skill'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills */}
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Missing Skills ({(matchDetails.missingSkills || []).length})
                      </h4>
                    </div>
                    {(matchDetails.missingSkills || []).length === 0 ? (
                      <p className="text-xs text-emerald-600 font-medium">
                        All required position skills are satisfied by your profile!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {matchDetails.missingSkills.map((s, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-800 border border-rose-200"
                            title={s.explanation}
                          >
                            <span>{s.normalizedName || s.skillName}</span>
                            <span className="text-[10px] bg-rose-200/60 px-1 py-0.2 rounded text-rose-900">
                              {s.requirement === 'required' ? 'Required' : 'Preferred'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Curated Learning Resources Section */}
                {learningResources.length > 0 && (
                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-primary-600" />
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Recommended Learning Pathways for Skill Gaps
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      Curated documentation and tutorials to help close your missing skill gaps for this role:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {learningResources.map((res) => (
                        <a
                          key={res._id}
                          href={res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50/20 transition-all flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700 bg-primary-100/60 px-1.5 py-0.5 rounded">
                                {res.skillTag || res.normalizedSkill}
                              </span>
                              <span className="text-[10px] text-gray-400 capitalize">
                                {res.type || 'Resource'}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-gray-900 mt-1.5 group-hover:text-primary-600 line-clamp-2">
                              {res.title}
                            </h5>
                            <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">
                              {res.description}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                            <span>{res.provider || 'Official'}</span>
                            <span className="flex items-center gap-1 text-primary-600 font-medium">
                              Visit <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="card p-12 text-center text-gray-400">
                <Layers className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Select a position from the left to view detailed matching analytics.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
