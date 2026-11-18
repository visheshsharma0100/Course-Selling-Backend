import { AlertCircle, CheckCircle2, Clock3, Save, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { getTutorProfile, updateTutorProfile } from '../services/tutorService.js'

const TutorProfile = () => {
  const { refreshUser, user } = useAuth()
  const [form, setForm] = useState({ bio: '', expertise: '', education: '', profileImage: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let active = true
    getTutorProfile().then((data) => {
      if (!active) return
      setForm({ bio: data.profile?.bio || '', expertise: data.profile?.expertise || '', education: data.profile?.education || '', profileImage: data.profile?.profileImage || '' })
    }).catch((error) => { if (active) setNotice({ type: 'error', text: getErrorMessage(error, 'We could not load your tutor profile.') }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setNotice(null)
    try {
      await updateTutorProfile(form)
      await refreshUser()
      setNotice({ type: 'success', text: 'Tutor profile updated successfully.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not update your tutor profile.') }) } finally { setSaving(false) }
  }
  const status = user?.tutorApprovalStatus || 'pending'
  const statusCopy = status === 'approved' ? 'Your tutor application is approved. Course management will be enabled in the next marketplace phase.' : status === 'rejected' ? `Your application was not approved.${user?.tutorRejectionReason ? ` Reason: ${user.tutorRejectionReason}` : ''}` : 'Your tutor application is pending administrator review. You can update your professional details while you wait.'
  if (loading) return <Loading label="Loading tutor profile…" />
  return <section className="section-space"><div className="container-page max-w-3xl"><p className="eyebrow">Tutor account</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink">Tutor profile</h1><div className={`mt-6 flex gap-3 rounded-xl border p-4 text-sm leading-6 ${status === 'approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : status === 'rejected' ? 'border-red-200 bg-red-50 text-red-900' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>{status === 'approved' ? <CheckCircle2 className="shrink-0" size={20} /> : <Clock3 className="shrink-0" size={20} />}<div><strong className="block capitalize">Application {status}</strong>{statusCopy}</div></div>{notice && <div className={`mt-5 flex gap-2 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}{notice.text}</div>}<form onSubmit={submit} className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex items-center gap-3 border-b border-slate-100 pb-6"><span className="grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700"><UserRound size={23} /></span><div><h2 className="font-extrabold text-ink">Professional details</h2><p className="text-sm text-slate-600">This information is shown on your published courses.</p></div></div><div className="mt-6 space-y-5"><div><label className="field-label" htmlFor="tutor-bio">Professional bio</label><textarea id="tutor-bio" rows="5" className="field-input resize-y" value={form.bio} onChange={(event) => setForm({ ...form, bio: event.target.value })} /></div><div><label className="field-label" htmlFor="tutor-expertise">Area of expertise</label><input id="tutor-expertise" className="field-input" value={form.expertise} onChange={(event) => setForm({ ...form, expertise: event.target.value })} /></div><div><label className="field-label" htmlFor="tutor-education">Education</label><input id="tutor-education" className="field-input" placeholder="e.g. B.Tech, Computer Science" value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })} /></div><div><label className="field-label" htmlFor="tutor-image">Profile image URL <span className="font-normal text-slate-400">(optional)</span></label><input id="tutor-image" className="field-input" type="url" value={form.profileImage} onChange={(event) => setForm({ ...form, profileImage: event.target.value })} /></div><button className="button-primary" disabled={saving}>{saving ? 'Saving…' : <><Save size={17} />Save profile</>}</button></div></form></div></section>
}

export default TutorProfile
