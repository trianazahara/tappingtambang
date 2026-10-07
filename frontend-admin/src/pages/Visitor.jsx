import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, CheckCircle2, User, Phone, Briefcase, MapPin, Search, IdCard, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Visitor() {
    const [activeTab, setActiveTab] = useState('cards'); // 'cards' | 'sessions'
    
    // Cards state
    const [cards, setCards] = useState([]);
    
    // Sessions state
    const [visitors, setVisitors] = useState([]);
    const [areas, setAreas] = useState([]);
    const [instansiList, setInstansiList] = useState([]);
    const [kendaraanList, setKendaraanList] = useState([]);
    
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Modals
    const [cardModal, setCardModal] = useState(false);
    const [sessionModal, setSessionModal] = useState(false);
    const [confirmSelesai, setConfirmSelesai] = useState(null);
    
    // Edit state
    const [editCardId, setEditCardId] = useState(null);
    const [editSessionId, setEditSessionId] = useState(null);
    
    // Forms
    const [cardForm, setCardForm] = useState({ nomor_kartu: '', uid_kartu: '' });
    const [sessionForm, setSessionForm] = useState({
        nomor_kartu: '',
        nama: '',
        no_telp: '',
        perusahaan: '',
        warna_permit: 'Merah',
        area_akses: [],
        type_unit: '',
        nomor_license: '',
        issued_at: '',
        berlaku_hingga: (() => {
            const tmr = new Date();
            tmr.setDate(tmr.getDate() + 1);
            tmr.setHours(17, 0, 0, 0); 
            return tmr.toISOString().slice(0,16);
        })()
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'cards') {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/visitor/cards`);
                setCards(res.data.data);
            } else {
                const [resVisitor, resArea, resInstansi] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/visitor`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/area`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`)
                ]);
                setVisitors(resVisitor.data.data);
                setAreas(resArea.data.data);
                setInstansiList(resInstansi.data.data.filter(i => i.status_instansi === 'Aktif'));
            }
        } catch (err) {
            toast.error("Gagal mengambil data");
        } finally {
            setLoading(false);
        }
    };

    const handleAreaChange = (id_area) => {
        setSessionForm(prev => {
            const current = [...prev.area_akses];
            if (current.includes(id_area)) {
                return { ...prev, area_akses: current.filter(id => id !== id_area) };
            } else {
                return { ...prev, area_akses: [...current, id_area] };
            }
        });
    };

    // Card Handlers
    const handleCardSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editCardId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/visitor/cards/${editCardId}`, cardForm);
                if (res.data.success) toast.success('Kartu berhasil diupdate');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/visitor/cards`, cardForm);
                if (res.data.success) toast.success('Kartu berhasil ditambahkan');
            }
            setCardModal(false);
            setEditCardId(null);
            setCardForm({ nomor_kartu: '', uid_kartu: '' });
            fetchData();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan kartu');
        }
    };

    const handleEditCard = (c) => {
        setEditCardId(c.id_kartu);
        setCardForm({ nomor_kartu: c.nomor_kartu, uid_kartu: c.uid_kartu || '' });
        setCardModal(true);
    };

    const handleDeleteCard = async (id) => {
        if (!window.confirm("Hapus kartu ini?")) return;
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/visitor/cards/${id}`);
            if (res.data.success) {
                toast.success('Kartu berhasil dihapus');
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menghapus kartu');
        }
    };

    // Session Handlers
    const handleSessionSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...sessionForm };
            if (payload.perusahaan === 'Lainnya') {
                const namaInstansiBaru = payload.perusahaanLainnya || 'Lainnya';
                payload.perusahaan = namaInstansiBaru;
                
                // Simpan instansi baru ke database
                if (namaInstansiBaru !== 'Lainnya') {
                    try {
                        await axios.post(`${import.meta.env.VITE_API_URL}/api/instansi`, {
                            nama_instansi: namaInstansiBaru,
                            kategori_instansi: 'Visitor'
                        });
                    } catch (err) {
                        console.error('Gagal menambahkan instansi otomatis', err);
                    }
                }
            }

            if (editSessionId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/visitor/${editSessionId}`, payload);
                if (res.data.success) toast.success('Data visitor berhasil diupdate');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/visitor`, payload);
                if (res.data.success) toast.success('Visitor berhasil ditambahkan');
            }
            
            setSessionModal(false);
            setEditSessionId(null);
            setSessionForm({ 
                nomor_kartu: '', nama: '', no_telp: '', perusahaan: '', warna_permit: 'Merah', area_akses: [], type_unit: '', nomor_license: '', issued_at: '',
                berlaku_hingga: (() => {
                    const tmr = new Date();
                    tmr.setDate(tmr.getDate() + 1);
                    tmr.setHours(17, 0, 0, 0); 
                    return tmr.toISOString().slice(0,16);
                })() 
            });
            // Auto switch to sessions tab or refresh
            if (activeTab === 'cards') {
                setActiveTab('sessions');
            } else {
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan data');
        }
    };

    const handleAssignVisitor = (nomor_kartu) => {
        // Prepare to fetch areas and instansi if we haven't
        if (areas.length === 0 || instansiList.length === 0 || kendaraanList.length === 0) {
            Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/area`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`)
            ]).then(([resArea, resInstansi, resKendaraan]) => {
                setAreas(resArea.data.data);
                setInstansiList(resInstansi.data.data.filter(i => i.status_instansi === 'Aktif'));
                setKendaraanList(resKendaraan.data.data);
            });
        }
        setEditSessionId(null);
        setSessionForm(prev => ({ ...prev, nomor_kartu, nama: '', no_telp: '', perusahaan: '', area_akses: [], type_unit: '', nomor_license: '', issued_at: '' }));
        setSessionModal(true);
    };

    const handleEditSession = (v) => {
        if (areas.length === 0 || instansiList.length === 0 || kendaraanList.length === 0) {
            Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/area`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`),
                axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`)
            ]).then(([resArea, resInstansi, resKendaraan]) => {
                setAreas(resArea.data.data);
                setInstansiList(resInstansi.data.data.filter(i => i.status_instansi === 'Aktif'));
                setKendaraanList(resKendaraan.data.data);
            });
        }
        setEditSessionId(v.id_visitor);
        setSessionForm({
            nomor_kartu: v.nomor_kartu || '',
            nama: v.nama || '',
            no_telp: v.no_telp || '',
            perusahaan: v.perusahaan || '',
            warna_permit: v.warna_permit || 'Merah',
            area_akses: v.area_akses || [],
            type_unit: v.type_unit || '',
            nomor_license: v.nomor_license || '',
            issued_at: v.issued_at || '',
            berlaku_hingga: v.berlaku_hingga ? new Date(new Date(v.berlaku_hingga).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : ''
        });
        setSessionModal(true);
    };

    const handleSelesai = async (id) => {
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/visitor/${id}/selesai`);
            if (res.data.success) {
                toast.success('Status visitor berhasil diubah menjadi Selesai');
                fetchData();
            }
        } catch (err) {
            toast.error('Gagal menyelesaikan visitor');
        } finally {
            setConfirmSelesai(null);
        }
    };

    const filteredCards = cards.filter(c => 
        (c.nomor_kartu?.toLowerCase().includes(search.toLowerCase()) || 
         c.uid_kartu?.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredSessions = visitors.filter(v => 
        (v.nama?.toLowerCase().includes(search.toLowerCase()) || 
        v.nomor_kartu?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Visitor</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola data kartu dan riwayat peminjaman Visitor</p>
                </div>
                {activeTab === 'cards' && (
                    <button onClick={() => {
                        setEditCardId(null);
                        setCardForm({ nomor_kartu: '', uid_kartu: '' });
                        setCardModal(true);
                    }} className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl flex items-center gap-2 transition-colors font-medium shadow-md shadow-red-500/20">
                        <Plus size={18} /> Tambah Kartu Baru
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('cards')}
                    className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'cards' ? 'border-b-2 border-[#E11D2E] text-[#E11D2E]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <IdCard size={18} /> Daftar Kartu Visitor
                </button>
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={`pb-4 px-2 font-medium flex items-center gap-2 transition-colors ${activeTab === 'sessions' ? 'border-b-2 border-[#E11D2E] text-[#E11D2E]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock size={18} /> Riwayat Penggunaan
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={activeTab === 'cards' ? "Cari nomor kartu / UID..." : "Cari nama atau nomor kartu..."}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E]"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    {activeTab === 'cards' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                    <th className="p-4 font-medium">Nomor Kartu</th>
                                    <th className="p-4 font-medium">UID NFC</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                                ) : filteredCards.length === 0 ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-gray-500">Tidak ada kartu</td></tr>
                                ) : (
                                    filteredCards.map(c => (
                                        <tr key={c.id_kartu} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800">{c.nomor_kartu}</td>
                                            <td className="p-4 text-gray-600 font-mono text-sm">{c.uid_kartu || '-'}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    c.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {c.status === 'Tersedia' ? (
                                                    <button onClick={() => handleAssignVisitor(c.nomor_kartu)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors">
                                                        Tambah Pengguna
                                                    </button>
                                                ) : (
                                                    <span className="px-3 py-1.5 text-gray-400 text-sm font-medium">
                                                        Sedang Dipakai
                                                    </span>
                                                )}
                                                <button onClick={() => handleEditCard(c)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
                                                    Edit Kartu
                                                </button>
                                                {c.status === 'Tersedia' && (
                                                    <button onClick={() => handleDeleteCard(c.id_kartu)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-sm font-medium transition-colors">
                                                        Hapus
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-500 text-sm border-b border-gray-100">
                                    <th className="p-4 font-medium">Nomor Kartu</th>
                                    <th className="p-4 font-medium">Data Visitor</th>
                                    <th className="p-4 font-medium">Permit & Area</th>
                                    <th className="p-4 font-medium">Waktu Masuk</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                                ) : filteredSessions.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-gray-500">Tidak ada riwayat</td></tr>
                                ) : (
                                    filteredSessions.map(v => (
                                        <tr key={v.id_visitor} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="p-4 font-bold text-gray-800">{v.nomor_kartu}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-gray-800">{v.nama}</div>
                                                <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                                                    <span className="flex items-center gap-1"><Phone size={12}/> {v.no_telp || '-'}</span>
                                                    <span className="flex items-center gap-1"><Briefcase size={12}/> {v.perusahaan || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium 
                                                    ${v.warna_permit === 'Merah' ? 'bg-red-100 text-red-700' : 
                                                    v.warna_permit === 'Orange' ? 'bg-orange-100 text-orange-700' : 
                                                    v.warna_permit === 'Biru' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {v.warna_permit}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={v.area_akses?.length + ' Area'}>
                                                    {v.area_akses?.length} Area Akses
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {new Date(v.tanggal_masuk).toLocaleString('id-ID')}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    v.status === 'Aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {v.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {v.status === 'Aktif' && (
                                                    <>
                                                        <a 
                                                            href={`/print-card/${v.uid_kartu || v.nomor_kartu}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-gray-50 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Cetak
                                                        </a>
                                                        <a 
                                                            href={`/v/${v.uid_kartu || v.nomor_kartu}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            ID
                                                        </a>
                                                        <button onClick={() => handleEditSession(v)} className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-sm font-medium transition-colors">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => setConfirmSelesai(v.id_visitor)} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium transition-colors">
                                                            Selesai
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal Tambah/Edit Master Kartu */}
            {cardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">{editCardId ? 'Edit Kartu' : 'Tambah Kartu Baru'}</h3>
                            <button onClick={() => setCardModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                        </div>
                        <form onSubmit={handleCardSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Kartu (Visual)</label>
                                <input 
                                    type="text" required value={cardForm.nomor_kartu} 
                                    onChange={e => setCardForm({...cardForm, nomor_kartu: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                    placeholder="Contoh: VIS-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">UID NFC (Opsional)</label>
                                <input 
                                    type="text" value={cardForm.uid_kartu} 
                                    onChange={e => setCardForm({...cardForm, uid_kartu: e.target.value})}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                    placeholder="Scan kartu NFC ke sini"
                                />
                            </div>
                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                <button type="button" onClick={() => setCardModal(false)} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Batal</button>
                                <button type="submit" className="px-5 py-2 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium shadow-md shadow-red-500/20 transition-colors">Simpan</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah/Edit Sesi Pengguna */}
            {sessionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-gray-800">{editSessionId ? 'Edit Data Visitor' : `Tambah Pengguna (${sessionForm.nomor_kartu})`}</h3>
                            <button onClick={() => setSessionModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <form onSubmit={handleSessionSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                                        <input 
                                            type="text" required value={sessionForm.nama} 
                                            onChange={e => setSessionForm({...sessionForm, nama: e.target.value})}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">No. HP / WA</label>
                                        <input 
                                            type="text" required value={sessionForm.no_telp} 
                                            onChange={e => setSessionForm({...sessionForm, no_telp: e.target.value})}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan / Instansi</label>
                                        <select 
                                            required 
                                            value={sessionForm.perusahaan} 
                                            onChange={e => setSessionForm({...sessionForm, perusahaan: e.target.value})}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E] appearance-none bg-white"
                                        >
                                            <option value="" disabled>Pilih Instansi</option>
                                            {instansiList.map((instansi) => (
                                                <option key={instansi.id_instansi} value={instansi.nama_instansi}>
                                                    {instansi.nama_instansi}
                                                </option>
                                            ))}
                                            <option value="Lainnya">Lainnya...</option>
                                        </select>
                                        {sessionForm.perusahaan === 'Lainnya' && (
                                            <input 
                                                type="text" required 
                                                onChange={e => setSessionForm({...sessionForm, perusahaanLainnya: e.target.value})}
                                                placeholder="Ketik nama perusahaan..."
                                                className="w-full mt-2 px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Warna Permit</label>
                                        <select 
                                            value={sessionForm.warna_permit} 
                                            onChange={e => setSessionForm({...sessionForm, warna_permit: e.target.value})}
                                            className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E] appearance-none bg-white"
                                        >
                                            <option value="Merah">Merah</option>
                                            <option value="Orange">Orange</option>
                                            <option value="Biru">Biru</option>
                                            <option value="Hijau">Hijau</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Berlaku Hingga</label>
                                    <input 
                                        type="datetime-local" required value={sessionForm.berlaku_hingga} 
                                        onChange={e => setSessionForm({...sessionForm, berlaku_hingga: e.target.value})}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E]"
                                    />
                                </div>
                                
                                {(sessionForm.warna_permit === 'Biru' || sessionForm.warna_permit === 'Hijau' || sessionForm.warna_permit === 'Orange') && (
                                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
                                        <h4 className="text-sm font-bold text-blue-800 mb-2">Informasi Kendaraan & Lisensi (Wajib untuk permit Biru/Hijau/Orange)</h4>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Type Unit (Kendaraan)</label>
                                            <select 
                                                required value={sessionForm.type_unit} 
                                                onChange={e => setSessionForm({...sessionForm, type_unit: e.target.value})}
                                                className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E] bg-white appearance-none"
                                            >
                                                <option value="" disabled>Pilih Kendaraan...</option>
                                                {kendaraanList.map(k => (
                                                    <option key={k.id_kendaraan} value={k.nama_kendaraan}>{k.nama_kendaraan}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor License</label>
                                                <input 
                                                    type="text" required value={sessionForm.nomor_license} 
                                                    onChange={e => setSessionForm({...sessionForm, nomor_license: e.target.value})}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E] bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Issued At</label>
                                                <input 
                                                    type="date" required value={sessionForm.issued_at} 
                                                    onChange={e => setSessionForm({...sessionForm, issued_at: e.target.value})}
                                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-[#E11D2E] focus:border-[#E11D2E] bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Area Akses yang Diizinkan</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-[200px] overflow-y-auto">
                                        {areas.map(area => (
                                            <label key={area.id_area} className="flex items-center gap-3 cursor-pointer group">
                                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors
                                                    ${sessionForm.area_akses.includes(area.id_area) 
                                                        ? 'bg-[#E11D2E] border-[#E11D2E]' 
                                                        : 'bg-white border-gray-300 group-hover:border-[#E11D2E]'}`}>
                                                    {sessionForm.area_akses.includes(area.id_area) && <CheckCircle2 size={14} className="text-white" />}
                                                </div>
                                                <span className="text-sm text-gray-700 select-none group-hover:text-gray-900">{area.nama_area}</span>
                                                <input 
                                                    type="checkbox" className="hidden"
                                                    checked={sessionForm.area_akses.includes(area.id_area)}
                                                    onChange={() => handleAreaChange(area.id_area)}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                                    <button type="button" onClick={() => setSessionModal(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors">Batal</button>
                                    <button type="submit" className="px-5 py-2.5 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium shadow-md shadow-red-500/20 transition-colors">Simpan Data</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
            {/* Selesai Confirm Modal */}
            {confirmSelesai && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Akhiri Kunjungan?</h3>
                        <p className="text-gray-500 mb-6">Apakah visitor ini sudah selesai dan kartu telah dikembalikan?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmSelesai(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Batal</button>
                            <button onClick={() => handleSelesai(confirmSelesai)} className="flex-1 px-4 py-2.5 rounded-xl bg-[#E11D2E] text-white font-medium hover:bg-[#B0121F]">Ya, Selesai</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
