import api from '../lib/axios';
import { Quotation, CreateQuotationSchema, UpdateQuotationStatusSchema } from '../types/api';

export const quotationService = {
    getQuotations: async (): Promise<Quotation[]> => {
        const response = await api.get<Quotation[]>('/quotations');
        return response.data;
    },

    createQuotation: async (data: CreateQuotationSchema): Promise<Quotation> => {
        const response = await api.post<Quotation>('/quotations', data);
        return response.data;
    },

    convertToSale: async (id: string): Promise<void> => {
        await api.post(`/quotations/${id}/convert`);
    },

    updateQuotationStatus: async (id: string, data: UpdateQuotationStatusSchema): Promise<Quotation> => {
        const response = await api.patch<Quotation>(`/quotations/${id}/status`, data);
        return response.data;
    },
};
