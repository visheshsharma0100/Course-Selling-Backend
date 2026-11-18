import { AlertCircle, ArrowLeft, CheckCircle2, ListVideo, PlayCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState.jsx'
import Loading from '../components/Loading.jsx'
import { getErrorMessage } from '../services/api.js'
import { getCourseById, getCourseVideoAccess, resolveApiUrl } from '../services/courseService.js'
import { getMyPurchases } from '../services/purchaseService.js'
import { getCourseTopics, getTopicTitle } from '../utils/courseTopics.js'

const CoursePlayer = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [videoUrl, setVideoUrl] = useState('')
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getMyPurchases(), getCourseById(id)]).then(([purchases, courseData]) => {
      if (!purchases.some((purchase) => purchase.course_id?._id === id)) throw new Error('COURSE_NOT_PURCHASED')
      if (!active) return
      setCourse(courseData)
      const firstVideo = getCourseTopics(courseData).findIndex((topic) => topic?.video?.filename)
      setSelectedTopic(firstVideo >= 0 ? firstVideo : null)
    }).catch((requestError) => {
      if (!active) return
      setError(requestError.message === 'COURSE_NOT_PURCHASED' ? 'This course is not in your purchases.' : getErrorMessage(requestError, 'We could not open this course.'))
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (selectedTopic === null) return undefined
    let active = true
    setVideoLoading(true); setVideoError(''); setVideoUrl('')
    getCourseVideoAccess(id, selectedTopic).then((access) => {
      if (!active) return
      setVideoUrl(resolveApiUrl(access.streamUrl))
    }).catch((requestError) => { if (active) setVideoError(getErrorMessage(requestError, 'This video is not available right now.')) })
      .finally(() => { if (active) setVideoLoading(false) })
    return () => { active = false }
  }, [id, selectedTopic])

  const topics = useMemo(() => getCourseTopics(course), [course])
  if (loading) return <Loading label="Opening your course…" />
  if (!course) return <section className="section-space"><div className="container-page"><Link to="/purchases" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700"><ArrowLeft size={16} />Back to My Purchases</Link><div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-900"><h1 className="font-extrabold">Course unavailable</h1><p className="mt-2 text-sm">{error}</p></div></div></section>

  return <section className="section-space"><div className="container-page"><Link to="/purchases" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-800"><ArrowLeft size={16} />Back to My Purchases</Link><div className="mt-5"><p className="eyebrow">Your course player</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink">{course.title}</h1></div>
    {!topics.some((topic) => topic?.video?.filename) ? <div className="mt-8"><EmptyState title="Videos are coming soon" description="Your purchase is active, but the instructor has not uploaded topic videos for this course yet." actionLabel="Course details" actionTo={`/courses/${id}`} /></div> : <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]"><div><div className="overflow-hidden rounded-xl bg-slate-950 shadow-lg">{videoLoading ? <div className="grid aspect-video place-items-center text-sm text-slate-300"><Loading label="Loading video…" className="!py-0 !text-slate-300" /></div> : videoUrl ? <video key={videoUrl} controls autoPlay className="aspect-video w-full" src={videoUrl}>Your browser does not support video playback.</video> : <div className="grid aspect-video place-items-center px-6 text-center text-sm text-slate-300">{videoError ? <span className="inline-flex items-center gap-2 text-red-200"><AlertCircle size={18} />{videoError}</span> : 'Choose a lesson to start watching.'}</div>}</div>{selectedTopic !== null && <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs font-bold uppercase tracking-wider text-brand-700">Now playing</p><h2 className="mt-1 font-extrabold text-ink">{getTopicTitle(topics[selectedTopic])}</h2></div>}</div>
      <aside className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="border-b border-slate-200 p-4"><h2 className="inline-flex items-center gap-2 font-extrabold text-ink"><ListVideo size={19} className="text-brand-700" />Course content</h2><p className="mt-1 text-xs text-slate-500">Select an uploaded topic to watch.</p></div><ol className="max-h-[32rem] overflow-y-auto">{topics.map((topic, index) => { const available = Boolean(topic?.video?.filename); const active = selectedTopic === index; return <li key={`${getTopicTitle(topic)}-${index}`}><button disabled={!available} onClick={() => setSelectedTopic(index)} className={`flex w-full gap-3 border-b border-slate-100 p-4 text-left transition ${active ? 'bg-brand-50' : available ? 'hover:bg-slate-50' : 'cursor-not-allowed opacity-50'}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-extrabold ${active ? 'bg-brand-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-ink">{getTopicTitle(topic)}</span><span className={`mt-1 inline-flex items-center gap-1 text-xs ${available ? 'text-brand-700' : 'text-slate-500'}`}>{available ? <><PlayCircle size={14} />Watch video</> : <><CheckCircle2 size={14} />Video coming soon</>}</span></span></button></li> })}</ol></aside>
    </div>}
  </div></section>
}

export default CoursePlayer
