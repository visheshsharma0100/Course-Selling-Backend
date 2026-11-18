import { ArrowRight, BookOpen, ImageOff, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { formatPrice } from '../utils/formatters.js'

const CourseVisual = ({ course, compact = false }) => {
  const [failed, setFailed] = useState(false)
  if (course.image_url && !failed) return <img src={course.image_url} alt="" className={`w-full object-cover ${compact ? 'h-full' : 'h-44'}`} onError={() => setFailed(true)} />
  return <div className={`flex w-full items-center justify-center bg-slate-100 text-brand-700 ${compact ? 'h-full' : 'h-44'}`}><ImageOff size={compact ? 22 : 32} /><span className="sr-only">Course image unavailable</span></div>
}

export const CourseImage = CourseVisual

const CourseCard = ({ course }) => (
  <article className="group flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <CourseVisual course={course} />
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700"><BookOpen size={14} /> Online course</div>
      <h3 className="line-clamp-2 text-lg font-extrabold leading-snug text-ink">{course.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{course.description}</p>
      <div className="mt-4 text-sm text-slate-600"><p className="font-bold text-slate-700">By {course.instructor?.name || 'SkillStack'}</p>{course.instructor?.role === 'tutor' && <p className="mt-1 inline-flex items-center gap-1 text-xs"><Star size={14} className="fill-amber-400 text-amber-400" />{course.instructor.ratingCount ? `${Number(course.instructor.ratingAverage).toFixed(1)} / 5 (${course.instructor.ratingCount})` : 'New tutor · No ratings yet'}</p>}</div>
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-lg font-black tracking-tight text-ink">{formatPrice(course.price)}</span>
        <Link to={`/courses/${course._id}`} className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:text-brand-800">View course <ArrowRight size={16} /></Link>
      </div>
    </div>
  </article>
)

export default CourseCard
