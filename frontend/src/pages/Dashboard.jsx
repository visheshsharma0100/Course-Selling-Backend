import { ArrowRight, BookOpen, Compass, ReceiptText, ShieldCheck, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const Dashboard = () => {
  const { user, isAdmin, isTutor } = useAuth()
  const cards = [
    { to: '/purchases', icon: ReceiptText, title: 'My purchases', copy: 'Open the courses that belong to you.' },
    { to: '/courses', icon: Compass, title: 'Explore courses', copy: 'Find your next practical learning path.' },
    { to: '/profile', icon: UserRound, title: 'Profile', copy: 'View your current account details.' },
  ]
  return <section className="section-space"><div className="container-page"><div className="rounded-xl bg-ink px-6 py-8 text-white sm:px-9"><p className="text-sm font-bold uppercase tracking-widest text-sky-200">Your learning space</p><h1 className="mt-2 text-3xl font-black">Welcome back, {user?.username || 'learner'}.</h1><p className="mt-3 max-w-xl text-slate-300">Everything you have access to is organized here. Continue with a course or discover something new.</p>{isAdmin && <Link to="/admin" className="button-secondary mt-5 !border-white/20 !bg-white/10 !text-white hover:!bg-white/20"><ShieldCheck size={17} />Open admin dashboard</Link>}</div>
      {isTutor && <div className={`mt-8 rounded-xl border p-5 ${user?.tutorApprovalStatus === 'approved' ? 'border-emerald-200 bg-emerald-50' : user?.tutorApprovalStatus === 'rejected' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}><h2 className="font-extrabold text-ink">Tutor application: {user?.tutorApprovalStatus || 'pending'}</h2><p className="mt-1 text-sm leading-6 text-slate-700">{user?.tutorApprovalStatus === 'approved' ? 'Your application is approved. Tutor course management is the next marketplace phase.' : user?.tutorApprovalStatus === 'rejected' ? `Your application was not approved.${user?.tutorRejectionReason ? ` ${user.tutorRejectionReason}` : ''}` : 'An administrator will review your profile before course publishing is enabled.'}</p><Link to="/tutor/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">Open tutor profile <ArrowRight size={16} /></Link></div>}
      <div className="mt-8 grid gap-5 md:grid-cols-3">{cards.map(({ to, icon: Icon, title, copy }) => <Link key={to} to={to} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"><Icon size={25} className="text-brand-700" /><h2 className="mt-5 font-extrabold text-ink">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p><span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-brand-700">Open <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></Link>)}</div>
    <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6"><div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700"><BookOpen size={21} /></span><div><h2 className="font-extrabold text-ink">Ready to add a course?</h2><p className="mt-1 text-sm leading-6 text-slate-600">Public course details are always available. When you decide to buy, SkillStack uses your existing session—no repeated login required.</p><Link to="/courses" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-700">Browse courses <ArrowRight size={16} /></Link></div></div></div>
  </div></section>
}

export default Dashboard
