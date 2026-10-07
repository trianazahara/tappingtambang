import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';

export default function UjianOnline() {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [currentSoalIndex, setCurrentSoalIndex] = useState(0);
    const [jawaban, setJawaban] = useState({}); // { id_soal: 'A' }
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const data = localStorage.getItem('ujian_session');
        if (!data) {
            navigate('/ujian/login');
        } else {
            setSession(JSON.parse(data));
        }
    }, [navigate]);

    if (!session) return null;

    const { pengajuan, soal } = session;
    const currentSoal = soal[currentSoalIndex];
    const isLastSoal = currentSoalIndex === soal.length - 1;

    const handleSelectAnswer = (opsi) => {
        setJawaban({ ...jawaban, [currentSoal.id_soal]: opsi });
    };

    const handleSubmit = async () => {
        if (!window.confirm('Apakah Anda yakin ingin mengakhiri ujian dan mengirimkan jawaban?')) return;
        
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/ujian/submit`, {
                id_pengajuan: pengajuan.id_pengajuan,
                jawaban
            });
            if (res.data.success) {
                setResult(res.data.data);
                localStorage.removeItem('ujian_session');
            }
        } catch (error) {
            alert('Gagal mengirim jawaban.');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white p-8 rounded-2xl shadow border border-gray-100 text-center">
                    <div className="flex justify-center mb-6">
                        <CheckCircle2 size={64} className={result.lulus ? "text-green-500" : "text-red-500"} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ujian Selesai!</h2>
                    <p className="text-gray-600 mb-6">Terima kasih telah menyelesaikan ujian K3.</p>
                    
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="text-sm text-gray-500 mb-1">Nilai Anda</div>
                        <div className={`text-4xl font-extrabold ${result.lulus ? 'text-green-600' : 'text-red-600'}`}>
                            {result.nilai.toFixed(0)}
                        </div>
                        <div className="mt-2 text-sm font-medium text-gray-700">
                            Status: {result.lulus ? 'LULUS' : 'TIDAK LULUS'}
                        </div>
                    </div>

                    <button onClick={() => navigate('/ujian/login')} className="w-full py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-medium hover:bg-gray-50">
                        Kembali ke Halaman Utama
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#E11D2E] rounded-lg flex items-center justify-center font-bold text-white">K3</div>
                    <div>
                        <h1 className="font-bold text-gray-900 leading-tight">Ujian Online K3</h1>
                        <p className="text-xs text-gray-500">{pengajuan.nama_lengkap} - {pengajuan.nik}</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Soal Terjawab</div>
                    <div className="font-bold text-gray-900">{Object.keys(jawaban).length} / {soal.length}</div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
                    {/* Progress */}
                    <div className="bg-gray-100 h-1.5 w-full">
                        <div className="bg-[#E11D2E] h-1.5 transition-all duration-300" style={{ width: `${((currentSoalIndex) / soal.length) * 100}%` }}></div>
                    </div>

                    <div className="p-6 md:p-10 flex-1 flex flex-col">
                        <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 leading-relaxed">
                            <span className="text-gray-400 mr-2">{currentSoalIndex + 1}.</span> 
                            {currentSoal.pertanyaan}
                        </h2>

                        {currentSoal.file_gambar && (
                            <div className="mb-8 rounded-xl overflow-hidden border border-gray-200">
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}/uploads/${currentSoal.file_gambar.split(/[/\\]/).pop()}`} 
                                    alt="Ilustrasi Soal" 
                                    className="w-full max-h-[400px] object-contain bg-gray-50"
                                />
                            </div>
                        )}

                        <div className="space-y-3 flex-1">
                            {['pilihan_a', 'pilihan_b', 'pilihan_c', 'pilihan_d'].map(opt => (
                                <button 
                                    key={opt}
                                    onClick={() => handleSelectAnswer(opt.split('_')[1].toUpperCase())}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-4
                                        ${jawaban[currentSoal.id_soal] === opt.split('_')[1].toUpperCase() 
                                            ? 'border-[#E11D2E] bg-red-50 text-[#E11D2E]' 
                                            : 'border-gray-200 hover:border-gray-300 text-gray-700 bg-white'}`}
                                >
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm
                                        ${jawaban[currentSoal.id_soal] === opt.split('_')[1].toUpperCase() ? 'border-[#E11D2E] bg-[#E11D2E] text-white' : 'border-gray-300 text-gray-500'}`}>
                                        {opt.split('_')[1].toUpperCase()}
                                    </div>
                                    <span className="font-medium">{currentSoal[opt]}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer / Navigasi */}
                    <div className="bg-gray-50 p-6 border-t border-gray-200 flex justify-between items-center">
                        <button 
                            disabled={currentSoalIndex === 0}
                            onClick={() => setCurrentSoalIndex(s => s - 1)}
                            className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 hover:bg-gray-200 text-gray-700"
                        >
                            <ChevronLeft size={18} /> Sebelumnya
                        </button>
                        
                        {!isLastSoal ? (
                            <button 
                                onClick={() => setCurrentSoalIndex(s => s + 1)}
                                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors"
                            >
                                Selanjutnya <ChevronRight size={18} />
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                disabled={loading || Object.keys(jawaban).length < soal.length}
                                className="px-6 py-2.5 bg-[#E11D2E] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#B0121F] transition-colors disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Jawaban'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
