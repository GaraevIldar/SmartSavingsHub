import axios from 'axios';

const API_URL = 'https://localhost:5073';

export const axiosInstance = axios.create({
    baseURL: API_URL,
});