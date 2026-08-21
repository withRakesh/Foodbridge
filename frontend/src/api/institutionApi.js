import axiosInstance from './axiosInstance';

// POST /api/institutions
// Body: { name, type, address, contactPerson?, contactPhone? }
// type must be one of: 'orphanage' | 'old_age_home' | 'shelter' | 'other'
export const createInstitution = (payload) =>
  axiosInstance.post('/institutions', payload).then((res) => res.data);

// GET /api/institutions — institutions belonging to the logged-in NGO
export const getMyInstitutions = () =>
  axiosInstance.get('/institutions').then((res) => res.data);
