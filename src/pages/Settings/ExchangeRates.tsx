import { useEffect, useState } from 'react';
import { ExchangeRate } from '../../types/api';
import { settingsService } from '../../services/settings';
import { Coins, RefreshCw, Save, TrendingUp, AlertCircle } from 'lucide-react';

interface ExchangeRatesProps {
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export default function ExchangeRates({ showNotification }: ExchangeRatesProps) {
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [editRates, setEditRates] = useState<Record<string, string>>({});

    const fetchRates = async () => {
        try {
            const data = await settingsService.getExchangeRates();
            setRates(data);
            const initialEditRates: Record<string, string> = {};
            data.forEach(rate => {
                initialEditRates[rate.currency_code] = rate.rate_to_base.toString();
            });
            setEditRates(initialEditRates);
        } catch (err) {
            console.error('Failed to fetch rates', err);
            showNotification('error', 'Failed to load exchange rates.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const handleSaveRate = async (currencyCode: string) => {
        const newRate = editRates[currencyCode];
        if (!newRate || isNaN(parseFloat(newRate))) {
            showNotification('error', 'Invalid rate value.');
            return;
        }

        setSaving(currencyCode);
        try {
            await settingsService.updateExchangeRate(currencyCode, {
                rate_to_base: parseFloat(newRate).toString()
            });
            showNotification('success', `Exchange rate for ${currencyCode} updated.`);
            await fetchRates();
        } catch (err) {
            console.error('Failed to update rate', err);
            showNotification('error', 'Failed to update exchange rate.');
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-300">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <Coins className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold dark:text-white uppercase tracking-wider">Exchange Rates</h3>
                </div>
                <button 
                    onClick={fetchRates}
                    className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
            
            <div className="p-6">
                <div className="mb-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Specify rates relative to your **Base Currency**. 
                        For example, if your base is USD and 1 USD = 3.67 AED, the AED rate should be **3.67**.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rates.map((rate) => (
                        <div key={rate.currency_code} className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500/30 transition-all group">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-sm font-black text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-gray-700 shadow-sm uppercase">
                                        {rate.currency_code.substring(0, 2)}
                                    </div>
                                    <span className="font-black text-gray-900 dark:text-white tracking-widest">{rate.currency_code}</span>
                                </div>
                                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-50 transition-opacity group-hover:opacity-100" />
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rate to Base</label>
                                    <div className="flex gap-2">
                                        <input 
                                            type="number" 
                                            step="0.0001"
                                            value={editRates[rate.currency_code] || ''}
                                            onChange={(e) => setEditRates({ ...editRates, [rate.currency_code]: e.target.value })}
                                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                        <button 
                                            onClick={() => handleSaveRate(rate.currency_code)}
                                            disabled={saving === rate.currency_code}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            <Save className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium pt-2 border-t border-gray-100 dark:border-gray-800">
                                    <span>LAST UPDATED</span>
                                    <span className="font-mono">
                                        {rate.updated_at ? new Date(rate.updated_at).toLocaleDateString() : 'NEVER'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {rates.length === 0 && (
                    <div className="text-center py-12">
                        <Coins className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-20" />
                        <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">No rates defined in system</p>
                    </div>
                )}
            </div>
        </div>
    );
}
