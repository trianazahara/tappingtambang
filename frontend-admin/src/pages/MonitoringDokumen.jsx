import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
    Clock, Search, AlertCircle, Download, FileText, X, 
    Filter, RefreshCw, Eye, CheckCircle2, ShieldCheck, 
    Calendar, Building, Copy, Check, ExternalLink, Printer,
    FileCheck, UserCheck, Layers, FileImage
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function MonitoringDokumen() {
    // Tab Mode: 'preview' (Filter & Preview Dokumen) vs 'expiration' (Masa Berlaku)
    const [activeTab, setActiveTab] = useState('preview');

    // State Filter Preview
    const [filterDocType, setFilterDocType] = useState('file_safety_induksi');
    const [filterStartDate, setFilterStartDate] = useState('');
    const [filterEndDate, setFilterEndDate] = useState('');
    const [filterSearch, setFilterSearch] = useState('');

    // Data Preview
    const [previewData, setPreviewData] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewItem, setPreviewItem] = useState(null);
    const [copiedNik, setCopiedNik] = useState('');

    // Data Expiration (Tab 2)
    const [expirationData, setExpirationData] = useState([]);
    const [expirationLoading, setExpirationLoading] = useState(false);
    const [expirationSearch, setExpirationSearch] = useState('');

    // Modal Export ZIP Massal
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportDocType, setExportDocType] = useState('file_safety_induksi');
    const [exportingZip, setExportingZip] = useState(false);

    // Initial Fetch
    useEffect(() => {
        fetchPreviewData();
        fetchExpirationData();
    }, []);

    const fetchPreviewData = async (overrideParams = {}) => {
        setPreviewLoading(true);
        try {
            const params = {
                docType: overrideParams.docType !== undefined ? overrideParams.docType : filterDocType,
                startDate: overrideParams.startDate !== undefined ? overrideParams.startDate : filterStartDate,
                endDate: overrideParams.endDate !== undefined ? overrideParams.endDate : filterEndDate,
                search: overrideParams.search !== undefined ? overrideParams.search : filterSearch
            };

            const queryParams = new URLSearchParams();
            if (params.docType) queryParams.append('docType', params.docType);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            if (params.search) queryParams.append('search', params.search);

            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/monitoring/preview-docs?${queryParams.toString()}`);
            if (res.data.success) {
                setPreviewData(res.data.data);
            }
        } catch (error) {
            console.error("Error previewing docs:", error);
            toast.error("Gagal memuat preview data dokumen");
        } finally {
            setPreviewLoading(false);
        }
    };

    const fetchExpirationData = async () => {
        setExpirationLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/monitoring`);
            if (res.data.success) {
                setExpirationData(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching expiration monitoring:", error);
        } finally {
            setExpirationLoading(false);
        }
    };

    const handleApplyFilter = (e) => {
        if (e) e.preventDefault();
        fetchPreviewData();
    };

    const handleResetFilter = () => {
        setFilterDocType('file_safety_induksi');
        setFilterStartDate('');
        setFilterEndDate('');
        setFilterSearch('');
        fetchPreviewData({
            docType: 'file_safety_induksi',
            startDate: '',
            endDate: '',
            search: ''
        });
    };

    // Shortcut Rentang Waktu
    const setDatePreset = (preset) => {
        const now = new Date();
        if (preset === 'today') {
            const todayStr = now.toISOString().split('T')[0];
            setFilterStartDate(todayStr);
            setFilterEndDate(todayStr);
            fetchPreviewData({ startDate: todayStr, endDate: todayStr });
        } else if (preset === 'month') {
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setFilterStartDate(firstDay);
            setFilterEndDate(lastDay);
            fetchPreviewData({ startDate: firstDay, endDate: lastDay });
        } else if (preset === 'all') {
            setFilterStartDate('');
            setFilterEndDate('');
            fetchPreviewData({ startDate: '', endDate: '' });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopiedNik(text);
        toast.success(`No. KTP ${text} disalin!`);
        setTimeout(() => setCopiedNik(''), 2000);
    };

    // Download Single File
    const handleDownloadSingle = (fileUrl, fileName) => {
        if (!fileUrl) return;
        const link = document.createElement('a');
        link.href = fileUrl.startsWith('http') ? fileUrl : `${import.meta.env.VITE_API_URL}/${fileUrl}`;
        link.setAttribute('download', fileName || 'dokumen');
        link.setAttribute('target', '_blank');
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    // Export ZIP dari filter saat ini
    const handleExportFiltered = async () => {
        if (previewData.length === 0) {
            toast.error("Tidak ada data dokumen untuk diekspor");
            return;
        }

        const toastId = toast.loading("Mempersiapkan unduhan ZIP dokumen...");
        setExportingZip(true);

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('docType', filterDocType === 'all' ? 'file_safety_induksi' : filterDocType);
            if (filterStartDate) queryParams.append('startDate', filterStartDate);
            if (filterEndDate) queryParams.append('endDate', filterEndDate);
            if (filterSearch) queryParams.append('search', filterSearch);

            const url = `${import.meta.env.VITE_API_URL}/api/monitoring/export-docs?${queryParams.toString()}`;
            const response = await axios.get(url, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/zip' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `Export_${filterDocType}_${filterStartDate || 'all'}_to_${filterEndDate || 'all'}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) fileName = filenameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success("Dokumen ZIP berhasil diunduh!", { id: toastId });
        } catch (error) {
            if (error.response && error.response.data instanceof Blob) {
                const text = await error.response.data.text();
                try {
                    const json = JSON.parse(text);
                    toast.error(json.message || "Gagal mengunduh dokumen", { id: toastId });
                } catch (e) {
                    toast.error("Terjadi kesalahan pada server", { id: toastId });
                }
            } else {
                toast.error("Gagal terhubung ke server", { id: toastId });
            }
        } finally {
            setExportingZip(false);
        }
    };

    // Export ZIP Modal (Massal dengan rentang tanggal khusus)
    const handleExportModal = async () => {
        if (!exportStartDate || !exportEndDate) {
            toast.error("Harap isi Tanggal Mulai dan Tanggal Selesai");
            return;
        }

        const toastId = toast.loading("Mempersiapkan dokumen...");
        try {
            const url = `${import.meta.env.VITE_API_URL}/api/monitoring/export-docs?startDate=${exportStartDate}&endDate=${exportEndDate}&docType=${exportDocType}`;
            const response = await axios.get(url, { responseType: 'blob' });

            const blob = new Blob([response.data], { type: 'application/zip' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `Export_${exportDocType}_${exportStartDate}_to_${exportEndDate}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) fileName = filenameMatch[1];
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            toast.success("Dokumen berhasil diunduh!", { id: toastId });
            setShowExportModal(false);
        } catch (error) {
            if (error.response && error.response.data instanceof Blob) {
                const text = await error.response.data.text();
                try {
                    const json = JSON.parse(text);
                    toast.error(json.message || "Gagal mengunduh dokumen", { id: toastId });
                } catch (e) {
                    toast.error("Terjadi kesalahan pada server", { id: toastId });
                }
            } else {
                toast.error("Gagal terhubung ke server", { id: toastId });
            }
        }
    };

    // Color helper untuk Tab 2 (Masa Berlaku)
    const getStatusColor = (dateStr) => {
        const today = new Date();
        today.setHours(0,0,0,0);
        const expDate = new Date(dateStr);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { bg: 'bg-red-100', text: 'text-red-700', label: 'Kedaluwarsa' };
        if (diffDays <= 30) return { bg: 'bg-orange-100', text: 'text-orange-700', label: `H- ${diffDays}` };
        return { bg: 'bg-green-100', text: 'text-green-700', label: 'Aktif' };
    };

    const filteredExpirationData = expirationData.filter(item => 
        item.nama_pemilik?.toLowerCase().includes(expirationSearch.toLowerCase()) ||
        item.instansi_atau_proyek?.toLowerCase().includes(expirationSearch.toLowerCase()) ||
        item.jenis_dokumen?.toLowerCase().includes(expirationSearch.toLowerCase())
    );

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                            <FileCheck size={24} />
                        </span>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Monitoring & Audit Dokumen</h1>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Filter dan preview dokumen pekerja (Safety Induksi, KTP, BPJS, SIM) serta cek keaslian berkas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => {
                            setExportDocType(filterDocType === 'all' ? 'file_safety_induksi' : filterDocType);
                            setExportStartDate(filterStartDate);
                            setExportEndDate(filterEndDate);
                            setShowExportModal(true);
                        }}
                        className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition-all shadow-sm w-full md:w-auto"
                    >
                        <Download size={18} />
                        Export Dokumen (ZIP)
                    </button>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-gray-200 gap-8">
                <button
                    onClick={() => setActiveTab('preview')}
                    className={`pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'preview'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Search size={18} />
                    Audit & Preview Dokumen
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-50 text-red-600">
                        {previewData.length}
                    </span>
                </button>

                <button
                    onClick={() => setActiveTab('expiration')}
                    className={`pb-4 px-2 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${
                        activeTab === 'expiration'
                            ? 'border-red-600 text-red-600'
                            : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                    <Clock size={18} />
                    Masa Berlaku SIM & Kontrak
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gray-100 text-gray-600">
                        {expirationData.length}
                    </span>
                </button>
            </div>

            {/* TAB 1: AUDIT & PREVIEW DOKUMEN */}
            {activeTab === 'preview' && (
                <div className="space-y-6">
                    {/* Filter Card */}
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2 font-bold text-gray-800">
                                <Filter size={18} className="text-red-600" />
                                <span>Filter Pencarian Dokumen</span>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-400 font-medium mr-1">Pintasan:</span>
                                <button 
                                    type="button" 
                                    onClick={() => setDatePreset('all')}
                                    className={`px-3 py-1 rounded-lg border transition-all ${!filterStartDate && !filterEndDate ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                >
                                    Semua Waktu
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setDatePreset('month')}
                                    className="px-3 py-1 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Bulan Ini
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setDatePreset('today')}
                                    className="px-3 py-1 rounded-lg border bg-gray-50 text-gray-600 hover:bg-gray-100 transition-all"
                                >
                                    Hari Ini
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* 1. Jenis Dokumen */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jenis Dokumen</label>
                                <select 
                                    value={filterDocType} 
                                    onChange={(e) => {
                                        setFilterDocType(e.target.value);
                                        fetchPreviewData({ docType: e.target.value });
                                    }}
                                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                >
                                    <option value="file_safety_induksi">📋 Safety Induksi & Persetujuan K3</option>
                                    <option value="file_data_diri">🪪 KTP / Identitas Diri</option>
                                    <option value="file_foto">👤 Foto Profil / Pas Foto</option>
                                    <option value="file_bpjs">🏥 BPJS Ketenagakerjaan</option>
                                    <option value="file_mcu">🩺 Medical Check Up (MCU)</option>
                                    <option value="file_sertifikat_sio_sim">🪪 Sertifikat / SIO / SIM</option>
                                    <option value="file_kontrak_kerja">📄 Kontrak Kerja / SPK</option>
                                    <option value="file_surat_penunjukan">📨 Surat Penunjukan / Permohonan</option>
                                    <option value="file_serah_terima_apd">🦺 Berita Acara APD</option>
                                    <option value="file_izin_kerja_berbahaya">⚠️ Izin Kerja Berbahaya</option>
                                    <option value="file_hasil_assessment">📊 Hasil Assessment</option>
                                    <option value="file_jsa">🛠️ Job Safety Analysis (JSA - Proyek)</option>
                                    <option value="file_life_saving_talk">🗣️ Life Saving Talk (Proyek)</option>
                                    <option value="file_izin_kerja_umum">📑 Izin Kerja Umum (Proyek)</option>
                                    <option value="all">📂 Semua Jenis Dokumen</option>
                                </select>
                            </div>

                            {/* 2. Tanggal Mulai */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dari Tanggal</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        value={filterStartDate}
                                        onChange={(e) => setFilterStartDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* 3. Tanggal Selesai */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Sampai Tanggal</label>
                                <div className="relative">
                                    <input 
                                        type="date"
                                        value={filterEndDate}
                                        onChange={(e) => setFilterEndDate(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* 4. Pencarian Nama / NIK */}
                            <div className="md:col-span-4">
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cari Pekerja / KTP</label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input 
                                        type="text" 
                                        placeholder="Ketik Nama / No. KTP (NIK)..." 
                                        value={filterSearch}
                                        onChange={(e) => setFilterSearch(e.target.value)}
                                        className="w-full pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all"
                                    />
                                    {filterSearch && (
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setFilterSearch('');
                                                fetchPreviewData({ search: '' });
                                            }}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="md:col-span-12 flex justify-end items-center gap-3 pt-2">
                                <button 
                                    type="button"
                                    onClick={handleResetFilter}
                                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1.5"
                                >
                                    <RefreshCw size={14} />
                                    Reset
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 shadow-sm transition-all flex items-center gap-1.5"
                                >
                                    <Search size={14} />
                                    Tampilkan Preview
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Preview Table Header & Quick Action */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200/60">
                        <div className="flex items-center gap-3">
                            <span className="flex h-3 w-3 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            <div className="text-sm">
                                <span className="font-bold text-gray-900">{previewData.length} Dokumen Ditemukan</span>
                                <span className="text-gray-500 ml-2">
                                    {filterStartDate && filterEndDate 
                                        ? `(Periode: ${filterStartDate} s/d ${filterEndDate})`
                                        : '(Semua rentang waktu)'}
                                </span>
                            </div>
                        </div>

                        {previewData.length > 0 && (
                            <button
                                onClick={handleExportFiltered}
                                disabled={exportingZip}
                                className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-100 transition-all shadow-xs flex items-center gap-2"
                                title="Unduh file-file yang tampil saat ini ke dalam 1 file ZIP"
                            >
                                <Download size={15} className="text-red-600" />
                                {exportingZip ? "Mengunduh ZIP..." : `Unduh ZIP Dokumen (${previewData.length})`}
                            </button>
                        )}
                    </div>

                    {/* Preview Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">No</th>
                                        <th className="px-6 py-4 font-semibold">Nama Pekerja / Pemilik</th>
                                        <th className="px-6 py-4 font-semibold">No. KTP / NIK</th>
                                        <th className="px-6 py-4 font-semibold">Instansi / Unit Kerja</th>
                                        <th className="px-6 py-4 font-semibold">Jenis Dokumen</th>
                                        <th className="px-6 py-4 font-semibold">Tgl Pengajuan</th>
                                        <th className="px-6 py-4 font-semibold">Status Dokumen</th>
                                        <th className="px-6 py-4 font-semibold text-center">Aksi Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {previewLoading ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-16 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                                    <span className="text-xs font-medium text-gray-500">Mencari dan memuat dokumen preview...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : previewData.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-16 text-center">
                                                <div className="max-w-md mx-auto flex flex-col items-center">
                                                    <div className="p-3 bg-red-50 rounded-2xl text-red-500 mb-3">
                                                        <AlertCircle size={28} />
                                                    </div>
                                                    <h3 className="font-bold text-gray-800 text-base">Tidak Ada Dokumen Ditemukan</h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Coba sesuaikan tanggal, ganti jenis dokumen, atau bersihkan kata kunci pencarian nama/KTP.
                                                    </p>
                                                    <button 
                                                        onClick={handleResetFilter} 
                                                        className="mt-4 px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all"
                                                    >
                                                        Tampilkan Semua Dokumen
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        previewData.map((item, index) => {
                                            const isDigital = item.is_digital_agreement;
                                            const hasFile = item.file_exists && item.file_url;

                                            return (
                                                <tr key={item.id || index} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-6 py-4 text-xs font-medium text-gray-400">
                                                        {index + 1}
                                                    </td>

                                                    {/* Nama Pemilik */}
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-gray-900">
                                                            {item.nama_pemilik}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {item.jabatan && item.jabatan !== '-' ? item.jabatan : item.category === 'proyek' ? 'Vendor Proyek' : 'Karyawan / Pekerja'}
                                                        </div>
                                                    </td>

                                                    {/* No. KTP / NIK */}
                                                    <td className="px-6 py-4">
                                                        {item.nik_atau_ktm && item.nik_atau_ktm !== '-' ? (
                                                            <div className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold text-gray-800 transition-colors group">
                                                                <span>{item.nik_atau_ktm}</span>
                                                                <button 
                                                                    onClick={() => copyToClipboard(item.nik_atau_ktm)}
                                                                    className="text-gray-400 hover:text-gray-700 opacity-60 group-hover:opacity-100"
                                                                    title="Salin No KTP"
                                                                >
                                                                    {copiedNik === item.nik_atau_ktm ? (
                                                                        <Check size={12} className="text-green-600" />
                                                                    ) : (
                                                                        <Copy size={12} />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic">-</span>
                                                        )}
                                                    </td>

                                                    {/* Instansi / Unit Kerja */}
                                                    <td className="px-6 py-4">
                                                        <div className="text-xs font-semibold text-gray-700">
                                                            {item.instansi}
                                                        </div>
                                                        {item.proyek && item.proyek !== '-' && (
                                                            <div className="text-[11px] text-gray-400 mt-0.5">
                                                                Proyek: {item.proyek}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Jenis Dokumen */}
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700">
                                                            <FileText size={12} />
                                                            {item.doc_label}
                                                        </span>
                                                    </td>

                                                    {/* Tanggal */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600">
                                                        {item.tanggal ? (
                                                            new Date(item.tanggal).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                        ) : '-'}
                                                    </td>

                                                    {/* Status Dokumen */}
                                                    <td className="px-6 py-4">
                                                        {isDigital ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                                                                <ShieldCheck size={13} />
                                                                Digital Agreement K3
                                                            </span>
                                                        ) : hasFile ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
                                                                <CheckCircle2 size={13} />
                                                                {item.file_type === 'image' ? 'Foto / Scan' : item.file_type === 'pdf' ? 'Dokumen PDF' : 'File Terlampir'}
                                                            </span>
                                                        ) : item.file_url ? (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700">
                                                                Tercatat di DB
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs italic">-</span>
                                                        )}
                                                    </td>

                                                    {/* Aksi Preview */}
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => setPreviewItem(item)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                                                                title="Lihat Preview Dokumen"
                                                            >
                                                                <Eye size={13} />
                                                                Preview
                                                            </button>

                                                            {hasFile && (
                                                                <button
                                                                    onClick={() => handleDownloadSingle(item.file_url, item.file_name)}
                                                                    className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all"
                                                                    title="Unduh File"
                                                                >
                                                                    <Download size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: MONITORING MASA BERLAKU (SIM & KONTRAK) */}
            {activeTab === 'expiration' && (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Toolbar */}
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                        <div>
                            <h2 className="font-bold text-gray-900">Masa Berlaku Berkas Pekerja & Kontrak</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Pantau tanggal jatuh tempo SIM/SIO dan Kontrak Proyek.</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Cari nama / instansi..." 
                                value={expirationSearch}
                                onChange={(e) => setExpirationSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-semibold">Jenis Dokumen</th>
                                    <th className="px-6 py-4 font-semibold">Nama / Pemilik</th>
                                    <th className="px-6 py-4 font-semibold">Instansi / Proyek</th>
                                    <th className="px-6 py-4 font-semibold">Keterangan</th>
                                    <th className="px-6 py-4 font-semibold">Tanggal Berakhir</th>
                                    <th className="px-6 py-4 font-semibold">Status</th>
                                    <th className="px-6 py-4 font-semibold text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {expirationLoading ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center mb-2">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                            </div>
                                            Memuat data masa berlaku...
                                        </td>
                                    </tr>
                                ) : filteredExpirationData.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                            <AlertCircle size={32} className="text-gray-300 mb-2 mx-auto" />
                                            <p>Tidak ada data masa berlaku ditemukan</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredExpirationData.map((item, idx) => {
                                        const status = getStatusColor(item.tanggal_berakhir);
                                        const isCritical = status.label === 'Kedaluwarsa' || status.label.includes('H-');

                                        return (
                                            <tr key={item.id || idx} className={`hover:bg-gray-50/50 transition-colors ${isCritical ? 'bg-red-50/20' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 font-medium text-gray-700">
                                                        <Clock size={16} className={isCritical ? "text-red-500" : "text-gray-400"} />
                                                        {item.jenis_dokumen}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-800">
                                                    {item.nama_pemilik}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.instansi_atau_proyek}
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {item.keterangan}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-700 whitespace-nowrap">
                                                    {new Date(item.tanggal_berakhir).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${status.bg} ${status.text}`}>
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {item.file_url ? (
                                                        <a 
                                                            href={item.file_url.startsWith('http') ? item.file_url : `${import.meta.env.VITE_API_URL}/${item.file_url}`} 
                                                            target="_blank" 
                                                            rel="noreferrer"
                                                            className="inline-flex items-center justify-center p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                                                            title="Lihat Dokumen"
                                                        >
                                                            <FileText size={18} />
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs italic">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* MODAL PREVIEW DOKUMEN & DIGITAL AGREEMENT */}
            {previewItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header Modal */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                    {previewItem.is_digital_agreement ? (
                                        <ShieldCheck className="text-emerald-600" size={20} />
                                    ) : (
                                        <FileText className="text-red-600" size={20} />
                                    )}
                                    {previewItem.doc_label}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Pemilik: <span className="font-semibold text-gray-800">{previewItem.nama_pemilik}</span> 
                                    {previewItem.nik_atau_ktm && previewItem.nik_atau_ktm !== '-' && (
                                        <span className="ml-2 font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                                            KTP: {previewItem.nik_atau_ktm}
                                        </span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                {previewItem.file_url && (
                                    <a
                                        href={previewItem.file_url.startsWith('http') ? previewItem.file_url : `${import.meta.env.VITE_API_URL}/${previewItem.file_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-all"
                                        title="Buka di tab baru"
                                    >
                                        <ExternalLink size={18} />
                                    </a>
                                )}
                                <button 
                                    onClick={() => setPreviewItem(null)} 
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Body Modal */}
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                            {/* CASE 1: Digital Agreement K3 */}
                            {previewItem.is_digital_agreement ? (
                                <div className="space-y-6">
                                    {/* Sertifikat Card */}
                                    <div className="bg-white border-2 border-emerald-500/30 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                                        <div className="absolute -right-8 -bottom-8 opacity-5 text-emerald-900 pointer-events-none">
                                            <ShieldCheck size={240} />
                                        </div>

                                        <div className="flex items-start justify-between border-b border-gray-100 pb-4 mb-5">
                                            <div>
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 mb-2">
                                                    <CheckCircle2 size={14} />
                                                    TERVERIFIKASI DIGITAL K3 TAMBANG
                                                </div>
                                                <h4 className="text-xl font-bold text-gray-900">
                                                    Bukti Komitmen & Safety Induction
                                                </h4>
                                                <p className="text-xs text-gray-500">
                                                    Dicatat secara elektronik dalam Sistem Perizinan Tambang PT Semen Padang
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 block">ID Pengajuan</span>
                                                <span className="text-sm font-mono font-bold text-gray-800">
                                                    #{previewItem.id_pengajuan || 'DIGITAL'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Profil Pekerja */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-50/70 rounded-2xl mb-5 text-xs">
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Nama Lengkap</span>
                                                <span className="font-bold text-gray-800 text-sm">{previewItem.nama_pemilik}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Nomor NIK / KTP</span>
                                                <span className="font-mono font-bold text-gray-800 text-sm">{previewItem.nik_atau_ktm || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Instansi / Vendor</span>
                                                <span className="font-semibold text-gray-800">{previewItem.instansi}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Unit Kerja / Jabatan</span>
                                                <span className="font-semibold text-gray-800">{previewItem.unit_kerja || '-'} / {previewItem.jabatan || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Proyek</span>
                                                <span className="font-semibold text-gray-800">{previewItem.proyek || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400 block mb-0.5">Waktu Verifikasi</span>
                                                <span className="font-semibold text-gray-800">
                                                    {previewItem.tanggal ? new Date(previewItem.tanggal).toLocaleString('id-ID') : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Pernyataan Golden Rules */}
                                        <div className="space-y-2.5 text-xs text-gray-700 border-t border-gray-100 pt-4">
                                            <p className="font-bold text-gray-900">Komitmen Keselamatan dan Kesehatan Kerja (K3):</p>
                                            <ul className="list-disc pl-5 space-y-1.5 text-gray-600">
                                                <li>Pekerja telah mengikuti pembekalan Safety Induction dan memahami Standar K3 Tambang.</li>
                                                <li>Wajib mengenakan Alat Pelindung Diri (APD) lengkap yang sesuai di setiap area operasional.</li>
                                                <li>Wajib mematuhi rambu keselamatan kerja, batas kecepatan kendaraan, dan Prosedur Kerja Aman (SOP/JSA).</li>
                                                <li>Wajib melaporkan setiap kejadian hampir celaka (near miss), bahaya, atau kecelakaan kepada pengawas K3.</li>
                                            </ul>
                                        </div>

                                        {/* Tanda Tangan Digital Stamp */}
                                        <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center text-xs">
                                            <div className="text-gray-400 text-[11px]">
                                                Audit Log Ref: {previewItem.id} | Timestamped
                                            </div>
                                            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-3 py-1 rounded-xl">
                                                <ShieldCheck size={16} />
                                                HSE DIGITAL VERIFIED
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action inside modal */}
                                    <div className="flex justify-end gap-3">
                                        <button 
                                            onClick={() => window.print()}
                                            className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-100 transition-all flex items-center gap-1.5"
                                        >
                                            <Printer size={15} />
                                            Cetak Bukti Persetujuan
                                        </button>
                                        <button 
                                            onClick={() => setPreviewItem(null)}
                                            className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all"
                                        >
                                            Tutup
                                        </button>
                                    </div>
                                </div>
                            ) : previewItem.file_url ? (
                                /* CASE 2: Uploaded Physical File */
                                <div className="space-y-4">
                                    <div className="bg-white rounded-2xl border border-gray-200 p-2 overflow-hidden flex justify-center items-center min-h-[300px]">
                                        {previewItem.file_type === 'image' ? (
                                            <img 
                                                src={previewItem.file_url.startsWith('http') ? previewItem.file_url : `${import.meta.env.VITE_API_URL}/${previewItem.file_url}`} 
                                                alt={previewItem.doc_label} 
                                                className="max-h-[550px] w-auto object-contain rounded-xl shadow-xs"
                                            />
                                        ) : previewItem.file_type === 'pdf' ? (
                                            <iframe 
                                                src={previewItem.file_url.startsWith('http') ? previewItem.file_url : `${import.meta.env.VITE_API_URL}/${previewItem.file_url}`} 
                                                className="w-full h-[550px] rounded-xl border border-gray-100" 
                                                title="Preview Dokumen PDF"
                                            />
                                        ) : (
                                            <div className="text-center py-12">
                                                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                                                <p className="text-sm font-semibold text-gray-700 mb-1">{previewItem.file_name || 'Dokumen'}</p>
                                                <p className="text-xs text-gray-400 mb-4">File berupa dokumen dan siap untuk diunduh</p>
                                                <button
                                                    onClick={() => handleDownloadSingle(previewItem.file_url, previewItem.file_name)}
                                                    className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-2 mx-auto"
                                                >
                                                    <Download size={14} />
                                                    Unduh Dokumen Ini
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="flex justify-between items-center pt-2">
                                        <div className="text-xs text-gray-500">
                                            Status: <span className="font-semibold text-gray-700">{previewItem.keterangan || 'Tersedia'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleDownloadSingle(previewItem.file_url, previewItem.file_name)}
                                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                                            >
                                                <Download size={14} />
                                                Unduh File
                                            </button>
                                            <button 
                                                onClick={() => setPreviewItem(null)}
                                                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold hover:bg-gray-800 transition-all"
                                            >
                                                Tutup
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* CASE 3: File tidak tersedia */
                                <div className="text-center py-12">
                                    <AlertCircle size={40} className="text-amber-500 mx-auto mb-2" />
                                    <h4 className="font-bold text-gray-800">File Fisik Belum Diunggah</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Data dokumen tercatat di sistem perizinan, namun berkas fisik belum diunggah oleh pemohon.
                                    </p>
                                    <button 
                                        onClick={() => setPreviewItem(null)}
                                        className="mt-4 px-4 py-1.5 bg-gray-900 text-white rounded-xl text-xs font-semibold"
                                    >
                                        Tutup
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EXPORT DOKUMEN MASSAL (ZIP) */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <span className="p-2 bg-red-50 text-red-600 rounded-xl">
                                    <Download size={20} />
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">Export Dokumen Massal (ZIP)</h3>
                            </div>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <p className="text-xs text-gray-600 leading-relaxed bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100/70">
                                Unduh arsip ZIP seluruh berkas dokumen yang diajukan untuk kebutuhan audit HSE, K3, dan kepatuhan perizinan kerja tambang.
                            </p>
                            
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pilih Jenis Dokumen</label>
                                <select 
                                    value={exportDocType} 
                                    onChange={e => setExportDocType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm font-medium bg-gray-50"
                                >
                                    <option value="file_safety_induksi">📋 Safety Induksi (Upload & Digital Agreement)</option>
                                    <option value="file_data_diri">🪪 KTP / Data Diri Karyawan</option>
                                    <option value="file_foto">👤 Foto Profil Karyawan</option>
                                    <option value="file_bpjs">🏥 BPJS Ketenagakerjaan</option>
                                    <option value="file_mcu">🩺 Medical Check Up (MCU)</option>
                                    <option value="file_hasil_assessment">📊 Hasil Assessment</option>
                                    <option value="file_sertifikat_sio_sim">🪪 Sertifikat / SIO / SIM</option>
                                    <option value="file_izin_kerja_berbahaya">⚠️ Izin Kerja Berbahaya</option>
                                    <option value="file_serah_terima_apd">🦺 Berita Acara APD</option>
                                    <option value="file_kontrak_kerja">📄 Kontrak Kerja / SPK</option>
                                    <option value="file_surat_penunjukan">📨 Surat Penunjukan / Permohonan</option>
                                    <option value="file_jsa">🛠️ Job Safety Analysis (JSA - Proyek)</option>
                                    <option value="file_life_saving_talk">🗣️ Life Saving Talk (Proyek)</option>
                                    <option value="file_izin_kerja_umum">📑 Izin Kerja Umum (Proyek)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Mulai</label>
                                    <input 
                                        type="date"
                                        value={exportStartDate}
                                        onChange={e => setExportStartDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Tanggal Selesai</label>
                                    <input 
                                        type="date"
                                        value={exportEndDate}
                                        onChange={e => setExportEndDate(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none text-sm bg-gray-50"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleExportModal}
                                className="w-full bg-red-600 text-white font-bold py-3 mt-2 rounded-2xl hover:bg-red-700 transition-all shadow-sm flex justify-center items-center gap-2 text-sm"
                            >
                                <Download size={18} />
                                Unduh ZIP Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
