import { useAuth } from '../../contexts/AuthContext';
import { Users, Briefcase, Database, BookOpen } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Admin Control Center"
        description="System management, skill taxonomy control, and curated learning resources."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Users, label: 'System Users', value: '1 Active', color: 'text-primary-600 bg-primary-50' },
          { icon: Briefcase, label: 'Total Jobs', value: '0 Listed', color: 'text-purple-600 bg-purple-50' },
          { icon: Database, label: 'Taxonomy Skills', value: '45 Aliases', color: 'text-green-600 bg-green-50' },
          { icon: BookOpen, label: 'Curated Resources', value: '30 Verified', color: 'text-yellow-600 bg-yellow-50' },
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
        <h3 className="font-semibold text-gray-900 text-sm mb-2">Platform Status</h3>
        <p className="text-xs text-gray-600">
          Express backend: Healthy | Sentence Transformers: Loaded | Mistral AI: Configured
        </p>
      </div>
    </div>
  );
}
