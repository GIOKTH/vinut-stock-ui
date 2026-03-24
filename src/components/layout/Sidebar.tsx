import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, ShoppingBag, FileText, BarChart3, Settings, LogOut } from 'lucide-react';
import { authService } from '../../services/auth';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag },
    { name: 'Quotations', href: '/quotations', icon: FileText },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
        navigate('/login', { replace: true });
    };

    return (
        <div 
            className="hidden lg:flex lg:flex-col lg:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors duration-300"
        >
            <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">MaoGao Stocks</span>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`group flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all active:scale-95 ${isActive
                                    ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400 shadow-sm border border-blue-500/10'
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/80 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                                }`}
                        >
                            <item.icon
                                className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                                    }`}
                                aria-hidden="true"
                            />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 mt-auto shrink-0">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center px-4 py-3 text-sm font-black rounded-xl text-red-500/90 bg-red-500/5 hover:bg-red-500/10 hover:text-red-500 transition-all border border-red-500/10 hover:border-red-500/30 active:scale-95 shadow-sm uppercase tracking-widest text-[11px]"
                >
                    <LogOut className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    Logout Account
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
