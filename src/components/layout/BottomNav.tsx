import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Settings } from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Products', href: '/products', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
];

const BottomNav: React.FC = () => {
    const location = useLocation();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 lg:hidden px-2 pb-safe transition-colors duration-300">
            <div className="flex justify-around items-center h-16">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${
                                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 scale-110' : ''}`}>
                                <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                            </div>
                            <span className={`text-[9px] mt-1 uppercase tracking-widest font-black transition-all ${isActive ? 'opacity-100 scale-105' : 'opacity-60'}`}>{item.name}</span>
                            {isActive && (
                                <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
