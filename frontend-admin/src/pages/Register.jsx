import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Lock, Eye, EyeOff, Loader2, HardHat, FileText, ArrowLeft, Building2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function Register() {
    const [namaLengkap, setNamaLengkap] = useState('');
    const [idInstansi, setIdInstansi] = useState('');
    const [instansiLainnya, setInstansiLainnya] = useState('');
    const [instansiList, setInstansiList] = useState([]);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchInstansi = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`);
                if (res.data.success) {
                    setInstansiList(res.data.data.filter(i => i.status_instansi === 'Aktif'));
                }
            } catch (error) {
                console.error("Gagal mengambil data instansi", error);
            }
        };
        fetchInstansi();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let finalIdInstansi = idInstansi;
            if (idInstansi === 'lainnya') {
                const resInstansi = await axios.post(`${import.meta.env.VITE_API_URL}/api/instansi`, {
                    nama_instansi: instansiLainnya,
                    kategori_instansi: 'Visitor'
                });
                if (resInstansi.data.success) {
                    finalIdInstansi = resInstansi.data.data.id_instansi;
                } else {
                    toast.error("Gagal menambahkan instansi baru");
                    setIsLoading(false);
                    return;
                }
            }

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
                nama_lengkap: namaLengkap,
                id_instansi: finalIdInstansi || null,
                email,
                password
            });

            if (res.data.success) {
                toast.success('Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi.');
                setTimeout(() => {
                    navigate('/login');
                }, 4000);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Terjadi kesalahan saat pendaftaran.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            <Toaster position="top-right" />
            
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-[#E11D2E] opacity-90 skew-y-3 transform -translate-y-20 -z-10"></div>
            
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center gap-3 mb-6">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
                        <HardHat size={32} className="text-[#E11D2E]" />
                    </div>
                </div>
                <h2 className="text-center text-3xl font-bold tracking-tight text-white drop-shadow-sm">
                    Pendaftaran Akun
                </h2>
                <p className="mt-2 text-center text-sm text-red-100">
                    Sistem Tapping Permit Tambang PTSP
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleRegister}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={namaLengkap}
                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm transition-colors bg-gray-50/50"
                                    placeholder="Masukkan nama lengkap"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Perusahaan / Instansi</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    required
                                    value={idInstansi}
                                    onChange={(e) => setIdInstansi(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm transition-colors bg-white appearance-none"
                                >
                                    <option value="" disabled>Pilih Instansi</option>
                                    {instansiList.map((instansi) => (
                                        <option key={instansi.id_instansi} value={instansi.id_instansi}>
                                            {instansi.nama_instansi}
                                        </option>
                                    ))}
                                    <option value="lainnya">Lainnya (Ketik Sendiri)</option>
                                </select>
                            </div>
                            {idInstansi === 'lainnya' && (
                                <div className="mt-3 relative">
                                    <input
                                        type="text"
                                        required
                                        value={instansiLainnya}
                                        onChange={(e) => setInstansiLainnya(e.target.value)}
                                        className="block w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm transition-colors bg-white"
                                        placeholder="Ketik nama instansi/perusahaan Anda..."
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email Aktif</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FileText className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm transition-colors bg-gray-50/50"
                                    placeholder="email@contoh.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm transition-colors bg-gray-50/50"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#E11D2E] hover:bg-[#B0121F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D2E] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Mendaftar...
                                    </span>
                                ) : (
                                    'Daftar Sekarang'
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-sm text-gray-600 hover:text-[#E11D2E] font-medium flex items-center justify-center gap-1 mx-auto"
                        >
                            <ArrowLeft size={16} /> Kembali ke halaman Login
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="mt-8 text-center text-sm text-gray-500 z-10">
                &copy; {new Date().getFullYear()} PT Semen Padang. All rights reserved.
            </div>
        </div>
    );
}
