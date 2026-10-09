import { Link } from 'react-router-dom';
import { Brain, Zap, BarChart2, BookOpen, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
              <Brain className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900 text-lg">SkillMatch AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 bg-gradient-to-b from-primary-50/70 via-white to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold mb-6">
            <Zap className="w-3.5 h-3.5" />
            Explainable AI-Powered Hiring & Career Guidance
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Bridge the Gap Between <br className="hidden sm:inline" />
            <span className="text-primary-600">Candidate Skills & Job Demands</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Extract skills with LLM intelligence, evaluate fit using hybrid semantic embeddings,
            and empower candidates with personalized learning recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="btn-primary px-6 py-3 text-sm">
              Create Free Account
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
            <Link to="/login" className="btn-outline px-6 py-3 text-sm">Sign In to Dashboard</Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">How SkillMatch AI Works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6 border hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary-600 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Automated Skill Extraction</h3>
            <p className="text-sm text-gray-600">
              Upload CVs in PDF or DOCX format. Mistral AI extracts and normalizes skills against a verified taxonomy.
            </p>
          </div>

          <div className="card p-6 border hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-accent-600 flex items-center justify-center mb-4">
              <BarChart2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Hybrid Semantic Matching</h3>
            <p className="text-sm text-gray-600">
              Transparent 0–100 match scoring combining 60% weighted skill overlap and 40% local sentence embedding similarity.
            </p>
          </div>

          <div className="card p-6 border hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Targeted Learning Pathways</h3>
            <p className="text-sm text-gray-600">
              Identify matched, partially matched, and missing skills with direct links to curated learning resources.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-500">
        <p>© {new Date().getFullYear()} SkillMatch AI — Academic Capstone Project</p>
      </footer>
    </div>
  );
}
