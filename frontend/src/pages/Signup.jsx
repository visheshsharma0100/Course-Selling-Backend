import { AlertCircle, ArrowRight, BookOpen, CheckCircle2, Eye, EyeOff, GraduationCap, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { signupRequest } from '../services/authService.js'

const Signup = () => {
  const { isAuthenticated, login } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '', accountType: 'learner', bio: '', expertise: '', profileImage: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const next = params.get('next') || '/dashboard'
  const purchase = params.get('purchase')
  if (isAuthenticated) return <Navigate to={next} replace />

  const submit = async (event) => {
    event.preventDefault(); setError('')
    if (form.username.trim().length < 3) return setError('Username must be at least 3 characters.')
    if (!form.email.trim() || form.password.length < 5) return setError('Use a valid email and a password with at least 5 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (form.accountType === 'tutor' && (!form.bio.trim() || !form.expertise.trim())) return setError('Tell us your professional bio and area of expertise to apply as a tutor.')
    setLoading(true)
    try {
      const data = await signupRequest({ username: form.username.trim(), email: form.email.trim(), password: form.password, accountType: form.accountType, bio: form.bio.trim(), expertise: form.expertise.trim(), profileImage: form.profileImage.trim() })
      if (data.token) {
        login(data)
        navigate(next, { replace: true, state: purchase ? { purchaseCourseId: purchase } : undefined })
      } else {
        navigate(`/login?next=${encodeURIComponent(next)}`, { replace: true })
      }
    } catch (requestError) { setError(getErrorMessage(requestError, 'We could not create your account. Please try again.')) } finally { setLoading(false) }
  }
  const loginPath = `/login${params.toString() ? `?${params.toString()}` : ''}`
  return <section className="section-space"><div className="container-page grid max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[.8fr_1.2fr]"><aside className="hidden bg-brand-700 p-10 text-white lg:block"><BookOpen className="text-sky-200" size={30} /><p className="mt-16 text-sm font-bold uppercase tracking-widest text-sky-100">Start learning</p><h1 className="mt-3 text-3xl font-black leading-tight">Build a habit that grows with you.</h1><ul className="mt-7 space-y-3 text-sm text-blue-100"><li className="flex gap-2"><CheckCircle2 size={18} />Browse courses freely</li><li className="flex gap-2"><CheckCircle2 size={18} />Keep purchases in one place</li><li className="flex gap-2"><CheckCircle2 size={18} />Learn on your schedule</li></ul></aside><div className="p-6 sm:p-10"><div className="lg:hidden"><Link to="/" className="inline-flex items-center gap-2 font-extrabold text-ink"><BookOpen className="text-brand-700" size={20} />SkillStack</Link></div><h1 className="mt-8 text-2xl font-black text-ink lg:mt-0">Create your account</h1><p className="mt-2 text-sm text-slate-600">Already have an account? <Link to={loginPath} className="font-bold text-brand-700 hover:underline">Log in</Link></p>{purchase && <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">Create an account, then log in to add this course.</div>}{error && <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="shrink-0" size={18} />{error}</div>}
    <form onSubmit={submit} className="mt-6 space-y-5"><fieldset><legend className="field-label">How would you like to use SkillStack?</legend><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setForm({ ...form, accountType: 'learner' })} className={`rounded-lg border p-3 text-left transition ${form.accountType === 'learner' ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-200 hover:border-slate-300'}`}><UserRound className="text-brand-700" size={20} /><span className="mt-2 block text-sm font-extrabold text-ink">Continue as learner</span><span className="mt-1 block text-xs leading-5 text-slate-600">Browse, buy, and learn from courses.</span></button><button type="button" onClick={() => setForm({ ...form, accountType: 'tutor' })} className={`rounded-lg border p-3 text-left transition ${form.accountType === 'tutor' ? 'border-brand-600 bg-brand-50 ring-1 ring-brand-600' : 'border-slate-200 hover:border-slate-300'}`}><GraduationCap className="text-brand-700" size={20} /><span className="mt-2 block text-sm font-extrabold text-ink">Become a tutor</span><span className="mt-1 block text-xs leading-5 text-slate-600">Submit an application to publish courses.</span></button></div></fieldset><div><label htmlFor="signup-name" className="field-label">Username</label><input id="signup-name" className="field-input" autoComplete="username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} /></div><div><label htmlFor="signup-email" className="field-label">Email address</label><input id="signup-email" className="field-input" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div><div><label htmlFor="signup-password" className="field-label">Password</label><div className="relative"><input id="signup-password" className="field-input pr-12" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><p className="mt-2 text-xs text-slate-500">At least 5 characters.</p></div><div><label htmlFor="signup-confirm-password" className="field-label">Confirm password</label><input id="signup-confirm-password" className="field-input" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={form.confirmPassword} onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })} /></div>{form.accountType === 'tutor' && <div className="space-y-5 rounded-xl border border-brand-100 bg-brand-50/60 p-4"><p className="text-sm font-bold text-brand-900">Tutor application</p><div><label htmlFor="signup-bio" className="field-label">Professional bio</label><textarea id="signup-bio" rows="3" className="field-input resize-y" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></div><div><label htmlFor="signup-expertise" className="field-label">Area of expertise</label><input id="signup-expertise" className="field-input" placeholder="e.g. Full-stack web development" value={form.expertise} onChange={(event) => setForm({ ...form, expertise: event.target.value })} /></div><div><label htmlFor="signup-image" className="field-label">Profile image URL <span className="font-normal text-slate-400">(optional)</span></label><input id="signup-image" type="url" className="field-input" placeholder="https://…" value={form.profileImage} onChange={(event) => setForm({ ...form, profileImage: event.target.value })} /></div><p className="text-xs leading-5 text-slate-600">Tutor accounts remain pending until an administrator reviews the application.</p></div>}<button className="button-primary w-full" disabled={loading}>{loading ? 'Creating account…' : <>{form.accountType === 'tutor' ? 'Submit tutor application' : 'Create account'} <ArrowRight size={17} /></>}</button></form></div></div></section>
}

export default Signup
