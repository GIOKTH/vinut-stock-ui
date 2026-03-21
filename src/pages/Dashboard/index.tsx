import { useEffect, useState } from 'react';
import { reportService } from '../../services/reports';
import { DashboardSummary } from '../../types/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Package } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
    const [summary, setSummary] = useState<DashboardSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const data = await reportService.getDashboardSummary();
                setSummary(data);
            } catch (error) {
                console.error('Failed to fetch dashboard summary', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) {
        return <div className="flex items-center justify-center h-full text-white">Loading dashboard...</div>;
    }

    if (!summary) {
        return <div className="text-white">Failed to load dashboard data.</div>;
    }

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-lg shadow-blue-500/5 hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">Total Sales Today</p>
                            <div className="mt-2 space-y-2">
                                {summary.summary_by_currency && summary.summary_by_currency.length > 0 ? (
                                    summary.summary_by_currency.map(c => (
                                        <div key={`sales-${c.currency}`} className="flex items-baseline space-x-2">
                                            <span className="text-xs font-bold text-blue-400">{c.currency}</span>
                                            <h3 className="text-xl sm:text-2xl font-bold text-white">
                                                {c.total_sales?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                                            </h3>
                                        </div>
                                    ))
                                ) : (
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                        {summary.daily_sales_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                                    </h3>
                                )}
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-lg shadow-green-500/5 hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">Total Profit Today</p>
                            <div className="mt-2 space-y-2">
                                {summary.summary_by_currency && summary.summary_by_currency.length > 0 ? (
                                    summary.summary_by_currency.map(c => (
                                        <div key={`profit-${c.currency}`} className="flex items-baseline space-x-2">
                                            <span className="text-xs font-bold text-green-400">{c.currency}</span>
                                            <h3 className="text-xl sm:text-2xl font-bold text-white">
                                                {c.total_profit?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                                            </h3>
                                        </div>
                                    ))
                                ) : (
                                    <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                        {summary.daily_profit_total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0'}
                                    </h3>
                                )}
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                            <TrendingUp className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-lg shadow-purple-500/5 hover:scale-[1.02] transition-transform duration-300 flex-1">
                        <div className="flex items-center justify-between h-full">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">Best Seller</p>
                                <h3 className="text-lg sm:text-xl font-bold text-white mt-1 truncate max-w-[100px] sm:max-w-none">
                                    {summary.best_selling_product || 'N/A'}
                                </h3>
                            </div>
                            <div className="p-3 sm:p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                                <Package className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-700/50 shadow-lg shadow-red-500/5 hover:scale-[1.02] transition-transform duration-300 flex-1">
                        <div className="flex items-center justify-between h-full">
                            <div>
                                <p className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-wider">Low Stock Items</p>
                                <h3 className="text-2xl sm:text-3xl font-bold text-white mt-1">
                                    {summary.low_stock_count || '0'}
                                </h3>
                            </div>
                            <div className="p-3 sm:p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                                <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Top 5 Best Sellers Chart */}
                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Top 5 Best Sellers</h3>
                    <div className="h-[300px] sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary.top_5_best_sellers}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="name" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Bar dataKey="quantity" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sales by Currency Pie Chart */}
                <div className="bg-gray-800 p-4 sm:p-6 rounded-xl border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 sm:mb-6">Sales by Currency</h3>
                    <div className="h-[300px] sm:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={summary.summary_by_currency}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="total_sales"
                                    nameKey="currency"
                                >
                                    {summary.summary_by_currency.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Low Stock Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Low Stock Alerts</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[600px] sm:min-w-full">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Product Name</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Current Quantity</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Threshold</th>
                                <th className="px-4 sm:px-6 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {summary.low_stock_details.length > 0 ? (
                                summary.low_stock_details.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-750/50">
                                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-300">{item.name}</td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-red-400 font-medium">{item.quantity}</td>
                                        <td className="px-4 sm:px-6 py-4 text-sm text-gray-400">{item.threshold}</td>
                                        <td className="px-4 sm:px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-500">
                                                Low Stock
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No low stock items found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
