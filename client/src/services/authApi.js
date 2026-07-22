import api from './api'

// POST /api/v1/register
export const registerUser = ({ name, email, phone, password, consent }) =>
  api.post('/register', { name, email, phone, password, consent }).then((res) => res.data)

// POST /api/v1/login
export const loginUser = ({ email, password }) =>
  api.post('/login', { email, password }).then((res) => res.data)

// PUT /api/v1/logout
export const logoutUser = () =>
  api.put('/logout').then((res) => res.data)

// GET /api/v1/self-identification
export const getSelf = () =>
  api.get('/self-identification').then((res) => res.data)

// POST /api/v1/refresh-token
export const refreshToken = () =>
  api.post('/refresh-token').then((res) => res.data)

// PUT /api/v1/forgot-password
export const forgotPassword = ({ email }) =>
  api.put('/forgot-password', { email }).then((res) => res.data)

// PUT /api/v1/reset-password/:token
export const resetPassword = (token, { newPassword }) =>
  api.put(`/reset-password/${token}`, { newPassword }).then((res) => res.data)

// PUT /api/v1/change-password (authenticated)
export const changePassword = ({ oldPassword, newPassword }) =>
  api.put('/change-password', { oldPassword, newPassword }).then((res) => res.data)

// PUT /api/v1/confirmation/:token?code=...
export const confirmAccount = (token, code) =>
  api.put(`/confirmation/${token}?code=${code}`).then((res) => res.data)
