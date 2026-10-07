import { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Plus, Loader2, AlertCircle, Edit, Trash2, ArrowLeft, Search, Filter, CheckCircle2 } from 'lucide-react';

export default function MasterKendaraan() {
    const [view, setView] = useState('table'); // 'table' | 'form'
    const [kendaraanList, setKendaraanList] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [kategoriFilter, setKategoriFilter] = useState('Semua');

    // Form State
    const [editId, setEditId] = useState(null);
    const [formData, setFormData] = useState({
        nama_kendaraan: '',
        kategori_kendaraan: 'Roda 4',
        warna_permit: 'Hijau',
        syarat_dokumen: 'SIM A',
        type_unit: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchKendaraan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`);
            if (res.data.success) {
                setKendaraanList(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data kendaraan');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'table') {
            fetchKendaraan();
            setError('');
            setSuccess('');
        }
    }, [view]);

    const handleOpenAdd = () => {
        setEditId(null);
        setFormData({
            nama_kendaraan: '',
            kategori_kendaraan: 'Roda 4',
            warna_permit: 'Hijau',
            syarat_dokumen: 'SIM A',
            type_unit: ''
        });
        setView('form');
    };

    const handleOpenEdit = (kendaraan) => {
        setEditId(kendaraan.id_kendaraan);
        setFormData({
            nama_kendaraan: kendaraan.nama_kendaraan,
            kategori_kendaraan: kendaraan.kategori_kendaraan,
            warna_permit: kendaraan.warna_permit,
            syarat_dokumen: kendaraan.syarat_dokumen,
            type_unit: kendaraan.type_unit || ''
        });
        setView('form');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitLoading(true);

        try {
            if (editId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/kendaraan/${editId}`, formData);
                if (res.data.success) setSuccess('Kendaraan berhasil diupdate!');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/kendaraan`, formData);
                if (res.data.success) setSuccess('Kendaraan berhasil ditambahkan!');
            }
            
            setTimeout(() => setView('table'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan kendaraan');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm(`Yakin ingin menghapus data kendaraan ini?`)) return;
        
        try {
            const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/kendaraan/${id}`);
            if (res.data.success) {
                fetchKendaraan();
            }
        } catch (err) {
            alert('Gagal menghapus kendaraan');
        }
    };

    // Filter Logic
    const filteredKendaraan = kendaraanList.filter(k => {
        const matchesSearch = k.nama_kendaraan.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesKategori = kategoriFilter === 'Semua' || k.kategori_kendaraan === kategoriFilter;
        return matchesSearch && matchesKategori;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Master Kendaraan</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola jenis kendaraan, alat berat, dan warna permit</p>
                </div>
                {view === 'table' && (
                    <button onClick={handleOpenAdd} className="flex items-center gap-2 bg-[#E11D2E] text-white px-5 py-2.5 rounded-xl hover:bg-[#B0121F] transition-colors shadow-md shadow-red-500/20 font-medium">
                        <Plus size={18} /> Tambah Kendaraan
                    </button>
                )}
            </div>

            {/* Error / Success Messages */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                    <AlertCircle size={20} /> <p className="font-medium">{error}</p>
                </div>
            )}
            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                    <CheckCircle2 size={20} /> <p className="font-medium">{success}</p>
                </div>
            )}

            {view === 'table' ? (
                <div className="space-y-4">
                    {/* Filters */}
                    <div className="flex gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Cari nama kendaraan..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <select 
                                value={kategoriFilter}
                                onChange={(e) => setKategoriFilter(e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:outline-none focus:border-[#E11D2E]"
                            >
                                <option value="Semua">Semua Kategori</option>
                                <option value="Roda 4">Roda 4</option>
                                <option value="Roda 6">Roda 6</option>
                                <option value="> Roda 6">&gt; Roda 6</option>
                                <option value="Alat Berat">Alat Berat</option>
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4">No</th>
                                        <th className="px-6 py-4">Nama Kendaraan</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Type Unit</th>
                                        <th className="px-6 py-4">Warna Permit</th>
                                        <th className="px-6 py-4">Syarat Dokumen</th>
                                        <th className="px-6 py-4 text-center">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-2" size={24}/> Memuat data...</td></tr>
                                    ) : filteredKendaraan.length === 0 ? (
                                        <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">Tidak ada data kendaraan ditemukan.</td></tr>
                                    ) : (
                                        filteredKendaraan.map((item, index) => (
                                            <tr key={item.id_kendaraan} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800 flex items-center gap-2">
                                                    <Truck size={16} className="text-gray-400" /> {item.nama_kendaraan}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium border border-gray-200">
                                                        {item.kategori_kendaraan}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.type_unit || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                                        item.warna_permit === 'Hijau' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        item.warna_permit === 'Biru' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                        {item.warna_permit}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.syarat_dokumen === 'SIM B2' ? 'SIM B2 / Sertifikat' : item.syarat_dokumen === 'SIO' ? 'SIO / Sertifikat Pelatihan' : item.syarat_dokumen}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <button onClick={() => handleOpenEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                            <Edit size={18} />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id_kendaraan)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                    <button onClick={() => setView('table')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 transition-colors">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                    
                    <h2 className="text-xl font-bold text-gray-800 mb-6 pb-2 border-b">{editId ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</h2>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Nama Kendaraan / Alat Berat</label>
                            <input 
                                type="text" 
                                name="nama_kendaraan"
                                value={formData.nama_kendaraan} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-all" 
                                placeholder="Misal: Dump Truck, Dozer..." 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Kategori Kendaraan</label>
                            <select 
                                name="kategori_kendaraan"
                                value={formData.kategori_kendaraan} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                            >
                                <option value="Roda 4">Roda 4 (LV, dll)</option>
                                <option value="Roda 6">Roda 6 (Medium Truck)</option>
                                <option value="> Roda 6">&gt; Roda 6 (Heavy Truck)</option>
                                <option value="Alat Berat">Alat Berat (Dozer, Excavator, dll)</option>
                            </select>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Type Unit (Opsional)</label>
                            <input 
                                type="text" 
                                name="type_unit"
                                value={formData.type_unit} 
                                onChange={handleInputChange} 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] transition-all" 
                                placeholder="Misal: P460, P410..." 
                            />
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Warna Permit</label>
                            <select 
                                name="warna_permit"
                                value={formData.warna_permit} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                            >
                                <option value="Hijau">Hijau</option>
                                <option value="Biru">Biru</option>
                                <option value="Orange">Orange</option>
                            </select>
                        </div>
                        
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Syarat Dokumen Mengemudi</label>
                            <select 
                                name="syarat_dokumen"
                                value={formData.syarat_dokumen} 
                                onChange={handleInputChange} 
                                required 
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                            >
                                <option value="SIM A">SIM A</option>
                                <option value="SIM B1">SIM B1</option>
                                <option value="SIM B2">SIM B2 / Sertifikat</option>
                                <option value="SIO">SIO / Sertifikat Pelatihan</option>
                                <option value="Tidak Ada">Tidak Ada Syarat Khusus</option>
                            </select>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setView('table')} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors font-medium">
                                Batal
                            </button>
                            <button type="submit" disabled={submitLoading} className="flex-[2] px-4 py-2.5 rounded-xl bg-[#E11D2E] hover:bg-[#B0121F] text-white transition-colors font-medium shadow-md shadow-red-500/20 flex justify-center items-center gap-2">
                                {submitLoading ? <Loader2 className="animate-spin" size={18} /> : (editId ? 'Simpan Perubahan' : 'Tambah Kendaraan')}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
