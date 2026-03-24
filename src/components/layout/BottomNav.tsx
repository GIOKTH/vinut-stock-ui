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
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 lg:hidden pb-safe transition-all duration-500 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-none">
            <div className="flex justify-around items-center h-[72px] px-2 max-w-lg mx-auto">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative group active:scale-90 ${
                                isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                                isActive 
                                    ? 'bg-blue-600/10 dark:bg-blue-400/10 shadow-[0_0_20px_rgba(59,130,246,0.1)] scale-110' 
                                    : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800'
                            }`}>
                                <item.icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                            </div>
                            <span className={`text-[10px] mt-1.5 uppercase tracking-[0.15em] font-black transition-all duration-300 ${isActive ? 'opacity-100 font-black' : 'opacity-40'}`}>
                                {item.name}
                            </span>
                            {isActive && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] bg-blue-600/60 dark:bg-blue-400/60 rounded-full blur-[0.5px] transition-all" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
