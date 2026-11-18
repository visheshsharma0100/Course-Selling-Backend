import api from './api.js'

export const createPurchaseOrder = (courseId) => api.post(`/purchase/${courseId}/order`).then((response) => ({ ...response.data.data, message: response.data.message }))
export const verifyPurchasePayment = (courseId, details) => api.post(`/purchase/${courseId}/verify`, details).then((response) => response.data.data)
export const getMyPurchases = () => api.get('/purchase/my').then((response) => response.data.data || [])
export const getAllPurchases = () => api.get('/purchase/all').then((response) => response.data.data || [])
export const updatePurchase = (purchaseId, details) => api.put(`/purchase/${purchaseId}`, details).then((response) => response.data.data)
export const deletePurchase = (purchaseId) => api.delete(`/purchase/${purchaseId}`).then((response) => response.data)
