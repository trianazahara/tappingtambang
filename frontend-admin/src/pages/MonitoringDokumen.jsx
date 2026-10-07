import { useEffect, useState } from 'react';
import axios from 'axios';
import { Clock, Search, AlertCircle, Download, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MonitoringDokumen() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState('');
    const [exportEndDate, setExportEndDate] = useState('');
    const [exportDocType, setExportDocType] = useState('file_safety_induksi');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/monitoring`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (error) {
            console.error("Error fetching monitoring:", error);
            toast.error("Gagal mengambil data monitoring");
        } finally {
            setLoading(false);
        }
    };

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

    const filteredData = data.filter(item => 
        item.nama_pemilik.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.instansi_atau_proyek.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.jenis_dokumen.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleExport = async () => {
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
                else {
                    const filenameMatchNoQuotes = contentDisposition.match(/filename=([^;]+)/);
                    if (filenameMatchNoQuotes && filenameMatchNoQuotes.length === 2) fileName = filenameMatchNoQuotes[1];
                }
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

    return (
        <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Monitoring Masa Berlaku</h1>
                    <p className="text-gray-500 mt-1">Pantau masa berlaku Kontrak Kerja dan SIM/SIO dari semua pekerja.</p>
                </div>
                <button 
                    onClick={() => setShowExportModal(true)}
                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-800 transition-all shadow-sm"
                >
                    <Download size={18} />
                    Export Dokumen (ZIP)
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Cari pemilik / instansi..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all w-64"
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
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex justify-center mb-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                                        </div>
                                        Memuat data...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                                        <AlertCircle size={32} className="text-gray-300 mb-2 mx-auto" />
                                        <p>Tidak ada data dokumen ditemukan</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, idx) => {
                                    const status = getStatusColor(item.tanggal_berakhir);
                                    
                                    // Highlight if it's expired or close to expiration
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

            {/* Modal Export Dokumen */}
            {showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Export Dokumen Audit (ZIP)</h3>
                            <button onClick={() => setShowExportModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <p className="text-sm text-gray-600 mb-2">
                                Unduh massal file dokumen pengajuan untuk rentang waktu tertentu. Sangat berguna untuk kebutuhan audit!
                            </p>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Dokumen</label>
                                <select 
                                    value={exportDocType} 
                                    onChange={e => setExportDocType(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none font-medium"
                                >
                                    <option value="file_safety_induksi">TTD K3 (Upload) & Digital Agreement</option>
                                    <option value="file_foto">Foto Profil Karyawan</option>
                                    <option value="file_data_diri">KTP / Data Diri Karyawan</option>
                                    <option value="file_bpjs">BPJS Ketenagakerjaan</option>
                                    <option value="file_mcu">Medical Check Up (MCU)</option>
                                    <option value="file_hasil_assessment">Hasil Assessment</option>
                                    <option value="file_sertifikat_sio_sim">Sertifikat / SIO / SIM Karyawan</option>
                                    <option value="file_izin_kerja_berbahaya">Izin Kerja Berbahaya</option>
                                    <option value="file_serah_terima_apd">Berita Acara Serah Terima APD</option>
                                    <option value="file_kontrak_kerja">Kontrak Kerja / SPK</option>
                                    <option value="file_surat_penunjukan">Surat Penunjukan / Permohonan</option>
                                    <option value="file_jsa">Job Safety Analysis (JSA) - Dok. Proyek</option>
                                    <option value="file_life_saving_talk">Life Saving Talk - Dok. Proyek</option>
                                    <option value="file_izin_kerja_umum">Izin Kerja Umum - Dok. Proyek</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Mulai</label>
                                    <input 
                                        type="date"
                                        value={exportStartDate}
                                        onChange={e => setExportStartDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tanggal Selesai</label>
                                    <input 
                                        type="date"
                                        value={exportEndDate}
                                        onChange={e => setExportEndDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleExport}
                                className="w-full bg-red-600 text-white font-bold py-3 mt-4 rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2"
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
