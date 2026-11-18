import { BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'

const EmptyState = ({ title, description, actionLabel, actionTo = '/courses' }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
    <span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700"><BookOpen size={22} /></span>
    <h2 className="text-lg font-bold text-ink">{title}</h2>
    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
    {actionLabel && <Link to={actionTo} className="button-primary mt-6">{actionLabel}</Link>}
  </div>
)

export default EmptyState
