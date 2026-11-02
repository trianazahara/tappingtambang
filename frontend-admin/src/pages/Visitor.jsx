import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
    Plus, CheckCircle2, User, Phone, Briefcase, MapPin, Search, IdCard, Clock, 
    FileText, Upload, ShieldCheck, Activity, Eye, X, AlertCircle, ArrowLeft, ArrowRight,
    HeartPulse, Check, Download, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';

export default function Visitor() {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
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
    const [detailModal, setDetailModal] = useState(false);
    const [detailVisitor, setDetailVisitor] = useState(null);
    const [confirmSelesai, setConfirmSelesai] = useState(null);
    
    // Wizard step inside Session Modal (1: Data Visitor, 2: Asesmen Kesehatan, 3: Syarat Dokumen, 4: Safety Induksi)
    const [formStep, setFormStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Signature
    const [ttdMethod, setTtdMethod] = useState('online'); // 'online' | 'upload'
    const sigCanvas = useRef(null);

    // Files state
    const [files, setFiles] = useState({});
    
    // Edit state
    const [editCardId, setEditCardId] = useState(null);
    const [editSessionId, setEditSessionId] = useState(null);
    
    // Forms
    const [cardForm, setCardForm] = useState({ nomor_kartu: '', uid_kartu: '' });
    
    const getDefaultExpiry = () => {
        const tmr = new Date();
        tmr.setDate(tmr.getDate() + 1);
        tmr.setHours(17, 0, 0, 0); 
        return tmr.toISOString().slice(0, 16);
    };

    const initialSessionForm = {
        nomor_kartu: '',
        nama: '',
        no_telp: '',
        perusahaan: '',
        warna_permit: 'Merah',
        area_akses: [],
        type_unit: '',
        nomor_license: '',
        issued_at: '',
        berlaku_hingga: getDefaultExpiry(),
        // Assessment Kesehatan
        tinggi_badan: '',
        berat_badan: '',
        q1_sehat: true,
        q2_tidur_cukup: true,
        q3_jantung: false,
        q4_diabetes: false,
        q5_kolesterol: false,
        q6_obat_kantuk: false,
        q7_paham_pekerjaan: true,
        q8_paham_risiko: true,
        q9_sedia_menegur: true,
        q10_sedia_melapor: true,
        // Safety Induction
        setuju_aturan_k3: false
    };

    const [sessionForm, setSessionForm] = useState(initialSessionForm);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'cards') {
                const res = await axios.get(`${backendUrl}/api/visitor/cards`);
                setCards(res.data.data);
            } else {
                const [resVisitor, resArea, resInstansi] = await Promise.all([
                    axios.get(`${backendUrl}/api/visitor`),
                    axios.get(`${backendUrl}/api/area`),
                    axios.get(`${backendUrl}/api/instansi`)
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
            const current = [...(prev.area_akses || [])];
            if (current.includes(id_area)) {
                return { ...prev, area_akses: current.filter(id => id !== id_area) };
            } else {
                return { ...prev, area_akses: [...current, id_area] };
            }
        });
    };

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target;
        if (selectedFiles && selectedFiles[0]) {
            const file = selectedFiles[0];
            if (file.size > 5 * 1024 * 1024) {
                toast.error('Ukuran file maksimal 5MB');
                return;
            }
            setFiles(prev => ({ ...prev, [name]: file }));
            toast.success(`File ${file.name} dipilih`);
        }
    };

    // Card Handlers
    const handleCardSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editCardId) {
                const res = await axios.put(`${backendUrl}/api/visitor/cards/${editCardId}`, cardForm);
                if (res.data.success) toast.success('Kartu berhasil diupdate');
            } else {
                const res = await axios.post(`${backendUrl}/api/visitor/cards`, cardForm);
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
            const res = await axios.delete(`${backendUrl}/api/visitor/cards/${id}`);
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
        if (e) e.preventDefault();

        // Validations
        if (!sessionForm.nama?.trim()) {
            toast.error("Nama lengkap visitor wajib diisi");
            setFormStep(1);
            return;
        }
        if (!sessionForm.no_telp?.trim()) {
            toast.error("Nomor HP / WhatsApp wajib diisi");
            setFormStep(1);
            return;
        }
        if (!sessionForm.perusahaan?.trim()) {
            toast.error("Perusahaan / Instansi wajib dipilih");
            setFormStep(1);
            return;
        }
        if (!sessionForm.tinggi_badan || !sessionForm.berat_badan) {
            toast.error("Tinggi dan berat badan pada Asesmen Kesehatan wajib diisi");
            setFormStep(2);
            return;
        }
        
        // Syarat Upload: KTP & Surat Pengantar
        if (!editSessionId) {
            if (!files['file_ktp']) {
                toast.error("Dokumen KTP wajib diunggah!");
                setFormStep(3);
                return;
            }
            if (!files['file_surat_pengantar']) {
                toast.error("Surat Pengantar wajib diunggah!");
                setFormStep(3);
                return;
            }
        }

        // Safety Induksi Validation
        if (!sessionForm.setuju_aturan_k3) {
            toast.error("Harap setujui Peraturan Umum Keselamatan Kerja (K3)!");
            setFormStep(4);
            return;
        }
        if (ttdMethod === 'online' && !editSessionId) {
            if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
                toast.error("Harap buat tanda tangan persetujuan Safety Induksi!");
                setFormStep(4);
                return;
            }
        } else if (ttdMethod === 'upload' && !editSessionId && !files['file_safety_induksi']) {
            toast.error("Harap unggah dokumen Safety Induksi yang telah ditandatangani!");
            setFormStep(4);
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('nomor_kartu', sessionForm.nomor_kartu);
            formData.append('nama', sessionForm.nama);
            formData.append('no_telp', sessionForm.no_telp);

            let perusahaanVal = sessionForm.perusahaan;
            if (perusahaanVal === 'Lainnya') {
                perusahaanVal = sessionForm.perusahaanLainnya || 'Lainnya';
                if (perusahaanVal !== 'Lainnya') {
                    axios.post(`${backendUrl}/api/instansi`, {
                        nama_instansi: perusahaanVal,
                        kategori_instansi: 'Visitor'
                    }).catch(() => {});
                }
            }
            formData.append('perusahaan', perusahaanVal);
            formData.append('warna_permit', sessionForm.warna_permit);
            formData.append('berlaku_hingga', sessionForm.berlaku_hingga);
            formData.append('area_akses', JSON.stringify(sessionForm.area_akses || []));
            formData.append('type_unit', sessionForm.type_unit || '');
            formData.append('nomor_license', sessionForm.nomor_license || '');
            formData.append('issued_at', sessionForm.issued_at || '');
            formData.append('setuju_aturan_k3', sessionForm.setuju_aturan_k3);

            // Assessment Kesehatan JSON
            const assessment = {
                tinggi_badan: sessionForm.tinggi_badan,
                berat_badan: sessionForm.berat_badan,
                q1_sehat: sessionForm.q1_sehat,
                q2_tidur_cukup: sessionForm.q2_tidur_cukup,
                q3_jantung: sessionForm.q3_jantung,
                q4_diabetes: sessionForm.q4_diabetes,
                q5_kolesterol: sessionForm.q5_kolesterol,
                q6_obat_kantuk: sessionForm.q6_obat_kantuk,
                q7_paham_pekerjaan: sessionForm.q7_paham_pekerjaan,
                q8_paham_risiko: sessionForm.q8_paham_risiko,
                q9_sedia_menegur: sessionForm.q9_sedia_menegur,
                q10_sedia_melapor: sessionForm.q10_sedia_melapor
            };
            formData.append('assessment_kesehatan', JSON.stringify(assessment));

            // Files
            if (files['file_ktp']) formData.append('file_ktp', files['file_ktp']);
            if (files['file_surat_pengantar']) formData.append('file_surat_pengantar', files['file_surat_pengantar']);
            if (files['file_safety_induksi']) formData.append('file_safety_induksi', files['file_safety_induksi']);

            // Online signature (Base64)
            if (ttdMethod === 'online' && sigCanvas.current && !sigCanvas.current.isEmpty()) {
                formData.append('ttd_k3', sigCanvas.current.getCanvas().toDataURL('image/png'));
            }

            if (editSessionId) {
                const res = await axios.put(`${backendUrl}/api/visitor/${editSessionId}`, formData);
                if (res.data.success) toast.success('Data visitor berhasil diperbarui');
            } else {
                const res = await axios.post(`${backendUrl}/api/visitor`, formData);
                if (res.data.success) toast.success('Visitor berhasil ditambahkan');
            }
            
            setSessionModal(false);
            setEditSessionId(null);
            setFiles({});
            setSessionForm(initialSessionForm);
            
            if (activeTab === 'cards') {
                setActiveTab('sessions');
            } else {
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal menyimpan data');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAssignVisitor = (nomor_kartu) => {
        if (areas.length === 0 || instansiList.length === 0 || kendaraanList.length === 0) {
            Promise.all([
                axios.get(`${backendUrl}/api/area`),
                axios.get(`${backendUrl}/api/instansi`),
                axios.get(`${backendUrl}/api/kendaraan`)
            ]).then(([resArea, resInstansi, resKendaraan]) => {
                setAreas(resArea.data.data);
                setInstansiList(resInstansi.data.data.filter(i => i.status_instansi === 'Aktif'));
                setKendaraanList(resKendaraan.data.data);
            });
        }
        setEditSessionId(null);
        setFiles({});
        setTtdMethod('online');
        setFormStep(1);
        setSessionForm({
            ...initialSessionForm,
            nomor_kartu
        });
        if (sigCanvas.current) sigCanvas.current.clear();
        setSessionModal(true);
    };

    const handleEditSession = (v) => {
        if (areas.length === 0 || instansiList.length === 0 || kendaraanList.length === 0) {
            Promise.all([
                axios.get(`${backendUrl}/api/area`),
                axios.get(`${backendUrl}/api/instansi`),
                axios.get(`${backendUrl}/api/kendaraan`)
            ]).then(([resArea, resInstansi, resKendaraan]) => {
                setAreas(resArea.data.data);
                setInstansiList(resInstansi.data.data.filter(i => i.status_instansi === 'Aktif'));
                setKendaraanList(resKendaraan.data.data);
            });
        }
        setEditSessionId(v.id_visitor);
        setFiles({});
        setTtdMethod('online');
        setFormStep(1);

        let ak = {};
        try {
            ak = typeof v.assessment_kesehatan === 'string' ? JSON.parse(v.assessment_kesehatan) : (v.assessment_kesehatan || {});
        } catch (e) {}

        let areaIds = [];
        try {
            areaIds = typeof v.area_akses === 'string' ? JSON.parse(v.area_akses) : (v.area_akses || []);
        } catch (e) {}

        setSessionForm({
            nomor_kartu: v.nomor_kartu || '',
            nama: v.nama || '',
            no_telp: v.no_telp || '',
            perusahaan: v.perusahaan || '',
            warna_permit: v.warna_permit || 'Merah',
            area_akses: areaIds,
            type_unit: v.type_unit || '',
            nomor_license: v.nomor_license || '',
            issued_at: v.issued_at || '',
            berlaku_hingga: v.berlaku_hingga ? new Date(new Date(v.berlaku_hingga).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,16) : '',
            file_ktp: v.file_ktp || null,
            file_surat_pengantar: v.file_surat_pengantar || null,
            file_safety_induksi: v.file_safety_induksi || null,
            tinggi_badan: ak.tinggi_badan || '',
            berat_badan: ak.berat_badan || '',
            q1_sehat: ak.q1_sehat !== undefined ? ak.q1_sehat : true,
            q2_tidur_cukup: ak.q2_tidur_cukup !== undefined ? ak.q2_tidur_cukup : true,
            q3_jantung: ak.q3_jantung !== undefined ? ak.q3_jantung : false,
            q4_diabetes: ak.q4_diabetes !== undefined ? ak.q4_diabetes : false,
            q5_kolesterol: ak.q5_kolesterol !== undefined ? ak.q5_kolesterol : false,
            q6_obat_kantuk: ak.q6_obat_kantuk !== undefined ? ak.q6_obat_kantuk : false,
            q7_paham_pekerjaan: ak.q7_paham_pekerjaan !== undefined ? ak.q7_paham_pekerjaan : true,
            q8_paham_risiko: ak.q8_paham_risiko !== undefined ? ak.q8_paham_risiko : true,
            q9_sedia_menegur: ak.q9_sedia_menegur !== undefined ? ak.q9_sedia_menegur : true,
            q10_sedia_melapor: ak.q10_sedia_melapor !== undefined ? ak.q10_sedia_melapor : true,
            setuju_aturan_k3: !!v.setuju_aturan_k3
        });
        setSessionModal(true);
    };

    const handleSelesai = async (id) => {
        try {
            const res = await axios.put(`${backendUrl}/api/visitor/${id}/selesai`);
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

    const getFileUrl = (filePath) => {
        if (!filePath) return null;
        return `${backendUrl}/${filePath.replace(/\\/g, '/')}`;
    };

    const filteredCards = cards.filter(c => 
        (c.nomor_kartu?.toLowerCase().includes(search.toLowerCase()) || 
         c.uid_kartu?.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredSessions = visitors.filter(v => 
        (v.nama?.toLowerCase().includes(search.toLowerCase()) || 
        v.nomor_kartu?.toLowerCase().includes(search.toLowerCase()) ||
        v.perusahaan?.toLowerCase().includes(search.toLowerCase()))
    );

    const healthQuestions = [
        { id: 'q1_sehat', label: '1. Apakah kondisi anda sehat hari ini?' },
        { id: 'q2_tidur_cukup', label: '2. Apakah anda tidur lebih dari 6 jam hari ini?' },
        { id: 'q3_jantung', label: '3. Apakah anda menderita penyakit Jantung?' },
        { id: 'q4_diabetes', label: '4. Apakah anda menderita penyakit Diabetes?' },
        { id: 'q5_kolesterol', label: '5. Apakah anda menderita penyakit Kolesterol?' },
        { id: 'q6_obat_kantuk', label: '6. Apakah anda mengkonsumsi obat yang dapat menyebabkan kantuk?' },
        { id: 'q7_paham_pekerjaan', label: '7. Apakah anda sudah mendapatkan penjelasan mengenai pekerjaan / agenda kunjungan yang akan dilakukan?' },
        { id: 'q8_paham_risiko', label: '8. Apakah anda sudah memahami risiko & bahaya di area tambang?' },
        { id: 'q9_sedia_menegur', label: '9. Apakah anda bersedia menegur jika menjumpai orang yang melakukan tindakan tidak aman?' },
        { id: 'q10_sedia_melapor', label: '10. Apakah anda bersedia melaporkan jika menjumpai kondisi tidak aman?' }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Manajemen Visitor</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola data kartu, riwayat kunjungan, berkas syarat (KTP & Surat Pengantar), asesmen kesehatan, dan safety induksi.</p>
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
                            placeholder={activeTab === 'cards' ? "Cari nomor kartu / UID..." : "Cari nama, perusahaan, atau kartu..."}
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
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    c.status === 'Tersedia' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                                                }`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {c.status === 'Tersedia' ? (
                                                    <button onClick={() => handleAssignVisitor(c.nomor_kartu)} className="px-3.5 py-1.5 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-1.5">
                                                        <Plus size={16} /> Tambah Pengguna
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
                                    <th className="p-4 font-medium">Dokumen & K3</th>
                                    <th className="p-4 font-medium">Waktu Masuk</th>
                                    <th className="p-4 font-medium">Status</th>
                                    <th className="p-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">Memuat data...</td></tr>
                                ) : filteredSessions.length === 0 ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-gray-500">Tidak ada riwayat</td></tr>
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
                                                <div className="text-xs text-gray-500 mt-1 max-w-[150px] truncate" title={(v.area_akses?.length || 0) + ' Area'}>
                                                    {v.area_akses?.length || 0} Area Akses
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${v.file_ktp && v.file_surat_pengantar ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                                                        <span className="text-xs text-gray-700 font-medium">
                                                            {v.file_ktp && v.file_surat_pengantar ? 'KTP & Pengantar Lengkap' : 'Berkas Belum Lengkap'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${v.file_safety_induksi || v.setuju_aturan_k3 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                                        <span className="text-xs text-gray-500">
                                                            {v.file_safety_induksi ? 'Induksi K3 Berttd' : v.setuju_aturan_k3 ? 'Aturan K3 Disetujui' : 'Induksi Belum Ada'}
                                                        </span>
                                                    </div>
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
                                            <td className="p-4 text-right flex justify-end gap-1.5 flex-wrap">
                                                <button 
                                                    onClick={() => {
                                                        setDetailVisitor(v);
                                                        setDetailModal(true);
                                                    }}
                                                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                                                    title="Lihat Berkas & Asesmen Kesehatan"
                                                >
                                                    <Eye size={13} /> Dokumen
                                                </button>
                                                {v.status === 'Aktif' && (
                                                    <>
                                                        <Link 
                                                            to={`/print-card/${encodeURIComponent(v.uid_kartu || v.nomor_kartu)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-gray-50 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors"
                                                        >
                                                            Cetak
                                                        </Link>
                                                        <Link 
                                                            to={`/v/${encodeURIComponent(v.uid_kartu || v.nomor_kartu)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-medium transition-colors"
                                                        >
                                                            ID
                                                        </Link>
                                                        <button onClick={() => handleEditSession(v)} className="px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-medium transition-colors">
                                                            Edit
                                                        </button>
                                                        <button onClick={() => setConfirmSelesai(v.id_visitor)} className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors">
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

            {/* Modal Tambah/Edit Sesi Pengguna Visitor dengan Wizard 4 Langkah */}
            {sessionModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col my-auto border border-gray-100">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    {editSessionId ? 'Edit Data Visitor' : `Tambah Pengguna (${sessionForm.nomor_kartu})`}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Lengkapi data profil, asesmen kesehatan, berkas syarat KTP & Pengantar, serta Safety Induction</p>
                            </div>
                            <button onClick={() => setSessionModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                        </div>

                        {/* Step Navigation Pills */}
                        <div className="grid grid-cols-4 border-b border-gray-200 bg-gray-50/40 text-xs sm:text-sm font-semibold text-center select-none">
                            <button
                                type="button"
                                onClick={() => setFormStep(1)}
                                className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${formStep === 1 ? 'border-[#E11D2E] text-[#E11D2E] bg-white font-bold shadow-xs' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${formStep === 1 ? 'bg-[#E11D2E] text-white' : 'bg-gray-200 text-gray-600'}`}>1</span>
                                <span className="truncate">Data Visitor</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormStep(2)}
                                className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${formStep === 2 ? 'border-[#E11D2E] text-[#E11D2E] bg-white font-bold shadow-xs' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${formStep === 2 ? 'bg-[#E11D2E] text-white' : 'bg-gray-200 text-gray-600'}`}>2</span>
                                <span className="truncate">Asesmen Sehat</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormStep(3)}
                                className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${formStep === 3 ? 'border-[#E11D2E] text-[#E11D2E] bg-white font-bold shadow-xs' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${formStep === 3 ? 'bg-[#E11D2E] text-white' : 'bg-gray-200 text-gray-600'}`}>3</span>
                                <span className="truncate">KTP & Pengantar</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormStep(4)}
                                className={`py-3 px-2 border-b-2 transition-all flex items-center justify-center gap-1.5 ${formStep === 4 ? 'border-[#E11D2E] text-[#E11D2E] bg-white font-bold shadow-xs' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${formStep === 4 ? 'bg-[#E11D2E] text-white' : 'bg-gray-200 text-gray-600'}`}>4</span>
                                <span className="truncate">Safety Induksi</span>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* STEP 1: DATA VISITOR & AKSES */}
                            {formStep === 1 && (
                                <div className="space-y-5 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" required value={sessionForm.nama} 
                                                onChange={e => setSessionForm({...sessionForm, nama: e.target.value})}
                                                placeholder="Contoh: Budi Santoso"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-gray-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">No. HP / WhatsApp <span className="text-red-500">*</span></label>
                                            <input 
                                                type="text" required value={sessionForm.no_telp} 
                                                onChange={e => setSessionForm({...sessionForm, no_telp: e.target.value})}
                                                placeholder="Contoh: 081234567890"
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-gray-800"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Perusahaan / Instansi <span className="text-red-500">*</span></label>
                                            <select 
                                                required 
                                                value={sessionForm.perusahaan} 
                                                onChange={e => setSessionForm({...sessionForm, perusahaan: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] appearance-none bg-white text-gray-800"
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
                                                    value={sessionForm.perusahaanLainnya || ''}
                                                    onChange={e => setSessionForm({...sessionForm, perusahaanLainnya: e.target.value})}
                                                    placeholder="Ketik nama perusahaan..."
                                                    className="w-full mt-2 px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E]"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Warna Permit</label>
                                            <select 
                                                value={sessionForm.warna_permit} 
                                                onChange={e => setSessionForm({...sessionForm, warna_permit: e.target.value})}
                                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] appearance-none bg-white text-gray-800"
                                            >
                                                <option value="Merah">Merah (Pit Worker / Tamu Umum)</option>
                                                <option value="Orange">Orange</option>
                                                <option value="Biru">Biru (In Pit Access)</option>
                                                <option value="Hijau">Hijau (Full Pit Access)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Masa Berlaku Izin Masuk (Berlaku Hingga)</label>
                                        <input 
                                            type="datetime-local" required value={sessionForm.berlaku_hingga} 
                                            onChange={e => setSessionForm({...sessionForm, berlaku_hingga: e.target.value})}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-gray-800"
                                        />
                                    </div>
                                    
                                    {(sessionForm.warna_permit === 'Biru' || sessionForm.warna_permit === 'Hijau' || sessionForm.warna_permit === 'Orange') && (
                                        <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 space-y-4">
                                            <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                                                <Briefcase size={16} /> Informasi Kendaraan & Lisensi (Wajib untuk permit Biru/Hijau/Orange)
                                            </h4>
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
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nomor License / SIM</label>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Area Akses yang Diizinkan</label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-gray-50/70 p-4 rounded-2xl border border-gray-200 max-h-[220px] overflow-y-auto">
                                            {areas.map(area => (
                                                <label key={area.id_area} className="flex items-center gap-3 cursor-pointer group bg-white p-2.5 rounded-xl border border-gray-100 hover:border-[#E11D2E]/40 transition-colors shadow-2xs">
                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0
                                                        ${(sessionForm.area_akses || []).includes(area.id_area) 
                                                            ? 'bg-[#E11D2E] border-[#E11D2E]' 
                                                            : 'bg-white border-gray-300 group-hover:border-[#E11D2E]'}`}>
                                                        {(sessionForm.area_akses || []).includes(area.id_area) && <CheckCircle2 size={14} className="text-white" />}
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-medium text-gray-700 select-none group-hover:text-gray-900 truncate">{area.nama_area}</span>
                                                    <input 
                                                        type="checkbox" className="hidden"
                                                        checked={(sessionForm.area_akses || []).includes(area.id_area)}
                                                        onChange={() => handleAreaChange(area.id_area)}
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: ASESMEN KESEHATAN */}
                            {formStep === 2 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3.5 p-4 bg-red-50 text-[#E11D2E] rounded-2xl border border-red-100">
                                        <div className="p-2.5 bg-white text-[#E11D2E] rounded-xl shadow-xs"><HeartPulse size={22} /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Pernyataan Sehat & Asesmen Fisik Visitor</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">Isi kondisi fisik dan jawab kuesioner kesehatan secara jujur demi keselamatan di tambang.</p>
                                        </div>
                                    </div>

                                    {/* Parameter Fisik */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Tinggi (cm) <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number" required 
                                                value={sessionForm.tinggi_badan} 
                                                onChange={e => setSessionForm({...sessionForm, tinggi_badan: e.target.value})}
                                                placeholder="Contoh: 170"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Berat (kg) <span className="text-red-500">*</span></label>
                                            <input 
                                                type="number" required 
                                                value={sessionForm.berat_badan} 
                                                onChange={e => setSessionForm({...sessionForm, berat_badan: e.target.value})}
                                                placeholder="Contoh: 65"
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#E11D2E]/20 focus:border-[#E11D2E] text-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Kuesioner Kesehatan (10 pertanyaan) */}
                                    <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-200">
                                        <p className="text-xs font-bold tracking-wide uppercase text-gray-700 mb-3 pb-2 border-b border-gray-200">
                                            Kuesioner Kesehatan & Keselamatan Kerja (Ya / Tidak)
                                        </p>
                                        <div className="space-y-2">
                                            {healthQuestions.map((q) => (
                                                <div key={q.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs sm:text-sm border-b border-gray-100 py-2.5 last:border-0 hover:bg-white/80 rounded-lg px-2 transition-colors">
                                                    <span className="text-gray-700 font-medium pr-3 mb-2 sm:mb-0 leading-relaxed">{q.label}</span>
                                                    <div className="flex gap-2 shrink-0 bg-gray-200/80 p-1 rounded-lg">
                                                        <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded-md transition-all text-xs font-semibold ${sessionForm[q.id] === true || sessionForm[q.id] === 'true' ? 'bg-white shadow-xs text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                            <input 
                                                                type="radio" name={q.id} value="true" 
                                                                checked={sessionForm[q.id] === true || sessionForm[q.id] === 'true'} 
                                                                onChange={() => setSessionForm(prev => ({ ...prev, [q.id]: true }))} 
                                                                className="text-[#E11D2E] focus:ring-[#E11D2E] w-3.5 h-3.5" 
                                                            /> Ya
                                                        </label>
                                                        <label className={`flex items-center gap-1.5 cursor-pointer px-3 py-1 rounded-md transition-all text-xs font-semibold ${sessionForm[q.id] === false || sessionForm[q.id] === 'false' ? 'bg-white shadow-xs text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                            <input 
                                                                type="radio" name={q.id} value="false" 
                                                                checked={sessionForm[q.id] === false || sessionForm[q.id] === 'false'} 
                                                                onChange={() => setSessionForm(prev => ({ ...prev, [q.id]: false }))} 
                                                                className="text-gray-500 w-3.5 h-3.5" 
                                                            /> Tidak
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: SYARAT DOKUMEN (KTP & SURAT PENGANTAR) */}
                            {formStep === 3 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3.5 p-4 bg-red-50 text-[#E11D2E] rounded-2xl border border-red-100">
                                        <div className="p-2.5 bg-white text-[#E11D2E] rounded-xl shadow-xs"><Upload size={22} /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Unggah Dokumen Persyaratan Kunjungan</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">Wajib mengunggah scan/foto KTP dan Surat Pengantar resmi instansi (Format PDF/JPG/PNG, Maks. 5MB).</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                        {/* KTP */}
                                        <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${files['file_ktp'] || sessionForm.file_ktp ? 'bg-green-50/40 border-green-300' : 'bg-gray-50/60 border-dashed border-gray-300 hover:border-[#E11D2E]/50'}`}>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="p-2.5 rounded-xl bg-white text-[#E11D2E] shadow-2xs border border-gray-100">
                                                        <IdCard size={22} />
                                                    </span>
                                                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase rounded-full bg-red-100 text-red-700">Wajib</span>
                                                </div>
                                                <h5 className="font-bold text-gray-800 text-base">Kartu Tanda Penduduk (KTP)</h5>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                    Foto KTP asli visitor yang masih berlaku dan terbaca jelas.
                                                </p>
                                                {(files['file_ktp'] || sessionForm.file_ktp) && (
                                                    <div className="mt-3 p-2 bg-green-100/70 border border-green-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-green-800">
                                                        <Check size={14} className="text-green-700" />
                                                        <span className="truncate">{files['file_ktp'] ? files['file_ktp'].name : 'Dokumen KTP Tersimpan'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <label className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${files['file_ktp'] || sessionForm.file_ktp ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#E11D2E] text-white hover:bg-[#B0121F]'}`}>
                                                <Upload size={14} />
                                                <span>{files['file_ktp'] || sessionForm.file_ktp ? 'Ganti File KTP' : 'Unggah File KTP'}</span>
                                                <input 
                                                    type="file" name="file_ktp" 
                                                    onChange={handleFileChange} 
                                                    className="sr-only" 
                                                    accept=".pdf,.png,.jpg,.jpeg,image/*" 
                                                />
                                            </label>
                                        </div>

                                        {/* SURAT PENGANTAR */}
                                        <div className={`p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-4 ${files['file_surat_pengantar'] || sessionForm.file_surat_pengantar ? 'bg-green-50/40 border-green-300' : 'bg-gray-50/60 border-dashed border-gray-300 hover:border-[#E11D2E]/50'}`}>
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="p-2.5 rounded-xl bg-white text-[#E11D2E] shadow-2xs border border-gray-100">
                                                        <FileText size={22} />
                                                    </span>
                                                    <span className="text-xs px-2.5 py-0.5 font-bold uppercase rounded-full bg-red-100 text-red-700">Wajib</span>
                                                </div>
                                                <h5 className="font-bold text-gray-800 text-base">Surat Pengantar Instansi</h5>
                                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                                    Surat tugas / pengantar dari instansi atau perusahaan asal visitor.
                                                </p>
                                                {(files['file_surat_pengantar'] || sessionForm.file_surat_pengantar) && (
                                                    <div className="mt-3 p-2 bg-green-100/70 border border-green-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-green-800">
                                                        <Check size={14} className="text-green-700" />
                                                        <span className="truncate">{files['file_surat_pengantar'] ? files['file_surat_pengantar'].name : 'Surat Pengantar Tersimpan'}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <label className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${files['file_surat_pengantar'] || sessionForm.file_surat_pengantar ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-[#E11D2E] text-white hover:bg-[#B0121F]'}`}>
                                                <Upload size={14} />
                                                <span>{files['file_surat_pengantar'] || sessionForm.file_surat_pengantar ? 'Ganti Surat Pengantar' : 'Unggah Surat Pengantar'}</span>
                                                <input 
                                                    type="file" name="file_surat_pengantar" 
                                                    onChange={handleFileChange} 
                                                    className="sr-only" 
                                                    accept=".pdf,.png,.jpg,.jpeg,image/*" 
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: SAFETY INDUKSI & PERSETUJUAN K3 */}
                            {formStep === 4 && (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="flex items-center gap-3.5 p-4 bg-red-50 text-[#E11D2E] rounded-2xl border border-red-100">
                                        <div className="p-2.5 bg-white text-[#E11D2E] rounded-xl shadow-xs"><ShieldCheck size={22} /></div>
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-sm">Peraturan Umum Keselamatan Kerja & Induksi K3</h4>
                                            <p className="text-xs text-gray-600 mt-0.5">Baca dan pahami seluruh ketentuan K3 sebelum memberikan pengesahan tanda tangan.</p>
                                        </div>
                                    </div>

                                    {/* Box Peraturan K3 */}
                                    <div className="bg-gray-50/80 p-4.5 rounded-2xl text-xs sm:text-sm text-gray-700 space-y-3 h-52 overflow-y-auto border border-gray-200 leading-relaxed custom-scrollbar shadow-inner">
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">1.</span> <span>Memastikan semua karyawan baru, kontraktor, tamu dan mahasiswa/siswa PKL harus memakai Kartu Tanda Pengenal, dan mengikuti Pengarahan K3 (Safety Induction) dan menandatangani formulir Peraturan Umum Keselamatan Kerja setelah membaca peraturan tersebut.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">2.</span> <span>Memastikan semua karyawan baru, kontraktor, tamu dan mahasiswa/siswa PKL menggunakan APD seperti helm, sepatu, ear plug dan APD lainnya yang dipersyaratkan, serta dilarang keras memasuki area berbahaya tanpa izin.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">3.</span> <span>Untuk menghindari terjadinya bahaya kebakaran dan atau ledakan, dilarang keras merokok di daerah dilarang merokok.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">4.</span> <span>Bagi kendaraan di dalam emplasemen Tambang kecepatan max. 25 km/jam dan di area penambangan max. 40 km/jam. Peralatan produksi max. 35 km/jam. Patuhilah rambu-rambu yang ada, berikan kesempatan pejalan kaki, dan berhenti pada rambu "STOP".</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">5.</span> <span>Setiap pekerjaan berbahaya di dalam Emplasemen harus dilengkapi dengan "IZIN KERJA BERBAHAYA" yang disetujui dan diawasi pelaksanaannya.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">6.</span> <span>Jika alarm keadaan darurat berbunyi, lakukan hal sbb: Jangan panik, dilarang berlari (berjalan menuju ke titik kumpul), jika mengendarai mobil pinggirkan ke kiri, matikan mesin, kunci, dan ikuti petunjuk evakuasi.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">7.</span> <span>Dilarang membuang sampah bukan pada tempatnya, dan dilarang membuang sampah mengandung metal di area penambangan.</span></p>
                                        <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">8.</span> <span>Dilarang mengambil foto di lingkungan tambang/pabrik tanpa izin, dan dilarang mengupload ke media sosial.</span></p>
                                    </div>

                                    {/* Checkbox Persetujuan Aturan K3 */}
                                    <label className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100/70 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            required
                                            checked={sessionForm.setuju_aturan_k3} 
                                            onChange={e => setSessionForm({...sessionForm, setuju_aturan_k3: e.target.checked})}
                                            className="w-5 h-5 mt-0.5 rounded text-[#E11D2E] focus:ring-[#E11D2E]"
                                        />
                                        <span className="text-xs sm:text-sm font-semibold text-gray-800 leading-snug">
                                            Saya telah membaca, memahami, dan berjanji untuk mematuhi seluruh Peraturan Umum Keselamatan Kerja (Safety Induction) di lingkungan Tambang. <span className="text-red-500">*</span>
                                        </span>
                                    </label>

                                    {/* Metode Tanda Tangan */}
                                    <div className="bg-white border border-gray-200 p-4 rounded-2xl shadow-xs space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h5 className="font-bold text-gray-800 text-sm">Tanda Tangan Pengesahan Induksi</h5>
                                            <div className="flex gap-3 text-xs">
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input 
                                                        type="radio" name="ttdMethod" value="online" 
                                                        checked={ttdMethod === 'online'} 
                                                        onChange={() => setTtdMethod('online')} 
                                                        className="text-[#E11D2E] focus:ring-[#E11D2E]" 
                                                    />
                                                    <span className="font-semibold text-gray-700">Ttd Digital (Online)</span>
                                                </label>
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input 
                                                        type="radio" name="ttdMethod" value="upload" 
                                                        checked={ttdMethod === 'upload'} 
                                                        onChange={() => setTtdMethod('upload')} 
                                                        className="text-[#E11D2E] focus:ring-[#E11D2E]" 
                                                    />
                                                    <span className="font-semibold text-gray-700">Upload Berkas</span>
                                                </label>
                                            </div>
                                        </div>

                                        {ttdMethod === 'online' ? (
                                            <div className="space-y-2">
                                                <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50/50 overflow-hidden relative">
                                                    <div className="absolute top-2 left-3 text-[11px] font-semibold text-gray-400 pointer-events-none">
                                                        Goreskan tanda tangan visitor di sini:
                                                    </div>
                                                    <SignatureCanvas 
                                                        ref={sigCanvas} 
                                                        penColor="black"
                                                        canvasProps={{ className: 'sigCanvas w-full h-36 rounded-xl cursor-crosshair' }} 
                                                    />
                                                </div>
                                                <div className="flex justify-end">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => sigCanvas.current && sigCanvas.current.clear()} 
                                                        className="text-xs px-3 py-1 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg font-bold transition-colors"
                                                    >
                                                        Hapus & Ulangi TTD
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <label className={`w-full p-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${files['file_safety_induksi'] || sessionForm.file_safety_induksi ? 'bg-green-50/50 border-green-300' : 'bg-gray-50 border-gray-300 hover:border-[#E11D2E]'}`}>
                                                    <Upload size={20} className={files['file_safety_induksi'] || sessionForm.file_safety_induksi ? 'text-green-600' : 'text-gray-400'} />
                                                    <div className="text-center">
                                                        <span className="text-xs font-bold text-gray-700">
                                                            {files['file_safety_induksi'] ? files['file_safety_induksi'].name : sessionForm.file_safety_induksi ? 'Berkas Safety Induksi Tersimpan' : 'Pilih Berkas Formulir Safety Induksi'}
                                                        </span>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">PDF, PNG, JPG (Maks 5MB)</p>
                                                    </div>
                                                    <input 
                                                        type="file" name="file_safety_induksi" 
                                                        onChange={handleFileChange} 
                                                        className="sr-only" 
                                                        accept=".pdf,.png,.jpg,.jpeg,image/*" 
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer with Step Navigation */}
                        <div className="p-4 px-6 border-t border-gray-100 flex justify-between items-center bg-gray-50/60">
                            <div>
                                {formStep > 1 ? (
                                    <button 
                                        type="button" 
                                        onClick={() => setFormStep(prev => Math.max(1, prev - 1))}
                                        className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl font-medium transition-colors flex items-center gap-1.5 shadow-2xs"
                                    >
                                        <ArrowLeft size={16} /> Sebelumnya
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        onClick={() => setSessionModal(false)}
                                        className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>

                            <div className="flex gap-2.5">
                                {formStep < 4 ? (
                                    <button 
                                        type="button" 
                                        onClick={() => setFormStep(prev => Math.min(4, prev + 1))}
                                        className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                                    >
                                        Selanjutnya <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button 
                                        type="button" 
                                        disabled={isSubmitting}
                                        onClick={handleSessionSubmit}
                                        className="px-6 py-2.5 bg-[#E11D2E] hover:bg-[#B0121F] disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-red-500/20 transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>Menyimpan...</>
                                        ) : (
                                            <><CheckCircle2 size={18} /> Simpan Data Visitor</>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Detail Berkas & Asesmen Kesehatan Visitor */}
            {detailModal && detailVisitor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col my-auto border border-gray-100">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/70">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Dokumen & Asesmen Visitor</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{detailVisitor.nama} - Kartu: {detailVisitor.nomor_kartu}</p>
                            </div>
                            <button onClick={() => setDetailModal(false)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Berkas Persyaratan (KTP & Surat Pengantar) */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                                    <FileText size={16} className="text-[#E11D2E]" /> Berkas Persyaratan
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* KTP */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-3">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Kartu Tanda Penduduk</span>
                                            <div className="font-bold text-gray-800 text-sm mt-0.5">KTP Visitor</div>
                                        </div>
                                        {detailVisitor.file_ktp ? (
                                            <a 
                                                href={getFileUrl(detailVisitor.file_ktp)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                            >
                                                <ExternalLink size={14} /> Lihat File KTP
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Belum diunggah</span>
                                        )}
                                    </div>

                                    {/* Surat Pengantar */}
                                    <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between gap-3">
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase">Surat Resmi</span>
                                            <div className="font-bold text-gray-800 text-sm mt-0.5">Surat Pengantar Instansi</div>
                                        </div>
                                        {detailVisitor.file_surat_pengantar ? (
                                            <a 
                                                href={getFileUrl(detailVisitor.file_surat_pengantar)} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                                            >
                                                <ExternalLink size={14} /> Lihat Surat Pengantar
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">Belum diunggah</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Hasil Asesmen Kesehatan */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                                    <HeartPulse size={16} className="text-[#E11D2E]" /> Asesmen Kesehatan Visitor
                                </h4>
                                {(() => {
                                    let ak = {};
                                    try {
                                        ak = typeof detailVisitor.assessment_kesehatan === 'string' 
                                            ? JSON.parse(detailVisitor.assessment_kesehatan) 
                                            : (detailVisitor.assessment_kesehatan || {});
                                    } catch (e) {}

                                    return (
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs">
                                                <div><span className="text-gray-500">Tinggi:</span> <strong className="text-gray-800">{ak.tinggi_badan || '-'} cm</strong></div>
                                                <div><span className="text-gray-500">Berat:</span> <strong className="text-gray-800">{ak.berat_badan || '-'} kg</strong></div>
                                            </div>

                                            <div className="bg-gray-50/70 p-3 rounded-xl border border-gray-200 text-xs space-y-1.5">
                                                <p className="font-bold text-gray-700 mb-2">Jawaban Kuesioner Kesehatan:</p>
                                                {healthQuestions.map(q => (
                                                    <div key={q.id} className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                                                        <span className="text-gray-600 truncate pr-2">{q.label}</span>
                                                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${ak[q.id] === true || ak[q.id] === 'true' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                                            {ak[q.id] === true || ak[q.id] === 'true' ? 'Ya' : 'Tidak'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Dokumen & TTD Safety Induction */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-2">
                                    <ShieldCheck size={16} className="text-[#E11D2E]" /> Pengesahan Safety Induksi K3
                                </h4>
                                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2.5 h-2.5 rounded-full ${detailVisitor.setuju_aturan_k3 ? 'bg-green-500' : 'bg-amber-400'}`}></span>
                                            <span className="text-sm font-bold text-gray-800">
                                                {detailVisitor.setuju_aturan_k3 ? 'Peraturan K3 Disetujui' : 'Belum Konfirmasi K3'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {detailVisitor.file_safety_induksi ? 'Tanda tangan pengesahan K3 terlampir.' : 'Belum ada bukti tanda tangan.'}
                                        </p>
                                    </div>
                                    {detailVisitor.file_safety_induksi && (
                                        <div className="shrink-0">
                                            {detailVisitor.file_safety_induksi.endsWith('.pdf') ? (
                                                <a 
                                                    href={getFileUrl(detailVisitor.file_safety_induksi)} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-blue-200"
                                                >
                                                    <ExternalLink size={14} /> Unduh Berkas PDF
                                                </a>
                                            ) : (
                                                <div className="p-1 bg-white border border-gray-200 rounded-xl shadow-xs">
                                                    <img 
                                                        src={getFileUrl(detailVisitor.file_safety_induksi)} 
                                                        alt="Tanda Tangan Visitor" 
                                                        className="h-16 w-32 object-contain rounded-lg"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 px-6 border-t border-gray-100 flex justify-end bg-gray-50/60">
                            <button 
                                onClick={() => setDetailModal(false)}
                                className="px-5 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-medium transition-colors"
                            >
                                Tutup
                            </button>
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
