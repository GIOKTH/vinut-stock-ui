import React, { useState, useEffect } from 'react';
import { Users, DollarSign, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import UserManagement from './UserManagement';
import ExchangeRates from './ExchangeRates';
import { authService } from '../../services/auth';
import { UserResponse } from '../../types/api';

type Tab = 'users' | 'exchange';

interface Notification {
    id: number;
    type: 'success' | 'error' | 'warning';
    message: string;
}

const TABS: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'exchange', label: 'Exchange Rates', icon: DollarSign },
];

export default function Settings() {
    const [user, setUser] = useState<UserResponse | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('exchange'); // Default to exchange for safety
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        authService.me().then(data => {
            setUser(data);
            if (data.role === 'ADMIN') {
                setActiveTab('users');
            }
        });
    }, []);

    const showNotification = (type: 'success' | 'error' | 'warning', message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    };

    const notifIcon = (type: Notification['type']) => {
        if (type === 'success') return <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />;
        if (type === 'error') return <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
        return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    };

    const notifColors: Record<Notification['type'], string> = {
        success: 'bg-green-500/10 border-green-500/20 text-green-300',
        error: 'bg-red-500/10 border-red-500/20 text-red-300',
        warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300',
    };

    // Filter tabs based on role
    const visibleTabs = TABS.filter(tab => !tab.adminOnly || user?.role === 'ADMIN');

    return (
        <div className="w-full space-y-6">
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
                {notifications.map(n => (
                    <div
                        key={n.id}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl backdrop-blur-sm animate-fade-in pointer-events-auto max-w-xs ${notifColors[n.type]}`}
                    >
                        {notifIcon(n.type)}
                        <span>{n.message}</span>
                    </div>
                ))}
            </div>

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Settings</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage users and configure exchange rates</p>
            </div>

            {/* Tab Bar — scrollable on mobile, full-width on desktop */}
            <div className="relative">
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-none">
                    {visibleTabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex-1 justify-center
                                    ${isActive
                                        ? 'bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700'
                                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                                <span className="hidden sm:inline">{tab.label}</span>
                                <span className="sm:hidden">
                                    {tab.id === 'users' ? 'Users' : 'Exchange'}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'users' && (
                    <UserManagement showNotification={showNotification} />
                )}
                {activeTab === 'exchange' && (
                    <ExchangeRates showNotification={showNotification} />
                )}
            </div>
        </div>
    );
}
