import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});

// Add request interceptor
api.interceptors.request.use(config => {
    // You can add auth tokens here if needed
    return config;
}, error => {
    return Promise.reject(error);
});

// Add response interceptor
api.interceptors.response.use(response => {
    return response;
}, error => {
    // Handle specific error statuses
    if (error.response?.status === 401) {
        // Handle unauthorized access
    }
    return Promise.reject(error);
});

export default api;