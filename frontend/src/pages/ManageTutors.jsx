import { AlertCircle, CheckCircle2, Filter, GraduationCap, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import Loading from '../components/Loading.jsx'
import { getErrorMessage } from '../services/api.js'
import { getTutors, updateTutorApproval } from '../services/adminService.js'
import { formatDate } from '../utils/formatters.js'

const filters = ['all', 'pending', 'approved', 'rejected']

const ManageTutors = () => {
  const [status, setStatus] = useState('pending')
  const [tutors, setTutors] = useState([])
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState('')
  const [notice, setNotice] = useState(null)
  const load = async (filter = status) => {
    setLoading(true)
    try { setTutors(await getTutors(filter === 'all' ? undefined : filter)) } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not load tutor applications.') }) } finally { setLoading(false) }
  }
  useEffect(() => { load(status) }, [status])
  const review = async (tutor, nextStatus) => {
    const rejectionReason = nextStatus === 'rejected' ? window.prompt('Optional rejection reason for this tutor application:') ?? '' : ''
    setWorkingId(tutor.user.id); setNotice(null)
    try {
      const updated = await updateTutorApproval(tutor.user.id, { status: nextStatus, rejectionReason })
      setTutors((items) => status === 'all' ? items.map((item) => item.user.id === updated.user.id ? updated : item) : items.filter((item) => item.user.id !== updated.user.id))
      setNotice({ type: 'success', text: `Tutor application ${nextStatus}.` })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not update the tutor application.') }) } finally { setWorkingId('') }
  }
  return <section className="section-space"><div className="container-page"><p className="eyebrow">Administrator</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Manage tutors</h1><p className="mt-3 text-slate-600">Review tutor applications and their professional details. Approval enables later tutor publishing capabilities.</p><div className="mt-6 flex flex-wrap gap-2">{filters.map((filter) => <button key={filter} onClick={() => setStatus(filter)} className={`rounded-full px-4 py-2 text-sm font-bold capitalize ${status === filter ? 'bg-brand-700 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{filter}</button>)}</div>{notice && <div className={`mt-5 flex gap-2 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}{notice.text}</div>}{loading ? <Loading label="Loading tutor applications…" /> : <div className="mt-7 grid gap-5 lg:grid-cols-2">{tutors.map((tutor) => <article key={tutor.user.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700"><GraduationCap size={22} /></span><div className="min-w-0"><h2 className="font-extrabold text-ink">{tutor.user.username}</h2><p className="truncate text-sm text-slate-600">{tutor.user.email}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${tutor.user.tutorApprovalStatus === 'approved' ? 'bg-emerald-50 text-emerald-700' : tutor.user.tutorApprovalStatus === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-800'}`}>{tutor.user.tutorApprovalStatus}</span></div></div><dl className="mt-5 space-y-3 border-t border-slate-100 pt-5 text-sm"><div><dt className="font-bold text-slate-500">Expertise</dt><dd className="mt-1 text-ink">{tutor.profile?.expertise || 'Not provided'}</dd></div><div><dt className="font-bold text-slate-500">Bio</dt><dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{tutor.profile?.bio || 'Not provided'}</dd></div><div className="text-xs text-slate-500">Applied {formatDate(tutor.user.createdAt)}</div></dl>{tutor.user.tutorApprovalStatus === 'pending' && <div className="mt-5 flex gap-2"><button disabled={workingId === tutor.user.id} onClick={() => review(tutor, 'approved')} className="button-primary text-sm"><CheckCircle2 size={16} />Approve</button><button disabled={workingId === tutor.user.id} onClick={() => review(tutor, 'rejected')} className="inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50"><XCircle size={16} />Reject</button></div>}</article>)}{!tutors.length && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600 lg:col-span-2"><Filter className="mx-auto text-slate-400" size={26} /><p className="mt-3 font-semibold">No {status === 'all' ? '' : status} tutor applications found.</p></div>}</div>}</div></section>
}

export default ManageTutors
