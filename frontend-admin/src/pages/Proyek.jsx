import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Plus, ArrowLeft, Loader2, CheckCircle2, Users, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Proyek() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const id_user = user.id_user;

    const [view, setView] = useState('table'); // table, wizard (tambah proyek), detail (list pekerja)
    const [proyekList, setProyekList] = useState([]);
    const [selectedProyek, setSelectedProyek] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [editId, setEditId] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    
    const [formData, setFormData] = useState({
        nama_proyek: '',
        jenis_proyek: 'Baru',
        tanggal_mulai: '',
        tanggal_selesai: ''
    });
    const [files, setFiles] = useState({});
    
    // Safety Modal state
    const [safetyModal, setSafetyModal] = useState(false);
    const [safetyFiles, setSafetyFiles] = useState({});
    const [safetyError, setSafetyError] = useState('');
    const [safetyLoading, setSafetyLoading] = useState(false);
    const [izinKhususCheck, setIzinKhususCheck] = useState({
        file_izin_panas: false,
        file_izin_ketinggian: false,
        file_izin_perancah: false,
        file_izin_beban: false,
        file_izin_ruang_terbatas: false,
        file_izin_penggalian: false,
        file_izin_air: false,
        file_izin_material_panas: false
    });

    useEffect(() => {
        if (view === 'table') fetchProyek();
    }, [view]);

    const fetchProyek = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/proyek?id_user=${id_user}`);
            if (res.data.success) {
                setProyekList(res.data.data);
            }
        } catch (err) {
            setError('Gagal memuat daftar proyek/kontrak');
        } finally {
            setLoading(false);
        }
    };

    const handleKirimAdmin = async (id_pengajuan) => {
        if (selectedProyek) {
            if (selectedProyek.jenis_proyek !== 'Perpanjangan' && (!selectedProyek.file_life_saving_talk || !selectedProyek.file_jsa || !selectedProyek.file_izin_kerja_umum)) {
                toast.error('Dokumen Safety Proyek wajib dilengkapi terlebih dahulu sebelum mengirim pekerja ke admin.');
                return;
            }
            if (!selectedProyek.file_surat_penunjukan || !selectedProyek.file_kontrak_kerja) {
                toast.error('Dokumen Bersama Proyek wajib dilengkapi terlebih dahulu.');
                return;
            }
        }
        setConfirmModal({
            isOpen: true,
            title: 'Kirim Pengajuan',
            message: 'Kirim pengajuan ini ke admin sekarang? Anda tidak dapat merubah data lagi.',
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/pengajuan/${id_pengajuan}/submit-draft`);
                    if (res.data.success) {
                        toast.success('Pengajuan berhasil dikirim');
                        if (selectedProyek) {
                            const detailRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/proyek/${selectedProyek.id_proyek}`);
                            if (detailRes.data.success) {
                                setSelectedProyek(detailRes.data.data);
                            }
                        }
                        fetchProyek();
                    }
                } catch (err) {
                    toast.error('Gagal mengirim pengajuan');
                }
            }
        });
    };
    const handleKirimSemuaAdmin = async (id_proyek) => {
        if (selectedProyek && selectedProyek.id_proyek === id_proyek) {
            if (selectedProyek.jenis_proyek !== 'Perpanjangan' && (!selectedProyek.file_life_saving_talk || !selectedProyek.file_jsa || !selectedProyek.file_izin_kerja_umum)) {
                toast.error('Dokumen Safety Proyek wajib dilengkapi terlebih dahulu sebelum mengirim pekerja ke admin.');
                return;
            }
            if (!selectedProyek.file_surat_penunjukan || !selectedProyek.file_kontrak_kerja) {
                toast.error('Dokumen Bersama Proyek wajib dilengkapi terlebih dahulu.');
                return;
            }
        }
        
        setConfirmModal({
            isOpen: true,
            title: 'Kirim Semua Pekerja',
            message: 'Kirim SEMUA pekerja dalam status Draft ke admin sekarang? Anda tidak dapat merubah data mereka lagi.',
            type: 'info',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                try {
                    const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/proyek/${id_proyek}/submit-drafts`);
                    if (res.data.success) {
                        toast.success("Berhasil mengirim semua draft pekerja ke admin!");
                        if (selectedProyek) {
                            const detailRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/proyek/${selectedProyek.id_proyek}`);
                            if (detailRes.data.success) {
                                setSelectedProyek(detailRes.data.data);
                            }
                        }
                        fetchProyek();
                    }
                } catch (error) {
                    console.error(error);
                    toast.error("Terjadi kesalahan saat mengirim pengajuan ke admin");
                }
            }
        });
    };

    const handleOpenDetail = async (id_proyek) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/proyek/${id_proyek}`);
            if (res.data.success) {
                setSelectedProyek(res.data.data);
                setView('detail');
            }
        } catch (err) {
            setError('Gagal memuat detail proyek');
        } finally {
            setLoading(false);
        }
    };

    const handleEditProyek = (proyek) => {
        setEditId(proyek.id_proyek);
        setFormData({
            nama_proyek: proyek.nama_proyek || '',
            jenis_proyek: proyek.jenis_proyek || 'Baru',
            tanggal_mulai: proyek.tanggal_mulai || '',
            tanggal_selesai: proyek.tanggal_selesai || ''
        });
        setFiles({});
        setView('wizard');
    };

    const handleDeleteProyek = (id_proyek) => {
        setConfirmModal({
            isOpen: true,
            title: 'Hapus Proyek',
            message: 'Apakah Anda yakin ingin menghapus proyek ini? (Pekerja di dalamnya harus kosong)',
            type: 'danger',
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setLoading(true);
                try {
                    const res = await axios.delete(`${import.meta.env.VITE_API_URL}/api/proyek/${id_proyek}`);
                    if (res.data.success) {
                        toast.success('Proyek berhasil dihapus');
                        fetchProyek();
                    }
                } catch (err) {
                    const message = err.response?.data?.message || 'Gagal menghapus proyek';
                    toast.error(message);
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    const handleSafetyFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList[0] && fileList[0].size > 5 * 1024 * 1024) {
            setSafetyError('Ukuran file tidak boleh lebih dari 5MB');
            toast.error('Ukuran file tidak boleh lebih dari 5MB');
            setTimeout(() => setSafetyError(''), 3000);
            e.target.value = null;
            return;
        }
        setSafetyFiles(prev => ({ ...prev, [name]: fileList[0] }));
    };

    const handleUploadSafetySubmit = async (e) => {
        e.preventDefault();
        setSafetyLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(safetyFiles).forEach(key => {
                if (safetyFiles[key]) submitData.append(key, safetyFiles[key]);
            });

            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/proyek/${selectedProyek.id_proyek}/upload-docs`, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success('Dokumen safety berhasil diunggah');
                setSafetyModal(false);
                setSafetyFiles({});
                handleOpenDetail(selectedProyek.id_proyek);
            }
        } catch (err) {
            toast.error('Gagal mengunggah dokumen safety');
        } finally {
            setSafetyLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList[0] && fileList[0].size > 5 * 1024 * 1024) {
            setError('Ukuran file tidak boleh lebih dari 5MB');
            toast.error('Ukuran file tidak boleh lebih dari 5MB');
            setTimeout(() => setError(''), 3000);
            e.target.value = null;
            return;
        }
        setFiles(prev => ({ ...prev, [name]: fileList[0] }));
    };

    const handleSubmitProyek = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('id_user_vendor', id_user);
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            Object.keys(files).forEach(key => {
                if (files[key]) submitData.append(key, files[key]);
            });

            const url = editId ? `${import.meta.env.VITE_API_URL}/api/proyek/${editId}` : `${import.meta.env.VITE_API_URL}/api/proyek`;
            const method = editId ? 'put' : 'post';

            const res = await axios[method](url, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                toast.success(editId ? 'Proyek berhasil diperbarui' : 'Proyek berhasil dibuat');
                setView('table');
                setFormData({
                    nama_proyek: '', jenis_proyek: 'Baru', tanggal_mulai: '', tanggal_selesai: ''
                });
                setFiles({});
                setEditId(null);
                fetchProyek();
            }
        } catch (err) {
            setError('Gagal menyimpan proyek');
        } finally {
            setSubmitLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto min-h-screen font-sans bg-gray-50/30">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Proyek / Kontrak Kerja</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola kontrak kerja dan daftarkan pekerja Anda secara kolektif.</p>
                </div>
                {view === 'table' ? (
                    <button onClick={() => {
                        setEditId(null);
                        setFormData({ nama_proyek: '', jenis_proyek: 'Baru', tanggal_mulai: '', tanggal_selesai: '' });
                        setFiles({});
                        setView('wizard');
                    }} className="py-2.5 px-4 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md flex gap-2">
                        <Plus size={18} /> Buat Proyek Baru
                    </button>
                ) : (
                    <button onClick={() => {
                        setView('table');
                        setEditId(null);
                    }} className="py-2 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium flex gap-2">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-[#E11D2E]" /></div>
            ) : view === 'table' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-medium">
                                <th className="px-6 py-4">Nama Proyek/Kontrak</th>
                                <th className="px-6 py-4">Durasi</th>
                                <th className="px-6 py-4 text-center">Jumlah Pekerja</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {proyekList.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Belum ada proyek.</td></tr>
                            ) : (
                                proyekList.map(p => (
                                    <tr key={p.id_proyek} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{p.nama_proyek}</td>
                                        <td className="px-6 py-4">{p.tanggal_mulai} s/d {p.tanggal_selesai}</td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-800">{p.pengajuan_permits?.length || 0} Orang</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEditProyek(p)} className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors text-xs font-semibold">Edit</button>
                                                <button onClick={() => handleDeleteProyek(p.id_proyek)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-xs font-semibold">Hapus</button>
                                                <button onClick={() => handleOpenDetail(p.id_proyek)} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-xs font-semibold">Detail</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            ) : view === 'wizard' ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                    <form onSubmit={handleSubmitProyek} className="space-y-6">
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Informasi Pekerjaan</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Judul / Nama Pekerjaan</label>
                                    <input type="text" name="nama_proyek" value={formData.nama_proyek} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200" placeholder="Misal: Perawatan Conveyor Belt" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Jenis Kontrak</label>
                                    <select name="jenis_proyek" value={formData.jenis_proyek} onChange={handleInputChange} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white">
                                        <option value="Baru">Baru</option>
                                        <option value="Perpanjangan">Perpanjangan</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                                    <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                                    <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange} required className="w-full px-4 py-2.5 rounded-xl border border-gray-200" />
                                </div>
                            </div>

                        </div>

                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold border-b pb-2">Unggah Dokumen Bersama ({user?.jenis_vendor === 'SPK' ? 'SPK' : 'Kontrak'})</h2>
                            <p className="text-xs text-gray-500">Dokumen ini akan dilampirkan otomatis ke semua pekerja di bawah proyek ini.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer">
                                    <label className="cursor-pointer">
                                        <span className="block text-sm font-medium text-gray-700 mb-1">
                                            Surat Penunjukan / Permohonan Mine Permit (Maks 5MB)
                                        </span>
                                        {editId && <span className="block text-xs font-semibold text-green-600 mb-2 bg-green-50 px-2 py-1 rounded inline-block">✓ Dokumen sudah ada (Unggah baru untuk mengganti)</span>}
                                        <input type="file" name="file_surat_penunjukan" onChange={handleFileChange} required={!editId} className="text-xs text-gray-500 block w-full" />
                                    </label>
                                </div>
                                <div className="border border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer">
                                    <label className="cursor-pointer">
                                        <span className="block text-sm font-medium text-gray-700 mb-1">Surat PL / PO / Kontrak / Berita Acara Mulai Kerja (Maks 5MB)</span>
                                        {editId && <span className="block text-xs font-semibold text-green-600 mb-2 bg-green-50 px-2 py-1 rounded inline-block">✓ Dokumen sudah ada (Unggah baru untuk mengganti)</span>}
                                        <input type="file" name="file_kontrak_kerja" onChange={handleFileChange} required={!editId} className="text-xs text-gray-500 block w-full" />
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-4 text-right">
                            <button type="submit" disabled={submitLoading} className="px-8 py-2.5 rounded-xl bg-[#E11D2E] hover:bg-[#B0121F] text-white font-medium shadow-md flex items-center justify-center gap-2 ml-auto">
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : 'Simpan Proyek'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="space-y-6 max-w-6xl mx-auto">
                    {/* Detail Proyek & List Pekerja */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex justify-between items-center">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{selectedProyek?.nama_proyek}</h2>
                            <p className="text-sm text-gray-500 mt-1">Masa Berlaku: <span className="font-semibold text-gray-700">{selectedProyek?.tanggal_mulai} s/d {selectedProyek?.tanggal_selesai}</span></p>
                            <div className="flex gap-3 mt-3">
                                {selectedProyek?.file_surat_penunjukan && (() => {
                                    const filename = selectedProyek.file_surat_penunjukan.split(/[/\\]/).pop();
                                    return (
                                        <a href={`${import.meta.env.VITE_API_URL}/uploads/${filename}`} target="_blank" rel="noreferrer" className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-100 font-medium">
                                            <FileText size={14} /> Surat Penunjukan / Dokumen
                                        </a>
                                    );
                                })()}
                                {selectedProyek?.file_kontrak_kerja && (() => {
                                    const filename = selectedProyek.file_kontrak_kerja.split(/[/\\]/).pop();
                                    return (
                                        <a href={`${import.meta.env.VITE_API_URL}/uploads/${filename}`} target="_blank" rel="noreferrer" className="text-xs bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-purple-100 font-medium">
                                            <FileText size={14} /> Kontrak / SPK
                                        </a>
                                    );
                                })()}
                            </div>
                        </div>
                        {/* A button to add a new worker (links to Permit form pre-filled with id_proyek) */}
                        <div className="flex gap-2">
                            {selectedProyek?.pengajuan_permits?.some(p => p.status_berkas === 'Draft') && (
                                <button onClick={() => handleKirimSemuaAdmin(selectedProyek.id_proyek)} className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-md flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                                    Kirim ke Admin ({selectedProyek.pengajuan_permits.filter(p => p.status_berkas === 'Draft').length})
                                </button>
                            )}
                            {selectedProyek?.jenis_proyek !== 'Perpanjangan' && (
                                <button onClick={() => setSafetyModal(true)} className="py-2 px-4 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl font-medium shadow-sm flex items-center gap-2">
                                    <FileText size={18} /> Dokumen Safety
                                </button>
                            )}
                            <Link to={`/dashboard/permit?id_proyek=${selectedProyek?.id_proyek}`} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-md flex items-center gap-2">
                                <Users size={18} /> Tambah Pekerja
                            </Link>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                            <h3 className="font-semibold text-gray-800">Daftar Pekerja Terdaftar</h3>
                        </div>
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500 font-medium">
                                    <th className="px-6 py-4">Nama Pekerja</th>
                                    <th className="px-6 py-4">Status Berkas</th>
                                    <th className="px-6 py-4 text-center">Kode Ujian</th>
                                    <th className="px-6 py-4 text-center">Nilai</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                {(!selectedProyek?.pengajuan_permits || selectedProyek.pengajuan_permits.length === 0) ? (
                                    <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-400">Belum ada pekerja yang didaftarkan.</td></tr>
                                ) : (
                                    selectedProyek.pengajuan_permits.map(pekerja => (
                                        <tr key={pekerja.id_pengajuan} className="hover:bg-gray-50/50">
                                            <td className="px-6 py-4 font-medium text-gray-900">{pekerja.karyawan?.nama_lengkap} <br/><span className="text-xs text-gray-500 font-normal">{pekerja.karyawan?.nik_atau_ktm}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${pekerja.status_berkas === 'Ditolak' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                                                    {pekerja.status_berkas.replace(/_/g, ' ')}
                                                </span>
                                                {pekerja.status_berkas === 'Ditolak' && pekerja.riwayat_approvals && pekerja.riwayat_approvals.length > 0 && (
                                                    <div className="text-[11px] text-red-600 mt-1.5 font-medium leading-tight max-w-[150px]">
                                                        <span className="block font-bold">Catatan:</span>
                                                        {pekerja.riwayat_approvals.filter(r => r.status_keputusan === 'Ditolak').pop()?.catatan_revisi}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {pekerja.kode_ujian_online ? (
                                                    <span className="font-mono bg-gray-100 px-2 py-1 rounded tracking-widest font-bold">{pekerja.kode_ujian_online}</span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center">{pekerja.nilai_ujian_online !== null ? `${pekerja.nilai_ujian_online}/100` : '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                {pekerja.status_berkas === 'Draft' ? (
                                                    <Link to={`/dashboard/permit?edit_id=${pekerja.id_pengajuan}`} className="text-orange-600 hover:underline text-xs font-medium bg-orange-50 px-3 py-1 rounded-lg border border-orange-100 shadow-sm inline-block">Edit Pengajuan</Link>
                                                ) : (pekerja.status_berkas === 'Siap_Cetak' || pekerja.status_berkas === 'Aktif') ? (
                                                    <a href={`${import.meta.env.VITE_API_URL}/api/pengajuan/${pekerja.id_pengajuan}/cetak-permit`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs font-medium bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm inline-block">Download Permit</a>
                                                ) : (
                                                    <Link to={`/dashboard/permit`} className="text-blue-600 hover:underline text-xs font-medium bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm inline-block">Lihat di Permit</Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Safety Docs Modal */}
            {safetyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative p-6">
                        <button onClick={() => setSafetyModal(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                            <span className="sr-only">Close</span>
                            &times;
                        </button>
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Unggah Dokumen Safety Proyek</h2>
                        {safetyError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex gap-2 items-center mb-4">
                                <AlertCircle size={16} /> {safetyError}
                            </div>
                        )}
                        <form onSubmit={handleUploadSafetySubmit} className="space-y-4">
                            <p className="text-sm text-gray-600 mb-4">Unggah dokumen ini agar bisa melengkapi persyaratan untuk semua pekerja di proyek ini.</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Life Saving Talk (Maks 5MB)</label>
                                    <input type="file" name="file_life_saving_talk" onChange={handleSafetyFileChange} className="w-full text-sm text-gray-500 border rounded-lg px-3 py-2" />
                                    {selectedProyek?.file_life_saving_talk && <span className="text-xs text-green-600">✓ Sudah diunggah</span>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Job Safety Analysis (JSA) (Maks 5MB)</label>
                                    <input type="file" name="file_jsa" onChange={handleSafetyFileChange} className="w-full text-sm text-gray-500 border rounded-lg px-3 py-2" />
                                    {selectedProyek?.file_jsa && <span className="text-xs text-green-600">✓ Sudah diunggah</span>}
                                </div>
                                <div className="space-y-1">
                                    <label className="block text-sm font-medium text-gray-700">Izin Kerja Umum (Maks 5MB)</label>
                                    <input type="file" name="file_izin_kerja_umum" onChange={handleSafetyFileChange} className="w-full text-sm text-gray-500 border rounded-lg px-3 py-2" />
                                    {selectedProyek?.file_izin_kerja_umum && <span className="text-xs text-green-600">✓ Sudah diunggah</span>}
                                </div>
                            </div>
                            
                            <div className="pt-4 border-t mt-4">
                                <h3 className="font-semibold text-gray-800 mb-3">Izin Kerja Khusus (Centang jika diperlukan)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {[
                                        { key: 'file_izin_panas', label: 'Izin Panas Berisiko' },
                                        { key: 'file_izin_ketinggian', label: 'Izin Ketinggian' },
                                        { key: 'file_izin_perancah', label: 'Izin Perancah' },
                                        { key: 'file_izin_beban', label: 'Izin Mengangkat Beban' },
                                        { key: 'file_izin_ruang_terbatas', label: 'Izin Ruang Terbatas' },
                                        { key: 'file_izin_penggalian', label: 'Izin Penggalian' },
                                        { key: 'file_izin_air', label: 'Izin Bekerja di Air' },
                                        { key: 'file_izin_material_panas', label: 'Izin Material Panas' },
                                    ].map(izin => (
                                        <div key={izin.key} className="bg-gray-50 border p-3 rounded-xl">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    checked={izinKhususCheck[izin.key]} 
                                                    onChange={e => setIzinKhususCheck({...izinKhususCheck, [izin.key]: e.target.checked})} 
                                                    className="w-4 h-4 text-[#E11D2E] rounded border-gray-300 focus:ring-[#E11D2E]" 
                                                />
                                                <span className="font-medium text-sm text-gray-700">{izin.label} (Maks 5MB)</span>
                                            </label>
                                            {izinKhususCheck[izin.key] && (
                                                <div className="mt-3 pl-7">
                                                    <input type="file" name={izin.key} onChange={handleSafetyFileChange} className="w-full text-sm text-gray-500 border rounded-lg px-3 py-2 bg-white" />
                                                    {selectedProyek?.[izin.key] && <span className="text-xs text-green-600 block mt-1">✓ Sudah diunggah</span>}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-end gap-3 mt-4">
                                <button type="button" onClick={() => setSafetyModal(false)} className="px-4 py-2 border rounded-xl font-medium text-gray-600 hover:bg-gray-50">Batal</button>
                                <button type="submit" disabled={safetyLoading} className="px-6 py-2 bg-[#E11D2E] text-white rounded-xl font-medium hover:bg-[#B0121F] disabled:opacity-50">
                                    {safetyLoading ? 'Mengunggah...' : 'Simpan Dokumen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Confirm Modal */}
            {confirmModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 relative">
                        <div className="flex gap-4 items-start">
                            <div className={`p-3 rounded-full shrink-0 ${confirmModal.type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{confirmModal.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{confirmModal.message}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors">Batal</button>
                            <button onClick={confirmModal.onConfirm} className={`px-4 py-2 text-white font-medium rounded-xl transition-colors ${confirmModal.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0f172a] hover:bg-black'}`}>
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
