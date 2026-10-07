import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    
    const [status, setStatus] = useState('loading'); // loading, success, error
    const [message, setMessage] = useState('Sedang memverifikasi email Anda...');
    const hasFetched = React.useRef(false);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token verifikasi tidak ditemukan.');
            return;
        }

        if (hasFetched.current) return;
        hasFetched.current = true;

        const verify = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/verify-email/${token}`);
                if (res.data.success) {
                    setStatus('success');
                    setMessage(res.data.message);
                }
            } catch (err) {
                setStatus('error');
                setMessage(err.response?.data?.message || 'Gagal memverifikasi email.');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <Toaster position="top-right" />
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-12 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-gray-100 text-center">
                    
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 size={48} className="animate-spin text-[#E11D2E] mb-4" />
                            <h2 className="text-xl font-semibold text-gray-900">Verifikasi Email</h2>
                            <p className="mt-2 text-gray-500">{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 size={56} className="text-green-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Berhasil!</h2>
                            <p className="mt-2 text-gray-600">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-8 w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-[#E11D2E] hover:bg-[#B0121F] transition-all"
                            >
                                Pergi ke Halaman Login
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center">
                            <XCircle size={56} className="text-red-500 mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900">Gagal Verifikasi</h2>
                            <p className="mt-2 text-gray-600">{message}</p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-8 w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                            >
                                Kembali ke Halaman Login
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
