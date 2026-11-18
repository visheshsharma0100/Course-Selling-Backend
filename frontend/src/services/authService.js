import api from './api.js'

export const loginRequest = (credentials) => api.post('/login', credentials).then((response) => response.data)
export const signupRequest = (details) => api.post('/signup', details).then((response) => response.data)
export const getCurrentUser = () => api.get('/me').then((response) => response.data.user)
