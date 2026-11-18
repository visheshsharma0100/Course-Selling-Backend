import api from './api.js'

export const getTutors = (status) => api.get('/admin/tutors', { params: status ? { status } : undefined }).then((response) => response.data.data || [])
export const updateTutorApproval = (tutorId, details) => api.put(`/admin/tutors/${tutorId}/approval`, details).then((response) => response.data.data)
