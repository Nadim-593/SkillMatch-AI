import { useAuth } from '../../contexts/AuthContext';
import { Briefcase, FileText, BarChart2, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

export default function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name || 'Candidate'}!`}
        description="Monitor your CV extraction status, job matches, and skill gaps."
        actions={
          <Link to="/candidate/cv" className="btn-primary text-xs">
            <FileText className="w-3.5 h-3.5 mr-1" />
            Upload / Review CV
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: FileText, label: 'CV Extraction', value: 'Ready to Upload', color: 'text-blue-600 bg-blue-50' },
          { icon: Briefcase, label: 'Available Jobs', value: 'Browse', color: 'text-purple-600 bg-purple-50' },
          { icon: BarChart2, label: 'Match Reports', value: '0 Generated', color: 'text-green-600 bg-green-50' },
          { icon: TrendingUp, label: 'Target Pathway', value: 'Active', color: 'text-yellow-600 bg-yellow-50' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4">
            <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/candidate/cv" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
              <div>
                <p className="text-xs font-semibold text-gray-900">Upload Your CV</p>
                <p className="text-[11px] text-gray-500">Upload PDF or DOCX file to extract skills automatically</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>

            <Link to="/candidate/jobs" className="flex items-center justify-between p-3 border rounded-lg hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
              <div>
                <p className="text-xs font-semibold text-gray-900">Explore Jobs & Run Matching</p>
                <p className="text-[11px] text-gray-500">Calculate semantic similarity and identify skill gaps</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">Matching Pipeline</h3>
          <ol className="space-y-3 text-xs text-gray-600">
            <li className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</span>
              <span>Upload CV document</span>
            </li>
            <li className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">2</span>
              <span>Confirm extracted skills</span>
            </li>
            <li className="flex gap-2.5">
              <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-[10px] flex-shrink-0">3</span>
              <span>Review match scores & skill gaps</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
