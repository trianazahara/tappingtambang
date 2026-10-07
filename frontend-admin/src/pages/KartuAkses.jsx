import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CreditCard, Loader2, AlertCircle, CheckCircle2, QrCode, Printer, MapPin, Scan, Download, Search, FileText, X, Power, CalendarClock, User, Briefcase, ChevronRight } from 'lucide-react';
import QRCode from 'react-qr-code';
import { useNavigate } from 'react-router-dom';

export default function KartuAkses() {
    const navigate = useNavigate();
    const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
    const [perpanjangModal, setPerpanjangModal] = useState({ isOpen: false, kartu: null, newDate: '' });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [kartuList, setKartuList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState([]);
    
    // Modal State
    const [modal, setModal] = useState({ isOpen: false, data: null });
    
    // Master Area & Kendaraan
    const [areas, setAreas] = useState([]);
    const [kendaraanList, setKendaraanList] = useState([]);
    
    // Form State
    const [formData, setFormData] = useState({
        area_ids: [],
        uid_kartu: '',
        jenis_teknologi: 'Barcode',
        nomor_permit: '',
        nomor_license: '',
        type_unit: '',
        jenis_permit: 'Full',
        issued_at: ''
    });
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchKartu();
        if (areas.length === 0) fetchAreas();
        if (kendaraanList.length === 0) fetchKendaraan();
    }, []);

    const fetchKendaraan = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`);
            if (res.data.success) {
                setKendaraanList(res.data.data);
            }
        } catch (err) {
            console.error('Gagal mengambil data kendaraan:', err);
        }
    };

    const fetchKartu = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/kartu`);
            if (res.data.success) {
                setKartuList(res.data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAreas = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/area`);
            if (res.data.success) {
                // Filter only active areas
                setAreas(res.data.data.filter(a => a.status_area === 'Aktif'));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleOpenModal = (pengajuan) => {
        const isEdit = pengajuan.status_berkas === 'Aktif';
        const kartu = isEdit && pengajuan.karyawan?.kartu_akses?.length > 0 
            ? pengajuan.karyawan.kartu_akses[0] 
            : null;

        const areaIds = pengajuan.master_areas?.map(a => a.id_area) || [];

        // Generate nomor permit unik
        let generatedNomor = kartu?.nomor_permit;
        if (!generatedNomor) {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const num = String(pengajuan.id_pengajuan).padStart(4, '0');
            generatedNomor = `PMT-${year}${month}-${num}`;
        }

        let parsedUnits = [];
        try {
            if (kartu?.type_unit) {
                if (kartu.type_unit.startsWith('[')) {
                    parsedUnits = JSON.parse(kartu.type_unit);
                } else {
                    parsedUnits = kartu.type_unit.split(',').map(s => ({
                        id_kendaraan: null,
                        nama_kendaraan: s.trim(),
                        type_unit: '',
                        status_fr: kartu?.jenis_permit === 'R' ? 'R' : 'F',
                        issued_at: kartu?.issued_at || ''
                    }));
                }
            }
        } catch(e) {
            console.error('Failed to parse type_unit', e);
        }

        setFormData({
            area_ids: areaIds,
            uid_kartu: kartu?.uid_kartu || '',
            jenis_teknologi: kartu?.jenis_teknologi || 'Barcode',
            nomor_permit: generatedNomor,
            nomor_license: kartu?.nomor_license || '',
            type_unit: parsedUnits
        });
        setModal({ isOpen: true, data: pengajuan });
        setError('');
        setSuccess('');
    };

    const handleOpenDetail = async (item) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pengajuan/${item.id_pengajuan}`);
            if (res.data.success) {
                setDetailModal({ isOpen: true, data: res.data.data });
            }
        } catch (error) {
            console.error("Gagal memuat detail:", error);
            toast.error("Gagal memuat detail pengajuan");
        } finally {
            setLoading(false);
        }
    };

    const handleAreaChange = (id_area) => {
        setFormData(prev => {
            const current = [...prev.area_ids];
            if (current.includes(id_area)) {
                return { ...prev, area_ids: current.filter(id => id !== id_area) };
            } else {
                return { ...prev, area_ids: [...current, id_area] };
            }
        });
    };

    const handleKendaraanChange = (k) => {
        let currentUnits = Array.isArray(formData.type_unit) ? [...formData.type_unit] : [];
        const existingIdx = currentUnits.findIndex(u => (u.id_kendaraan === k.id_kendaraan) || (!u.id_kendaraan && u.nama_kendaraan === k.nama_kendaraan));
        
        if (existingIdx >= 0) {
            currentUnits.splice(existingIdx, 1);
        } else {
            currentUnits.push({
                id_kendaraan: k.id_kendaraan,
                nama_kendaraan: k.nama_kendaraan,
                type_unit: k.type_unit,
                status_fr: 'F',
                issued_at: ''
            });
        }
        setFormData({ ...formData, type_unit: currentUnits });
    };

    const handleKendaraanDetailChange = (id_kendaraan, field, value) => {
        let currentUnits = Array.isArray(formData.type_unit) ? [...formData.type_unit] : [];
        const existingIdx = currentUnits.findIndex(u => u.id_kendaraan === id_kendaraan || (!u.id_kendaraan && u.nama_kendaraan === id_kendaraan));
        if (existingIdx >= 0) {
            currentUnits[existingIdx][field] = value;
            setFormData({ ...formData, type_unit: currentUnits });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.area_ids.length === 0) {
            setError('Minimal pilih 1 Area Kerja');
            return;
        }

        if (formData.jenis_teknologi === 'NFC' && !formData.uid_kartu) {
            setError('UID NFC wajib diisi jika memilih jenis teknologi NFC');
            return;
        }

        setSubmitLoading(true);
        setError('');
        
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/kartu/proses`, {
                id_pengajuan: modal.data.id_pengajuan,
                area_ids: formData.area_ids,
                uid_kartu: formData.uid_kartu,
                jenis_teknologi: formData.jenis_teknologi,
                nomor_permit: formData.nomor_permit,
                warna_kartu: modal.data.kategori_akses || 'Merah',
                nomor_license: formData.nomor_license,
                type_unit: JSON.stringify(formData.type_unit)
            });

            if (res.data.success) {
                setSuccess('Kartu berhasil diproses!');
                setTimeout(() => {
                    setModal({ isOpen: false, data: null });
                    fetchKartu();
                }, 1500);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Gagal memproses kartu');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleCetakKartu = (id_pengajuan) => {
        window.open(`${import.meta.env.VITE_API_URL}/api/pengajuan/${id_pengajuan}/cetak-permit`, '_blank');
    };

    const handleToggleStatus = async (kartu) => {
        if (!kartu) return;
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/kartu/toggle-status/${kartu.id_kartu}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchKartu();
            }
        } catch (error) {
            console.error("Gagal mengubah status kartu", error);
            toast.error("Gagal mengubah status kartu");
        }
    };

    const submitPerpanjang = async (e) => {
        e.preventDefault();
        const { kartu, newDate } = perpanjangModal;
        if (!kartu || !newDate) return;
        
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/kartu/perpanjang/${kartu.id_kartu}`, { tanggal_selesai: newDate });
            if (res.data.success) {
                toast.success("Berhasil diperpanjang!");
                setPerpanjangModal({ isOpen: false, kartu: null, newDate: '' });
                fetchKartu();
            }
        } catch (error) {
            console.error("Gagal memperpanjang kartu", error);
            toast.error("Gagal memperpanjang kartu");
        }
    };

    const handlePerpanjang = (id_pengajuan) => {
        if (!id_pengajuan) return;
        navigate(`/dashboard/permit?edit_id=${id_pengajuan}&action=perpanjang`);
    };

    const handleExportExcel = async () => {
        if (selectedRows.length === 0) {
            toast.error("Pilih data yang akan di-export!");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/kartu/export/excel`, { ids: selectedRows }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Data_Kartu_Akses.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccess("Berhasil export ke Excel!");
        } catch (err) {
            console.error("Error export data:", err);
            setError("Gagal export data");
        } finally {
            setLoading(false);
        }
    };

    const handleExportDocs = async () => {
        if (selectedRows.length === 0) {
            toast.error("Pilih data yang akan di-export!");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/kartu/export/docs`, { ids: selectedRows }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Dokumen_Kartu_Akses.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
            setSuccess("Berhasil download dokumen!");
        } catch (err) {
            console.error("Error export docs:", err);
            setError("Gagal download dokumen");
        } finally {
            setLoading(false);
        }
    };

    const filteredKartuList = kartuList.filter((item) => {
        const matchSearch = (item.karyawan?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.karyawan?.nik_atau_ktm || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchStatus = statusFilter ? item.status_berkas === statusFilter : true;
        return matchSearch && matchStatus;
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Kartu Akses & Area</h1>
                    <p className="text-sm text-gray-500 mt-1">Atur area lokasi, daftarkan NFC/QR Code, dan cetak Permit</p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari Nama / NIK..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-sm"
                        />
                    </div>
                    <div className="w-full sm:w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-sm bg-white"
                        >
                            <option value="">Semua Status</option>
                            <option value="Siap_Cetak">Menunggu Diproses</option>
                            <option value="Aktif">Sudah Diproses (Aktif)</option>
                        </select>
                    </div>
                    <div className="flex w-full sm:w-auto gap-2">
                        <button onClick={handleExportExcel} className="flex-1 sm:flex-none py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
                            <Download size={18} />
                            Excel
                        </button>
                        <button onClick={handleExportDocs} className="flex-1 sm:flex-none py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 text-sm">
                            <Download size={18} />
                            ZIP
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-100 text-[13px] uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-5 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-[#E11D2E] focus:ring-[#E11D2E]"
                                        checked={filteredKartuList.length > 0 && selectedRows.length === filteredKartuList.length}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedRows(filteredKartuList.map(p => p.id_pengajuan));
                                            else setSelectedRows([]);
                                        }}
                                    />
                                </th>
                                <th className="px-6 py-5">Pekerja</th>
                                <th className="px-6 py-5">Perusahaan</th>
                                <th className="px-6 py-5">Status & Akses</th>
                                <th className="px-6 py-5">Berlaku Hingga</th>
                                <th className="px-6 py-5 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500"><Loader2 className="animate-spin mx-auto mb-3 text-red-500" size={32}/> Memuat data kartu akses...</td></tr>
                            ) : filteredKartuList.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500"><Search className="mx-auto mb-3 opacity-20" size={48}/>Tidak ada kartu ditemukan.</td></tr>
                            ) : (
                                filteredKartuList.map((item) => {
                                    const isAktif = item.status_berkas === 'Aktif';
                                    const kartu = isAktif && item.karyawan?.kartu_akses?.length > 0 ? item.karyawan.kartu_akses[0] : null;
                                    const kartuStatus = kartu?.status_kartu || '';
                                    const expiryDateStr = kartu?.berlaku_hingga || item.tanggal_selesai;
                                    const isExpired = expiryDateStr ? new Date(expiryDateStr) < new Date(new Date().setHours(0,0,0,0)) : false;
                                    return (
                                        <tr key={item.id_pengajuan} className="hover:bg-red-50/30 transition-colors group">
                                            <td className="px-4 py-4 border-b border-gray-100 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded border-gray-300 text-[#E11D2E] focus:ring-[#E11D2E]"
                                                    checked={selectedRows.includes(item.id_pengajuan)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedRows(prev => [...prev, item.id_pengajuan]);
                                                        else setSelectedRows(prev => prev.filter(id => id !== item.id_pengajuan));
                                                    }}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold text-lg">
                                                        {item.karyawan?.nama_lengkap?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 group-hover:text-[#E11D2E] transition-colors">
                                                            {item.karyawan?.nama_lengkap}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5 font-medium">NIK/KTM: {item.karyawan?.nik_atau_ktm}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-gray-700 font-medium">{item.karyawan?.master_instansi?.nama_instansi || item.karyawan?.unit_kerja || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2 items-start">
                                                    <span className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border tracking-wider ${
                                                        isExpired ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                                        isAktif ? (kartuStatus === 'Aktif' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200') : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                        {isExpired ? 'Kedaluwarsa' : isAktif ? (kartuStatus === 'Aktif' ? 'Kartu Aktif' : 'Kartu Nonaktif') : 'Menunggu Diproses'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                                                            item.kategori_akses === 'Hijau' ? 'bg-green-500' :
                                                            item.kategori_akses === 'Biru' ? 'bg-blue-500' :
                                                            item.kategori_akses === 'Orange' ? 'bg-orange-500' :
                                                            'bg-red-500'
                                                        }`}></div>
                                                        <span className="text-xs font-semibold text-gray-700">{item.kategori_akses || '-'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {kartu?.berlaku_hingga || item.tanggal_selesai ? (
                                                    <div className="flex items-center gap-1.5 text-gray-600 font-medium text-sm">
                                                        <CalendarClock size={16} className="text-gray-400"/>
                                                        {new Date(kartu?.berlaku_hingga || item.tanggal_selesai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </div>
                                                ) : <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2 justify-center opacity-80 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleOpenDetail(item)} className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors tooltip" title="Detail">
                                                        <FileText size={16} />
                                                    </button>
                                                    
                                                    {item.status_berkas === 'Siap_Cetak' ? (
                                                        <button onClick={() => handleOpenModal(item)} className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors" title="Proses Kartu">
                                                            <CreditCard size={16} />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleCetakKartu(item.id_pengajuan)} className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors" title="Cetak DOCX">
                                                                <Download size={16} />
                                                            </button>
                                                            <button onClick={() => handleOpenModal(item)} className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-lg transition-colors" title="Edit Kartu">
                                                                <CreditCard size={16} />
                                                            </button>
                                                            <button onClick={() => handlePerpanjang(item.id_pengajuan)} className="p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors" title="Perpanjang Kartu">
                                                                <CalendarClock size={16} />
                                                            </button>
                                                            <button onClick={() => handleToggleStatus(kartu)} className={`p-2 rounded-lg transition-colors ${kartuStatus === 'Aktif' ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`} title={kartuStatus === 'Aktif' ? "Nonaktifkan Kartu" : "Aktifkan Kartu"}>
                                                                <Power size={16} />
                                                            </button>
                                                        </>
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

            {/* Modal Proses Kartu */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Proses Kartu Akses & Area</h3>
                                <p className="text-sm text-gray-500 mt-1">{modal.data?.karyawan?.nama_lengkap} - {modal.data?.karyawan?.master_instansi?.nama_instansi || modal.data?.karyawan?.unit_kerja || '-'}</p>
                            </div>
                            <button onClick={() => setModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {error && (
                                <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3">
                                    <AlertCircle size={20} /> <p className="font-medium">{error}</p>
                                </div>
                            )}
                            {success && (
                                <div className="mb-6 bg-green-50 text-green-600 p-4 rounded-xl border border-green-200 flex items-center gap-3">
                                    <CheckCircle2 size={20} /> <p className="font-medium">{success}</p>
                                </div>
                            )}

                            <form id="formKartu" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Kiri: Pengaturan Kartu */}
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                                            <CreditCard size={18} className="text-[#E11D2E]"/> Pengaturan Kartu Fisik
                                        </h4>
                                        
                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700">Nomor Permit (Generate Otomatis)</label>
                                            <input 
                                                type="text" 
                                                value={formData.nomor_permit} 
                                                readOnly
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none text-gray-500 font-mono" 
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="block text-sm font-medium text-gray-700">Jenis Teknologi Kartu</label>
                                            <select 
                                                value={formData.jenis_teknologi}
                                                onChange={(e) => setFormData({...formData, jenis_teknologi: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                                            >
                                                <option value="Barcode">Hanya QR Code</option>
                                                <option value="NFC">NFC + QR Code</option>
                                            </select>
                                        </div>

                                        {formData.jenis_teknologi === 'NFC' && (
                                            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                                                <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    UID NFC <span className="text-xs font-normal text-gray-500">(Tap kartu ke reader)</span>
                                                </label>
                                                <div className="relative">
                                                    <Scan className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                                                    <input 
                                                        type="text" 
                                                        value={formData.uid_kartu}
                                                        onChange={(e) => setFormData({...formData, uid_kartu: e.target.value})}
                                                        placeholder="Contoh: 04:EA:XX:XX:XX"
                                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* New Permit Data Fields */}
                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <div className="space-y-1.5">
                                                <label className="block text-sm font-medium text-gray-700">Nomor License (SIMPER/KIMPER)</label>
                                                <input 
                                                    type="text" 
                                                    value={formData.nomor_license}
                                                    onChange={(e) => setFormData({...formData, nomor_license: e.target.value})}
                                                    placeholder="Contoh: SIM-123456"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                                                />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700">Type Unit / Kendaraan</label>
                                                <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50 max-h-96 overflow-y-auto">
                                                    {kendaraanList.length > 0 ? (() => {
                                                        const selectedColorMap = {
                                                            'Hijau (Full Pit Access)': 'Hijau',
                                                            'Biru (In Pit Access)': 'Biru',
                                                            'Orange': 'Orange'
                                                        };
                                                        const permitColor = modal.data.kategori_akses;
                                                        const filterColor = selectedColorMap[permitColor];
                                                        const filteredUnits = filterColor ? kendaraanList.filter(k => k.warna_permit === filterColor) : kendaraanList;
                                                        
                                                        if (filteredUnits.length === 0) {
                                                            return <div className="text-sm text-gray-500 italic">Tidak ada unit untuk warna permit {permitColor}.</div>;
                                                        }

                                                        return filteredUnits.map(k => {
                                                            const currentUnits = Array.isArray(formData.type_unit) ? formData.type_unit : [];
                                                            const selectedUnit = currentUnits.find(v => (v.id_kendaraan === k.id_kendaraan) || (!v.id_kendaraan && v.nama_kendaraan === k.nama_kendaraan));
                                                            const isChecked = !!selectedUnit;

                                                            return (
                                                                <div key={k.id_kendaraan} className={`flex flex-col gap-3 p-3 border rounded-lg transition-colors ${isChecked ? 'bg-white border-[#E11D2E]/30 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                                                                    <label className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer font-medium">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={isChecked}
                                                                            onChange={() => handleKendaraanChange(k)}
                                                                            className="rounded text-[#E11D2E] focus:ring-[#E11D2E] w-4 h-4"
                                                                        /> {k.nama_kendaraan} {k.type_unit ? `- ${k.type_unit}` : ''} <span className="text-xs text-gray-400 font-normal">({k.kategori_kendaraan})</span>
                                                                    </label>
                                                                    
                                                                    {isChecked && (
                                                                        <div className="flex flex-wrap gap-4 pl-6 pt-1 border-t border-gray-100 mt-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <label className="text-xs font-medium text-gray-600">Status:</label>
                                                                                <select
                                                                                    value={selectedUnit.status_fr || 'F'}
                                                                                    onChange={(e) => handleKendaraanDetailChange(k.id_kendaraan || k.nama_kendaraan, 'status_fr', e.target.value)}
                                                                                    className="text-xs px-2 py-1.5 rounded border border-gray-300 bg-white"
                                                                                >
                                                                                    <option value="F">Full (F)</option>
                                                                                    <option value="R">Restricted (R)</option>
                                                                                </select>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <label className="text-xs font-medium text-gray-600">Issued At:</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={selectedUnit.issued_at || ''}
                                                                                    onChange={(e) => handleKendaraanDetailChange(k.id_kendaraan || k.nama_kendaraan, 'issued_at', e.target.value)}
                                                                                    className="text-xs px-2 py-1.5 rounded border border-gray-300 bg-white"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    })() : (
                                                        <div className="text-sm text-gray-400">Memuat data kendaraan...</div>
                                                    )}
                                                </div>
                                                </div>
                                            </div>
                                        </div>

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col items-center justify-center space-y-3">
                                        <span className="text-sm font-medium text-gray-600">Preview QR Code</span>
                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                            <QRCode value={formData.nomor_permit || 'QR'} size={120} bgColor="#ffffff" fgColor="#000000" level="Q" />
                                        </div>
                                    </div>
                                </div>

                                {/* Kanan: Area Kerja */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-800 flex items-center gap-2 border-b pb-2">
                                        <MapPin size={18} className="text-[#E11D2E]"/> Akses Area Kerja
                                    </h4>
                                    <p className="text-sm text-gray-500 mb-3">Pilih area mana saja yang boleh dimasuki oleh pekerja ini.</p>
                                    
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 max-h-[300px] overflow-y-auto space-y-2">
                                        {areas.map(area => (
                                            <label key={area.id_area} className="flex items-center p-3 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-sm cursor-pointer transition-all">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.area_ids.includes(area.id_area)}
                                                    onChange={() => handleAreaChange(area.id_area)}
                                                    className="w-4 h-4 text-[#E11D2E] rounded border-gray-300 focus:ring-[#E11D2E]"
                                                />
                                                <span className="ml-3 text-sm font-medium text-gray-700">{area.nama_area}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setModal({ isOpen: false, data: null })} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                                Batal
                            </button>
                            <button form="formKartu" type="submit" disabled={submitLoading} className="px-6 py-2.5 rounded-xl bg-[#E11D2E] hover:bg-[#B0121F] text-white font-medium transition-colors shadow-md shadow-red-500/20 flex items-center gap-2">
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18} />} Simpan & Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* MODAL DETAIL */}
            {detailModal.isOpen && detailModal.data && (() => {
                const p = detailModal.data;
                const files = [
                    { key: 'file_foto', label: 'Foto Profil' },
                    { key: 'file_bpjs', label: 'BPJS' },
                    { key: 'file_data_diri', label: 'Data Diri / KTP' },
                    { key: 'file_mcu', label: 'MCU / Sehat' },
                    { key: 'file_kontrak_kerja', label: 'Kontrak Kerja' },
                    { key: 'file_surat_penunjukan', label: 'Surat Penunjukan' },
                    { key: 'file_surat_pengantar', label: 'Surat Pengantar' },
                    { key: 'file_prosedur', label: 'Prosedur' },
                    { key: 'file_izin_kerja_berbahaya', label: 'Izin Kerja Berbahaya' },
                    { key: 'file_serah_terima_apd', label: 'Serah Terima APD / Induksi' },
                    { key: 'file_permohonan_kimper', label: 'Permohonan Kimper' },
                    { key: 'file_sertifikat_sio_sim', label: 'SIO/SIM' },
                    { key: 'file_hasil_assessment', label: 'Hasil Assessment' },
                    { key: 'file_safety_induksi', label: 'Safety Induksi' }
                ];
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col relative">
                            {/* Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">Detail Pengajuan Permit</h2>
                                    <p className="text-sm text-gray-500 mt-1">ID Pengajuan: #{p.id_pengajuan}</p>
                                </div>
                                <button onClick={() => setDetailModal({ isOpen: false, data: null })} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            
                            {/* Content */}
                            <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Kolom Kiri: Info Pekerja & Akses */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Card Informasi Pekerja */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                                                <User size={18} className="text-gray-500" />
                                                <h3 className="font-bold text-gray-800">Informasi Pekerja</h3>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Nama Lengkap</p>
                                                        <p className="font-semibold text-gray-900">{p.karyawan?.nama_lengkap}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">NIK / KTM</p>
                                                        <p className="font-semibold text-gray-900">{p.karyawan?.nik_atau_ktm}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Jenis Kelamin</p>
                                                        <p className="font-medium text-gray-800">{p.karyawan?.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Tempat, Tanggal Lahir</p>
                                                        <p className="font-medium text-gray-800">{p.karyawan?.tempat_lahir}, {p.karyawan?.tanggal_lahir ? new Date(p.karyawan?.tanggal_lahir).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Jabatan</p>
                                                        <p className="font-medium text-gray-800 flex items-center gap-1.5"><Briefcase size={14} className="text-gray-400"/> {p.karyawan?.jabatan || '-'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 mb-1">Unit Kerja / Perusahaan</p>
                                                        <p className="font-medium text-gray-800">{p.karyawan?.master_instansi?.nama_instansi || p.karyawan?.unit_kerja || '-'}</p>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <p className="text-xs text-gray-500 mb-1">Alamat Rumah</p>
                                                        <p className="font-medium text-gray-800 flex items-start gap-1.5"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0"/> {p.karyawan?.alamat_rumah || '-'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Dokumen */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                                                <FileText size={18} className="text-gray-500" />
                                                <h3 className="font-bold text-gray-800">Dokumen Personal</h3>
                                            </div>
                                            <div className="p-6">
                                                <div className="grid grid-cols-2 gap-3">
                                                    {files.filter(f => p[f.key]).map(f => (
                                                        <a key={f.key} href={`${import.meta.env.VITE_API_URL}/${p[f.key]}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm transition-all group">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="bg-red-100 p-1.5 rounded-lg text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <span className="text-sm font-semibold text-gray-700 group-hover:text-red-700 transition-colors">{f.label}</span>
                                                            </div>
                                                            <ChevronRight size={16} className="text-gray-300 group-hover:text-red-400" />
                                                        </a>
                                                    ))}
                                                </div>
                                                {files.filter(f => p[f.key]).length === 0 && (
                                                    <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                        <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                                        <p className="text-sm">Tidak ada dokumen personal yang dilampirkan.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolom Kanan: Izin & Sehat */}
                                    <div className="space-y-6">
                                        {/* Izin Akses Tambang */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                                                <h3 className="font-bold text-gray-800">Izin Akses Tambang</h3>
                                            </div>
                                            <div className="p-6 space-y-4">
                                                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Warna Permit</p>
                                                        <p className={`font-bold text-lg mt-0.5 ${
                                                            p.kategori_akses?.includes('Merah') ? 'text-red-600' :
                                                            p.kategori_akses?.includes('Hijau') ? 'text-green-600' :
                                                            p.kategori_akses?.includes('Biru') ? 'text-blue-600' : 'text-orange-500'
                                                        }`}>{p.kategori_akses}</p>
                                                    </div>
                                                    <div className={`h-10 w-10 rounded-full shadow-sm ${
                                                        p.kategori_akses?.includes('Merah') ? 'bg-red-500' :
                                                        p.kategori_akses?.includes('Hijau') ? 'bg-green-500' :
                                                        p.kategori_akses?.includes('Biru') ? 'bg-blue-500' : 'bg-orange-500'
                                                    }`}></div>
                                                </div>
                                                
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Jenis Izin</p>
                                                    <p className="font-semibold text-gray-900">{p.jenis_izin} <span className="text-gray-400 font-normal">({p.jenis_permintaan})</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Durasi Permit</p>
                                                    <p className="font-medium text-gray-800 bg-gray-50 inline-block px-2.5 py-1 rounded-md border border-gray-100">
                                                        {p.tanggal_mulai ? new Date(p.tanggal_mulai).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'} 
                                                        <span className="mx-2 text-gray-400">s/d</span> 
                                                        {p.tanggal_selesai ? new Date(p.tanggal_selesai).toLocaleDateString('id-ID', {day:'2-digit', month:'short', year:'numeric'}) : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Area Diizinkan</p>
                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                        {p.master_areas && p.master_areas.length > 0 ? p.master_areas.map(a => (
                                                            <span key={a.id_area} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-md border border-blue-100">
                                                                {a.nama_area}
                                                            </span>
                                                        )) : <span className="text-gray-400 text-sm">-</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal Perpanjang */}
            {perpanjangModal.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Perpanjang Masa Berlaku</h3>
                                <p className="text-sm text-gray-500 mt-1">Ubah tanggal kedaluwarsa kartu akses</p>
                            </div>
                            <button onClick={() => setPerpanjangModal({ isOpen: false, kartu: null, newDate: '' })} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <form onSubmit={submitPerpanjang} className="p-6">
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Tanggal Perpanjangan Baru</label>
                                    <input 
                                        type="date"
                                        value={perpanjangModal.newDate}
                                        onChange={(e) => setPerpanjangModal({ ...perpanjangModal, newDate: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E]"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setPerpanjangModal({ isOpen: false, kartu: null, newDate: '' })} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-100 transition-colors">
                                    Batal
                                </button>
                                <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#E11D2E] hover:bg-[#B0121F] text-white font-medium transition-colors shadow-md shadow-red-500/20 flex items-center gap-2">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
