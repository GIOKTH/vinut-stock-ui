import { apiInstance as api } from '../lib/axios';
import { Purchase, CreatePurchaseSchema, PurchaseItem } from '../types/api';

export interface PurchaseDetail {
    purchase: Purchase;
    items: (PurchaseItem & { product_name: string, product_code: string })[];
}

export const purchaseService = {
    getPurchases: async (): Promise<Purchase[]> => {
        const response = await api.get('/purchases');
        return response.data;
    },

    getPurchaseDetails: async (id: string): Promise<PurchaseDetail> => {
        const response = await api.get(`/purchases/${id}`);
        return response.data;
    },

    createPurchase: async (data: CreatePurchaseSchema): Promise<Purchase> => {
        const response = await api.post('/purchases', data);
        return response.data;
    }
};
