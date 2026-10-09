import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Plus, Trash2,
  Sparkles, RefreshCw, Save, ShieldCheck, Tag
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import SkillBadge from '../../components/ui/SkillBadge';
import { cvService } from '../../services/cv.service';

const CATEGORIES = [
  'Frontend', 'Backend', 'Database', 'Cloud', 'DevOps',
  'Programming Language', 'Architecture', 'AI/ML', 'Security', 'General'
];

export default function CvUploadReview() {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'text'
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualText, setManualText] = useState('');

  // Profile and Skills state
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [skills, setSkills] = useState([]);
  const [currentCv, setCurrentCv] = useState(null);
  const [rawTextLength, setRawTextLength] = useState(0);

  // New skill inline form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Frontend');
  const [newSkillProficiency, setNewSkillProficiency] = useState('intermediate');

  // Load existing profile on mount
  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      setFetchingProfile(true);
      const res = await cvService.getProfile();
      if (res.profile) {
        setHeadline(res.profile.headline || '');
        setSummary(res.profile.summary || '');
        setSkills(res.profile.confirmedSkills || []);
        setCurrentCv(res.profile.currentCv || null);
      }
    } catch (err) {
      // Profile may not exist yet or have no CV
    } finally {
      setFetchingProfile(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.match(/\.(pdf|docx)$/i)) {
        toast.error('Only PDF and Word (.docx) files are supported.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File exceeds maximum size of 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a PDF or DOCX file to upload.');
      return;
    }

    try {
      setLoading(true);
      const res = await cvService.uploadCv(selectedFile);
      toast.success(res.message || 'CV processed successfully!');
      setCurrentCv(res.cv);
      setRawTextLength(res.rawTextLength || 0);

      // Convert extracted skills to editable structure
      const newExtracted = (res.extractedSkills || []).map((s) => ({
        skillName: s.skill_name || s.skillName,
        normalizedName: s.normalized_name || s.normalizedName || s.skill_name,
        category: s.category || 'General',
        proficiency: 'intermediate',
        evidence: s.evidence || '',
        confidence: s.confidence || 0.85,
      }));

      setSkills(newExtracted);
      setSelectedFile(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload and analyze document.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualTextSubmit = async (e) => {
    e.preventDefault();
    if (!manualText || manualText.trim().length < 20) {
      toast.error('Please enter at least 20 characters of CV text.');
      return;
    }

    try {
      setLoading(true);
      const res = await cvService.submitManualText(manualText);
      toast.success('CV text analyzed successfully!');
      setCurrentCv(res.cv);
      setRawTextLength(res.rawTextLength || 0);

      const newExtracted = (res.extractedSkills || []).map((s) => ({
        skillName: s.skill_name || s.skillName,
        normalizedName: s.normalized_name || s.normalizedName || s.skill_name,
        category: s.category || 'General',
        proficiency: 'intermediate',
        evidence: s.evidence || '',
        confidence: s.confidence || 0.85,
      }));

      setSkills(newExtracted);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to analyze text.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills((prev) => prev.filter((_, idx) => idx !== index));
    toast.success('Skill removed from review list.');
  };

  const handleProficiencyChange = (index, value) => {
    setSkills((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], proficiency: value };
      return updated;
    });
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) {
      toast.error('Skill name is required.');
      return;
    }

    const isDuplicate = skills.some(
      (s) => s.skillName.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (isDuplicate) {
      toast.error('This skill is already in your list.');
      return;
    }

    setSkills((prev) => [
      ...prev,
      {
        skillName: newSkillName.trim(),
        normalizedName: newSkillName.trim(),
        category: newSkillCategory,
        proficiency: newSkillProficiency,
        evidence: 'Manually added by candidate',
        confidence: 1.0,
      },
    ]);

    setNewSkillName('');
    toast.success('Skill added.');
  };

  const handleSaveConfirmedProfile = async () => {
    if (skills.length === 0) {
      toast.error('Please confirm at least one skill for your profile.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        headline,
        summary,
        skills,
      };
      const res = await cvService.updateProfileSkills(payload);
      toast.success('Profile and confirmed skills saved successfully!');
      if (res.profile) {
        setSkills(res.profile.confirmedSkills || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save skills profile.');
    } finally {
      setSaving(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title="CV Upload & Skill Review"
        description="Upload your CV to automatically extract skills using AI, then review, correct, and confirm your profile."
      />

      {/* Upload & Entry Box */}
      <div className="card p-5 mb-8">
        <div className="flex border-b border-gray-200 mb-5">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'upload'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Document (PDF / DOCX)
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 pb-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            Manual Text Entry
          </button>
        </div>

        {activeTab === 'upload' ? (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary-400 bg-gray-50/50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-800 mb-1">
                {selectedFile ? selectedFile.name : 'Select or drag your CV here'}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supported formats: PDF (.pdf), Microsoft Word (.docx) — Max size: 10MB
              </p>
              <label className="btn-outline cursor-pointer text-xs">
                Browse Files
                <input
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
              </label>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary text-xs px-5 py-2.5"
                disabled={!selectedFile || loading}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1.5" />
                    Extracting Skills with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Upload & Extract Skills
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleManualTextSubmit} className="space-y-4">
            <div>
              <label className="label text-xs">Paste CV or Resume Text</label>
              <textarea
                rows={7}
                className="input text-xs font-mono"
                placeholder="Paste your work experience, education, and technical skills here..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="btn-primary text-xs px-5 py-2.5"
                disabled={loading || manualText.trim().length < 20}
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-1.5" />
                    Analyzing Text...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Extract Skills from Text
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {currentCv && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Active CV document: <strong className="text-gray-900">{currentCv.originalFilename}</strong>
            </span>
            <span className="text-gray-400">
              Extraction status: <span className="capitalize font-semibold text-green-600">{currentCv.extractionStatus}</span>
            </span>
          </div>
        )}
      </div>

      {/* Review & Confirmation Interface */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary-600" />
              Candidate Profile & Skill Review
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review AI-identified skills, add missing skills, or remove false positives before saving.
            </p>
          </div>
          <button
            onClick={handleSaveConfirmedProfile}
            disabled={saving || skills.length === 0}
            className="btn-primary text-xs px-5 py-2.5 self-start sm:self-auto"
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-1.5" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-1.5" />
                Confirm & Save Profile ({skills.length} skills)
              </>
            )}
          </button>
        </div>

        {/* Profile Headline & Summary */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="label text-xs">Professional Headline</label>
            <input
              className="input text-xs"
              placeholder="e.g. Senior Full Stack Engineer (React / Node / Python)"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>
          <div>
            <label className="label text-xs">Brief Summary</label>
            <input
              className="input text-xs"
              placeholder="e.g. 4+ years building cloud-native web applications"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </div>
        </div>

        {/* Add Skill Form */}
        <form onSubmit={handleAddSkill} className="bg-gray-50 p-3.5 rounded-lg border border-gray-200 mb-6">
          <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-primary-600" />
            Add a Skill Manually
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              className="input text-xs sm:col-span-2"
              placeholder="Skill name (e.g. Docker, PostgreSQL, Go)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
            />
            <select
              className="input text-xs"
              value={newSkillCategory}
              onChange={(e) => setNewSkillCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button type="submit" className="btn-secondary text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Skill
            </button>
          </div>
        </form>

        {/* Extracted Skills List */}
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
            Confirmed Skills ({skills.length})
          </h3>

          {skills.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-xs border border-dashed rounded-lg">
              No skills extracted yet. Upload a CV or add skills manually above.
            </div>
          ) : (
            <div className="space-y-2">
              {skills.map((skill, index) => (
                <div
                  key={`${skill.skillName}-${index}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-900">{skill.skillName}</span>
                      {skill.normalizedName && skill.normalizedName !== skill.skillName && (
                        <span className="text-[10px] text-gray-400">
                          (Taxonomy: {skill.normalizedName})
                        </span>
                      )}
                      <span className="badge-blue text-[10px] py-0 px-2">{skill.category}</span>
                      <span className="text-[10px] text-gray-400">
                        {Math.round(skill.confidence * 100)}% confidence
                      </span>
                    </div>
                    {skill.evidence && (
                      <p className="text-[11px] text-gray-500 italic mt-1 truncate">
                        &quot;{skill.evidence}&quot;
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      className="input text-xs py-1 px-2 w-32"
                      value={skill.proficiency || 'intermediate'}
                      onChange={(e) => handleProficiencyChange(index, e.target.value)}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert">Expert</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      title="Remove skill"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
