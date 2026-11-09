import { useAuth } from '../../contexts/AuthContext';
import { Briefcase, Users, BarChart2, PlusCircle, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

export default function RecruiterDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title={`Recruiter Workspace — ${user?.name || 'Recruiter'}`}
        description="Create job requisitions and review AI-ranked candidate matches."
        actions={
          <Link to="/recruiter/jobs/new" className="btn-primary text-xs">
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Create Job Post
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: Briefcase, label: 'Active Jobs', value: '0 Open', color: 'text-primary-600 bg-primary-50' },
          { icon: Users, label: 'Candidates Assessed', value: '0 Evaluated', color: 'text-purple-600 bg-purple-50' },
          { icon: BarChart2, label: 'Average Fit Score', value: 'N/A', color: 'text-green-600 bg-green-50' },
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

      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-3">Recruiting Overview</h3>
        <p className="text-xs text-gray-500 mb-4">
          Post a new job description to automatically extract required and preferred skills with Mistral AI.
        </p>
        <Link to="/recruiter/jobs" className="btn-outline text-xs inline-flex">
          Manage Job Postings
          <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
}
