import { useEffect, useState } from 'react';
import { UserResponse } from '../../types/api';
import { settingsService } from '../../services/settings';
import { Users, Shield, ShieldOff, Trash2 } from 'lucide-react';

interface UserManagementProps {
    showNotification: (type: 'success' | 'error' | 'warning', message: string) => void;
}

export default function UserManagement({ showNotification }: UserManagementProps) {
    const [users, setUsers] = useState<UserResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchUsers = async () => {
        try {
            const data = await settingsService.getUsers();
            setUsers(data);
        } catch (err) {
            console.error('Failed to fetch users', err);
            showNotification('error', 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleToggleBlock = async (user: UserResponse) => {
        setActionLoading(user.id);
        try {
            if (user.is_blocked) {
                await settingsService.unblockUser(user.id);
                showNotification('success', `User ${user.username} has been unblocked.`);
            } else {
                await settingsService.blockUser(user.id);
                showNotification('warning', `User ${user.username} has been blocked.`);
            }
            await fetchUsers();
        } catch (err: any) {
            console.error('Failed to toggle user block status', err);
            const errorMsg = err.response?.data?.error || 'Failed to update user status.';
            showNotification('error', errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleChangeRole = async (user: UserResponse, newRole: string) => {
        if (user.role === newRole) return;
        setActionLoading(user.id);
        try {
            await settingsService.changeUserRole(user.id, { role: newRole });
            showNotification('success', `User ${user.username} role updated to ${newRole}.`);
            await fetchUsers();
        } catch (err: any) {
            console.error('Failed to change user role', err);
            const errorMsg = err.response?.data?.error || 'Failed to update user role.';
            showNotification('error', errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteUser = async (user: UserResponse) => {
        if (!confirm(`Are you sure you want to delete user ${user.username}? This action cannot be undone.`)) return;
        
        setActionLoading(user.id);
        try {
            await settingsService.deleteUser(user.id);
            showNotification('success', `User ${user.username} has been deleted.`);
            setUsers(users.filter(u => u.id !== user.id));
        } catch (err: any) {
            console.error('Failed to delete user', err);
            const errorMsg = err.response?.data?.error || 'Failed to delete user.';
            showNotification('error', errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm transition-colors duration-300">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold dark:text-white uppercase tracking-wider">User Management</h3>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">User</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-750/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-9 w-9 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold border border-gray-200 dark:border-gray-600">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-3">
                                            <div className="text-sm font-bold text-gray-900 dark:text-white">{user.username}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{user.id.substring(0, 8)}...</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select 
                                        value={user.role}
                                        onChange={(e) => handleChangeRole(user, e.target.value)}
                                        disabled={actionLoading === user.id}
                                        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="SALE">SALE</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.is_blocked ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20">
                                            <ShieldOff className="w-3.5 h-3.5" />
                                            Blocked
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                            <Shield className="w-3.5 h-3.5" />
                                            Active
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                    <div className="flex justify-end items-center gap-2">
                                        <button
                                            onClick={() => handleToggleBlock(user)}
                                            disabled={actionLoading === user.id}
                                            className={`p-2 rounded-lg border transition-all active:scale-95 ${
                                                user.is_blocked 
                                                ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-green-500/20' 
                                                : 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20'
                                            }`}
                                            title={user.is_blocked ? "Unblock User" : "Block User"}
                                        >
                                            {user.is_blocked ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(user)}
                                            disabled={actionLoading === user.id || !!user.has_sales}
                                            className={`p-2 border rounded-lg transition-all active:scale-95 ${
                                                user.has_sales 
                                                ? 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                                                : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'
                                            }`}
                                            title={user.has_sales ? "Cannot delete user with sales record (Block instead)" : "Delete User"}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
