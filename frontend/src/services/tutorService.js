import api from './api.js'

export const getTutorProfile = () => api.get('/tutor/profile').then((response) => response.data.data)
export const updateTutorProfile = (details) => api.put('/tutor/profile', details).then((response) => response.data.data)
