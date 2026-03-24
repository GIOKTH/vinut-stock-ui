import { apiInstance as api } from '../lib/axios';
import { ExchangeRate, UpdateExchangeRateSchema, UserResponse, ChangeRoleSchema } from '../types/api';

export const settingsService = {
    getExchangeRates: async (): Promise<ExchangeRate[]> => {
        const response = await api.get<ExchangeRate[]>('/settings/exchange');
        return response.data;
    },

    updateExchangeRate: async (currency: string, data: UpdateExchangeRateSchema): Promise<void> => {
        await api.post(`/settings/exchange/${currency}`, data);
    },

    getUsers: async (): Promise<UserResponse[]> => {
        const response = await api.get<UserResponse[]>('/settings/users');
        return response.data;
    },

    deleteUser: async (id: string): Promise<void> => {
        await api.delete(`/settings/users/${id}`);
    },

    blockUser: async (id: string): Promise<void> => {
        await api.post(`/settings/users/${id}/block`);
    },

    unblockUser: async (id: string): Promise<void> => {
        await api.post(`/settings/users/${id}/unblock`);
    },

    changeUserRole: async (id: string, data: ChangeRoleSchema): Promise<void> => {
        await api.put(`/settings/users/${id}/role`, data);
    },
};
