import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

const getTitle = (pathname: string) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname.startsWith('/products')) return 'Products';
    if (pathname.startsWith('/sales')) return 'Sales';
    if (pathname.startsWith('/quotations')) return 'Quotations';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/settings')) return 'Settings';
    return 'Dashboard';
};

export default function MainLayout() {
    const location = useLocation();
    const title = getTitle(location.pathname);

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden w-full">
            <Sidebar isOpen={false} onClose={() => {}} />
            
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full pb-16 lg:pb-0">
                <Header title={title} />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full pb-20 sm:pb-6">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
                <BottomNav />
            </div>
        </div>
    );
}
