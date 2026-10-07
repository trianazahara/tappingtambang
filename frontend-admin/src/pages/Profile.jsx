import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Lock, Save, AlertCircle, CheckCircle2, Mail, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Profile() {
    const [userData, setUserData] = useState(null);
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        email: '',
        password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        if (storedUser) {
            setUserData(storedUser);
            setFormData(prev => ({
                ...prev,
                nama_lengkap: storedUser.nama_lengkap || '',
                email: storedUser.email || storedUser.username || ''
            }));
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password && formData.password !== formData.confirm_password) {
            toast.error('Password baru dan konfirmasi password tidak sama!');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nama_lengkap: formData.nama_lengkap,
                email: formData.email,
            };
            if (formData.password) {
                payload.password = formData.password;
            }

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${userData.id_user}`, payload);
            
            if (res.data.success) {
                toast.success('Profil berhasil diupdate!');
                // Update local storage
                const updatedUser = { ...userData, nama_lengkap: formData.nama_lengkap, email: formData.email };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUserData(updatedUser);
                setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
                
                // Reload to reflect name change in Header
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Error update profile:', error);
            toast.error(error.response?.data?.message || 'Gagal mengupdate profil');
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return <div className="p-8 text-center text-gray-500">Memuat data...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50"></div>
                <div className="relative z-10 flex items-center gap-5">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E11D2E] to-[#A80D26] flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-red-500/30">
                        {formData.nama_lengkap.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Profil Pengguna</h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Shield size={16} className="text-red-500" />
                            Role Anda: <span className="font-semibold text-gray-700">{userData.role.replace('_', ' ')}</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <form onSubmit={handleSubmit} className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {/* Informasi Dasar */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                    <User className="text-[#E11D2E]" size={20} /> Informasi Dasar
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                name="nama_lengkap"
                                                value={formData.nama_lengkap}
                                                onChange={handleChange}
                                                required
                                                className="pl-10 w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                                className="pl-10 w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Keamanan */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                                    <Lock className="text-[#E11D2E]" size={20} /> Ubah Password
                                </h3>
                                <div className="bg-orange-50 text-orange-700 p-3.5 rounded-xl border border-orange-100 mb-5 flex items-start gap-2.5 text-sm">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p>Kosongkan kolom password jika Anda tidak ingin mengubah password saat ini.</p>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password Baru</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="password"
                                                value={formData.password}
                                                onChange={handleChange}
                                                placeholder="Masukkan password baru..."
                                                className="pl-10 w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <CheckCircle2 size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="password"
                                                name="confirm_password"
                                                value={formData.confirm_password}
                                                onChange={handleChange}
                                                placeholder="Ulangi password baru..."
                                                className="pl-10 w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium text-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-gray-100 flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-[#E11D2E] to-[#A80D26] hover:from-[#C91929] hover:to-[#8E0B20] text-white px-8 py-3.5 rounded-xl font-bold flex items-center gap-2.5 shadow-lg shadow-red-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        >
                            {loading ? <span className="animate-spin text-xl">↻</span> : <Save size={20} />}
                            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
