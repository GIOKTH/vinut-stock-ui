import { useState, useEffect } from 'react';
import { Bell, User as UserIcon, Sun, Moon } from 'lucide-react';
import { authService } from '../../services/auth';
import { User } from '../../types/api';
import { useTheme } from '../../contexts/ThemeContext';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userData = await authService.me();
                setUser(userData);
            } catch (err) {
                console.error('Failed to fetch user', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors duration-300">
            <div className="flex items-center">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white uppercase tracking-tight">{title}</h2>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <button 
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all active:scale-90 shadow-sm hover:shadow-md"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                >
                    {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </button>
                <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all active:scale-95 shadow-sm hover:shadow-md">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 dark:bg-gray-700 flex items-center justify-center text-blue-600 dark:text-white shrink-0">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    {loading ? (
                        <div className="flex flex-col">
                            <span className="h-4 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded"></span>
                            <span className="h-3 w-10 bg-gray-100 dark:bg-gray-800 animate-pulse rounded mt-1 hidden sm:block"></span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900 dark:text-white max-w-[80px] sm:max-w-[120px] truncate">{user?.username || 'User'}</span>
                            <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest hidden sm:block leading-none mt-0.5">{user?.role || 'user'}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
