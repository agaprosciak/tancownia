import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/'
});

api.interceptors.request.use((config) => {
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
        const access = JSON.parse(authTokens).access;
        // To jest ta "przepustka", której brakowało na screenie
        config.headers.Authorization = `Bearer ${access}`;
    }
    return config;
});

export default api;