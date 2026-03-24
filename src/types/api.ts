export interface ChangeRoleSchema {
    role: string;
}

export interface CreateProductSchema {
    code: string;
    commission_price?: string | null;
    image?: string | null;
    is_active?: boolean | null;
    low_stock_threshold?: number | null;
    name: string;
    promotion_price?: string | null;
    quantity: number;
    sale_price: string;
}

export interface UpdateProductSchema {
    code?: string | null;
    commission_price?: string | null;
    image?: string | null;
    is_active?: boolean | null;
    low_stock_threshold?: number | null;
    name?: string | null;
    promotion_price?: string | null;
    quantity?: number | null;
    sale_price?: string | null;
}

export interface CreatePurchaseItemSchema {
    buy_price: string;
    new_commission_price?: string | null;
    new_promotion_price?: string | null;
    new_sale_price?: string | null;
    product_id: string;
    quantity: number;
}

export interface CreatePurchaseSchema {
    currency_code?: string | null;
    items: CreatePurchaseItemSchema[];
    margin_price?: string | null;
    shipping_cost?: string | null;
    supplier_id?: string | null;
    tax_rate?: string | null;
}

export interface CreateQuotationItemSchema {
    product_id: string;
    quantity: number;
}

export interface CreateQuotationSchema {
    currency_code?: string | null;
    discount_amount?: string | null;
    items: CreateQuotationItemSchema[];
    partner_name?: string | null;
    status?: string | null;
    tax_rate?: string | null;
}

export interface CreateSaleItemSchema {
    product_id: string;
    quantity: number;
}

export interface CreateSaleSchema {
    currency_code?: string | null;
    items: CreateSaleItemSchema[];
    payment_method?: string | null;
    promotion_code?: string | null;
    payment_amount?: number | null;
    payment_currency?: string | null;
    status?: string | null;
}

export interface CreateUserSchema {
    password?: string;
    role: string;
    username: string;
}

export interface ExchangeRate {
    currency_code: string;
    rate_to_base: string;
    updated_at?: string | null;
}

export interface LoginSchema {
    password?: string;
    username: string;
}

export interface Product {
    code: string;
    commission_price?: string | null;
    cost_price?: string | null;
    created_at?: string | null;
    id: string;
    image?: string | null;
    is_active?: boolean | null;
    low_stock_threshold?: number | null;
    name: string;
    promotion_price?: string | null;
    quantity: number;
    sale_price: string;
    updated_at?: string | null;
}

export interface Purchase {
    created_at?: string | null;
    currency_code: string;
    exchange_rate: string;
    id: string;
    shipping_cost?: string | null;
    supplier_id?: string | null;
    tax_rate?: string | null;
    total_amount: string;
}

export interface PurchaseItem {
    buy_price: string;
    id: string;
    product_id?: string | null;
    purchase_id?: string | null;
    quantity: number;
    subtotal: string;
}

export interface Quotation {
    created_at?: string | null;
    currency_code: string;
    discount_amount: string;
    exchange_rate: string;
    id: string;
    partner_name?: string | null;
    status?: string | null;
    tax_rate: string;
    total_amount: string;
    updated_at?: string | null;
    user_id?: string | null;
}

export interface QuotationItem {
    id: string;
    product_id?: string | null;
    quantity: number;
    quotation_id?: string | null;
    subtotal: string;
    unit_price: string;
}

export interface Sale {
    created_at?: string | null;
    currency_code?: string | null;
    discount_amount?: string | null;
    exchange_rate?: string | null;
    id: string;
    payment_method?: string | null;
    promotion_code?: string | null;
    status?: string | null;
    total_amount: string;
    user_id?: string | null;
    payment_amount?: string | null;
    payment_currency?: string | null;
    username?: string | null;
}

export interface SaleItemResponse {
    id: string;
    sale_id: string;
    product_id?: string | null;
    product_name?: string | null;
    product_code?: string | null;
    quantity: number;
    subtotal: string;
    unit_price: string;
}

export interface SaleDetailResponse {
    items: SaleItemResponse[];
    sale: Sale;
}

export interface UpdateExchangeRateSchema {
    rate_to_base: string;
}

export interface UpdateProductStatusSchema {
    is_active: boolean;
}

export interface UpdateQuotationStatusSchema {
    status: string;
}

export interface UpdateSaleStatusSchema {
    status: string;
}

export interface User {
    created_at?: string | null;
    id: string;
    is_blocked?: boolean | null;
    role: string;
    updated_at?: string | null;
    username: string;
}

export interface UserResponse {
    id: string;
    is_blocked?: boolean | null;
    role: string;
    username: string;
    has_sales?: boolean | null;
}

export interface DashboardSummary {
    daily_sales_total: number | null;
    daily_profit_total: number | null;
    best_selling_product: string | null;
    low_stock_count: number | null;
    top_5_best_sellers: {
        name: string;
        quantity: number | null;
    }[];
    summary_by_currency: {
        currency: string;
        total_sales: number | null;
        total_profit: number | null;
    }[];
    low_stock_details: {
        name: string;
        quantity: number;
        threshold: number;
    }[];
    exchange_rates: {
        currency: string;
        rate: string;
    }[];
}

export interface ProductPerformanceReport {
    product: string;
    total_sold: number;
    total_revenue: number | null;
    total_profit: number | null;
    current_stock: number;
    is_low_stock: boolean;
    is_active: boolean | null;
}

export interface LowStockReport {
    name: string;
    code: string;
    quantity: number;
    low_stock_threshold: number;
}
