import axiosInstance from './axiosInstance';

// GET /api/volunteers/available — active, currently-available volunteers, NGO-only
export const getAvailableVolunteers = () =>
  axiosInstance.get('/volunteers/available').then((res) => res.data);
