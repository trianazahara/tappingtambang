import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Plus, Loader2, AlertCircle, Edit, Power, PowerOff, ArrowLeft, Search, Filter } from 'lucide-react';

export default function Area() {
    const [view, setView] = useState('table'); // 'table' | 'form'
    const [areas, setAreas] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');

    // Form State
    const [editId, setEditId] = useState(null);
    const [namaArea, setNamaArea] = useState('');
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/area`);
            if (res.data.success) {
                setAreas(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data area');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'table') {
            fetchAreas();
            setError('');
            setSuccess('');
        }
    }, [view]);

    const handleOpenAdd = () => {
        setEditId(null);
        setNamaArea('');
        setView('form');
    };

    const handleOpenEdit = (area) => {
        setEditId(area.id_area);
        setNamaArea(area.nama_area);
        setView('form');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitLoading(true);

        try {
            if (editId) {
                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/area/${editId}`, { nama_area: namaArea });
                if (res.data.success) setSuccess('Area berhasil diupdate!');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/area`, { nama_area: namaArea });
                if (res.data.success) setSuccess('Area berhasil ditambahkan!');
            }
            
            setTimeout(() => setView('table'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan area');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Yakin ingin ${currentStatus === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan'} area ini?`)) return;
        
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/area/${id}/status`);
            if (res.data.success) {
                fetchAreas();
            }
        } catch (err) {
            alert('Gagal mengubah status area');
        }
    };

    // Filter Logic
    const filteredAreas = areas.filter(area => {
        const matchesSearch = area.nama_area.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'Semua' || area.status_area === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Area</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola data master area kerja PT Semen Padang.</p>
                </div>
                {view === 'table' ? (
                    <button
                        onClick={handleOpenAdd}
                        className="py-2.5 px-4 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md shadow-[#E11D2E]/20 flex justify-center items-center gap-2"
                    >
                        <Plus size={18} />
                        Tambah Area
                    </button>
                ) : (
                    <button
                        onClick={() => setView('table')}
                        className="py-2 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium transition-all flex justify-center items-center gap-2 shadow-sm"
                    >
                        <ArrowLeft size={18} />
                        Kembali
                    </button>
                )}
            </div>

            {view === 'table' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Toolbar Pencarian dan Filter */}
                    <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 bg-gray-50/30">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama area..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none text-sm"
                            />
                        </div>
                        <div className="relative w-full sm:w-48">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Filter size={18} />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white text-sm appearance-none"
                            >
                                <option value="Semua">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Nonaktif">Nonaktif</option>
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Loader2 size={32} className="animate-spin text-[#E11D2E] mb-2" />
                            <p className="text-sm">Memuat data area...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-medium">
                                        <th className="px-6 py-4 w-20">ID</th>
                                        <th className="px-6 py-4">Nama Area</th>
                                        <th className="px-6 py-4 w-32">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredAreas.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-10 text-center text-gray-400">
                                                {areas.length === 0 ? 'Belum ada data area.' : 'Tidak ada data yang cocok dengan pencarian/filter.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAreas.map((area) => (
                                            <tr key={area.id_area} className={`hover:bg-gray-50/50 transition-colors ${area.status_area === 'Nonaktif' ? 'opacity-50' : ''}`}>
                                                <td className="px-6 py-4 font-medium text-gray-500">#{area.id_area}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium text-gray-900">
                                                        <MapPin size={16} className="text-[#E11D2E]" />
                                                        {area.nama_area}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium text-xs ${area.status_area === 'Aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {area.status_area}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => handleOpenEdit(area)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(area.id_area, area.status_area)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title={area.status_area === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}>
                                                        {area.status_area === 'Aktif' ? <PowerOff size={16} /> : <Power size={16} />}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {view === 'form' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                        <div className="h-10 w-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                            {editId ? <Edit size={20} /> : <Plus size={20} />}
                        </div>
                        {editId ? 'Edit Area' : 'Tambah Area Baru'}
                    </h2>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <MapPin size={16} className="text-green-600" />
                            </div>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-gray-700">Nama Area</label>
                            <input
                                type="text"
                                value={namaArea}
                                onChange={(e) => setNamaArea(e.target.value)}
                                placeholder="Contoh: Pit Tambang Timur"
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none"
                                required
                            />
                        </div>
                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="py-2.5 px-8 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md shadow-[#E11D2E]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                            >
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Area'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
