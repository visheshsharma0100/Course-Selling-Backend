import api from './api.js'

export const getTutorSubscription = () => api.get('/tutor/subscription').then((response) => response.data.data)
export const createTutorSubscriptionOrder = (planKey) => api.post('/tutor/subscription/order', { planKey }).then((response) => response.data.data)
export const verifyTutorSubscriptionPayment = (details) => api.post('/tutor/subscription/verify', details).then((response) => response.data.data)
export const activateDevelopmentTutorSubscription = (planKey) => api.post('/tutor/subscription/development-activate', { planKey }).then((response) => response.data.data)
