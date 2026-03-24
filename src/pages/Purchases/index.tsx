import { useEffect, useState } from 'react';
import { purchaseService } from '../../services/purchases';
import { productService } from '../../services/products';
import { settingsService } from '../../services/settings';
import { Purchase, Product, ExchangeRate, CreatePurchaseSchema } from '../../types/api';
import { 
    Plus, ShoppingBag, Truck, 
    Trash2, Save, X, Calendar, 
    TrendingUp, Percent, Package,
    FileText, Printer
} from 'lucide-react';
import { PurchaseDetail } from '../../services/purchases';


export default function Purchases() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState<PurchaseDetail | null>(null);

    // Form State
    const [selectedCurrency, setSelectedCurrency] = useState('BASE');
    const [shippingCost, setShippingCost] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [purchaseItems, setPurchaseItems] = useState<any[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pData, prodData, currData] = await Promise.all([
                    purchaseService.getPurchases(),
                    productService.getProducts(),
                    settingsService.getExchangeRates()
                ]);
                setPurchases(pData);
                setProducts(prodData);
                setCurrencies(currData);
            } catch (error) {
                console.error("Failed to fetch purchases data", error);
            }
        };
        fetchData();
    }, []);

    const handleAddProduct = () => {
        const prod = products.find(p => p.id === selectedProductId);
        if (!prod) return;

        if (purchaseItems.find(item => item.product_id === prod.id)) return;

        setPurchaseItems([...purchaseItems, {
            product_id: prod.id,
            product_name: prod.name,
            quantity: 1,
            buy_price: parseFloat(prod.cost_price || '0'),
            new_sale_price: parseFloat(prod.sale_price || '0'),
            new_commission_price: prod.commission_price ? parseFloat(prod.commission_price) : undefined,
            new_promotion_price: prod.promotion_price ? parseFloat(prod.promotion_price) : undefined
        }]);
        setSelectedProductId('');
    };

    const handleRemoveItem = (index: number) => {
        setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...purchaseItems];
        newItems[index][field] = value;
        setPurchaseItems(newItems);
    };

    const subtotal = purchaseItems.reduce((acc, item) => acc + (item.buy_price * item.quantity), 0);
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount + shippingCost;

    const handleSubmit = async () => {
        if (purchaseItems.length === 0) return;

        const payload: CreatePurchaseSchema = {
            items: purchaseItems.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                buy_price: item.buy_price.toString(),
                new_sale_price: item.new_sale_price?.toString(),
                new_commission_price: item.new_commission_price?.toString(),
                new_promotion_price: item.new_promotion_price?.toString()
            })),
            shipping_cost: shippingCost.toString(),
            tax_rate: taxRate.toString(),
            currency_code: selectedCurrency
        };

        try {
            const newPurchase = await purchaseService.createPurchase(payload);
            setIsCreateModalOpen(false);
            
            // Refresh list
            const updated = await purchaseService.getPurchases();
            setPurchases(updated);
            
            // Auto-print receipt
            if (newPurchase && newPurchase.id) {
                try {
                    const details = await purchaseService.getPurchaseDetails(newPurchase.id);
                    setSelectedPurchase(details);
                    // Wait for modal to render
                    setTimeout(() => {
                        window.print();
                        setSelectedPurchase(null);
                    }, 800);
                } catch (e) {
                    console.error("Auto-print failed", e);
                }
            }

            // Reset form
            setPurchaseItems([]);
            setShippingCost(0);
            setTaxRate(0);
        } catch (error) {
            alert("Failed to create purchase. Please check logs.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl shadow-blue-500/5">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600">
                        <ShoppingBag className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Purchase Inventory</h1>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manage supplier orders & buying price</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/25"
                >
                    <Plus className="w-5 h-5" />
                    New Purchase Order
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest italic">Date</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest italic">Items</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest italic">Total Amount</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest italic">Rate</th>
                                <th className="px-6 py-5 text-xs font-black text-gray-400 uppercase tracking-widest italic">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {purchases.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {new Date(p.created_at!).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-black rounded-full uppercase">Multiple Items</span>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-gray-900 dark:text-white tracking-widest">{Number(p.total_amount).toLocaleString()} {p.currency_code}</span>
                                            {p.currency_code !== 'BASE' && (
                                                <span className="text-[10px] text-gray-400 font-bold uppercase italic">Landed Cost Accounting</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-xs font-black text-emerald-500 uppercase tracking-tighter">
                                            <TrendingUp className="w-3.5 h-3.5" />
                                            {p.exchange_rate} {p.currency_code}/BASE
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const details = await purchaseService.getPurchaseDetails(p.id);
                                                    setSelectedPurchase(details);
                                                } catch (e) {
                                                    alert("Failed to load details");
                                                }
                                            }}
                                            className="text-blue-500 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest underline decoration-2 underline-offset-4"
                                        >
                                            View Bill
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* VIEW BILL MODAL */}
            {selectedPurchase && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setSelectedPurchase(null)}
                >
                    <div 
                        id="printable-receipt"
                        className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-[40px] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 no-print">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Purchase Summary</h2>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">ID: {selectedPurchase.purchase.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 no-print">
                                <button 
                                    onClick={() => window.print()}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                                    title="Print Bill"
                                >
                                    <Printer className="w-6 h-6 stroke-[3px]" />
                                </button>
                                <button 
                                    onClick={() => setSelectedPurchase(null)}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                    title="Close Modal"
                                >
                                    <X className="w-6 h-6 stroke-[3px]" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-gray-50/30 dark:bg-gray-900/40">
                            {/* Highlighted Summary Section */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1 p-6 bg-gradient-to-br from-blue-600 to-emerald-600 rounded-[32px] text-white shadow-xl shadow-blue-500/25 flex flex-col justify-between">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Total Paid</p>
                                    <div className="mt-2">
                                        <p className="text-3xl font-black tracking-tighter tabular-nums drop-shadow-md">{Number(selectedPurchase.purchase.total_amount).toLocaleString()}</p>
                                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedPurchase.purchase.currency_code}</p>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Exchange Rate</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-blue-500" />
                                        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums">{selectedPurchase.purchase.exchange_rate}</p>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic tracking-tighter">Rate to Base (USD)</p>
                                </div>
                                
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Shipping Fee</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums mt-2">{Number(selectedPurchase.purchase.shipping_cost || 0).toLocaleString()}</p>
                                    <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full mt-2 overflow-hidden">
                                        <div className="w-1/3 h-full bg-blue-500 rounded-full"></div>
                                    </div>
                                </div>
                                
                                <div className="p-6 bg-white dark:bg-gray-800 rounded-[32px] border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">Transaction Date</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xl font-black text-gray-900 dark:text-white italic tracking-tighter">
                                            {new Date(selectedPurchase.purchase.created_at!).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                                        </p>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase italic tracking-tighter">Recorded Archive</p>
                                </div>
                            </div>

                            <div className="rounded-[40px] border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800/80 p-2 overflow-hidden shadow-2xl shadow-gray-200/20">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Buy Price</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {selectedPurchase.items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.product_name}</span>
                                                        <span className="text-[10px] font-bold text-gray-400">{item.product_code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-black text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-700 dark:text-gray-300">{Number(item.buy_price).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-sm font-black text-blue-600">{Number(item.subtotal).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end no-print">
                            <button 
                                onClick={() => setSelectedPurchase(null)}
                                className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Close View
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE PURCHASE MODAL */}
            {isCreateModalOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setIsCreateModalOpen(false)}
                >
                    <div 
                        className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-[40px] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600">
                                    <Truck className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">New Purchase Order</h2>
                                    <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Update stock levels & buy prices</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsCreateModalOpen(false)}
                                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-90"
                                title="Close Modal"
                            >
                                <X className="w-6 h-6 stroke-[3px]" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Top Config */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Buying Currency</label>
                                    <select 
                                        value={selectedCurrency}
                                        onChange={(e) => setSelectedCurrency(e.target.value)}
                                        className="w-full h-14 bg-gray-50 dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500/50 rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none transition-all shadow-sm"
                                    >
                                        <option value="BASE">Base Currency (Local)</option>
                                        {currencies.map(c => (
                                            <option key={c.currency_code} value={c.currency_code}>{c.currency_code} ({c.rate_to_base})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Total Shipping Cost</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Truck className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="number" 
                                            value={shippingCost}
                                            onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                                            className="w-full h-14 bg-gray-50 dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500/50 rounded-2xl pl-14 pr-6 text-sm font-black text-gray-700 dark:text-gray-300 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic ml-1">Import Tax Rate (%)</label>
                                    <div className="relative">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400">
                                            <Percent className="w-4 h-4" />
                                        </div>
                                        <input 
                                            type="number" 
                                            value={taxRate}
                                            onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                            className="w-full h-14 bg-gray-50 dark:bg-gray-800/80 border-2 border-transparent focus:border-blue-500/50 rounded-2xl pl-14 pr-6 text-sm font-black text-gray-700 dark:text-gray-300 outline-none transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Item Selection */}
                            <div className="flex gap-4 p-6 bg-blue-500/5 dark:bg-blue-500/10 rounded-[32px] border border-blue-500/10">
                                <div className="flex-1">
                                    <select 
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        className="w-full h-14 bg-white dark:bg-gray-800 border-2 border-transparent focus:border-blue-500/50 rounded-2xl px-6 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none transition-all shadow-sm"
                                    >
                                        <option value="">Select Product to Add...</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <button 
                                    onClick={handleAddProduct}
                                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> ADD
                                </button>
                            </div>

                            {/* Items List */}
                            <div className="space-y-4">
                                {purchaseItems.map((item, index) => (
                                    <div key={item.product_id} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:border-blue-500/20">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-500">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <h4 className="font-black text-gray-900 dark:text-white uppercase tracking-tighter">{item.product_name}</h4>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-500 hover:text-red-600 p-2"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Qty</label>
                                                <input 
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    className="w-full h-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 text-sm font-black text-blue-600" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Buy Price ({selectedCurrency})</label>
                                                <input 
                                                    type="number"
                                                    value={item.buy_price}
                                                    onChange={(e) => handleItemChange(index, 'buy_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full h-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 text-sm font-black" 
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-emerald-500">New Sale Price (BASE)</label>
                                                <input 
                                                    type="number"
                                                    value={item.new_sale_price}
                                                    onChange={(e) => handleItemChange(index, 'new_sale_price', parseFloat(e.target.value) || 0)}
                                                    className="w-full h-12 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 text-sm font-black text-emerald-600" 
                                                />
                                            </div>
                                            <div className="flex items-end flex-col">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subtotal</p>
                                                <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{(item.buy_price * item.quantity).toLocaleString()} <span className="text-[10px] text-gray-400">{selectedCurrency}</span></p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Modal Footer (Highlighted Summary) */}
                        <div className="p-8 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-10 relative">
                            <div className="flex items-center gap-6 sm:gap-10 p-6 bg-gradient-to-r from-blue-50/50 to-emerald-50/50 dark:from-blue-900/10 dark:to-emerald-900/10 rounded-[28px] border border-blue-100 dark:border-blue-900/30 flex-1 w-full overflow-x-auto">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-1">Subtotal</span>
                                    <span className="text-xl font-bold text-gray-700 dark:text-gray-300 uppercase tracking-tighter tabular-nums">{subtotal.toLocaleString()} <span className="text-xs text-gray-400">{selectedCurrency}</span></span>
                                </div>
                                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Tax ({taxRate}%)</span>
                                    <span className="text-xl font-bold text-red-500/80 uppercase tracking-tighter tabular-nums">+{taxAmount.toLocaleString()} <span className="text-xs text-red-500/50">{selectedCurrency}</span></span>
                                </div>
                                <div className="w-px h-10 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
                                <div className="flex flex-col flex-1 text-right">
                                    <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.2em] mb-1">Grand Total</span>
                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400 uppercase tracking-tighter tabular-nums drop-shadow-sm leading-none">
                                        {totalAmount.toLocaleString()} <span className="text-xs font-bold opacity-70 tracking-widest ml-1">{selectedCurrency}</span>
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={handleSubmit}
                                className="w-full sm:w-auto px-10 py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl shadow-gray-900/20 dark:shadow-white/20 active:scale-95 shrink-0"
                            >
                                <Save className="w-5 h-5" />
                                Process Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
