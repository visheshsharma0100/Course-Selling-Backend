import { Search, SlidersHorizontal } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import CourseCard from '../components/CourseCard.jsx'
import EmptyState from '../components/EmptyState.jsx'
import Loading from '../components/Loading.jsx'
import { getCourses } from '../services/courseService.js'
import { getTopicTitle } from '../utils/courseTopics.js'

const Courses = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const query = searchParams.get('search') || ''

  useEffect(() => {
    let active = true
    setLoading(true)
    getCourses().then((data) => { if (active) setCourses(data) })
      .catch(() => { if (active) setError('We could not load courses right now. Check that the backend is running and try again.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return courses
    return courses.filter((course) => [course.title, course.description, ...(course.syllabus || []).map((topic) => getTopicTitle(topic))].join(' ').toLowerCase().includes(term))
  }, [courses, query])

  const updateQuery = (value) => setSearchParams(value ? { search: value } : {})

  return <section className="section-space"><div className="container-page"><p className="eyebrow">Course catalogue</p><h1 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">Explore courses</h1><p className="mt-3 max-w-2xl text-slate-600">Browse all currently published SkillStack courses. You can view every course before signing in.</p>
    <div className="mt-7 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"><label className="flex flex-1 items-center gap-3 px-2"><Search size={19} className="text-slate-500" /><span className="sr-only">Search all courses</span><input value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search by course, topic, or syllabus…" className="min-w-0 flex-1 py-2 outline-none placeholder:text-slate-400" /></label><div className="inline-flex items-center gap-2 border-t border-slate-100 px-2 pt-3 text-sm font-semibold text-slate-500 sm:border-l sm:border-t-0 sm:pt-0"><SlidersHorizontal size={16} />{filtered.length} result{filtered.length === 1 ? '' : 's'}</div></div>
    {loading ? <Loading label="Loading courses…" /> : error ? <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div> : filtered.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((course) => <CourseCard key={course._id} course={course} />)}</div> : <div className="mt-8"><EmptyState title="No courses found" description={query ? `No published course matched “${query}”. Try a different search.` : 'New courses will appear here soon.'} actionLabel={query ? 'Clear search' : undefined} actionTo="/courses" /></div>}
  </div></section>
}

export default Courses
