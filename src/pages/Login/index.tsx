import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth';
import { User, Lock, XCircle } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = await authService.login({ username, password });
            localStorage.setItem('token', token);
            navigate('/');
        } catch (err: any) {
            console.error('Login failed', err);
            setError('Invalid username or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 transition-colors duration-500">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-2xl transition-all duration-300">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-500/30 rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-widest">Antigravity POS</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Access your enterprise dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl mb-8 text-sm font-bold flex items-center gap-3 animate-shake">
                        <XCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Username</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <User className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="block w-full pl-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm p-3.5 transition-all outline-none"
                                placeholder="Enter your identifier"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Password</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="block w-full pl-12 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 sm:text-sm p-3.5 transition-all outline-none"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-4 px-4 rounded-2xl shadow-2xl text-sm font-black text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-blue-500/30 active:scale-[0.98] uppercase tracking-[0.2em] border border-blue-500/20"
                    >
                        {loading ? 'Authenticating...' : 'Sign In Now'}
                    </button>
                </form>
            </div>
        </div>
    );
}
