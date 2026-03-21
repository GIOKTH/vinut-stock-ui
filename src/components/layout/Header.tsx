import { useState, useEffect } from 'react';
import { Bell, User as UserIcon } from 'lucide-react';
import { authService } from '../../services/auth';
import { User } from '../../types/api';

interface HeaderProps {
    title: string;
}

export default function Header({ title }: HeaderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

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
        <header className="bg-gray-900 border-b border-gray-800 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0">
            <div className="flex items-center">
                <h2 className="text-lg sm:text-xl font-semibold text-white">{title}</h2>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
                <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white shrink-0">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    {loading ? (
                        <div className="flex flex-col">
                            <span className="h-4 w-16 bg-gray-700 animate-pulse rounded"></span>
                            <span className="h-3 w-10 bg-gray-800 animate-pulse rounded mt-1 hidden sm:block"></span>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white max-w-[80px] sm:max-w-[120px] truncate">{user?.username || 'User'}</span>
                            <span className="text-xs text-gray-400 capitalize hidden sm:block">{user?.role || 'user'}</span>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
