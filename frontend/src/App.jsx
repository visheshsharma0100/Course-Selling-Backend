import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer.jsx'
import Navbar from './components/Navbar.jsx'
import AdminRoute from './components/AdminRoute.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import CourseDetails from './pages/CourseDetails.jsx'
import CoursePlayer from './pages/CoursePlayer.jsx'
import Courses from './pages/Courses.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import ManageTutors from './pages/ManageTutors.jsx'
import NotFound from './pages/NotFound.jsx'
import Profile from './pages/Profile.jsx'
import Purchases from './pages/Purchases.jsx'
import Signup from './pages/Signup.jsx'
import TutorProfile from './pages/TutorProfile.jsx'
import TutorDashboard from './pages/TutorDashboard.jsx'
import TutorCourses from './pages/TutorCourses.jsx'
import TutorRoute from './components/TutorRoute.jsx'

const App = () => (
  <BrowserRouter>
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:id" element={<CourseDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/learn/:id" element={<CoursePlayer />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/tutors" element={<ManageTutors />} />
          </Route>
          <Route element={<TutorRoute />}>
            <Route path="/tutor/dashboard" element={<TutorDashboard />} />
            <Route path="/tutor/courses" element={<TutorCourses />} />
            <Route path="/tutor/profile" element={<TutorProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  </BrowserRouter>
)

export default App
