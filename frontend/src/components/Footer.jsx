import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white">
    <div className="container-page flex flex-col justify-between gap-5 py-8 text-sm text-slate-600 sm:flex-row sm:items-center">
      <div><Link to="/" className="inline-flex items-center gap-2 font-extrabold text-ink"><BookOpen size={18} className="text-brand-700" /> SkillStack</Link><p className="mt-2">Professional learning, built around practical momentum.</p></div>
      <div className="flex gap-5 font-semibold"><Link to="/courses" className="hover:text-brand-700">Explore courses</Link><Link to="/signup" className="hover:text-brand-700">Join SkillStack</Link></div>
    </div>
  </footer>
)

export default Footer
