import axiosInstance from './axiosInstance';

// POST /api/donations — multipart/form-data (image is optional).
// Expects a FormData with: foodName, quantity, preparedTime (ISO string),
// expiryTime (ISO string), location (JSON string: {address, lat, lng}),
// and optionally an "image" file field.
export const createDonation = (formData) =>
  axiosInstance
    .post('/donations', formData)
    .then((res) => res.data);

// GET /api/donations/my-donations — this restaurant's own donation history
export const getMyDonations = () =>
  axiosInstance.get('/donations/my-donations').then((res) => res.data);

// PUT /api/donations/:id/cancel — only works while status is still 'posted'
export const cancelDonation = (donationId) =>
  axiosInstance.put(`/donations/${donationId}/cancel`).then((res) => res.data);

// PUT /api/donations/:id/confirm-handover — only works while status is
// 'volunteer_assigned' (i.e. after the NGO has assigned someone to collect)
export const confirmHandover = (donationId) =>
  axiosInstance.put(`/donations/${donationId}/confirm-handover`).then((res) => res.data);

// GET /api/donations/available — unclaimed "posted" donations, NGO-only
export const getAvailableDonations = () =>
  axiosInstance.get('/donations/available').then((res) => res.data);

// GET /api/donations/my-ngo-donations — donations this NGO has accepted,
// across every status from 'accepted' through 'completed'
export const getMyNgoDonations = () =>
  axiosInstance.get('/donations/my-ngo-donations').then((res) => res.data);

// PUT /api/donations/:id/accept
// Body: { institutionId }
export const acceptDonation = (donationId, institutionId) =>
  axiosInstance
    .put(`/donations/${donationId}/accept`, { institutionId })
    .then((res) => res.data);

// PUT /api/donations/:id/assign-volunteer
// Body: { volunteerId }
export const assignVolunteer = (donationId, volunteerId) =>
  axiosInstance
    .put(`/donations/${donationId}/assign-volunteer`, { volunteerId })
    .then((res) => res.data);

// PUT /api/donations/:id/confirm-delivery — NGO confirms receipt, closes the loop
export const confirmDelivery = (donationId) =>
  axiosInstance.put(`/donations/${donationId}/confirm-delivery`).then((res) => res.data);

// GET /api/donations/my-assignments — this volunteer's assignments, across
// 'volunteer_assigned' / 'collected' / 'delivered'
export const getMyAssignments = () =>
  axiosInstance.get('/donations/my-assignments').then((res) => res.data);

// PUT /api/donations/:id/mark-delivered — only works while status is 'collected'
export const markDelivered = (donationId) =>
  axiosInstance.put(`/donations/${donationId}/mark-delivered`).then((res) => res.data);
