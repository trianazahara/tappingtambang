import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Plus, Edit2, Trash2, Search, Loader2, Upload, Download, 
    FileSpreadsheet, AlertCircle, CheckCircle2, X, HelpCircle, 
    Info, FileText, ChevronDown, ChevronUp, SlidersHorizontal, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';

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

    // State untuk Import Excel
    const [showImportModal, setShowImportModal] = useState(false);
    const [importFile, setImportFile] = useState(null);
    const [importDefaultKendaraan, setImportDefaultKendaraan] = useState('');
    const [importing, setImporting] = useState(false);
    const [downloadingTemplate, setDownloadingTemplate] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [showSkippedDetails, setShowSkippedDetails] = useState(false);
    const fileInputRef = useRef(null);

    // State untuk Pengaturan Ujian (Random soal & Batas Waktu)
    const [showSettingModal, setShowSettingModal] = useState(false);
    const [examSettings, setExamSettings] = useState({
        jumlah_soal: 20,
        gunakan_waktu: true,
        durasi_menit: 60,
        passing_grade: 76,
        kendaraan_list: []
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [submittingSoal, setSubmittingSoal] = useState(false);

    const fetchSoal = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/soal`);
            setSoal(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch soal', error);
            toast.error('Gagal mengambil data soal');
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

    const fetchExamSettings = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/ujian/setting`);
            if (res.data?.data) {
                setExamSettings(res.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch exam settings', error);
        }
    };

    const handleVehicleLimitChange = (id_kendaraan, value) => {
        const parsed = Math.max(1, parseInt(value) || 1);
        setExamSettings(prev => ({
            ...prev,
            kendaraan_list: (prev.kendaraan_list || []).map(k => 
                k.id_kendaraan === id_kendaraan ? { ...k, jumlah_soal: parsed } : k
            )
        }));
    };

    useEffect(() => {
        fetchSoal();
        fetchMasterKendaraan();
        fetchExamSettings();
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
            toast.success('Soal berhasil dihapus');
            fetchSoal();
        } catch (error) {
            console.error('Failed to delete soal', error);
            toast.error('Gagal menghapus soal');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submittingSoal) return;
        setSubmittingSoal(true);
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
                toast.success('Soal berhasil diperbarui');
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/api/soal`, fd, { headers: { 'Content-Type': 'multipart/form-data' }});
                toast.success('Soal baru berhasil ditambahkan');
            }
            setShowModal(false);
            setEditId(null);
            setFileGambar(null);
            fetchSoal();
        } catch (error) {
            console.error('Failed to save soal', error);
            toast.error(error.response?.data?.message || 'Gagal menyimpan soal');
        } finally {
            setSubmittingSoal(false);
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

    // Download Template Excel
    const handleDownloadTemplate = async () => {
        setDownloadingTemplate(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/soal/template`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Template_Bank_Soal.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('Template berhasil diunduh');
        } catch (error) {
            console.error('Failed to download template', error);
            toast.error('Gagal mengunduh template Excel');
        } finally {
            setDownloadingTemplate(false);
        }
    };

    // Handle File Change for Import
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const validExts = ['.xlsx', '.xls', '.csv'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            if (!validExts.includes(fileExt)) {
                toast.error('Format file tidak didukung. Harap pilih file .xlsx, .xls, atau .csv');
                return;
            }
            setImportFile(file);
            setImportResult(null);
        }
    };

    // Submit Import Excel
    const handleImportSubmit = async (e) => {
        e.preventDefault();
        if (importing) return;
        if (!importFile) {
            toast.error('Silakan pilih file Excel / CSV terlebih dahulu');
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            const fd = new FormData();
            fd.append('file', importFile);
            if (importDefaultKendaraan) {
                fd.append('id_kendaraan_default', importDefaultKendaraan);
            }

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/soal/import`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success(res.data.message || 'Import berhasil!');
                setShowImportModal(false);
                setImportFile(null);
                setImportResult(null);
                setShowSkippedDetails(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
                fetchSoal();
            } else {
                toast.error(res.data.message || 'Gagal mengimpor soal');
            }
        } catch (error) {
            console.error('Failed to import soal', error);
            const errRes = error.response?.data;
            if (errRes && errRes.message) {
                toast.error(errRes.message);
                if (errRes.skipped) {
                    setImportResult(errRes);
                }
            } else {
                toast.error('Terjadi kesalahan saat mengunggah file');
            }
        } finally {
            setImporting(false);
        }
    };

    const handleCloseImportModal = () => {
        setShowImportModal(false);
        setImportFile(null);
        setImportResult(null);
        setShowSkippedDetails(false);
    };

    // Save Exam Settings
    const handleSaveExamSettings = async (e) => {
        e.preventDefault();
        if (savingSettings) return;
        setSavingSettings(true);
        try {
            const payload = {
                jumlah_soal: examSettings.jumlah_soal,
                gunakan_waktu: examSettings.gunakan_waktu,
                durasi_menit: examSettings.durasi_menit,
                passing_grade: examSettings.passing_grade,
                kendaraan_settings: examSettings.kendaraan_list?.map(k => ({
                    id_kendaraan: k.id_kendaraan,
                    jumlah_soal: k.jumlah_soal
                })) || []
            };

            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/ujian/setting`, payload);
            if (res.data.success) {
                toast.success('Pengaturan ujian berhasil disimpan!');
                if (res.data.data) {
                    setExamSettings(res.data.data);
                }
                setShowSettingModal(false);
            }
        } catch (error) {
            console.error('Failed to save exam settings', error);
            toast.error('Gagal menyimpan pengaturan ujian');
        } finally {
            setSavingSettings(false);
        }
    };

    const filteredSoal = soal.filter(s => s.pertanyaan?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileSpreadsheet className="text-[#E11D2E]" size={28} />
                        Manajemen Bank Soal
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Kelola pertanyaan, pilihan jawaban, dan kunci untuk Ujian Online K3 Tambang.
                    </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                    {/* Tombol Pengaturan Ujian */}
                    <button
                        type="button"
                        onClick={() => setShowSettingModal(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all font-medium text-sm shadow-xs"
                        title="Atur jumlah soal acak & batas waktu ujian"
                    >
                        <SlidersHorizontal size={17} className="text-[#E11D2E]" />
                        <span>Pengaturan Ujian</span>
                        <span className="hidden lg:inline-block text-[11px] bg-red-50 text-[#E11D2E] px-2 py-0.5 rounded-full font-bold border border-red-100">
                            {examSettings.jumlah_soal} Soal • {examSettings.gunakan_waktu ? `${examSettings.durasi_menit}m` : 'Bebas'}
                        </span>
                    </button>

                    {/* Unduh Template */}
                    <button
                        type="button"
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-emerald-600/30 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all font-medium text-sm shadow-xs disabled:opacity-50"
                        title="Unduh format template Excel untuk bank soal"
                    >
                        {downloadingTemplate ? <Loader2 size={17} className="animate-spin" /> : <Download size={17} />}
                        <span>Template Excel</span>
                    </button>

                    {/* Import Excel */}
                    <button
                        type="button"
                        onClick={() => {
                            setImportResult(null);
                            setImportFile(null);
                            setShowImportModal(true);
                        }}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm shadow-emerald-600/20"
                    >
                        <Upload size={17} />
                        <span>Import Excel / CSV</span>
                    </button>

                    {/* Tambah Manual */}
                    <button 
                        type="button"
                        onClick={openAddModal} 
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#E11D2E] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#B0121F] transition-all text-sm shadow-sm shadow-[#E11D2E]/20"
                    >
                        <Plus size={17} />
                        <span>Tambah Soal</span>
                    </button>
                </div>
            </div>

            {/* Content Table Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <div className="relative max-w-md w-full">
                        <input
                            type="text"
                            placeholder="Cari teks soal / pertanyaan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none transition-all text-sm"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                    <div className="text-xs text-gray-500 font-medium self-end sm:self-center">
                        Total Soal di Bank: <span className="text-gray-900 font-bold">{filteredSoal.length}</span> (Akan diacak <span className="text-[#E11D2E] font-bold">{examSettings.jumlah_soal} soal</span> per ujian)
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 w-12 text-center">No</th>
                                <th className="p-4 min-w-[320px]">Pertanyaan & Opsi</th>
                                <th className="p-4 text-center">Kunci</th>
                                <th className="p-4">Jenis Unit / Kendaraan</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center w-28">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-12">
                                        <Loader2 className="animate-spin text-gray-400 mx-auto mb-2" size={32} />
                                        <span className="text-gray-500 text-sm">Memuat bank soal...</span>
                                    </td>
                                </tr>
                            ) : filteredSoal.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-16 text-gray-500">
                                        <FileSpreadsheet className="mx-auto mb-3 text-gray-300" size={48} />
                                        <p className="font-semibold text-gray-700">Belum ada soal ditemukan</p>
                                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                            Gunakan tombol <strong>Import Excel / CSV</strong> di kanan atas untuk memasukkan ratusan soal sekaligus dari Google Form.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSoal.map((item, index) => (
                                    <tr key={item.id_soal} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="p-4 text-center text-gray-400 font-medium">{index + 1}</td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900 mb-2 leading-relaxed">
                                                {item.pertanyaan}
                                            </div>
                                            {item.file_gambar && (
                                                <div className="mb-2">
                                                    <a 
                                                        href={`${import.meta.env.VITE_API_URL}/uploads/${item.file_gambar.split(/[/\\]/).pop()}`} 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors"
                                                    >
                                                        🖼️ Lihat Gambar Soal
                                                    </a>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                                <div className={item.kunci_jawaban === 'A' ? 'font-bold text-emerald-700' : ''}>
                                                    <span className="font-semibold text-gray-500">A.</span> {item.pilihan_a}
                                                </div>
                                                <div className={item.kunci_jawaban === 'B' ? 'font-bold text-emerald-700' : ''}>
                                                    <span className="font-semibold text-gray-500">B.</span> {item.pilihan_b}
                                                </div>
                                                <div className={item.kunci_jawaban === 'C' ? 'font-bold text-emerald-700' : ''}>
                                                    <span className="font-semibold text-gray-500">C.</span> {item.pilihan_c}
                                                </div>
                                                <div className={item.kunci_jawaban === 'D' ? 'font-bold text-emerald-700' : ''}>
                                                    <span className="font-semibold text-gray-500">D.</span> {item.pilihan_d}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm shadow-xs border border-emerald-200">
                                                {item.kunci_jawaban}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 font-medium">
                                            {item.master_kendaraan?.nama_kendaraan ? (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                                    🚛 {item.master_kendaraan.nama_kendaraan}
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700">
                                                    🌐 Umum (Semua)
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                                item.status_soal === 'Aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {item.status_soal}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center items-center gap-1.5">
                                                <button 
                                                    onClick={() => handleEdit(item)} 
                                                    className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                                                    title="Edit Soal"
                                                >
                                                    <Edit2 size={17} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(item.id_soal)} 
                                                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                    title="Hapus Soal"
                                                >
                                                    <Trash2 size={17} />
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

            {/* Modal Pengaturan Ujian */}
            {showSettingModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-5 flex justify-center items-center">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal - Fixed at top */}
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-100 text-[#E11D2E] rounded-xl">
                                    <SlidersHorizontal size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Pengaturan Ujian K3</h2>
                                    <p className="text-xs text-gray-500">Atur batas jumlah soal acak per unit kendaraan & batas waktu</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowSettingModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form - Body Scrollable, Footer Fixed */}
                        <form onSubmit={handleSaveExamSettings} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
                                {/* Batas Soal Khusus Per Unit Kendaraan */}
                                <div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-bold text-gray-900">
                                            Batas Soal Khusus Per Unit Kendaraan
                                        </label>
                                        <p className="text-xs text-gray-500">
                                            Atur batas jumlah soal yang ditampilkan untuk masing-masing unit (misal: <strong>Light Vehicle 20 soal</strong>, <strong>Dump Truck 50 soal</strong>).
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 max-h-56 overflow-y-auto space-y-2">
                                        {examSettings.kendaraan_list && examSettings.kendaraan_list.length > 0 ? (
                                            examSettings.kendaraan_list.map((k) => (
                                                <div 
                                                    key={k.id_kendaraan}
                                                    className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-gray-200/80 shadow-2xs hover:border-gray-300 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="text-base">🚛</span>
                                                        <div>
                                                            <span className="font-bold text-sm text-gray-800">{k.nama_kendaraan}</span>
                                                            <span className="text-[11px] ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
                                                                {k.kategori_kendaraan}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="300"
                                                            value={k.jumlah_soal || 20}
                                                            onChange={(e) => handleVehicleLimitChange(k.id_kendaraan, e.target.value)}
                                                            className="w-20 px-2.5 py-1.5 text-center font-bold text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none"
                                                        />
                                                        <span className="text-xs text-gray-500 font-medium">Soal</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-gray-400 py-3 text-center">Memuat daftar kendaraan...</p>
                                        )}
                                    </div>
                                </div>

                                {/* Jumlah Soal Standar / Umum */}
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                                        Batas Soal Standar / Umum (Fallback)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="500"
                                            required
                                            value={examSettings.jumlah_soal}
                                            onChange={(e) => setExamSettings({ ...examSettings, jumlah_soal: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none text-sm font-bold text-gray-800"
                                        />
                                        <span className="absolute right-4 top-2 text-xs text-gray-400 font-medium">Soal</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Digunakan untuk peserta kategori Umum atau jika jenis kendaraannya belum diatur secara khusus.
                                    </p>
                                </div>

                                {/* Pilihan Waktu: Pakai Waktu vs Tanpa Waktu */}
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Mode Batas Waktu Ujian
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setExamSettings({ ...examSettings, gunakan_waktu: true })}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                                                examSettings.gunakan_waktu 
                                                    ? 'border-[#E11D2E] bg-red-50/60 text-[#E11D2E]' 
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                                <Clock size={16} />
                                                <span>Pakai Batas Waktu</span>
                                            </div>
                                            <p className="text-xs opacity-80">Ada hitung mundur & otomatis kirim saat habis</p>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setExamSettings({ ...examSettings, gunakan_waktu: false })}
                                            className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                                                !examSettings.gunakan_waktu 
                                                    ? 'border-[#E11D2E] bg-red-50/60 text-[#E11D2E]' 
                                                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 font-bold text-sm mb-1">
                                                <span>♾️ Tanpa Waktu</span>
                                            </div>
                                            <p className="text-xs opacity-80">Peserta bebas mengerjakan santai tanpa timer</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Durasi Menit (hanya tampil jika gunakan_waktu = true) */}
                                {examSettings.gunakan_waktu && (
                                    <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 animate-in fade-in duration-200">
                                        <label className="block text-xs font-bold text-amber-900 uppercase tracking-wider mb-1.5">
                                            Durasi Waktu Pengerjaan (Menit)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="5"
                                                max="300"
                                                required
                                                value={examSettings.durasi_menit}
                                                onChange={(e) => setExamSettings({ ...examSettings, durasi_menit: parseInt(e.target.value) || 10 })}
                                                className="w-full px-4 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-[#E11D2E] outline-none text-sm font-bold text-gray-800 bg-white"
                                            />
                                            <span className="absolute right-4 top-2 text-xs text-gray-400 font-medium">Menit</span>
                                        </div>
                                        <p className="text-xs text-amber-700 mt-1.5">
                                            Peserta memiliki waktu {examSettings.durasi_menit} menit ({Math.floor(examSettings.durasi_menit / 60)} jam {examSettings.durasi_menit % 60} mnt) untuk menyelesaikan ujian.
                                        </p>
                                    </div>
                                )}

                                {/* Standar Kelulusan (Passing Grade) */}
                                <div className="pt-2 border-t border-gray-100">
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                                        Standar Nilai Kelulusan (Passing Grade)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            required
                                            value={examSettings.passing_grade}
                                            onChange={(e) => setExamSettings({ ...examSettings, passing_grade: parseInt(e.target.value) || 76 })}
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none text-sm font-bold text-gray-800"
                                        />
                                        <span className="absolute right-4 top-2.5 text-xs text-gray-400 font-medium">/ 100</span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Nilai di bawah ini dinyatakan TIDAK LULUS.</p>
                                </div>
                            </div>

                            {/* Footer Buttons - Fixed at bottom */}
                            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowSettingModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D2E] text-white font-medium hover:bg-[#B0121F] transition-colors text-sm shadow-sm shadow-[#E11D2E]/20 disabled:opacity-50"
                                >
                                    {savingSettings ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>Simpan Pengaturan</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Excel */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-5 flex justify-center items-center">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal - Fixed */}
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                                    <Upload size={22} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Import Bank Soal</h2>
                                    <p className="text-xs text-gray-500">Unggah file Excel (.xlsx / .xls) atau CSV untuk memasukkan soal sekaligus</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleCloseImportModal}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body - Scrollable */}
                        <form onSubmit={handleImportSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
                                {/* Petunjuk Google Form */}
                                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-2">
                                    <div className="flex items-center gap-2 font-semibold text-blue-800">
                                        <Info size={16} className="text-blue-600" />
                                        <span>Cara Ambil Data dari Google Form:</span>
                                    </div>
                                    <ol className="list-decimal list-inside space-y-1 text-blue-700 ml-1">
                                        <li>Buka kuis Google Form Anda, lalu klik tab <strong>Tanggapan / Responses</strong>.</li>
                                        <li>Klik ikon Spreadsheet hijau (<strong>Lihat di Spreadsheet</strong>).</li>
                                        <li>Di Google Sheets, klik menu <strong>File &gt; Download &gt; Microsoft Excel (.xlsx)</strong>.</li>
                                        <li>Sesuaikan nama kolom dengan format template kami atau unduh template di bawah.</li>
                                    </ol>
                                </div>

                                {/* Quick Download Template Button */}
                                <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 border border-emerald-100 rounded-xl">
                                    <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                                        <FileSpreadsheet size={18} className="text-emerald-600" />
                                        <span>Belum punya format Excel yang sesuai?</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleDownloadTemplate}
                                        disabled={downloadingTemplate}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                                    >
                                        <Download size={14} />
                                        Unduh Template
                                    </button>
                                </div>

                                {/* Dropzone File */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                        Pilih File Excel / CSV <span className="text-red-500">*</span>
                                    </label>
                                    
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx, .xls, .csv"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />

                                    {!importFile ? (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors">
                                                <Upload size={22} />
                                            </div>
                                            <div className="text-sm font-medium text-gray-700 group-hover:text-emerald-700">
                                                Klik untuk memilih file Excel / CSV
                                            </div>
                                            <p className="text-xs text-gray-400">Mendukung file .xlsx, .xls, atau .csv (Maksimal 10MB)</p>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{importFile.name}</p>
                                                    <p className="text-xs text-gray-500">{(importFile.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setImportFile(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                                                title="Hapus file"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Dropdown Kategori Kendaraan Default (Opsional) */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Target Unit / Kendaraan (Opsional)
                                    </label>
                                    <select
                                        value={importDefaultKendaraan}
                                        onChange={(e) => setImportDefaultKendaraan(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm bg-white"
                                    >
                                        <option value="">Sesuai Kolom di File Excel (Rekomendasi)</option>
                                        <option value="">Umum (Jika di file tidak ditentukan)</option>
                                        {masterKendaraan.map(k => (
                                            <option key={k.id_kendaraan} value={k.id_kendaraan}>
                                                Paksa Semua Masuk ke: {k.nama_kendaraan}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Jika kolom 'Jenis Kendaraan' di Excel sudah diisi, sistem otomatis mencocokkan nama unitnya.
                                    </p>
                                </div>

                                {/* Hasil Import / Error Alert */}
                                {importResult && (
                                    <div className={`p-4 rounded-xl border text-sm ${
                                        importResult.success ? 'bg-green-50 border-green-200 text-green-900' : 'bg-red-50 border-red-200 text-red-900'
                                    }`}>
                                        <div className="flex items-center gap-2 font-bold">
                                            {importResult.success ? (
                                                <CheckCircle2 size={18} className="text-green-600" />
                                            ) : (
                                                <AlertCircle size={18} className="text-red-600" />
                                            )}
                                            <span>{importResult.message}</span>
                                        </div>

                                        {importResult.skippedCount > 0 && (
                                            <div className="mt-3 text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSkippedDetails(!showSkippedDetails)}
                                                    className="flex items-center gap-1 font-semibold text-amber-700 hover:underline"
                                                >
                                                    <span>{importResult.skippedCount} baris tidak dapat diimpor (Klik untuk rincian)</span>
                                                    {showSkippedDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                </button>

                                                {showSkippedDetails && (
                                                    <ul className="mt-2 space-y-1 bg-white/70 p-2.5 rounded-lg border border-amber-200 max-h-36 overflow-y-auto">
                                                        {importResult.skipped?.map((s, idx) => (
                                                            <li key={idx} className="text-amber-900">
                                                                • <strong>Baris {s.row}</strong>: {s.reason}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons - Fixed */}
                            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleCloseImportModal}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
                                >
                                    Tutup
                                </button>
                                <button
                                    type="submit"
                                    disabled={importing || !importFile}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors text-sm shadow-sm shadow-emerald-600/20 disabled:opacity-50"
                                >
                                    {importing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Mengimpor Data...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            <span>Mulai Import Soal</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Tambah / Edit Manual */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm p-3 sm:p-5 flex justify-center items-center">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative border border-gray-100 flex flex-col max-h-[85vh] my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header Modal - Fixed */}
                        <div className="flex justify-between items-center p-5 sm:p-6 border-b border-gray-100 shrink-0 bg-white">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editId ? 'Edit Soal' : 'Tambah Soal Baru'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Form Body - Scrollable */}
                        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pertanyaan</label>
                                    <textarea 
                                        name="pertanyaan" 
                                        value={formData.pertanyaan} 
                                        onChange={handleChange} 
                                        required
                                        rows={3}
                                        placeholder="Tuliskan teks pertanyaan soal..."
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none text-sm"
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
                                    <p className="text-xs text-gray-500 mt-1">Gunakan gambar jika soal merujuk pada objek tertentu (misal: rambu jalan, alat ukur).</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {['a', 'b', 'c', 'd'].map(opt => (
                                        <div key={opt}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Pilihan {opt.toUpperCase()}</label>
                                            <div className="flex">
                                                <span className="inline-flex items-center px-3 border border-r-0 border-gray-200 bg-gray-50 text-gray-500 rounded-l-xl font-bold text-sm">
                                                    {opt.toUpperCase()}
                                                </span>
                                                <input 
                                                    type="text" 
                                                    name={`pilihan_${opt}`} 
                                                    value={formData[`pilihan_${opt}`]} 
                                                    onChange={handleChange} 
                                                    required
                                                    placeholder={`Jawaban opsi ${opt.toUpperCase()}`}
                                                    className="w-full px-4 py-2 border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none text-sm"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kunci Jawaban</label>
                                        <select 
                                            name="kunci_jawaban" 
                                            value={formData.kunci_jawaban} 
                                            onChange={handleChange} 
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none font-bold bg-white text-sm"
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
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none bg-white text-sm"
                                        >
                                            <option value="Aktif">Aktif</option>
                                            <option value="Nonaktif">Nonaktif</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kendaraan</label>
                                        <select 
                                            name="id_kendaraan" 
                                            value={formData.id_kendaraan} 
                                            onChange={handleChange} 
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#E11D2E] focus:border-[#E11D2E] outline-none bg-white text-sm"
                                        >
                                            <option value="">Umum (Semua Unit)</option>
                                            {masterKendaraan.map(k => (
                                                <option key={k.id_kendaraan} value={k.id_kendaraan}>{k.nama_kendaraan}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons - Fixed */}
                            <div className="flex gap-3 p-4 sm:p-5 border-t border-gray-100 bg-gray-50/90 shrink-0">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm">
                                    Batal
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={submittingSoal}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E11D2E] text-white font-medium hover:bg-[#B0121F] transition-colors text-sm shadow-sm shadow-[#E11D2E]/20 disabled:opacity-50"
                                >
                                    {submittingSoal ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Menyimpan...</span>
                                        </>
                                    ) : (
                                        <span>{editId ? 'Simpan Perubahan' : 'Simpan Soal'}</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
