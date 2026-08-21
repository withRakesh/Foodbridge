import axiosInstance from './axiosInstance';

// GET /api/admin/:role/pending — role must be 'restaurant' or 'ngo'
export const getPendingByRole = (role) =>
  axiosInstance.get(`/admin/${role}/pending`).then((res) => res.data);

// PUT /api/admin/:role/:id/status
// Body: { status: 'approved' | 'rejected' }
export const updateApprovalStatus = (role, id, status) =>
  axiosInstance.put(`/admin/${role}/${id}/status`, { status }).then((res) => res.data);

// GET /api/admin/users?role=..
export const getAllUsers = (role) =>
  axiosInstance.get('/admin/users', { params: role ? { role } : {} }).then((res) => res.data);

// PUT /api/admin/users/:id/toggle-active
export const toggleUserActive = (id) =>
  axiosInstance.put(`/admin/users/${id}/toggle-active`).then((res) => res.data);

// GET /api/admin/dashboard-stats
export const getDashboardStats = () =>
  axiosInstance.get('/admin/dashboard-stats').then((res) => res.data);

// GET /api/admin/donations?status=&restaurantId=&fromDate=&toDate=
export const getAllDonationsAdmin = (filters = {}) =>
  axiosInstance.get('/admin/donations', { params: filters }).then((res) => res.data);
