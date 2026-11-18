import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const TutorRoute = () => {
  const { isAuthenticated, isTutor } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return isTutor ? <Outlet /> : <Navigate to="/dashboard" replace />
}

export default TutorRoute
