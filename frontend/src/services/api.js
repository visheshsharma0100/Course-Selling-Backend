import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillstack_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // The client defaults to JSON for regular API calls. A stale JSON header on
  // FormData prevents Multer from seeing the `video` field, so deliberately
  // remove it and let the browser add multipart/form-data with its boundary.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.setContentType === 'function') config.headers.setContentType(undefined)
    else delete config.headers['Content-Type']
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('skillstack_token')) {
      localStorage.removeItem('skillstack_token')
      localStorage.removeItem('skillstack_user')
      window.dispatchEvent(new Event('skillstack:session-expired'))
    }
    return Promise.reject(error)
  },
)

export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const message = error?.response?.data?.message
  if (Array.isArray(message)) return message.map((issue) => issue.message).join(' ')
  return message || fallback
}

export default api
