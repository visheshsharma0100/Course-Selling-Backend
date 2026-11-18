import { CalendarDays, ExternalLink, PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CourseImage } from '../components/CourseCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Loading from '../components/Loading.jsx'
import { getErrorMessage } from '../services/api.js'
import { getMyPurchases } from '../services/purchaseService.js'
import { formatDate } from '../utils/formatters.js'

const Purchases = () => {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    getMyPurchases().then((data) => { if (active) setPurchases(data) })
      .catch((requestError) => { if (active) setError(getErrorMessage(requestError, 'We could not load your purchases.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  return <section className="section-space"><div className="container-page"><p className="eyebrow">Your library</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">My purchases</h1><p className="mt-3 text-slate-600">Courses you have added to your SkillStack account.</p>
      {loading ? <Loading label="Loading your purchases…" /> : error ? <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : !purchases.length ? <div className="mt-8"><EmptyState title="You haven't purchased any courses yet." description="Explore the course catalogue and add a course when you are ready." actionLabel="Explore courses" /></div> : <div className="mt-8 space-y-4">{purchases.map((purchase) => { const course = purchase.course_id; return <article key={purchase._id} className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:flex-row"><div className="h-40 w-full shrink-0 sm:h-auto sm:w-52">{course ? <CourseImage course={course} compact /> : <div className="h-full bg-slate-100" />}</div><div className="flex min-w-0 flex-1 flex-col p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><h2 className="text-lg font-extrabold text-ink">{course?.title || 'Course no longer available'}</h2><p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{course?.description || 'The course linked to this purchase is unavailable.'}</p></div>{course && <div className="flex shrink-0 flex-wrap gap-2"><Link to={`/learn/${course._id}`} className="button-primary text-sm"><PlayCircle size={16} />Watch course</Link><Link to={`/courses/${course._id}`} className="button-secondary text-sm"><ExternalLink size={16} />Details</Link></div>}</div><div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-brand-700" />Purchased {formatDate(purchase.purchase_date)}</span><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} className="text-brand-700" />Access until {formatDate(purchase.expiry_date)}</span></div></div></article> })}</div>}
  </div></section>
}

export default Purchases
