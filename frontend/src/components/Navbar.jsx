import { BookOpen, LayoutDashboard, Library, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { initials } from '../utils/formatters.js'

const navClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'}`

const Navbar = () => {
  const [open, setOpen] = useState(false)
  const { isAuthenticated, isAdmin, isTutor, logout, user } = useAuth()
  const navigate = useNavigate()
  const close = () => setOpen(false)
  const signOut = () => { logout(); close(); navigate('/') }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-ink" onClick={close}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-700 text-white"><BookOpen size={18} /></span>
          SkillStack
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          <NavLink to="/courses" className={navClass}>Explore courses</NavLink>
          {isAuthenticated && !isAdmin && <NavLink to="/purchases" className={navClass}><Library className="mr-1 inline" size={15} />My learning</NavLink>}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? <>
            <Link to="/dashboard" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-slate-200 text-xs text-slate-700">{initials(user?.username)}</span>
              <span className="max-w-28 truncate">{user?.username || 'Account'}</span>
            </Link>
            {isTutor && <Link to="/tutor/dashboard" className="button-secondary !px-3 !py-2 text-sm"><UserRound size={16} /> Tutor</Link>}
            {isAdmin && <Link to="/admin" className="button-secondary !px-3 !py-2 text-sm"><ShieldCheck size={16} /> Admin</Link>}
            <button onClick={signOut} className="button-primary !px-3 !py-2 text-sm"><LogOut size={16} /> Logout</button>
          </> : <>
            <Link to="/login" className="button-secondary text-sm">Log in</Link>
            <Link to="/signup" className="button-primary text-sm">Sign up</Link>
          </>}
        </div>
        <button className="rounded-md p-2 text-slate-700 hover:bg-slate-100 md:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
        <nav className="container-page grid gap-1" aria-label="Mobile navigation">
          <NavLink to="/" end className={navClass} onClick={close}>Home</NavLink>
          <NavLink to="/courses" className={navClass} onClick={close}>Explore courses</NavLink>
          {isAuthenticated ? <>
            <NavLink to="/dashboard" className={navClass} onClick={close}><LayoutDashboard className="mr-2 inline" size={16} />Dashboard</NavLink>
            <NavLink to="/profile" className={navClass} onClick={close}><UserRound className="mr-2 inline" size={16} />Profile</NavLink>
            {!isAdmin && <NavLink to="/purchases" className={navClass} onClick={close}><Library className="mr-2 inline" size={16} />My learning</NavLink>}
            {isTutor && <NavLink to="/tutor/dashboard" className={navClass} onClick={close}><UserRound className="mr-2 inline" size={16} />Tutor workspace</NavLink>}
            {isAdmin && <NavLink to="/admin" className={navClass} onClick={close}><ShieldCheck className="mr-2 inline" size={16} />Admin</NavLink>}
            <button className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-bold text-red-700 hover:bg-red-50" onClick={signOut}><LogOut size={16} />Logout</button>
          </> : <div className="mt-3 grid grid-cols-2 gap-2"><Link to="/login" className="button-secondary text-sm" onClick={close}>Log in</Link><Link to="/signup" className="button-primary text-sm" onClick={close}>Sign up</Link></div>}
        </nav>
      </div>}
    </header>
  )
}

export default Navbar
