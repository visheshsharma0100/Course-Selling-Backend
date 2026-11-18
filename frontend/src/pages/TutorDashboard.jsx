import { AlertCircle, ArrowRight, CheckCircle2, CircleDollarSign, Clock3, GraduationCap, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Loading from '../components/Loading.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../services/api.js'
import { activateDevelopmentTutorSubscription, createTutorSubscriptionOrder, getTutorSubscription, verifyTutorSubscriptionPayment } from '../services/subscriptionService.js'
import { formatDate, formatPrice } from '../utils/formatters.js'

const loadRazorpayCheckout = () => new Promise((resolve, reject) => {
  if (window.Razorpay) return resolve()
  const script = document.createElement('script')
  script.src = 'https://checkout.razorpay.com/v1/checkout.js'
  script.async = true
  script.onload = resolve
  script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded. Check your connection and try again.'))
  document.body.appendChild(script)
})

const TutorDashboard = () => {
  const { user, refreshUser } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState('')
  const [notice, setNotice] = useState(null)
  const load = async () => {
    setLoading(true)
    try { setData(await getTutorSubscription()) } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not load tutor subscription details.') }) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const buyPlan = async (planKey) => {
    setProcessingPlan(planKey); setNotice(null)
    try {
      const order = await createTutorSubscriptionOrder(planKey)
      await loadRazorpayCheckout()
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'SkillStack',
        description: `${order.plan.name} tutor plan`,
        order_id: order.orderId,
        prefill: { name: user?.username || '', email: user?.email || '' },
        theme: { color: '#1d4ed8' },
        handler: async (response) => {
          try {
            await verifyTutorSubscriptionPayment({ subscriptionId: order.subscriptionId, ...response })
            await refreshUser()
            await load()
            setNotice({ type: 'success', text: 'Your tutor subscription is active. You can now create and manage your courses.' })
          } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'Payment received, but activation could not be confirmed yet. Do not pay again; contact support if it does not update shortly.') }) }
          finally { setProcessingPlan('') }
        },
        modal: { ondismiss: () => setProcessingPlan('') },
      })
      checkout.on('payment.failed', (response) => {
        const reason = response?.error?.description || response?.error?.reason
        setNotice({ type: 'error', text: `Payment was not completed.${reason ? ` Razorpay: ${reason}` : ' Choose UPI or another test payment method and try again.'}` })
        setProcessingPlan('')
      })
      checkout.open()
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, error.message || 'We could not start checkout.') }); setProcessingPlan('') }
  }
  const activateDevelopmentPlan = async (planKey) => {
    setProcessingPlan(planKey); setNotice(null)
    try {
      await activateDevelopmentTutorSubscription(planKey)
      await load()
      setNotice({ type: 'success', text: 'Development plan activated locally. No payment was taken and Razorpay was not contacted.' })
    } catch (error) { setNotice({ type: 'error', text: getErrorMessage(error, 'We could not activate the local development plan.') }) } finally { setProcessingPlan('') }
  }
  if (loading) return <Loading label="Loading tutor workspace…" />
  const subscription = data?.subscription
  const approved = user?.tutorApprovalStatus === 'approved'
  return <section className="section-space"><div className="container-page"><p className="eyebrow">Tutor workspace</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Teach on SkillStack</h1><p className="mt-3 max-w-2xl text-slate-600">Create your course, add syllabus videos, and keep every lesson under your control.</p>{notice && <div className={`mt-6 flex gap-2 rounded-lg border p-3 text-sm ${notice.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{notice.type === 'success' ? <CheckCircle2 size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}{notice.text}</div>}
    {!approved ? <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-6"><div className="flex gap-3"><Clock3 className="shrink-0 text-amber-800" size={24} /><div><h2 className="font-extrabold text-amber-950">Tutor approval required</h2><p className="mt-1 text-sm leading-6 text-amber-900">Your application is {user?.tutorApprovalStatus || 'pending'}. An administrator must approve it before you can purchase a plan or create courses.</p><Link to="/tutor/profile" className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-brand-700">Review tutor profile <ArrowRight size={16} /></Link></div></div></div> : subscription ? <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><p className="text-sm font-bold text-emerald-800">{subscription.paymentStatus === 'development' ? 'Active local development plan' : 'Active tutor plan'}</p><h2 className="mt-1 text-xl font-black text-emerald-950">{subscription.planKey === 'monthly' ? 'One month' : subscription.planKey === 'quarterly' ? 'Three months' : 'Full year'}</h2><p className="mt-1 text-sm text-emerald-900">Active until {formatDate(subscription.expiresAt)}.</p>{subscription.paymentStatus === 'development' && <p className="mt-2 text-xs font-semibold text-amber-800">Development only — no payment was charged or sent to Razorpay.</p>}</div><Link to="/tutor/courses" className="button-primary"><GraduationCap size={18} />Manage my courses</Link></div></div> : <div className="mt-7"><div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex gap-3"><CircleDollarSign className="shrink-0 text-brand-700" size={24} /><div><h2 className="font-extrabold text-ink">Choose your tutor plan</h2><p className="mt-1 text-sm leading-6 text-slate-600">A paid plan is required before you can create, edit, delete, or upload videos to your courses. Prices are set and verified on the backend.</p>{data?.developmentMode && <p className="mt-2 text-xs leading-5 font-semibold text-amber-800">Local development mode is enabled. You may activate a test plan without payment only for endpoint testing.</p>}</div></div></div><div className="mt-5 grid gap-5 md:grid-cols-3">{data?.plans?.map((plan) => <article key={plan.key} className="flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-extrabold text-ink">{plan.name}</h2><p className="mt-2 text-3xl font-black text-ink">{formatPrice(plan.amount)}</p><p className="mt-2 text-sm text-slate-600">Access to the tutor workspace for {plan.months === 1 ? '1 month' : `${plan.months} months`}.</p>{data?.developmentMode ? <button disabled={Boolean(processingPlan)} onClick={() => activateDevelopmentPlan(plan.key)} className="button-primary mt-6 w-full">{processingPlan === plan.key ? 'Activating…' : 'Activate local test plan'}</button> : <button disabled={Boolean(processingPlan)} onClick={() => buyPlan(plan.key)} className="button-primary mt-6 w-full">{processingPlan === plan.key ? 'Opening checkout…' : `Choose ${plan.name}`}</button>}</article>)}</div></div>}<div className="mt-8 grid gap-5 md:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-5"><ShieldCheck className="text-brand-700" size={23} /><h2 className="mt-4 font-extrabold text-ink">Private ownership</h2><p className="mt-1 text-sm leading-6 text-slate-600">Only you can manage courses that belong to your tutor account.</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><GraduationCap className="text-brand-700" size={23} /><h2 className="mt-4 font-extrabold text-ink">Course workspace</h2><p className="mt-1 text-sm leading-6 text-slate-600">Add course details, syllabus topics, and an MP4 lesson for each topic.</p></div><div className="rounded-xl border border-slate-200 bg-white p-5"><Clock3 className="text-brand-700" size={23} /><h2 className="mt-4 font-extrabold text-ink">Publishing review</h2><p className="mt-1 text-sm leading-6 text-slate-600">Tutor courses stay pending until an administrator approves publication.</p></div></div></div></section>
}

export default TutorDashboard
