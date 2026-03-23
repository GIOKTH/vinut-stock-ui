import React, { useState, useEffect, useRef } from 'react';
import {
    Plus,
    Search,
    Filter,
    ShoppingBag,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    Loader2,
    Calendar,
    ClipboardList as ClipboardListIcon,
    CreditCard,
    ScanLine,
    History,
    ShoppingCart,
    User,
    X,
    Printer,
    Download,
    Banknote,
    Barcode,
    TableProperties as TablePropertiesIcon
} from 'lucide-react';
import { saleService } from '../../services/sales';
import { productService } from '../../services/products';
import { settingsService } from '../../services/settings';
import { Sale, Product, ExchangeRate, SaleDetailResponse } from '../../types/api';

const Sales: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'POS' | 'HISTORY'>('POS');
    const [sales, setSales] = useState<Sale[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [currencies, setCurrencies] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

    // POS State
    const [saving, setSaving] = useState(false);
    const [scanInput, setScanInput] = useState('');
    const scannerInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus scanner on tab switch
    useEffect(() => {
        if (activeTab === 'POS') {
            setTimeout(() => scannerInputRef.current?.focus(), 100);
        }
    }, [activeTab]);
    const [saleForm, setSaleForm] = useState({
        items: [{ product_id: '', quantity: 1 }],
        payment_method: 'CASH',
        currency_code: 'BASE',
        payment_amount: '0.00',
        payment_currency: 'USD'
    });

    // Receipt State
    const [selectedSale, setSelectedSale] = useState<SaleDetailResponse | null>(null);
    const [loadingReceipt, setLoadingReceipt] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

    // Moved calculations above useEffect to fix declaration order lint
    const estimatedTotal = saleForm.items.reduce((acc, item) => {
        const product = products.find(p => p.id === item.product_id);
        const price = product ? (typeof product.sale_price === 'string' ? parseFloat(product.sale_price) : product.sale_price) : 0;
        return acc + (price * item.quantity);
    }, 0);

    const getConvertedTotal = (total: number, currencyCode: string) => {
        if (currencyCode === 'BASE' || currencyCode === 'USD') return total;
        const rate = currencies.find(c => c.currency_code === currencyCode)?.rate_to_base || '1';
        return total * parseFloat(rate);
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const [salesData, productsData, exchangeRates] = await Promise.all([
                saleService.getSales(),
                productService.getProducts(),
                settingsService.getExchangeRates()
            ]);
            setSales(salesData);
            setProducts(productsData.filter(p => p.is_active !== false));
            setCurrencies(exchangeRates);
        } catch (err) {
            console.error('Failed to fetch data', err);
            showNotification('error', 'Failed to load system defaults.');
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    useEffect(() => {
        fetchData();

        // Keyboard Shortcuts
        const handleKeyPress = (e: KeyboardEvent) => {
            // Tab switching
            if (e.altKey && e.key === '1') setActiveTab('POS');
            if (e.altKey && e.key === '2') setActiveTab('HISTORY');
            
            // POS Actions (Only if POS tab is active)
            if (activeTab === 'POS') {
                // Alt + N: New Item / Add Entry
                if (e.altKey && e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    addSaleItem();
                }
                // Alt + F or Alt + K: Focus Scanner
                if (e.altKey && (e.key.toLowerCase() === 'f' || e.key.toLowerCase() === 'k')) {
                    e.preventDefault();
                    scannerInputRef.current?.focus();
                }
                // Alt + Enter: Complete Sale
                if (e.altKey && e.key === 'Enter') {
                    e.preventDefault();
                    // Manually trigger form submit or call handler
                    if (estimatedTotal > 0 && !saving) {
                        const submitBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
                        submitBtn?.click();
                    }
                }
                // Alt + C: Cash, Alt + B: Bank, Alt + Q: QR
                if (e.altKey && e.key.toLowerCase() === 'c') setSaleForm(prev => ({ ...prev, payment_method: 'CASH' }));
                if (e.altKey && e.key.toLowerCase() === 'b') setSaleForm(prev => ({ ...prev, payment_method: 'BANK_TRANSFER' }));
                if (e.altKey && e.key.toLowerCase() === 'q') setSaleForm(prev => ({ ...prev, payment_method: 'QR_PAY' }));
            }

            if (e.key === 'Escape') {
                setShowReceipt(false);
                if (activeTab === 'POS') scannerInputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [activeTab, estimatedTotal, saving]); // Added dependencies for shortcuts to work with latest state

    // Auto-update payment amount when total or currency changes
    useEffect(() => {
        const totalInTarget = getConvertedTotal(estimatedTotal, saleForm.payment_currency);
        setSaleForm(prev => ({ ...prev, payment_amount: totalInTarget.toFixed(2) }));
    }, [estimatedTotal, saleForm.payment_currency]);

    const handleCreateSale = async (e: React.FormEvent) => {
        e.preventDefault();

        if (saleForm.items.some(item => !item.product_id || item.quantity <= 0)) {
            showNotification('warning', 'Please select products and enter valid quantities.');
            return;
        }

        setSaving(true);
        try {
            const newSale = await saleService.createSale({
                items: saleForm.items.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity
                })),
                payment_method: saleForm.payment_method,
                currency_code: saleForm.currency_code,
                payment_amount: parseFloat(saleForm.payment_amount) || 0,
                payment_currency: saleForm.payment_currency,
                status: 'COMPLETED'
            });

            fetchData();

            // Auto-print receipt
            if (newSale && newSale.id) {
                await handleViewReceipt(newSale.id);
                // Wait for modal to render content
                setTimeout(() => {
                    window.print();
                }, 800);
            }

            setSaleForm({
                items: [{ product_id: '', quantity: 1 }],
                payment_method: 'CASH',
                currency_code: 'BASE',
                payment_amount: '0.00',
                payment_currency: 'USD'
            });
            showNotification('success', 'Sale recorded and stock updated.');
        } catch (err: any) {
            console.error('Failed to create sale', err);
            const errorMsg = err.response?.data?.error || 'Failed to record sale. Check stock levels.';
            showNotification('error', errorMsg);
        } finally {
            setSaving(false);
        }
    };

    const handleViewReceipt = async (id: string) => {
        setLoadingReceipt(true);
        setShowReceipt(true);
        try {
            const detail = await saleService.getSaleDetail(id);
            setSelectedSale(detail);
        } catch (err) {
            console.error('Failed to fetch sale detail', err);
            showNotification('error', 'Failed to load receipt details.');
            setShowReceipt(false);
        } finally {
            setLoadingReceipt(false);
        }
    };

    const handleScanProduct = (e: React.FormEvent) => {
        e.preventDefault();
        const code = scanInput.trim();
        if (!code) return;

        const product = products.find(p => p.code.toLowerCase() === code.toLowerCase());
        if (product) {
            const existingItemIndex = saleForm.items.findIndex(item => item.product_id === product.id);
            if (existingItemIndex > -1) {
                const newItems = [...saleForm.items];
                newItems[existingItemIndex].quantity += 1;
                // Move existing item to top if scanned again? 
                // Let's keep it in place for now but if they want "latest on top", 
                // we could also move it. For now, just follow the "new item on top" rule.
                setSaleForm({ ...saleForm, items: newItems });
            } else {
                if (saleForm.items.length === 1 && !saleForm.items[0].product_id) {
                    setSaleForm({ ...saleForm, items: [{ product_id: product.id, quantity: 1 }] });
                } else {
                    setSaleForm({ ...saleForm, items: [{ product_id: product.id, quantity: 1 }, ...saleForm.items] });
                    triggerHighlight(0);
                }
            }
            setScanInput('');
            showNotification('success', `Added ${product.name}`);
            // Always focus back to scanner
            setTimeout(() => scannerInputRef.current?.focus(), 0);
        } else {
            showNotification('warning', `Product code "${code}" not found.`);
            setScanInput('');
            setTimeout(() => scannerInputRef.current?.focus(), 0);
        }
    };

    const addSaleItem = () => {
        setSaleForm({
            ...saleForm,
            items: [{ product_id: '', quantity: 1 }, ...saleForm.items]
        });
        triggerHighlight(0);
    };

    const triggerHighlight = (index: number) => {
        setHighlightedIndex(index);
        setTimeout(() => setHighlightedIndex(null), 2000);
    };

    const removeSaleItem = (index: number) => {
        if (saleForm.items.length <= 1) return;
        const newItems = [...saleForm.items];
        newItems.splice(index, 1);
        setSaleForm({ ...saleForm, items: newItems });
    };

    const updateSaleItem = (index: number, field: string, value: any) => {
        const newItems = [...saleForm.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setSaleForm({ ...saleForm, items: newItems });
        
        // If selecting a product manually, focus back to scanner for next item
        if (field === 'product_id' && value) {
            setTimeout(() => scannerInputRef.current?.focus(), 100);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/20';
            case 'PENDING': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20';
            default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toUpperCase()) {
            case 'COMPLETED': return <CheckCircle2 className="w-3.5 h-3.5" />;
            case 'PENDING': return <Clock className="w-3.5 h-3.5" />;
            case 'CANCELLED': return <XCircle className="w-3.5 h-3.5" />;
            default: return <AlertCircle className="w-3.5 h-3.5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header section with Tabs */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-1 px-1 transition-colors duration-300">
                <div className="flex-1 w-full">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4 tracking-tight uppercase">
                        <ShoppingBag className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
                        Sales
                    </h1>

                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('POS')}
                            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-t-xl transition-all font-bold text-xs md:text-sm border-b-2 whitespace-nowrap ${activeTab === 'POS'
                                ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 border-blue-500'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 border-transparent'
                                }`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            POS
                            <span className="ml-2 px-1 py-0.5 text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700 font-black">ALT+1</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('HISTORY')}
                            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-t-xl transition-all font-bold text-xs md:text-sm border-b-2 whitespace-nowrap ${activeTab === 'HISTORY'
                                ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-600/10 dark:text-blue-400 border-blue-500'
                                : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 border-transparent'
                                }`}
                        >
                            <History className="w-4 h-4" />
                            History
                            <span className="ml-2 px-1 py-0.5 text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700 font-black">ALT+2</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification */}
            {notification && (
                <div className={`flex items-center gap-3 p-4 rounded-xl border animate-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                    notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                        'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                        notification.type === 'error' ? <XCircle className="w-5 h-5" /> :
                            <AlertCircle className="w-5 h-5" />}
                    <p className="text-sm font-medium">{notification.message}</p>
                </div>
            )}

            {/* POS Tab Content */}
            {activeTab === 'POS' ? (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm overflow-hidden transition-colors duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-blue-500" />
                                    Items Selection
                                </h3>
                                <button
                                    onClick={addSaleItem}
                                    className="px-4 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm active:scale-95"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Entry
                                    <span className="ml-1 px-1.5 py-0.5 text-[8px] bg-blue-500/10 text-blue-500 rounded border border-blue-500/20 font-black">ALT+N</span>
                                </button>
                            </div>

                            <div className="space-y-4 max-h-[50vh] xl:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {saleForm.items.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 bg-gray-50/50 dark:bg-gray-950/40 p-4 rounded-xl border group transition-all duration-500 ${highlightedIndex === index
                                            ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.1)] dark:shadow-[0_0_15px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/50 scale-[1.01] bg-blue-50 dark:bg-blue-500/5'
                                            : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="w-full md:flex-1">
                                            <select
                                                value={item.product_id}
                                                onChange={e => updateSaleItem(index, 'product_id', e.target.value)}
                                                className="w-full bg-transparent text-gray-900 dark:text-white focus:outline-none text-base md:text-lg font-bold cursor-pointer"
                                                required
                                            >
                                                <option value="" className="bg-white dark:bg-gray-900 text-gray-400">Select product...</option>
                                                {products.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-white dark:bg-gray-900">
                                                        {p.name} (${p.sale_price})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="w-full md:w-auto flex items-center justify-between gap-4">
                                            <div className="flex-1 md:w-32 flex items-center bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-2 transition-colors duration-300">
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={e => updateSaleItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                    className="w-full bg-transparent py-2 text-center text-gray-900 dark:text-white focus:outline-none font-bold"
                                                    required
                                                />
                                            </div>
                                            <div className="w-24 md:w-32 text-right">
                                                <p className="text-gray-900 dark:text-white font-black">
                                                    ${((products.find(p => p.id === item.product_id)?.sale_price || 0) as number * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeSaleItem(index)}
                                                className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all md:opacity-0 group-hover:opacity-100"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Transaction Summary & Checkout */}
                        <div className="bg-white dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl sticky top-6 transition-colors duration-300">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-4">Checkout Summary</h3>

                            <form onSubmit={handleCreateSale} className="space-y-6">
                                {/* Scanner Input */}
                                <div className="bg-blue-500/10 dark:bg-blue-600/5 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4 flex items-center gap-3 transition-colors duration-300">
                                    <ScanLine className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                                    <input
                                        ref={scannerInputRef}
                                        type="text"
                                        placeholder="Scan Product..."
                                        value={scanInput}
                                        autoFocus
                                        onChange={e => setScanInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleScanProduct(e); }}
                                        className="w-full bg-transparent border-none p-0 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:outline-none text-sm font-bold"
                                        title="Alt + F to focus"
                                    />
                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 dark:bg-gray-900/50 rounded border border-gray-200 dark:border-gray-700 group relative">
                                        <Barcode className="w-3 h-3 text-yellow-500" />
                                        <span className="text-[9px] font-black text-gray-500 dark:text-gray-400 tracking-tighter">BARCODE</span>
                                        <span className="ml-1 px-1 py-0.5 text-[7px] bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-700 font-black">ALT+F</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest leading-none">Payment Currency</label>
                                        <select
                                            value={saleForm.payment_currency}
                                            onChange={e => setSaleForm({ ...saleForm, payment_currency: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-blue-500/30 rounded-xl px-4 py-3 text-blue-600 dark:text-blue-400 focus:outline-none text-sm font-bold shadow-[0_0_15px_rgba(59,130,246,0.05)] dark:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-colors duration-300"
                                        >
                                            {currencies.map(c => (
                                                <option key={c.currency_code} value={c.currency_code} className="bg-white dark:bg-gray-900">{c.currency_code}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase mb-2 tracking-widest leading-none">Payment Method</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {['CASH', 'BANK_TRANSFER', 'QR_PAY'].map(method => (
                                                <button
                                                    key={method}
                                                    type="button"
                                                    onClick={() => setSaleForm({ ...saleForm, payment_method: method })}
                                                    className={`px-3 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-between gap-1 ${saleForm.payment_method === method
                                                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600'
                                                        }`}
                                                >
                                                    <span>{method.replace('_', ' ')}</span>
                                                    <span className={`px-1 py-0.5 text-[7px] rounded border font-black ${saleForm.payment_method === method ? 'bg-white/20 border-white/30 text-white' : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}`}>
                                                        ALT+{method[0]}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                </div>

                                <div className="hidden xl:block pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3 transition-colors duration-300">
                                    <div className="flex justify-between items-center text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                                        <span className="text-sm font-medium">Total Price (USD)</span>
                                        <p className="text-sm font-black text-gray-900 dark:text-white">${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    </div>

                                    {saleForm.currency_code !== 'BASE' && (
                                        <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                                            <span>Exchange Rate</span>
                                            <span>1 USD = {currencies.find(c => c.currency_code === saleForm.currency_code)?.rate_to_base || '0'} {saleForm.currency_code}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-gray-400 dark:text-gray-500 py-3 border-t border-gray-50 dark:border-gray-800/50">
                                        <span className="text-sm font-medium italic">Subtotal ({saleForm.payment_currency === 'BASE' ? 'USD' : saleForm.payment_currency})</span>
                                        <span className="text-xl font-black text-blue-600 dark:text-blue-500">
                                            {parseFloat(saleForm.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {saleForm.payment_currency === 'BASE' ? 'USD' : saleForm.payment_currency}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-4 px-2 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 transition-colors duration-300">
                                        <div className="flex flex-col">
                                            <span className="text-xl font-black text-gray-900 dark:text-white">Grand Total</span>
                                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest leading-none mt-1">
                                                {saleForm.payment_currency === 'BASE' ? 'Recieved USD' : `${saleForm.payment_currency} Payment`}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-black text-blue-600 dark:text-blue-500 leading-none">
                                                {parseFloat(saleForm.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {saleForm.payment_currency === 'BASE' ? 'USD' : saleForm.payment_currency}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving || estimatedTotal === 0}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl transition-all font-black text-lg disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/30 active:scale-[0.98] mt-4 uppercase tracking-[0.2em]"
                                        title="Alt + S or Ctrl + Enter"
                                    >
                                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <CreditCard className="w-6 h-6" />}
                                        <div className="flex items-center gap-2">
                                            {saving ? 'Processing...' : 'Complete Sale'}
                                            {!saving && <span className="ml-2 px-2 py-0.5 text-[10px] bg-white/20 border border-white/30 rounded font-black lowercase tracking-normal">alt+enter</span>}
                                        </div>
                                    </button>
                                </div>

                                {/* Mobile Sticky Bottom Bar */}
                                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 xl:hidden z-50 flex items-center justify-between gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] transition-colors duration-300">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Grand Total</span>
                                        <p className="text-lg font-black text-blue-600 dark:text-blue-500">
                                            {parseFloat(saleForm.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {saleForm.payment_currency === 'BASE' ? 'USD' : saleForm.payment_currency}
                                        </p>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic leading-none">Subtotal</span>
                                        <p className="text-[10px] font-black text-gray-500">
                                            ${estimatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                                        </p>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={saving || estimatedTotal === 0}
                                        className="flex-1 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 active:from-blue-700 active:to-blue-800 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/25 active:scale-95"
                                    >
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                        COMPLETE
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            ) : (
                /* History Tab Content */
                <div className="space-y-6 animate-in fade-in duration-500 slide-in-from-bottom-4">
                    <div className="bg-gray-800/40 border border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search transactions, usernames..."
                                    className="w-full bg-gray-950/50 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Calendar className="w-4 h-4" />
                                <span>Recent 30 Days</span>
                                <Filter className="w-4 h-4 ml-2 cursor-pointer hover:text-white" />
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                        <th className="px-6 py-4 border-b border-gray-700">Date & Time</th>
                                        <th className="px-6 py-4 border-b border-gray-700">User / Cashier</th>
                                        <th className="px-6 py-4 border-b border-gray-700 text-center">Totals</th>
                                        <th className="px-6 py-4 border-b border-gray-700">Actual Payment</th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">Status</th>
                                        <th className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><p>Loading history...</p></div>
                                            </td>
                                        </tr>
                                    ) : sales.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center gap-2 opacity-50"><ShoppingBag className="w-12 h-12" /><p>No sales history found.</p></div>
                                            </td>
                                        </tr>
                                    ) : (
                                        sales.map((sale) => (
                                            <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    {sale.created_at ? new Date(sale.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                                                            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{sale.username || 'System Admin'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex flex-col items-center border-r border-gray-100 dark:border-gray-800 pr-4">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-sm font-black text-gray-900 dark:text-white">${parseFloat(sale.total_amount).toLocaleString()}</span>
                                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">USD</span>
                                                        </div>
                                                        {sale.currency_code !== 'BASE' && (
                                                            <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                                                                <span className="text-[10px] font-bold text-gray-400">
                                                                    {(parseFloat(sale.total_amount) * parseFloat(sale.exchange_rate || '1')).toLocaleString()} {sale.currency_code}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {sale.payment_amount ? (
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <Banknote className="w-3 h-3 text-green-500" />
                                                                <span className="text-sm font-black text-green-400">
                                                                    {parseFloat(sale.payment_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sale.payment_currency === 'BASE' ? 'USD' : sale.payment_currency}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter mt-1">{sale.payment_method?.replace('_', ' ')}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-600 italic">No record</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(sale.status || 'PENDING')}`}>
                                                        {getStatusIcon(sale.status || 'PENDING')}
                                                        {sale.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <button
                                                        onClick={() => handleViewReceipt(sale.id)}
                                                        className="p-2 text-blue-600 dark:text-blue-400 border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 hover:bg-blue-500/5 dark:hover:bg-blue-600/10 rounded-lg transition-all"
                                                    >
                                                        <TablePropertiesIcon className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile History Cards */}
                        <div className="md:hidden divide-y divide-gray-800">
                            {loading ? (
                                <div className="p-12 text-center text-gray-500">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                                    Loading history...
                                </div>
                            ) : sales.length === 0 ? (
                                <div className="p-12 text-center text-gray-500 opacity-50">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-2" />
                                    No sales history.
                                </div>
                            ) : (
                                sales.map((sale) => (
                                    <div key={sale.id} className="p-4 bg-white dark:bg-gray-900/40 space-y-4 transition-colors duration-300">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mb-1">
                                                    {sale.created_at ? new Date(sale.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{sale.username || 'System Admin'}</span>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter border ${getStatusStyle(sale.status || 'PENDING')}`}>
                                                {sale.status || 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-950/60 p-3 rounded-xl border border-gray-100 dark:border-gray-800 transition-colors duration-300">
                                            <div className="text-center flex-1 border-r border-gray-100 dark:border-gray-800">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Grand Total</p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">${parseFloat(sale.total_amount).toLocaleString()}</p>
                                            </div>
                                            <div className="text-center flex-1">
                                                <p className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Actually Paid</p>
                                                <p className="text-sm font-black text-green-600 dark:text-green-400">
                                                    {parseFloat(sale.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {sale.payment_currency === 'BASE' ? 'USD' : sale.payment_currency}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleViewReceipt(sale.id)}
                                            className="w-full py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 border border-gray-100 dark:border-gray-700 transition-all"
                                        >
                                            <ClipboardListIcon className="w-3.5 h-3.5" />
                                            View Full Receipt
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Modal */}
            {showReceipt && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 transition-colors duration-300" id="printable-receipt">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-gray-800 no-print">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <ClipboardListIcon className="w-6 h-6 text-blue-500" />
                                Digital Receipt
                            </h3>
                            <button
                                onClick={() => setShowReceipt(false)}
                                className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-all"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body (Receipt Content) */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {loadingReceipt ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                                    <p className="text-gray-400 font-medium">Fetching transaction details...</p>
                                </div>
                            ) : selectedSale ? (
                                <div className="space-y-8">
                                    {/* Store Header */}
                                    <div className="text-center space-y-2">
                                        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-widest uppercase">Mao Gao Stocks</h2>
                                        <p className="text-gray-400 dark:text-gray-500 text-xs font-bold uppercase tracking-tighter">Premium Inventory Management System</p>
                                        <div className="flex items-center justify-center gap-4 pt-4 text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">
                                            <span># {selectedSale.sale.id.slice(0, 13).toUpperCase()}</span>
                                            <span>•</span>
                                            <span>{selectedSale.sale.created_at ? new Date(selectedSale.sale.created_at).toLocaleString() : 'N/A'}</span>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="space-y-4 pt-4">
                                        <div className="grid grid-cols-4 text-[10px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-widest pb-2 border-b border-gray-100 dark:border-gray-800">
                                            <div className="col-span-2">Description</div>
                                            <div className="text-center">Qty</div>
                                            <div className="text-right">Price</div>
                                        </div>
                                        <div className="space-y-4">
                                            {selectedSale.items.map((item, idx) => (
                                                <div key={idx} className="grid grid-cols-4 items-start gap-4">
                                                    <div className="col-span-2 space-y-1">
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.product_name}</p>
                                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{item.product_code}</p>
                                                    </div>
                                                    <div className="text-center text-sm font-black text-gray-400">×{item.quantity}</div>
                                                    <div className="text-right text-sm font-black text-gray-900 dark:text-white">${parseFloat(item.subtotal).toLocaleString()}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summation */}
                                    <div className="pt-8 border-t border-gray-100 dark:border-gray-800 space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-gray-500 dark:text-gray-400">
                                                <span className="text-xs font-bold uppercase tracking-wider">Total Price (USD)</span>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">${parseFloat(selectedSale.sale.total_amount).toLocaleString()}</span>
                                            </div>
                                            {selectedSale.sale.currency_code !== 'BASE' && (
                                                <div className="flex justify-between items-center text-[10px] text-gray-400 dark:text-gray-600 font-bold uppercase tracking-widest leading-none">
                                                    <span>Subtotal ({selectedSale.sale.currency_code})</span>
                                                    <span>{(parseFloat(selectedSale.sale.total_amount) * parseFloat(selectedSale.sale.exchange_rate || '1')).toLocaleString()} {selectedSale.sale.currency_code}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-green-50 dark:bg-green-500/5 rounded-2xl p-5 border border-green-100 dark:border-green-500/10 space-y-3 transition-colors duration-300">
                                            <div className="flex justify-between items-center text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">
                                                <span>Actual Payment Received</span>
                                                <span>{selectedSale.sale.payment_method?.replace('_', ' ')}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1">
                                                <span className="text-sm text-gray-500 dark:text-gray-400 font-bold">Paid in {selectedSale.sale.payment_currency === 'BASE' ? 'USD' : selectedSale.sale.payment_currency}</span>
                                                <span className="text-2xl font-black text-green-600 dark:text-green-400">
                                                    {parseFloat(selectedSale.sale.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedSale.sale.payment_currency === 'BASE' ? 'USD' : selectedSale.sale.payment_currency}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-2">
                                            <div className="flex flex-col">
                                                <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Grand Total</span>
                                                <div className="flex items-center gap-2 mt-0.5 opacity-50">
                                                    <CreditCard className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                                                    <span className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Base Record USD</span>
                                                </div>
                                            </div>
                                            <span className="text-lg font-black text-blue-600 dark:text-blue-500">
                                                {parseFloat(selectedSale.sale.payment_amount || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedSale.sale.payment_currency === 'BASE' ? 'USD' : selectedSale.sale.payment_currency}
                                            </span>
                                        </div>
                                    </div>

                                </div>
                            ) : null}
                        </div>

                        {/* Modal Footer Controls */}
                        <div className="p-6 bg-gray-50 dark:bg-gray-950/50 border-t border-gray-100 dark:border-gray-800 flex gap-4 no-print transition-colors duration-300">
                            <button
                                className="flex-1 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 shadow-sm"
                                onClick={() => window.print()}
                            >
                                <Printer className="w-4 h-4" />
                                Print Receipt
                            </button>
                            <button className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95">
                                <Download className="w-4 h-4" />
                                Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sales;
