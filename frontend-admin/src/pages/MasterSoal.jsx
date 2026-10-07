import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';

export default function MasterSoal() {
    const [soal, setSoal] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        pertanyaan: '',
        pilihan_a: '',
        pilihan_b: '',
        pilihan_c: '',
        pilihan_d: '',
        kunci_jawaban: 'A',
        status_soal: 'Aktif',
        id_kendaraan: ''
    });
    const [fileGambar, setFileGambar] = useState(null);
    const [editId, setEditId] = useState(null);
    const [masterKendaraan, setMasterKendaraan] = useState([]);

    const fetchSoal = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/soal`);
            setSoal(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch soal', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterKendaraan = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`);
            setMasterKendaraan(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch kendaraan', error);
        }
    };

    useEffect(() => {
        fetchSoal();
        fetchMasterKendaraan();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (item) => {
        setEditId(item.id_soal);
        setFormData({
            pertanyaan: item.pertanyaan,
            pilihan_a: item.pilihan_a,
            pilihan_b: item.pilihan_b,
            pilihan_c: item.pilihan_c,
            pilihan_d: item.pilihan_d,
            kunci_jawaban: item.kunci_jawaban,
            status_soal: item.status_soal,
            id_kendaraan: item.id_kendaraan || ''
        });
        setFileGambar(null);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Yakin ingin menghapus soal ini?')) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/soal/${id}`);
            fetchSoal();
        } catch (error) {
            console.error('Failed to delete soal', error);
            alert('Gagal menghapus soal');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            Object.keys(formData).forEach(key => {
                fd.append(key, formData[key]);
            });
            if (fileGambar) {
                fd.append('file_gambar', fileGambar);
            }

            if (editId) {
                await axios.put(`${import.meta.env.VITE_API_URL}/api/soal/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/soal`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
            }
            setShowModal(false);
            fetchSoal();
        } catch (error) {
            console.error('Failed to save soal', error);
            alert('Gagal menyimpan soal');
        }
    };

    const openAddModal = () => {
        setEditId(null);
        setFormData({
            pertanyaan: '',
            pilihan_a: '',
            pilihan_b: '',
            pilihan_c: '',
            pilihan_d: '',
            kunci_jawaban: 'A',
            status_soal: 'Aktif',
            id_kendaraan: ''
        });
        setFileGambar(null);
        setShowModal(true);
    };

    const filteredSoal = soal.filter(s => s.pertanyaan.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Bank Soal</h1>
                    <p className="text-gray-500 mt-1">Kelola pertanyaan dan kunci jawaban untuk Ujian Online K3.</p>
                </div>
                <button onClick={openAddModal} className="bg-[#E11D2E] text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-[#B0121F] transition-all">
                    <Plus size={20} />
                    Tambah Soal
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Cari soal..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                                <th className="p-4 font-medium">No</th>
                                <th className="p-4 font-medium w-1/3">Pertanyaan</th>
                                <th className="p-4 font-medium">Kunci Jawaban</th>
                                <th className="p-4 font-medium">Jenis Kendaraan</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10">
                                        <Loader2 className="animate-spin text-gray-400 mx-auto" size={32} />
                                    </td>
                                </tr>
                            ) : filteredSoal.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-gray-500">
                                        Tidak ada soal ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredSoal.map((item, index) => (
                                    <tr key={item.id_soal} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">{index + 1}</td>
                                        <td className="p-4 text-sm text-gray-900">
                                            <div className="line-clamp-2">{item.pertanyaan}</div>
                                            {item.file_gambar && (
                                                <a href={`${import.meta.env.VITE_API_URL}/uploads/${item.file_gambar.split(/[/\\]/).pop()}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                                    Lihat Gambar
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-700">
                                            {item.kunci_jawaban}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {item.master_kendaraan?.nama_kendaraan || 'Umum'}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                item.status_soal === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.status_soal}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => handleEdit(item)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(item.id_soal)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-6 md:p-8 my-8 shadow-xl relative">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            {editId ? 'Edit Soal' : 'Tambah Soal Baru'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                                <textarea 
                                    name="pertanyaan" 
                                    value={formData.pertanyaan} 
                                    onChange={handleChange} 
                                    required
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Gambar Pelengkap (Opsional)</label>
                                <input 
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => setFileGambar(e.target.files[0])} 
                                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none bg-white text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">Gunakan gambar jika soal merujuk pada objek tertentu (misal: rambu, alat ukur).</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {['a', 'b', 'c', 'd'].map(opt => (
                                    <div key={opt}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                                        <div className="flex">
                                            <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 rounded-l-xl font-bold">
                                                {opt.toUpperCase()}
                                            </span>
                                            <input 
                                                type="text"
                                                name={`pilihan_${opt}`} 
                                                value={formData[`pilihan_${opt}`]} 
                                                onChange={handleChange} 
                                                required
                                                className="w-full px-4 py-2 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban</label>
                                    <select 
                                        name="kunci_jawaban" 
                                        value={formData.kunci_jawaban} 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none font-bold bg-white"
                                    >
                                        <option value="A">A</option>
                                        <option value="B">B</option>
                                        <option value="C">C</option>
                                        <option value="D">D</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Soal</label>
                                    <select 
                                        name="status_soal" 
                                        value={formData.status_soal} 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none bg-white"
                                    >
                                        <option value="Aktif">Aktif</option>
                                        <option value="Nonaktif">Nonaktif</option>
                                    </select>
                                </div>
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kendaraan</label>
                                    <select 
                                        name="id_kendaraan" 
                                        value={formData.id_kendaraan} 
                                        onChange={handleChange} 
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none bg-white"
                                    >
                                        <option value="">Umum (Semua Kendaraan)</option>
                                        {masterKendaraan.map(k => (
                                            <option key={k.id_kendaraan} value={k.id_kendaraan}>{k.nama_kendaraan}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-6 border-t border-gray-100 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="flex-1 px-4 py-3 rounded-xl bg-[#E11D2E] text-white font-medium hover:bg-[#B0121F] transition-colors">
                                    Simpan Soal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
