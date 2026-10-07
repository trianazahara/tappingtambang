import { useState } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UjianLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ nik_atau_ktm: '', kode_ujian_online: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ujian/login`, formData);
            if (res.data.success) {
                // Store exam session in localStorage or memory
                localStorage.setItem('ujian_session', JSON.stringify(res.data.data));
                navigate('/ujian/start');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login gagal. Periksa kembali NIK dan Kode Ujian Anda.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-[#E11D2E] rounded-xl flex items-center justify-center font-bold text-white text-xl">
                        K3
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Portal Ujian Online</h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Silakan masuk menggunakan NIK dan Kode Ujian (Token) Anda.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-2xl sm:px-10 border border-gray-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-center">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">NIK / Nomor Identitas</label>
                            <div className="mt-1">
                                <input name="nik_atau_ktm" type="text" required value={formData.nik_atau_ktm} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Kode Ujian (Token)</label>
                            <div className="mt-1">
                                <input name="kode_ujian_online" type="text" required value={formData.kode_ujian_online} onChange={handleChange} className="appearance-none block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#E11D2E] focus:border-[#E11D2E] sm:text-sm uppercase tracking-widest font-mono" />
                            </div>
                        </div>

                        <div>
                            <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#E11D2E] hover:bg-[#B0121F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D2E] disabled:opacity-70">
                                {loading ? <Loader2 className="animate-spin" /> : 'Mulai Ujian'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
