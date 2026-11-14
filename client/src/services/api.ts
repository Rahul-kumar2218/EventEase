import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('eventease_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for unified error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'Unable to connect to server.';
    if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (error.message === 'Network Error') {
      message = 'Unable to connect to server. Please ensure the backend is running.';
    }
    return Promise.reject({
      ...error,
      customMessage: message,
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

export default api;
