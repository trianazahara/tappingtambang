import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { User, Phone, Briefcase, MapPin, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function VisitorPublic() {
    const { uid } = useParams();
    const [visitor, setVisitor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [areas, setAreas] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // We'll fetch both visitor data and areas
                const [resVisitor, resArea] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/visitor/public/${uid}`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/area`)
                ]);
                
                if (resVisitor.data.success) {
                    setVisitor(resVisitor.data.data);
                } else {
                    setError('Data tidak ditemukan atau sudah tidak aktif.');
                }
                
                if (resArea.data.success) {
                    setAreas(resArea.data.data);
                }
            } catch (err) {
                setError('Kartu ini tidak aktif atau tidak ditemukan.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [uid]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Memuat data...</div>;
    }

    if (error || !visitor) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-xl shadow-red-500/5 border border-red-100">
                    <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Valid</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    // Determine colors based on warna_permit
    const colorMap = {
        'Merah': { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' },
        'Orange': { bg: 'bg-orange-500', text: 'text-orange-500', light: 'bg-orange-50' },
        'Biru': { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' },
        'Hijau': { bg: 'bg-emerald-500', text: 'text-emerald-500', light: 'bg-emerald-50' },
    };
    
    const colors = colorMap[visitor.warna_permit] || colorMap['Merah'];

    // Map area ids to names
    let allowedAreas = [];
    try {
        const areaIds = typeof visitor.area_akses === 'string' ? JSON.parse(visitor.area_akses) : (visitor.area_akses || []);
        allowedAreas = areas.filter(a => areaIds.includes(a.id_area)).map(a => a.nama_area);
    } catch(e) {}

    const isExpired = visitor.berlaku_hingga && new Date(visitor.berlaku_hingga) < new Date();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl relative">
                {/* Header Pattern / Color */}
                <div className={`h-32 ${colors.bg} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20px 20px, white 2px, transparent 0)', backgroundSize: '40px 40px' }}></div>
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                </div>

                {/* Avatar / Icon */}
                <div className="relative flex justify-center -mt-16 mb-4">
                    <div className="w-32 h-32 bg-white rounded-full p-2 shadow-lg">
                        <div className={`w-full h-full rounded-full ${colors.light} flex items-center justify-center`}>
                            <User size={56} className={colors.text} />
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8 text-center">
                    {/* Status Badge */}
                    <div className="mb-4">
                        {isExpired ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                                <AlertCircle size={14}/> EXPIRED
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-bold">
                                <CheckCircle2 size={14}/> AKTIF
                            </span>
                        )}
                    </div>

                    <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">{visitor.nama}</h1>
                    <p className="text-lg text-gray-500 font-medium mb-6">Kartu: {visitor.nomor_kartu}</p>

                    {/* Info Cards */}
                    <div className="space-y-3 text-left">
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                <Briefcase size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Instansi / Perusahaan</p>
                                <p className="text-gray-800 font-semibold">{visitor.perusahaan || '-'}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                <Phone size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">No. Telepon</p>
                                <p className="text-gray-800 font-semibold">{visitor.no_telp || '-'}</p>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Berlaku Hingga</p>
                                <p className={`font-bold ${isExpired ? 'text-red-500' : 'text-gray-800'}`}>
                                    {visitor.berlaku_hingga ? new Date(visitor.berlaku_hingga).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short'}) : '-'}
                                </p>
                            </div>
                        </div>

                        <div className={`rounded-2xl p-4 flex gap-4 ${colors.light} border border-white/50`}>
                            <div className={`w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm ${colors.text} shrink-0`}>
                                <MapPin size={20} />
                            </div>
                            <div>
                                <p className={`text-xs font-bold uppercase tracking-wider ${colors.text} opacity-80 mb-1`}>Area Akses ({visitor.warna_permit})</p>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                    {allowedAreas.length > 0 ? allowedAreas.map((area, idx) => (
                                        <span key={idx} className="bg-white/80 px-2 py-1 rounded text-xs font-semibold text-gray-700 shadow-sm">
                                            {area}
                                        </span>
                                    )) : (
                                        <span className="text-gray-500 text-sm font-medium">Tidak ada area akses</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <img src="/logo.png" alt="Logo" className="h-8 mx-auto grayscale opacity-50" onError={(e) => e.target.style.display='none'} />
                        <p className="text-xs text-gray-400 mt-2 font-medium">PT Semen Padang - Visitor Management System</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
