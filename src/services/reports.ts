import api from '../lib/axios';
import { DashboardSummary, LowStockReport, ProductPerformanceReport } from '../types/api';

export const reportService = {
    getDashboardSummary: async (): Promise<DashboardSummary> => {
        const response = await api.get<DashboardSummary>('/dashboard/summary');
        return response.data;
    },

    getLowStockReport: async (): Promise<LowStockReport[]> => {
        const response = await api.get<LowStockReport[]>('/reports/low-stock');
        return response.data;
    },

    getProductReports: async (): Promise<ProductPerformanceReport[]> => {
        const response = await api.get<ProductPerformanceReport[]>('/reports/products');
        return response.data;
    },
};
