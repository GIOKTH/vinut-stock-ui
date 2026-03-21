import { useEffect, useState } from 'react';
import { Product } from '../../types/api';
import { productService } from '../../services/products';
import { Package, Plus, Search, AlertTriangle, CheckCircle, XCircle, Edit } from 'lucide-react';

export default function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addForm, setAddForm] = useState({
        code: '',
        name: '',
        sale_price: '',
        quantity: 0,
        low_stock_threshold: 10
    });

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
    
    const [editForm, setEditForm] = useState({
        name: '',
        sale_price: '',
        quantity: 0,
        low_stock_threshold: 0
    });

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 5000);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditForm({
            name: product.name,
            sale_price: product.sale_price,
            quantity: product.quantity,
            low_stock_threshold: product.low_stock_threshold || 10
        });
        setIsEditModalOpen(true);
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const newProduct = await productService.createProduct({
                code: addForm.code,
                name: addForm.name,
                sale_price: addForm.sale_price,
                quantity: addForm.quantity,
                low_stock_threshold: addForm.low_stock_threshold,
                is_active: true
            });
            setProducts([newProduct, ...products]);
            setIsAddModalOpen(false);
            setAddForm({
                code: '',
                name: '',
                sale_price: '',
                quantity: 0,
                low_stock_threshold: 10
            });
            showNotification('success', `Product "${newProduct.name}" created successfully.`);
        } catch (err) {
            console.error('Failed to create product', err);
            showNotification('error', 'Failed to create product. The code might already exist.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProduct) return;
        setSaving(true);
        try {
            const updated = await productService.updateProduct(editingProduct.id, {
                name: editForm.name,
                sale_price: editForm.sale_price,
                quantity: editForm.quantity,
                low_stock_threshold: editForm.low_stock_threshold
            });
            setProducts(products.map(p => p.id === updated.id ? updated : p));
            setIsEditModalOpen(false);
            showNotification('success', `Product "${updated.name}" was successfully updated.`);
        } catch (err) {
            console.error('Failed to update product', err);
            showNotification('error', 'Failed to update product. Please safely try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (product: Product) => {
        try {
            const newStatus = product.is_active === false ? true : false;
            const updated = await productService.updateProductStatus(product.id, { is_active: newStatus });
            setProducts(products.map(p => p.id === updated.id ? updated : p));
            showNotification('success', `Product "${updated.name}" is now ${newStatus ? 'active' : 'inactive'}.`);
        } catch (err) {
            console.error('Failed to toggle product status', err);
            showNotification('error', 'Failed to update product status.');
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getProducts();
                setProducts(data);
            } catch (err) {
                console.error('Failed to fetch products', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center text-white">
                <p>Loading products...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                        <Package className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Products</h2>
                        <p className="text-gray-400 text-sm mt-1">Manage your inventory and stock</p>
                    </div>
                </div>
                
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Product
                </button>
            </div>

            {notification && (
                <div className={`p-4 rounded-xl flex items-center gap-3 transition-all duration-300 animate-in slide-in-from-top-2 ${
                    notification.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]' :
                    notification.type === 'error' ? 'bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' :
                    'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> :
                     notification.type === 'error' ? <XCircle className="w-5 h-5 flex-shrink-0" /> :
                     <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="font-medium text-sm">{notification.message}</p>
                    <button 
                        onClick={() => setNotification(null)} 
                        className="ml-auto p-1 opacity-70 hover:opacity-100 hover:bg-white/10 rounded-lg transition-all"
                    >
                        <XCircle className="w-4 h-4" />
                    </button>
                </div>
            )}

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="p-4 sm:p-5 border-b border-gray-700 bg-gray-800/50 flex justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-500" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search products..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-lg bg-gray-900/50 text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all focus:bg-gray-900"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-900/50">
                            <tr>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Storage Code</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Price (Base)</th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Quantity</th>
                                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700/50">
                            {products.length > 0 ? (
                                products.map((product) => {
                                    const isLowStock = product.low_stock_threshold != null && product.quantity <= product.low_stock_threshold;
                                    return (
                                        <tr key={product.id} className="hover:bg-gray-750/50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 flex-shrink-0 bg-gray-700/50 group-hover:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-600 transition-colors">
                                                        <Package className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors">{product.name}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-400 font-mono bg-gray-900/50 px-2 py-1 rounded inline-block border border-gray-700">{product.code}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {product.is_active !== false ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm shadow-green-500/5">
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Active
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20 shadow-sm shadow-gray-500/5">
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Inactive
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 font-medium">
                                                <span className="text-gray-500 mr-1">$</span>
                                                {Number(product.sale_price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${isLowStock ? 'text-red-400' : 'text-gray-300'}`}>
                                                        {product.quantity.toLocaleString()}
                                                    </span>
                                                    {isLowStock && (
                                                        <div className="flex items-center gap-1 text-xs text-red-500/90 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                                                            <AlertTriangle className="w-3.5 h-3.5" />
                                                            <span>Low</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end items-center gap-4">
                                                    <div 
                                                        role="switch"
                                                        aria-checked={product.is_active !== false}
                                                        tabIndex={0}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStatus(product);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleToggleStatus(product);
                                                            }
                                                        }}
                                                        className={`${
                                                            product.is_active !== false ? 'bg-[#34C759]' : 'bg-[#E9E9EA]'
                                                        } relative inline-flex h-[31px] w-[51px] flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none shadow-inner`}
                                                        title={product.is_active !== false ? "Disable Product" : "Enable Product"}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className={`${
                                                                product.is_active !== false ? 'translate-x-[22px]' : 'translate-x-[2px]'
                                                            } pointer-events-none inline-block h-[27px] w-[27px] transform rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15)] ring-0 transition duration-200 ease-in-out`}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => openEditModal(product)}
                                                        className="text-gray-400 hover:text-blue-400 transition-colors p-2 hover:bg-gray-700/50 rounded-lg inline-flex items-center justify-center"
                                                        title="Edit Product"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex justify-center mb-4">
                                            <div className="p-4 bg-gray-900/50 rounded-full">
                                                <Package className="h-10 w-10 text-gray-600" />
                                            </div>
                                        </div>
                                        <p className="text-base font-medium text-gray-400">No products found</p>
                                        <p className="text-sm mt-1">Try adding a new product to your inventory.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Product Modal */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                            <h3 className="text-lg font-bold text-white">Edit Product</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Product Name</label>
                                <input 
                                    type="text" 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sale Price</label>
                                <input 
                                    type="number" step="0.01" 
                                    value={editForm.sale_price} 
                                    onChange={e => setEditForm({...editForm, sale_price: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Quantity in Stock</label>
                                    <input 
                                        type="number" 
                                        value={editForm.quantity} 
                                        onChange={e => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Low Stock Alert Level</label>
                                    <input 
                                        type="number" 
                                        value={editForm.low_stock_threshold} 
                                        onChange={e => setEditForm({...editForm, low_stock_threshold: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-700 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-transparent shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Product Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                            <h3 className="text-lg font-bold text-white">Add New Product</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Storage Code / ID</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. PRD-001"
                                    value={addForm.code} 
                                    onChange={e => setAddForm({...addForm, code: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Product Name</label>
                                <input 
                                    type="text" 
                                    placeholder="Enter product name"
                                    value={addForm.name} 
                                    onChange={e => setAddForm({...addForm, name: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Sale Price</label>
                                <input 
                                    type="number" step="0.01" 
                                    placeholder="0.00"
                                    value={addForm.sale_price} 
                                    onChange={e => setAddForm({...addForm, sale_price: e.target.value})}
                                    className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Quantity</label>
                                    <input 
                                        type="number" 
                                        value={addForm.quantity} 
                                        onChange={e => setAddForm({...addForm, quantity: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Low Stock Alert</label>
                                    <input 
                                        type="number" 
                                        value={addForm.low_stock_threshold} 
                                        onChange={e => setAddForm({...addForm, low_stock_threshold: parseInt(e.target.value) || 0})}
                                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-700 mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-transparent shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    {saving ? 'Creating...' : 'Create Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
