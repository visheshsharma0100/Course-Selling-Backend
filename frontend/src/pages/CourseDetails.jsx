import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2, Clock3, GraduationCap, LogIn, ShieldCheck, Star } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CourseImage } from '../components/CourseCard.jsx'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { getCourseById } from '../services/courseService.js'
import { createPurchaseOrder, verifyPurchasePayment } from '../services/purchaseService.js'
import { formatPrice } from '../utils/formatters.js'
import { getCourseTopics, getTopicTitle } from '../utils/courseTopics.js'

const CourseDetails = () => {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [purchaseLoading, setPurchaseLoading] = useState(false)
  const [notice, setNotice] = useState(null)
  const autoPurchaseStarted = useRef(false)

  const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve()
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = resolve
    script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded. Check your connection and try again.'))
    document.body.appendChild(script)
  })

  useEffect(() => {
    let active = true
    setLoading(true)
    setNotice(null)
    getCourseById(id).then((data) => { if (active) setCourse(data) })
      .catch((error) => { if (active) setNotice({ type: 'error', text: getErrorMessage(error, 'This course could not be found.') }) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id])

  const enroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?next=${encodeURIComponent(`/courses/${id}`)}&purchase=${encodeURIComponent(id)}`)
      return
    }
    setPurchaseLoading(true)
    setNotice(null)
    let checkoutOpened = false
    try {
      const order = await createPurchaseOrder(id)
      if (order.developmentMode) {
        throw new Error('The backend is still running an old local-test configuration. Restart backend and try again; no course should be granted without Razorpay.')
      }
      await loadRazorpayCheckout()
      const checkout = new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, name: 'SkillStack', description: course.title, order_id: order.orderId,
        prefill: { name: user?.username || '', email: user?.email || '' }, theme: { color: '#1d4ed8' },
        handler: async (response) => {
          try {
            await verifyPurchasePayment(id, { purchaseId: order.purchaseId, ...response })
            setNotice({ type: 'success', text: 'Course purchased successfully. It is now available in My Purchases.' })
          } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'Payment was received but we could not confirm access yet. Do not pay again; contact support if it does not update shortly.') }) }
          finally { setPurchaseLoading(false) }
        },
        modal: { ondismiss: () => setPurchaseLoading(false) },
      })
      checkout.on('payment.failed', (response) => {
        const reason = response?.error?.description || response?.error?.reason
        setNotice({ type: 'error', text: `Payment was not completed, so this course has not been purchased.${reason ? ` Razorpay: ${reason}` : ' Choose UPI or another method and try again.'}` })
        setPurchaseLoading(false)
      })
      checkout.open()
      checkoutOpened = true
      return
    } catch (error) {
      if (error.response?.status === 409) {
        setNotice({ type: 'owned', text: 'You already own this course. Open My Purchases to start learning.' })
      } else {
        setNotice({ type: 'error', text: getErrorMessage(error, 'We could not add this course. Please try again.') })
      }
    } finally { if (!checkoutOpened) setPurchaseLoading(false) }
  }

  useEffect(() => {
    if (location.state?.purchaseCourseId === id && isAuthenticated && course && !autoPurchaseStarted.current) {
      autoPurchaseStarted.current = true
      navigate(location.pathname, { replace: true, state: {} })
      enroll()
    }
  // The state is intentionally consumed only once after the redirected login.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, id, isAuthenticated, course])

  if (loading) return <Loading label="Loading course…" />
  if (!course) return <section className="section-space"><div className="container-page"><Link to="/courses" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700"><ArrowLeft size={16} />Back to courses</Link><div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6"><h1 className="font-extrabold text-red-900">Course unavailable</h1><p className="mt-2 text-sm text-red-800">{notice?.text || 'This course could not be found.'}</p></div></div></section>

  return <section className="section-space"><div className="container-page"><Link to="/courses" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-800"><ArrowLeft size={16} />Back to courses</Link>
    <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start"><div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><div className="h-52 bg-slate-100 sm:h-64 lg:h-72"><CourseImage course={course} compact /></div><div className="p-6 sm:p-8"><div className="flex items-center gap-2 text-sm font-bold text-brand-700"><BookOpen size={17} />Professional online course</div><h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">{course.title}</h1><p className="mt-5 max-w-3xl leading-7 text-slate-600">{course.description}</p></div></div>
      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"><h2 className="text-xl font-extrabold text-ink">Course syllabus</h2><p className="mt-2 text-sm text-slate-600">A clear view of the topics covered in this course.</p>{getCourseTopics(course).length ? <ol className="mt-6 space-y-3">{getCourseTopics(course).map((topic, index) => <li key={`${getTopicTitle(topic)}-${index}`} className="flex gap-3 border-b border-slate-100 pb-3 text-slate-700 last:border-0"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-extrabold text-brand-700">{index + 1}</span><span className="pt-0.5">{getTopicTitle(topic)}</span></li>)}</ol> : <p className="mt-5 text-sm text-slate-500">The course syllabus will be added soon.</p>}</section>
      <section className="mt-7 rounded-xl border border-slate-200 bg-white p-6 sm:p-8"><div className="flex items-center gap-2"><GraduationCap className="text-brand-700" size={22} /><h2 className="text-xl font-extrabold text-ink">Your instructor</h2></div>{course.instructor?.role === 'admin' ? <p className="mt-4 text-sm leading-6 text-slate-700">Created by <strong>SkillStack Admin</strong>.</p> : <div className="mt-4"><p className="font-extrabold text-ink">{course.instructor?.name || 'SkillStack tutor'}</p><p className="mt-2 text-sm leading-6 text-slate-600">{course.instructor?.bio || 'Professional course instructor on SkillStack.'}</p><p className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-slate-700"><Star size={16} className="fill-amber-400 text-amber-400" />{course.instructor?.ratingCount ? `${Number(course.instructor.ratingAverage).toFixed(1)} / 5 (${course.instructor.ratingCount} ratings)` : 'New tutor · No ratings yet'}</p><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Skills</dt><dd className="mt-1 text-sm text-slate-700">{course.instructor?.expertise || 'Not provided'}</dd></div><div><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">Education</dt><dd className="mt-1 text-sm text-slate-700">{course.instructor?.education || 'Not provided'}</dd></div></dl></div>}</section>
      <div className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-xl border border-slate-200 bg-white p-5"><Clock3 className="text-brand-700" size={21} /><h3 className="mt-3 font-extrabold text-ink">Learn flexibly</h3><p className="mt-1 text-sm leading-6 text-slate-600">Return to your purchased course whenever you need it.</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><ShieldCheck className="text-brand-700" size={21} /><h3 className="mt-3 font-extrabold text-ink">Your purchase, protected</h3><p className="mt-1 text-sm leading-6 text-slate-600">Purchased courses are kept within your personal account.</p></div></div>
    </div>
    <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24"><p className="text-sm font-semibold text-slate-500">Course price</p><p className="mt-1 text-3xl font-black text-ink">{formatPrice(course.price)}</p><button onClick={enroll} disabled={purchaseLoading} className="button-primary mt-5 w-full">{purchaseLoading ? 'Opening secure checkout…' : isAuthenticated ? 'Buy course' : <><LogIn size={17} />Log in to buy</>}</button><p className="mt-3 text-center text-xs leading-5 text-slate-500">Secure test payment powered by Razorpay.</p>
      {notice && <div className={`mt-4 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : notice.type === 'owned' ? 'border-brand-200 bg-brand-50 text-brand-900' : 'border-red-200 bg-red-50 text-red-800'}`}><div className="flex gap-2">{notice.type === 'error' ? <AlertCircle className="shrink-0" size={18} /> : <CheckCircle2 className="shrink-0" size={18} />}<span>{notice.text}</span></div>{notice.type === 'owned' && <Link to="/purchases" className="mt-2 inline-block font-bold underline">View My Purchases</Link>}{notice.type === 'success' && <Link to="/purchases" className="mt-2 inline-block font-bold underline">Go to My Purchases</Link>}</div>}
    </aside></div>
  </div></section>
}

export default CourseDetails
