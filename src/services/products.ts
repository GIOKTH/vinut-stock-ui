import api from '../lib/axios';
import { Product, CreateProductSchema, UpdateProductStatusSchema, UpdateProductSchema } from '../types/api';

export const productService = {
    getProducts: async (): Promise<Product[]> => {
        const response = await api.get<Product[]>('/products');
        return response.data;
    },

    getProduct: async (id: string): Promise<Product> => {
        const response = await api.get<Product>(`/products/${id}`);
        return response.data;
    },

    createProduct: async (data: CreateProductSchema): Promise<Product> => {
        const response = await api.post<Product>('/products', data);
        return response.data;
    },

    updateProductStatus: async (id: string, data: UpdateProductStatusSchema): Promise<Product> => {
        const response = await api.patch<Product>(`/products/${id}/status`, data);
        return response.data;
    },

    updateProduct: async (id: string, data: UpdateProductSchema): Promise<Product> => {
        const response = await api.patch<Product>(`/products/${id}`, data);
        return response.data;
    },

    getProductPurchases: async (id: string): Promise<void> => {
        await api.get(`/products/${id}/purchases`);
    },
};
