import api from '../lib/axios';
import { Sale, CreateSaleSchema, UpdateSaleStatusSchema } from '../types/api';

export const saleService = {
    getSales: async (params?: { page?: number; page_size?: number; status?: string }): Promise<Sale[]> => {
        const response = await api.get<Sale[]>('/sales', { params });
        return response.data;
    },

    createSale: async (data: CreateSaleSchema): Promise<Sale> => {
        const response = await api.post<Sale>('/sales', data);
        return response.data;
    },

    updateSaleStatus: async (id: string, data: UpdateSaleStatusSchema): Promise<Sale> => {
        const response = await api.patch<Sale>(`/sales/${id}/status`, data);
        return response.data;
    },
};
