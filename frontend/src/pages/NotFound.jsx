import { ArrowLeft, MapPinned } from 'lucide-react'
import { Link } from 'react-router-dom'

const NotFound = () => <section className="section-space"><div className="container-page flex min-h-80 items-center justify-center"><div className="max-w-md text-center"><MapPinned className="mx-auto text-brand-700" size={38} /><p className="mt-5 text-sm font-bold uppercase tracking-widest text-brand-700">404</p><h1 className="mt-2 text-3xl font-black text-ink">This page is not on the course map.</h1><p className="mt-3 text-slate-600">The link may be old, or the page may have moved.</p><Link to="/" className="button-primary mt-6"><ArrowLeft size={17} />Back home</Link></div></div></section>

export default NotFound
