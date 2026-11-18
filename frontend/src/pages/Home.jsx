import { ArrowRight, Award, BookOpen, CheckCircle2, Clock3, Search, ShieldCheck, Star, UsersRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CourseCard from '../components/CourseCard.jsx'
import Loading from '../components/Loading.jsx'
import { getCourses } from '../services/courseService.js'

const categories = ['Web Development', 'Data & AI', 'Business', 'Design', 'Personal Growth']
const benefits = [
  { icon: BookOpen, title: 'Practical learning paths', copy: 'Focused courses that help you build skills you can apply straight away.' },
  { icon: Clock3, title: 'Learn on your schedule', copy: 'Return to your course whenever it suits you, from any device.' },
  { icon: Award, title: 'Track real progress', copy: 'Keep your learning organized in one clear, distraction-free space.' },
]
const testimonials = [
  { quote: 'The course structure made it easy to move from tutorials to actually building.', name: 'Aarav S.', role: 'Software learner' },
  { quote: 'I liked that everything I needed was organized in one place, without the noise.', name: 'Meera K.', role: 'Career switcher' },
  { quote: 'Clear lessons and a clean experience helped me stay consistent every week.', name: 'Rohan P.', role: 'Product enthusiast' },
]

const Home = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getCourses().then((data) => { if (active) setCourses(data.slice(0, 3)) })
      .catch(() => { if (active) setError('Courses are temporarily unavailable. Please try again shortly.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const search = (event) => {
    event.preventDefault()
    navigate(`/courses${query.trim() ? `?search=${encodeURIComponent(query.trim())}` : ''}`)
  }

  return <>
    <section className="border-b border-slate-200 bg-white">
      <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:py-20">
        <div>
          <p className="eyebrow">Build skills with direction</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-ink sm:text-5xl">Learn what moves your work forward.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">SkillStack brings focused, practical courses together in one place—so you can spend less time searching and more time learning.</p>
          <form onSubmit={search} className="mt-7 flex max-w-xl flex-col gap-2 rounded-lg border border-slate-300 bg-white p-2 shadow-sm sm:flex-row">
            <label className="flex min-w-0 flex-1 items-center gap-2 px-3"><Search size={19} className="shrink-0 text-slate-500" /><span className="sr-only">Search courses</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 flex-1 border-0 bg-transparent py-2 outline-none placeholder:text-slate-400" placeholder="What do you want to learn?" /></label>
            <button className="button-primary" type="submit">Search courses</button>
          </form>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-600" />Learn at your pace</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={16} className="text-brand-600" />Clear course access</span></div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-ink p-7 text-white shadow-xl sm:p-10">
          <div className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-500/25" /><div className="absolute -bottom-16 left-10 h-40 w-40 rounded-full bg-indigo-400/15" />
          <div className="relative"><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold"><Star size={15} className="fill-amber-300 text-amber-300" /> A better learning routine</div>
            <h2 className="mt-7 text-2xl font-extrabold leading-tight sm:text-3xl">Start with a course. Leave with momentum.</h2>
            <div className="mt-8 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/15 bg-white/10 p-4"><UsersRound className="text-sky-200" size={22} /><p className="mt-5 text-sm text-slate-200">Learn alongside a growing community.</p></div><div className="rounded-xl border border-white/15 bg-white/10 p-4"><ShieldCheck className="text-sky-200" size={22} /><p className="mt-5 text-sm text-slate-200">Simple, secure access to your courses.</p></div></div>
          </div>
        </div>
      </div>
    </section>

    <section className="section-space">
      <div className="container-page"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Start here</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Featured courses</h2><p className="mt-2 text-slate-600">Explore courses currently available on SkillStack.</p></div><Link to="/courses" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-800">See all courses <ArrowRight size={17} /></Link></div>
        {loading ? <Loading label="Loading featured courses…" /> : error ? <p className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{error}</p> : courses.length ? <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{courses.map((course) => <CourseCard key={course._id} course={course} />)}</div> : <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">New courses will appear here soon.</div>}
      </div>
    </section>

    <section className="border-y border-slate-200 bg-white py-14"><div className="container-page"><p className="eyebrow">Explore by direction</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Popular learning areas</h2><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{categories.map((category) => <Link key={category} to={`/courses?search=${encodeURIComponent(category)}`} className="rounded-lg border border-slate-200 px-4 py-4 font-bold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800">{category}<ArrowRight className="float-right mt-0.5" size={17} /></Link>)}</div></div></section>

    <section className="section-space"><div className="container-page"><div className="max-w-2xl"><p className="eyebrow">Why SkillStack</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Keep learning uncomplicated.</h2><p className="mt-3 leading-7 text-slate-600">A polished, straightforward place to explore a course, enroll, and keep track of what is yours.</p></div><div className="mt-9 grid gap-5 md:grid-cols-3">{benefits.map(({ icon: Icon, title, copy }) => <article key={title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><Icon className="text-brand-700" size={26} /><h3 className="mt-5 text-lg font-extrabold text-ink">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p></article>)}</div></div></section>

    <section className="border-t border-slate-200 bg-white py-14"><div className="container-page"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="eyebrow">Learner stories</p><h2 className="mt-2 text-3xl font-black tracking-tight text-ink">Made for steady progress.</h2></div><p className="text-xs text-slate-500">Illustrative learner feedback</p></div><div className="mt-8 grid gap-5 lg:grid-cols-3">{testimonials.map((item) => <blockquote key={item.name} className="rounded-xl border border-slate-200 p-6"><div className="flex text-amber-500">{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} className="fill-current" />)}</div><p className="mt-4 leading-7 text-slate-700">“{item.quote}”</p><footer className="mt-5 text-sm"><strong className="text-ink">{item.name}</strong><span className="block text-slate-500">{item.role}</span></footer></blockquote>)}</div></div></section>
  </>
}

export default Home
