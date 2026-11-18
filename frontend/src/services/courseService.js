import api from './api.js'

export const getCourses = () => api.get('/courses').then((response) => response.data.data || [])
export const getAdminCourses = () => api.get('/admin/courses').then((response) => response.data.data || [])
export const getTutorCourses = () => api.get('/tutor/courses').then((response) => response.data.data || [])
export const getCourseById = (courseId) => api.get(`/courses/${courseId}`).then((response) => response.data.data)
export const createCourse = (course) => api.post('/courses', course).then((response) => response.data.data)
export const updateCourse = (courseId, course) => api.put(`/courses/${courseId}`, course).then((response) => response.data.data)
export const deleteCourse = (courseId) => api.delete(`/courses/${courseId}`).then((response) => response.data)
export const uploadCourseVideo = (courseId, topicIndex, video) => {
  const formData = new FormData()
  formData.append('video', video, video.name)
  return api.post(`/courses/${courseId}/videos/${topicIndex}`, formData, {
    // Deliberately do not set Content-Type. Axios/the browser adds the required
    // multipart boundary; manually setting it can produce an unreadable upload.
    onUploadProgress: undefined,
  }).then((response) => response.data.data)
}
export const uploadCourseVideoWithProgress = (courseId, topicIndex, video, onProgress) => {
  const formData = new FormData()
  formData.append('video', video, video.name)
  return api.post(`/courses/${courseId}/videos/${topicIndex}`, formData, {
    onUploadProgress: (event) => {
      if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100))
    },
  }).then((response) => response.data.data)
}
export const getCourseVideoAccess = (courseId, topicIndex) => api.get(`/courses/${courseId}/videos/${topicIndex}/access`).then((response) => response.data.data)
export const deleteCourseVideo = (courseId, topicIndex) => api.delete(`/courses/${courseId}/videos/${topicIndex}`).then((response) => response.data.data)

export const resolveApiUrl = (path) => {
  const baseUrl = api.defaults.baseURL || ''
  return /^https?:\/\//i.test(baseUrl) ? new URL(path, baseUrl).toString() : path
}
