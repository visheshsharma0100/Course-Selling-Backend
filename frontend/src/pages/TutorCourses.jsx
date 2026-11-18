import { AlertCircle, CheckCircle2, Pencil, Save, Trash2, Upload, Video, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import EmptyState from '../components/EmptyState.jsx'
import Loading from '../components/Loading.jsx'
import { getErrorMessage } from '../services/api.js'
import { createCourse, deleteCourse, deleteCourseVideo, getTutorCourses, updateCourse, uploadCourseVideoWithProgress } from '../services/courseService.js'
import { getTutorSubscription } from '../services/subscriptionService.js'
import { getCourseTopics, getTopicTitle } from '../utils/courseTopics.js'
import { formatPrice } from '../utils/formatters.js'

const blankCourse = { title: '', description: '', image_url: '', category: '', price: '', syllabus: '', isPublished: false }

const toForm = (course) => ({
  title: course.title, description: course.description, image_url: course.image_url || '', category: course.category || '',
  price: String(course.price ?? ''), syllabus: getCourseTopics(course).map((topic) => getTopicTitle(topic)).join('\n'), isPublished: Boolean(course.isPublished),
})

const TutorCourses = () => {
  const [courses, setCourses] = useState([])
  const [subscription, setSubscription] = useState(undefined)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(blankCourse)
  const [editing, setEditing] = useState(null)
  const [videoCourse, setVideoCourse] = useState(null)
  const [uploadingTopic, setUploadingTopic] = useState('')
  const [uploadProgress, setUploadProgress] = useState({})
  const [deletingVideo, setDeletingVideo] = useState('')
  const [notice, setNotice] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [courseData, subscriptionData] = await Promise.all([getTutorCourses(), getTutorSubscription()])
      setCourses(courseData)
      setSubscription(subscriptionData.subscription)
    } catch (error) {
      setNotice({ type: 'error', text: getErrorMessage(error, 'We could not load your courses.') })
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const saveCourse = async (event) => {
    event.preventDefault(); setNotice(null)
    if (!form.title.trim() || !form.description.trim() || form.price === '') {
      setNotice({ type: 'error', text: 'Title, description, and price are required.' }); return
    }
    setSaving(true)
    const existingTopics = getCourseTopics(courses.find((course) => course._id === editing))
    const syllabus = form.syllabus.split('\n').map((topic) => topic.trim()).filter(Boolean).map((title) => {
      const oldTopic = existingTopics.find((topic) => getTopicTitle(topic) === title)
      return oldTopic?.video ? { title, video: oldTopic.video } : { title }
    })
    const payload = { title: form.title.trim(), description: form.description.trim(), image_url: form.image_url.trim(), category: form.category.trim() || 'General', price: Number(form.price), syllabus, isPublished: form.isPublished }
    try {
      const result = editing ? await updateCourse(editing, payload) : await createCourse(payload)
      setCourses((items) => editing ? items.map((course) => course._id === result._id ? result : course) : [result, ...items])
      if (videoCourse?._id === result._id) setVideoCourse(result)
      setForm(blankCourse); setEditing(null)
      setNotice({ type: 'success', text: result.isPublished ? 'Course saved and published.' : 'Course saved as unpublished.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not save this course.') }) } finally { setSaving(false) }
  }

  const removeCourse = async (course) => {
    if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return
    try {
      await deleteCourse(course._id)
      setCourses((items) => items.filter((item) => item._id !== course._id))
      if (videoCourse?._id === course._id) setVideoCourse(null)
      setNotice({ type: 'success', text: 'Course deleted successfully.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not delete this course.') }) }
  }

  const uploadVideo = async (course, index, file) => {
    if (!file) return
    const key = `${course._id}-${index}`
    if (!file.name.toLowerCase().endsWith('.mp4')) { setNotice({ type: 'error', text: 'Choose an MP4 (.mp4) video file.' }); return }
    if (file.size > 1024 * 1024 * 1024) { setNotice({ type: 'error', text: 'Video must be 1 GB or smaller.' }); return }
    setUploadingTopic(key); setUploadProgress((current) => ({ ...current, [key]: 0 })); setNotice(null)
    try {
      const result = await uploadCourseVideoWithProgress(course._id, index, file, (percent) => setUploadProgress((current) => ({ ...current, [key]: percent })))
      setCourses((items) => items.map((item) => item._id === result._id ? result : item)); setVideoCourse(result)
      setNotice({ type: 'success', text: `Video uploaded for “${getTopicTitle(getCourseTopics(result)[index])}”.` })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not upload this video.') }) } finally {
      setUploadingTopic(''); setUploadProgress((current) => { const next = { ...current }; delete next[key]; return next })
    }
  }

  const removeVideo = async (course, index) => {
    const key = `${course._id}-${index}`
    if (!window.confirm(`Remove the video from “${getTopicTitle(getCourseTopics(course)[index])}”?`)) return
    setDeletingVideo(key)
    try {
      const result = await deleteCourseVideo(course._id, index)
      setCourses((items) => items.map((item) => item._id === result._id ? result : item)); setVideoCourse(result)
      setNotice({ type: 'success', text: 'Topic video removed successfully.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not delete this video.') }) } finally { setDeletingVideo('') }
  }

  if (loading) return <Loading label="Loading your course workspace…" />
  if (!subscription) return <section className="section-space"><div className="container-page"><EmptyState title="An active tutor plan is required" description="Choose a tutor plan before you create or manage courses." actionLabel="Choose a plan" actionTo="/tutor/dashboard" /></div></section>

  return <section className="section-space"><div className="container-page">
    <p className="eyebrow">Tutor workspace</p>
    <h1 className="mt-2 text-3xl font-black tracking-tight text-ink">My courses</h1>
    <p className="mt-3 text-slate-600">You control publishing, lessons, and updates for courses created by your own tutor account.</p>
    {notice && <div className={`mt-5 flex gap-2 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 className="shrink-0" size={18} /> : <AlertCircle className="shrink-0" size={18} />}{notice.text}</div>}
    <div className="mt-7 grid gap-7 xl:grid-cols-[23rem_minmax(0,1fr)]">
      <form onSubmit={saveCourse} className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3"><h2 className="font-extrabold text-ink">{editing ? 'Edit course' : 'Create a course'}</h2>{editing && <button type="button" onClick={() => { setEditing(null); setForm(blankCourse) }} className="inline-flex items-center gap-1 text-sm font-bold text-slate-600"><X size={16} />Cancel</button>}</div>
        <p className="mt-2 text-xs leading-5 text-slate-500">Your active plan lets you publish or unpublish only your own courses.</p>
        <div className="mt-5 space-y-4">
          <div><label className="field-label">Title</label><input className="field-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></div>
          <div><label className="field-label">Description</label><textarea rows="4" className="field-input resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
          <div><label className="field-label">Thumbnail URL <span className="font-normal text-slate-400">(optional)</span></label><input type="url" className="field-input" value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} /></div>
          <div><label className="field-label">Category</label><input className="field-input" placeholder="e.g. Web development" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></div>
          <div><label className="field-label">Price (₹)</label><input type="number" min="0" className="field-input" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></div>
          <div><label className="field-label">Syllabus <span className="font-normal text-slate-400">(one topic per line)</span></label><textarea rows="6" className="field-input resize-y" value={form.syllabus} onChange={(event) => setForm({ ...form, syllabus: event.target.value })} /></div>
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"><input type="checkbox" checked={form.isPublished} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })} className="mt-0.5 h-4 w-4 accent-brand-700" /><span><strong className="block text-ink">Publish this course</strong><span className="mt-1 block text-xs leading-5 text-slate-600">Students can discover and purchase it when enabled.</span></span></label>
          <button disabled={saving} className="button-primary w-full">{saving ? 'Saving…' : <><Save size={17} />{editing ? 'Save changes' : form.isPublished ? 'Create & publish course' : 'Create unpublished course'}</>}</button>
        </div>
      </form>
      <div>{courses.length ? <div className="space-y-4">{courses.map((course) => <article key={course._id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row"><div><div className="flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${course.isPublished ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{course.isPublished ? 'Published' : 'Unpublished'}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">{course.category || 'General'}</span></div><h2 className="mt-3 text-lg font-extrabold text-ink">{course.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600">{course.description}</p><p className="mt-3 font-bold text-ink">{formatPrice(course.price)}</p></div><div className="flex h-fit gap-2"><button onClick={() => setVideoCourse(course)} className="button-secondary !px-2.5 !py-2" aria-label={`Manage videos for ${course.title}`}><Video size={16} /></button><button onClick={() => { setEditing(course._id); setForm(toForm(course)); setNotice(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="button-secondary !px-2.5 !py-2" aria-label={`Edit ${course.title}`}><Pencil size={16} /></button><button onClick={() => removeCourse(course)} className="inline-flex items-center justify-center rounded-md border border-red-200 px-2.5 py-2 text-red-700 hover:bg-red-50" aria-label={`Delete ${course.title}`}><Trash2 size={16} /></button></div></div>{videoCourse?._id === course._id && <div className="mt-5 border-t border-slate-100 pt-4"><div className="flex justify-between gap-3"><div><h3 className="font-extrabold text-ink">Topic videos</h3><p className="mt-1 text-xs text-slate-600">Upload an MP4 lesson for each syllabus topic. Maximum file size: 1 GB.</p></div><button onClick={() => setVideoCourse(null)} className="text-sm font-bold text-slate-500 hover:text-ink">Close</button></div><div className="mt-4 divide-y divide-slate-100">{getCourseTopics(course).map((topic, index) => { const key = `${course._id}-${index}`; const isUploading = uploadingTopic === key; const isDeleting = deletingVideo === key; return <div key={`${getTopicTitle(topic)}-${index}`} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="font-bold text-ink">{index + 1}. {getTopicTitle(topic)}</p><p className={`mt-1 text-xs ${topic?.video?.filename ? 'text-emerald-700' : 'text-slate-500'}`}>{topic?.video?.filename ? `Uploaded: ${topic.video.originalName || 'MP4 video'}` : 'No video uploaded'}</p>{isUploading && <div className="mt-2 h-1.5 max-w-xs overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${uploadProgress[key] || 0}%` }} /></div>}</div><div className="flex shrink-0 gap-2"><label className="button-secondary text-sm"><Upload size={16} />{isUploading ? `Uploading ${uploadProgress[key] || 0}%` : topic?.video?.filename ? 'Replace MP4' : 'Upload MP4'}<input type="file" accept="video/mp4,.mp4" className="sr-only" disabled={isUploading || isDeleting} onChange={(event) => { uploadVideo(course, index, event.target.files?.[0]); event.target.value = '' }} /></label>{topic?.video?.filename && <button onClick={() => removeVideo(course, index)} disabled={isUploading || isDeleting} className="inline-flex items-center justify-center rounded-md border border-red-200 px-3 py-2 text-sm font-bold text-red-700 hover:bg-red-50">{isDeleting ? 'Removing…' : <><Trash2 size={16} />Remove</>}</button>}</div></div> })}{!getCourseTopics(course).length && <p className="py-3 text-sm text-slate-600">Add syllabus topics first, then save the course.</p>}</div></div>}</article>)}</div> : <EmptyState title="No tutor courses yet" description="Create your first course, then add an MP4 lesson to each syllabus topic." />}</div>
    </div>
  </div></section>
}

export default TutorCourses
