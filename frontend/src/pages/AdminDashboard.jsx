import { AlertCircle, CheckCircle2, ChevronDown, Pencil, Plus, ReceiptText, Save, Trash2, Upload, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { getErrorMessage } from '../services/api.js'
import { createCourse, deleteCourse, getAdminCourses, updateCourse, uploadCourseVideo } from '../services/courseService.js'
import { deletePurchase, getAllPurchases, updatePurchase } from '../services/purchaseService.js'
import { getCourseTopics, getTopicTitle } from '../utils/courseTopics.js'
import { formatDate, formatPrice } from '../utils/formatters.js'

const blankCourse = { title: '', description: '', image_url: '', price: '', isPublished: true, approvalStatus: 'approved', syllabus: '' }
const asFormCourse = (course) => ({ ...course, syllabus: getCourseTopics(course).map((topic) => getTopicTitle(topic)).join('\n') })

const AdminDashboard = () => {
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blankCourse)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [expiry, setExpiry] = useState({})
  const [videoCourse, setVideoCourse] = useState(null)
  const [uploadingTopic, setUploadingTopic] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [courseData, purchaseData] = await Promise.all([getAdminCourses(), getAllPurchases()])
      setCourses(courseData); setPurchases(purchaseData)
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not load the administration data.') }) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const submitCourse = async (event) => {
    event.preventDefault(); setNotice(null)
    if (!form.title.trim() || !form.description.trim() || form.price === '') return setNotice({ type: 'error', text: 'Title, description, and price are required.' })
    setSaving(true)
    const existingTopics = getCourseTopics(courses.find((course) => course._id === editing))
    const payload = { title: form.title.trim(), description: form.description.trim(), image_url: form.image_url.trim(), price: Number(form.price), isPublished: form.isPublished, approvalStatus: form.approvalStatus, syllabus: form.syllabus.split('\n').map((item) => item.trim()).filter(Boolean).map((title) => {
      const previousTopic = existingTopics.find((topic) => getTopicTitle(topic) === title)
      return previousTopic?.video ? { title, video: previousTopic.video } : { title }
    }) }
    try {
      const result = editing ? await updateCourse(editing, payload) : await createCourse(payload)
      setCourses((items) => editing ? items.map((course) => course._id === editing ? result : course) : [result, ...items])
      if (editing && videoCourse?._id === editing) setVideoCourse(result)
      setForm(blankCourse); setEditing(null); setNotice({ type: 'success', text: editing ? 'Course updated successfully.' : 'Course created successfully.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not save this course.') }) } finally { setSaving(false) }
  }
  const edit = (course) => { setEditing(course._id); setForm(asFormCourse(course)); setNotice(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const removeCourse = async (course) => {
    if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return
    try { await deleteCourse(course._id); setCourses((items) => items.filter((item) => item._id !== course._id)); setNotice({ type: 'success', text: 'Course deleted successfully.' }) } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not delete this course.') }) }
  }
  const saveExpiry = async (purchase) => {
    const value = expiry[purchase._id]
    if (!value) return setNotice({ type: 'error', text: 'Choose a valid expiry date first.' })
    try { const result = await updatePurchase(purchase._id, { expiry_date: value }); setPurchases((items) => items.map((item) => item._id === purchase._id ? result : item)); setNotice({ type: 'success', text: 'Purchase expiry updated successfully.' }) } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not update the purchase.') }) }
  }
  const removePurchase = async (purchase) => {
    if (!window.confirm('Delete this purchase record? This cannot be undone.')) return
    try { await deletePurchase(purchase._id); setPurchases((items) => items.filter((item) => item._id !== purchase._id)); setNotice({ type: 'success', text: 'Purchase record deleted successfully.' }) } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not delete the purchase record.') }) }
  }
  const uploadVideo = async (course, topicIndex, file) => {
    if (!file) return
    if (file.type !== 'video/mp4') {
      setNotice({ type: 'error', text: 'Please select an MP4 video file.' })
      return
    }
    setUploadingTopic(`${course._id}-${topicIndex}`); setNotice(null)
    try {
      const result = await uploadCourseVideo(course._id, topicIndex, file)
      setCourses((items) => items.map((item) => item._id === result._id ? result : item))
      setVideoCourse(result)
      setNotice({ type: 'success', text: `Video uploaded for “${getTopicTitle(getCourseTopics(result)[topicIndex])}”.` })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not upload this video.') }) } finally { setUploadingTopic(null) }
  }

  return <section className="section-space"><div className="container-page"><p className="eyebrow">Administrator</p><div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-black tracking-tight text-ink sm:text-4xl">Admin dashboard</h1><p className="mt-3 max-w-3xl text-slate-600">Create and manage published courses, or manage purchase records. Backend authorization protects every action below.</p></div><Link to="/admin/tutors" className="button-secondary shrink-0 text-sm">Manage tutor applications</Link></div>
    <div className="mt-7 flex flex-wrap gap-2 border-b border-slate-200"><button onClick={() => setTab('courses')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'courses' ? 'border-brand-700 text-brand-700' : 'border-transparent text-slate-600 hover:text-ink'}`}><Plus size={17} />Courses</button><button onClick={() => setTab('purchases')} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold ${tab === 'purchases' ? 'border-brand-700 text-brand-700' : 'border-transparent text-slate-600 hover:text-ink'}`}><ReceiptText size={17} />All purchases</button></div>
    {notice && <div className={`mt-6 flex gap-2 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}{notice.text}</div>}
    {loading ? <Loading label="Loading administration data…" /> : tab === 'courses' ? <div className="mt-7 grid gap-7 xl:grid-cols-[23rem_minmax(0,1fr)]"><form onSubmit={submitCourse} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><h2 className="font-extrabold text-ink">{editing ? 'Edit course' : 'Create course'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blankCourse) }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-ink"><X size={16} />Cancel</button>}</div><div className="mt-5 space-y-4"><div><label className="field-label" htmlFor="course-title">Title</label><input id="course-title" className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div><div><label className="field-label" htmlFor="course-description">Description</label><textarea id="course-description" rows="4" className="field-input resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div><div><label className="field-label" htmlFor="course-image">Image URL <span className="font-normal text-slate-400">(optional)</span></label><input id="course-image" type="url" className="field-input" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} /></div><div><label className="field-label" htmlFor="course-price">Price (₹)</label><input id="course-price" type="number" min="0" className="field-input" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div><div><label className="field-label" htmlFor="course-syllabus">Syllabus <span className="font-normal text-slate-400">(one topic per line)</span></label><textarea id="course-syllabus" rows="5" className="field-input resize-y" value={form.syllabus} onChange={(event) => setForm({ ...form, syllabus: event.target.value })} /></div><label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="h-4 w-4 accent-brand-700" />Publish this course</label><button disabled={saving} className="button-primary w-full">{saving ? 'Saving…' : <><Save size={17} />{editing ? 'Save changes' : 'Create course'}</>}</button></div></form>
      <div><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">The existing backend lists published courses publicly. This view therefore shows published courses; unpublished courses can be created or edited only when their ID is known.</div><div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[42rem] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Course</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Status</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{courses.map((course) => <tr key={course._id}><td className="max-w-md px-5 py-4"><strong className="block truncate text-ink">{course.title}</strong><span className="mt-1 block truncate text-xs text-slate-500">{course.description}</span></td><td className="px-5 py-4 font-semibold text-ink">{formatPrice(course.price)}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Published</span></td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => setVideoCourse(course)} className="button-secondary !px-2.5 !py-2" aria-label={`Manage videos for ${course.title}`}><Video size={16} /></button><button onClick={() => edit(course)} className="button-secondary !px-2.5 !py-2" aria-label={`Edit ${course.title}`}><Pencil size={16} /></button><button onClick={() => removeCourse(course)} className="inline-flex items-center justify-center rounded-md border border-red-200 px-2.5 py-2 text-red-700 hover:bg-red-50" aria-label={`Delete ${course.title}`}><Trash2 size={16} /></button></div></td></tr>)}{!courses.length && <tr><td colSpan="4" className="px-5 py-10 text-center text-slate-500">No published courses found.</td></tr>}</tbody></table></div></div>{videoCourse && <section className="mt-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="inline-flex items-center gap-2 font-extrabold text-ink"><Video size={19} className="text-brand-700" />Topic videos</h2><p className="mt-1 text-sm text-slate-600">{videoCourse.title} — upload one MP4 file per syllabus topic.</p></div><button onClick={() => setVideoCourse(null)} className="button-secondary text-sm"><X size={16} />Close</button></div>{getCourseTopics(videoCourse).length ? <div className="mt-5 divide-y divide-slate-100">{getCourseTopics(videoCourse).map((topic, index) => <div key={`${getTopicTitle(topic)}-${index}`} className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center"><div className="min-w-0 flex-1"><p className="font-bold text-ink">{index + 1}. {getTopicTitle(topic)}</p><p className={`mt-1 text-xs font-medium ${topic?.video?.filename ? 'text-emerald-700' : 'text-slate-500'}`}>{topic?.video?.filename ? `Uploaded: ${topic.video.originalName || 'MP4 video'}` : 'No video uploaded yet'}</p></div><label className="button-secondary shrink-0 text-sm"><Upload size={16} />{uploadingTopic === `${videoCourse._id}-${index}` ? 'Uploading…' : topic?.video?.filename ? 'Replace MP4' : 'Upload MP4'}<input type="file" accept="video/mp4" className="sr-only" disabled={uploadingTopic === `${videoCourse._id}-${index}`} onChange={(event) => { uploadVideo(videoCourse, index, event.target.files?.[0]); event.target.value = '' }} /></label></div>)}</div> : <p className="mt-5 text-sm text-slate-600">Add syllabus topics in Edit course before uploading videos.</p>}</section>}</div></div> : <div className="mt-7 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="min-w-[54rem] w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Learner</th><th className="px-5 py-4">Course</th><th className="px-5 py-4">Purchased</th><th className="px-5 py-4">Expiry</th><th className="px-5 py-4 text-right">Manage</th></tr></thead><tbody className="divide-y divide-slate-100">{purchases.map((purchase) => <tr key={purchase._id}><td className="px-5 py-4"><strong className="block text-ink">{purchase.user_id?.username || 'Unknown user'}</strong><span className="text-xs text-slate-500">{purchase.user_id?.email || '—'}</span></td><td className="px-5 py-4 font-semibold text-ink">{purchase.course_id?.title || 'Deleted course'}</td><td className="px-5 py-4 text-slate-600">{formatDate(purchase.purchase_date)}</td><td className="px-5 py-4"><span className="text-slate-700">{formatDate(purchase.expiry_date)}</span><details className="mt-2"><summary className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-brand-700">Change <ChevronDown size={14} /></summary><div className="mt-2 flex gap-2"><input type="date" className="rounded-md border border-slate-300 px-2 py-1 text-xs" value={expiry[purchase._id] || ''} onChange={(event) => setExpiry({ ...expiry, [purchase._id]: event.target.value })} /><button onClick={() => saveExpiry(purchase)} className="text-xs font-bold text-brand-700">Save</button></div></details></td><td className="px-5 py-4"><button onClick={() => removePurchase(purchase)} className="ml-auto flex items-center gap-1.5 text-sm font-bold text-red-700 hover:text-red-800"><Trash2 size={16} />Delete</button></td></tr>)}{!purchases.length && <tr><td colSpan="5" className="px-5 py-10 text-center text-slate-500">No purchase records found.</td></tr>}</tbody></table></div></div>}
  </div></section>
}

export default AdminDashboard
