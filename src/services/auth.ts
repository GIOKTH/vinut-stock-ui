import { apiInstance as api } from '../lib/axios';
import { LoginSchema, CreateUserSchema, UserResponse } from '../types/api';

export const authService = {
    login: async (data: LoginSchema): Promise<string> => {
        const response = await api.post<{ token: string }>('/auth/login', data);
        return response.data.token;
    },

    register: async (data: CreateUserSchema): Promise<UserResponse> => {
        const response = await api.post<UserResponse>('/auth/register', data);
        return response.data;
    },

    me: async (): Promise<UserResponse> => {
        const response = await api.get<UserResponse>('/auth/me');
        return response.data;
    },

    logout: () => {
        localStorage.removeItem('token');
    },
};
