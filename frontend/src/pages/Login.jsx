import { AlertCircle, ArrowRight, BookOpen, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { loginRequest } from '../services/authService.js'

const Login = () => {
  const { isAuthenticated, login } = useAuth()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const next = params.get('next') || '/dashboard'
  const purchase = params.get('purchase')

  if (isAuthenticated) return <Navigate to={next} replace />

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!form.email.trim() || !form.password) return setError('Enter your email and password to continue.')
    setLoading(true)
    try {
      const data = await loginRequest({ email: form.email.trim(), password: form.password })
      login(data)
      navigate(next, { replace: true, state: purchase ? { purchaseCourseId: purchase } : undefined })
    } catch (requestError) { setError(getErrorMessage(requestError, 'We could not log you in. Please try again.')) } finally { setLoading(false) }
  }

  const signupPath = `/signup${params.toString() ? `?${params.toString()}` : ''}`
  return <section className="section-space"><div className="container-page grid max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[.8fr_1.2fr]"><aside className="hidden bg-ink p-10 text-white lg:block"><BookOpen className="text-sky-200" size={30} /><p className="mt-16 text-sm font-bold uppercase tracking-widest text-sky-200">Welcome back</p><h1 className="mt-3 text-3xl font-black leading-tight">Keep your learning moving.</h1><p className="mt-5 leading-7 text-slate-300">Your purchased courses and learning dashboard are ready when you are.</p></aside><div className="p-6 sm:p-10"><div className="lg:hidden"><Link to="/" className="inline-flex items-center gap-2 font-extrabold text-ink"><BookOpen className="text-brand-700" size={20} />SkillStack</Link></div><h1 className="mt-8 text-2xl font-black text-ink lg:mt-0">Log in to SkillStack</h1><p className="mt-2 text-sm text-slate-600">Don’t have an account? <Link to={signupPath} className="font-bold text-brand-700 hover:underline">Create one</Link></p>{purchase && <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">Log in to add this course to your account.</div>}
    {error && <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><AlertCircle className="shrink-0" size={18} />{error}</div>}<form onSubmit={submit} className="mt-6 space-y-5"><div><label htmlFor="login-email" className="field-label">Email address</label><input id="login-email" className="field-input" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div><div><label htmlFor="login-password" className="field-label">Password</label><div className="relative"><input id="login-password" className="field-input pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div><button className="button-primary w-full" disabled={loading}>{loading ? 'Logging in…' : <>Log in <ArrowRight size={17} /></>}</button></form></div></div></section>
}

export default Login
