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
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 lg:hidden px-2 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navigation.map((item) => {
                    const isActive = location.pathname === item.href || (item.href !== '/' && location.pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
                                isActive ? 'text-blue-500' : 'text-gray-400 hover:text-white'
                            }`}
                        >
                            <item.icon className="h-6 w-6" />
                            <span className="text-[10px] mt-1 font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
