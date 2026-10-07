import { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Plus, ArrowLeft, Loader2, CheckCircle2, AlertCircle, ChevronRight, Upload, Search, User, MapPin, Phone, Briefcase, Calendar, ShieldCheck, Activity, GraduationCap, XCircle, Info, Edit, Send } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { useRef } from 'react';
import FastTrackModal from '../components/FastTrackModal';

export default function Permit() {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};
    const role = user.role;
    const id_user = user.id_user;

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const id_proyek_query = queryParams.get('id_proyek');
    const edit_id_query = queryParams.get('edit_id');
    const detail_id_query = queryParams.get('detail_id');

    const [view, setView] = useState(id_proyek_query || edit_id_query ? 'wizard' : detail_id_query ? 'detail' : 'table'); // 'table' | 'wizard' | 'detail'
    const [pengajuanList, setPengajuanList] = useState([]);
    const [selectedPengajuan, setSelectedPengajuan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [editId, setEditId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);
    
    const [isFastTrackModalOpen, setIsFastTrackModalOpen] = useState(false);

    const sigCanvas = useRef({});
    const [ttdMethod, setTtdMethod] = useState('online'); // 'online' or 'upload'

    // Export Handlers
    const handleExportExcel = async () => {
        if (selectedRows.length === 0) {
            toast.error("Pilih data yang akan di-export!");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pengajuan/export/excel`, { ids: selectedRows }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Laporan_Permit.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Berhasil export ke Excel!");
        } catch (err) {
            toast.error("Gagal export data");
        } finally {
            setLoading(false);
        }
    };

    const handleExportDocs = async () => {
        if (selectedRows.length === 0) {
            toast.error("Pilih data yang akan di-download!");
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pengajuan/export/docs`, { ids: selectedRows }, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'Dokumen_dan_Data_Permit.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success("Berhasil download ZIP dokumen dan excel!");
        } catch (err) {
            toast.error("Gagal download data");
        } finally {
            setLoading(false);
        }
    };

    // Modal States
    const [modal, setModal] = useState({ isOpen: false, type: '', message: '' }); // type: 'success' | 'error'
    const [approveModal, setApproveModal] = useState({ isOpen: false, id_pengajuan: null });
    const [rejectModal, setRejectModal] = useState({ isOpen: false, id_pengajuan: null, alasan: '' });

    // Wizard State
    const [step, setStep] = useState(1);
    const [submitLoading, setSubmitLoading] = useState(false);

    // Form Data
    const [formData, setFormData] = useState({
        // Biodata
        nik_atau_ktm: '',
        nama_lengkap: '',
        jenis_kelamin: 'L',
        tempat_lahir: '',
        tanggal_lahir: '',
        agama: '',
        golongan_darah: '',
        alamat_rumah: '',
        no_hp: '',
        email: '',
        jabatan: '',
        unit_kerja: '',
        id_instansi: '',

        // Pilihan Kategori
        kategori_pemohon: 'Internal', // Internal, Magang, Kontraktor

        // Pendidikan & Keahlian
        riwayat_pendidikan: '',
        sertifikasi_keahlian: '',
        pendidikan_khusus: '',

        // Izin Akses Tambang
        jenis_izin: 'Baru',
        jenis_permintaan: 'Permanent',
        tanggal_mulai: '',
        tanggal_selesai: '',
        kategori_akses: 'Merah (Pit Worker)',
        area_ids: [],
        jenis_kendaraan: [],
        alasan_justifikasi: '',
        tanggal_berlaku_sim: '',

        perlu_izin_khusus: false,
        izin_panas: false,
        izin_ketinggian: false,
        izin_perancah: false,
        izin_beban: false,
        izin_ruang_terbatas: false,
        izin_penggalian: false,
        izin_air: false,
        izin_material_panas: false,

        // Form Survei Kesehatan (Keterangan Sehat)
        tinggi_badan: '',
        berat_badan: '',
        tekanan_darah: '',
        denyut_nadi: '',
        golongan_darah_sehat: '',
        riwayat_penyakit: '',
        
        pilihan_dokumen_b2: 'SIM B2',
        pilihan_dokumen_sio: 'SIO',
        tanggal_berlaku_sio: '',

        q1_sehat: false,
        q2_tidur_cukup: false,
        q3_jantung: false,
        q4_diabetes: false,
        q5_kolesterol: false,
        q6_obat_kantuk: false,
        q7_paham_pekerjaan: false,
        q8_paham_risiko: false,
        q9_sedia_menegur: false,
        q10_sedia_melapor: false,

        setuju_aturan_k3: false,
        id_proyek: id_proyek_query || null
    });

    // File Data
    const [files, setFiles] = useState({});

    // Master Data
    const [masterInstansi, setMasterInstansi] = useState([]);
    const [masterArea, setMasterArea] = useState([]);
    const [masterKendaraan, setMasterKendaraan] = useState([]);

    // Proyek Data
    const [proyekData, setProyekData] = useState(null);

    useEffect(() => {
        if (view === 'table') {
            fetchPengajuan();
        } else if (view === 'wizard') {
            fetchMasterData();
            if (edit_id_query) {
                // Fetch the detail of the pengajuan to edit
                axios.get(`${import.meta.env.VITE_API_URL}/api/pengajuan/${edit_id_query}`).then(res => {
                    if (res.data.success) {
                        handleEdit(res.data.data);
                        if (res.data.data.id_proyek) fetchDetailProyek(res.data.data.id_proyek);
                        
                        // NEW: Logic for perpanjangan permit
                        if (queryParams.get('action') === 'perpanjang') {
                            setEditId(null);
                            setFormData(prev => ({
                                ...prev,
                                jenis_izin: 'Perpanjangan',
                                tanggal_mulai: '',
                                tanggal_selesai: ''
                            }));
                            toast.success("Mode Perpanjangan: Silakan update dokumen dan tanggal masa berlaku baru.");
                        }
                    }
                }).catch(err => {
                    setError('Gagal memuat data edit pengajuan');
                });
            } else if (id_proyek_query) {
                fetchDetailProyek(id_proyek_query);
            }
        } else if (view === 'detail' && detail_id_query && !selectedPengajuan) {
            handleOpenDetail(detail_id_query);
        }
    }, [view, edit_id_query, id_proyek_query, detail_id_query]);

    const fetchDetailProyek = async (id_proyek) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/proyek/${id_proyek}`);
            if (res.data.success) {
                setProyekData(res.data.data);
            }
        } catch (err) {
            console.error("Gagal memuat detail proyek:", err);
        }
    };

    const fetchPengajuan = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pengajuan?role=${role}&id_user=${id_user}`);
            setPengajuanList(res.data.data);
        } catch (err) {
            setError('Gagal memuat data pengajuan');
        } finally {
            setLoading(false);
        }
    };

    const fetchMasterData = async () => {
        try {
            const resInstansi = await axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`);
            setMasterInstansi(resInstansi.data.data);
            const resArea = await axios.get(`${import.meta.env.VITE_API_URL}/api/area`);
            setMasterArea(resArea.data.data);
            const resKendaraan = await axios.get(`${import.meta.env.VITE_API_URL}/api/kendaraan`);
            setMasterKendaraan(resKendaraan.data.data);
        } catch (err) {
            console.error(err);
        }
    };

    const getStatusBadgeClass = (status) => {
        if (!status) return 'bg-gray-50 text-gray-700 border border-gray-200';
        if (status === 'Ditolak') return 'bg-red-50 text-red-700 border border-red-200';
        if (status === 'Siap_Cetak' || status === 'Disetujui') return 'bg-green-50 text-green-700 border border-green-200';
        if (status === 'Menunggu_Ujian') return 'bg-orange-50 text-orange-700 border border-orange-200';
        return 'bg-blue-50 text-blue-700 border border-blue-200';
    };

    const handleOpenAdd = () => {
        setEditId(null);
        setStep(1);
        setFormData({
            nik_atau_ktm: '', nama_lengkap: '', jenis_kelamin: 'L', tempat_lahir: '', tanggal_lahir: '',
            agama: '', golongan_darah: '', alamat_rumah: '', no_hp: '', email: '', jabatan: '', unit_kerja: '',
            id_instansi: '', kategori_pemohon: 'Internal', riwayat_pendidikan: '', sertifikasi_keahlian: '',
            pendidikan_khusus: '', jenis_izin: 'Baru', jenis_permintaan: 'Permanent', tanggal_mulai: '',
            tanggal_selesai: '', kategori_akses: 'Merah (Pit Worker)', area_ids: [], jenis_kendaraan: [],
            alasan_justifikasi: '', tanggal_berlaku_sim: '', tanggal_berlaku_sio: '', perlu_izin_khusus: false, izin_panas: false, izin_ketinggian: false, izin_perancah: false,
            izin_beban: false, izin_ruang_terbatas: false, izin_penggalian: false, izin_air: false, izin_material_panas: false,
            tinggi_badan: '', berat_badan: '', tekanan_darah: '', denyut_nadi: '',
            golongan_darah_sehat: '', riwayat_penyakit: '', q1_sehat: false, q2_tidur_cukup: false,
            q3_jantung: false, q4_diabetes: false, q5_kolesterol: false, q6_obat_kantuk: false,
            q7_paham_pekerjaan: false, q8_paham_risiko: false, q9_sedia_menegur: false, q10_sedia_melapor: false,
            setuju_aturan_k3: false, id_proyek: id_proyek_query || null
        });
        setFiles({});
        setView('wizard');
        setError('');
        setSuccess('');
        setSubmitLoading(false);
    };

    const handleOpenEdit = async (id_pengajuan) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pengajuan/${id_pengajuan}`);
            if (res.data.success) {
                handleEdit(res.data.data);
                if (res.data.data.id_proyek) fetchDetailProyek(res.data.data.id_proyek);
            }
        } catch (err) {
            toast.error('Gagal memuat detail pengajuan untuk diedit');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (p) => {
        setEditId(p.id_pengajuan);
        setStep(1);
        setFormData({
            nik_atau_ktm: p.karyawan?.nik_atau_ktm || '',
            nama_lengkap: p.karyawan?.nama_lengkap || '',
            jenis_kelamin: p.karyawan?.jenis_kelamin || 'L',
            tempat_lahir: p.karyawan?.tempat_lahir || '',
            tanggal_lahir: p.karyawan?.tanggal_lahir ? p.karyawan.tanggal_lahir.substring(0, 10) : '',
            agama: p.karyawan?.agama || '',
            golongan_darah: p.karyawan?.golongan_darah || '',
            alamat_rumah: p.karyawan?.alamat_rumah || '',
            no_hp: p.karyawan?.no_hp || '',
            email: p.karyawan?.email || '',
            jabatan: p.karyawan?.jabatan || '',
            unit_kerja: p.karyawan?.unit_kerja || '',
            id_instansi: p.karyawan?.id_instansi || '',
            kategori_pemohon: p.kategori_pemohon || 'Internal',
            riwayat_pendidikan: p.karyawan?.riwayat_pendidikan || '',
            sertifikasi_keahlian: p.karyawan?.sertifikasi_keahlian || '',
            pendidikan_khusus: p.karyawan?.pendidikan_khusus || '',

            jenis_izin: p.jenis_izin || 'Baru',
            jenis_permintaan: p.jenis_permintaan || 'Permanent',
            tanggal_mulai: p.tanggal_mulai ? p.tanggal_mulai.substring(0, 10) : '',
            tanggal_selesai: p.tanggal_selesai ? p.tanggal_selesai.substring(0, 10) : '',
            kategori_akses: p.kategori_akses || 'Merah (Pit Worker)',
            area_ids: p.master_areas?.map(a => a.id_area) || [],
            jenis_kendaraan: p.jenis_kendaraan ? (
                p.jenis_kendaraan.startsWith('[') ? JSON.parse(p.jenis_kendaraan).map(k => k.nama_kendaraan).join(',').split(',').map(s=>s.trim()) : p.jenis_kendaraan.split(',').map(s => s.trim())
            ) : [],
            alasan_justifikasi: p.alasan_justifikasi || '',
            tanggal_berlaku_sim: p.tanggal_berlaku_sim || '',
            tanggal_berlaku_sio: p.tanggal_berlaku_sio || '',

            tinggi_badan: p.surat_sehat?.tinggi_badan || '',
            berat_badan: p.surat_sehat?.berat_badan || '',
            tekanan_darah: p.surat_sehat?.tekanan_darah || '',
            denyut_nadi: p.surat_sehat?.denyut_nadi || '',
            golongan_darah_sehat: p.surat_sehat?.golongan_darah || '',
            riwayat_penyakit: p.surat_sehat?.riwayat_penyakit || '',

            q1_sehat: p.surat_sehat?.q1_sehat || false,
            q2_tidur_cukup: p.surat_sehat?.q2_tidur_cukup || false,
            q3_jantung: p.surat_sehat?.q3_jantung || false,
            q4_diabetes: p.surat_sehat?.q4_diabetes || false,
            q5_kolesterol: p.surat_sehat?.q5_kolesterol || false,
            q6_obat_kantuk: p.surat_sehat?.q6_obat_kantuk || false,
            q7_paham_pekerjaan: p.surat_sehat?.q7_paham_pekerjaan || false,
            q8_paham_risiko: p.surat_sehat?.q8_paham_risiko || false,
            q9_sedia_menegur: p.surat_sehat?.q9_sedia_menegur || false,
            q10_sedia_melapor: p.surat_sehat?.q10_sedia_melapor || false,

            izin_panas: !!p.file_izin_panas,
            izin_ketinggian: !!p.file_izin_ketinggian,
            izin_perancah: !!p.file_izin_perancah,
            izin_beban: !!p.file_izin_beban,
            izin_ruang_terbatas: !!p.file_izin_ruang_terbatas,
            izin_penggalian: !!p.file_izin_penggalian,
            izin_air: !!p.file_izin_air,
            izin_material_panas: !!p.file_izin_material_panas,
            perlu_izin_khusus: !!(p.file_izin_panas || p.file_izin_ketinggian || p.file_izin_perancah || p.file_izin_beban || p.file_izin_ruang_terbatas || p.file_izin_penggalian || p.file_izin_air || p.file_izin_material_panas),

            setuju_aturan_k3: p.setuju_aturan_k3 || false,
            id_proyek: p.id_proyek || null,
            file_foto: p.file_foto || null,
            file_data_diri: p.file_data_diri || null,
            file_mcu: p.file_mcu || null,
            file_bpjs: p.file_bpjs || null,
            file_surat_pengantar: p.file_surat_pengantar || null,
            file_safety_induksi: p.file_safety_induksi || null,
            file_surat_penunjukan: p.file_surat_penunjukan || null,
            file_kontrak_kerja: p.file_kontrak_kerja || null,
            file_prosedur: p.file_prosedur || null,
            file_izin_kerja_berbahaya: p.file_izin_kerja_berbahaya || null,
            file_serah_terima_apd: p.file_serah_terima_apd || null,
            file_permohonan_kimper: p.file_permohonan_kimper || null,
            file_hasil_assessment: p.file_hasil_assessment || null,
            file_sim_a: p.file_sim_a || null,
            file_sim_b1: p.file_sim_b1 || null,
            file_sim_b2: p.file_sim_b2 || null,
            file_sio: p.file_sio || null,
            file_sertifikat_sio_sim: p.file_sertifikat_sio_sim || null
        });
        setFiles({});
        setView('wizard');
        setError('');
        setSuccess('');
        setSubmitLoading(false);
    };

    const handleOpenDetail = async (id_pengajuan) => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/pengajuan/${id_pengajuan}`);
            if (res.data.success) {
                setSelectedPengajuan(res.data.data);
                setView('detail');
            }
        } catch (err) {
            setError('Gagal memuat detail pengajuan');
        } finally {
            setLoading(false);
        }
    };

    const handleKirimAdmin = async (id_pengajuan) => {
        const p = pengajuanList.find(x => x.id_pengajuan === id_pengajuan);
        if (!p) return;

        // Validasi Dokumen Proyek
        if (p.id_proyek && p.proyek_vendor) {
            const proyek = p.proyek_vendor;
            if ((!proyek.file_surat_penunjukan || !proyek.file_kontrak_kerja) || 
                (proyek.jenis_proyek !== 'Perpanjangan' && (!proyek.file_life_saving_talk || !proyek.file_jsa || !proyek.file_izin_kerja_umum))) {
                toast.error('Dokumen Bersama Proyek (Safety / Kontrak) belum lengkap! Silakan lengkapi melalui Edit terlebih dahulu.');
                return;
            }
        }

        // Validasi Dokumen Personal
        let baseFiles = [];
        if (p.kategori_pemohon === 'Magang') {
            baseFiles = ['file_foto', 'file_data_diri', 'file_mcu', 'file_bpjs', 'file_surat_pengantar'];
        } else if (role === 'Koordinator_Vendor') {
            baseFiles = ['file_foto', 'file_data_diri', 'file_mcu', 'file_bpjs'];
            if (user?.jenis_vendor === 'Kontrak' && !p.id_proyek) {
                baseFiles.push('file_surat_penunjukan', 'file_kontrak_kerja');
            }
        } else if (p.kategori_pemohon === 'Internal') {
            baseFiles = ['file_foto', 'file_surat_penunjukan', 'file_data_diri', 'file_mcu', 'file_prosedur', 'file_bpjs', 'file_izin_kerja_berbahaya', 'file_serah_terima_apd', 'file_kontrak_kerja'];
        } else if (p.kategori_pemohon === 'Kontraktor') {
            if (p.id_proyek) {
                baseFiles = ['file_foto', 'file_data_diri', 'file_bpjs', 'file_mcu'];
            } else {
                baseFiles = ['file_foto', 'file_surat_penunjukan', 'file_data_diri', 'file_permohonan_kimper', 'file_bpjs', 'file_mcu', 'file_kontrak_kerja'];
            }
        }

        let requireSimA = false, requireSimB1 = false, requireSimB2 = false, requireSio = false;
        let jenisKendaraanArr = p.jenis_kendaraan ? (
            p.jenis_kendaraan.startsWith('[') ? JSON.parse(p.jenis_kendaraan).map(k => k.nama_kendaraan) : p.jenis_kendaraan.split(',').map(s => s.trim())
        ) : [];

        jenisKendaraanArr.forEach(k => {
            const mk = masterKendaraan.find(m => m.nama_kendaraan === k);
            if (mk && mk.syarat_dokumen) {
                if (mk.syarat_dokumen.includes('SIM A')) requireSimA = true;
                if (mk.syarat_dokumen.includes('SIM B1 Umum')) requireSimB1 = true;
                if (mk.syarat_dokumen.includes('SIM B2 Umum')) requireSimB2 = true;
                if (mk.syarat_dokumen.includes('SIO')) requireSio = true;
            }
        });

        if (requireSimA) baseFiles.push('file_sim_a');
        if (requireSimB1) baseFiles.push('file_sim_b1');
        if (requireSimB2 || requireSio) baseFiles.push('file_sim_b2');

        const missingFiles = baseFiles.filter(fId => fId !== 'file_hasil_assessment' && !p[fId]);

        if (missingFiles.length > 0) {
            toast.error('Dokumen persyaratan belum lengkap! Silakan lengkapi melalui Edit terlebih dahulu.');
            return;
        }

        // Validasi Aturan K3
        if (!p.file_safety_induksi) {
            toast.error('Dokumen Safety Induksi belum ditandatangani/diunggah! Silakan lengkapi melalui Edit terlebih dahulu.');
            return;
        }

        if (requireSimA || requireSimB1 || requireSimB2) {
            if (!p.tanggal_berlaku_sim) {
                toast.error('Tanggal Berlaku SIM belum diisi! Silakan lengkapi melalui Edit terlebih dahulu.');
                return;
            }
        }
        if (requireSio || requireSimB2) {
            if (!p.tanggal_berlaku_sio && !p.tanggal_berlaku_sim) {
                // Biar aman kalau dia punya dua-duanya, salah satu harus diisi (atau sesuai UI).
            }
        }
        if (requireSio) {
            if (!p.tanggal_berlaku_sio) {
                toast.error('Tanggal Berlaku SIO / Alat Berat belum diisi! Silakan lengkapi melalui Edit terlebih dahulu.');
                return;
            }
        }

        if (!window.confirm("Kirim pengajuan ini ke admin sekarang? Anda tidak dapat merubah data lagi.")) return;
        setLoading(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/pengajuan/${id_pengajuan}/submit-draft`);
            if (res.data.success) {
                toast.success('Pengajuan berhasil dikirim ke Admin');
                fetchPengajuan(); // reload table
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Gagal mengirim pengajuan');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        const { name, files: fileList } = e.target;
        if (fileList.length > 0) {
            if (fileList[0].size > 5 * 1024 * 1024) {
                setError('Ukuran file tidak boleh lebih dari 5MB');
                toast.error('Ukuran file tidak boleh lebih dari 5MB');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                e.target.value = null;
                return;
            }
            setFiles(prev => ({ ...prev, [name]: fileList[0] }));
        }
    };

    const handleKendaraanChange = (namaKendaraan) => {
        setFormData(prev => {
            const current = [...prev.jenis_kendaraan];
            let updatedKendaraan;
            if (current.includes(namaKendaraan)) {
                updatedKendaraan = current.filter(k => k !== namaKendaraan);
            } else {
                updatedKendaraan = [...current, namaKendaraan];
            }

            // Deduce highest color
            const colorPriority = {
                'Merah (Pit Worker)': 1,
                'Orange': 2,
                'Biru (In Pit Access)': 3,
                'Hijau (Full Pit Access)': 4
            };
            let highestColor = 'Merah (Pit Worker)';
            
            updatedKendaraan.forEach(k => {
                const mk = masterKendaraan.find(m => m.nama_kendaraan === k);
                if (mk) {
                    const colorStr = mk.warna_permit === 'Orange' ? 'Orange' :
                        mk.warna_permit === 'Biru' ? 'Biru (In Pit Access)' :
                            mk.warna_permit === 'Hijau' ? 'Hijau (Full Pit Access)' : 'Merah (Pit Worker)';
                    if (colorPriority[colorStr] > colorPriority[highestColor]) {
                        highestColor = colorStr;
                    }
                }
            });

            const nextKategoriAkses = updatedKendaraan.length > 0 ? highestColor : (prev.kategori_akses === 'Merah (Pit Worker)' ? 'Merah (Pit Worker)' : 'Merah (Pit Worker)');

            return { ...prev, jenis_kendaraan: updatedKendaraan, kategori_akses: nextKategoriAkses };
        });
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

    const handleSubmit = async (e, isDraft = false) => {
        if (e) e.preventDefault();
        setError('');
        setSubmitLoading(true);

        // Strict validation for final submit
        if (!isDraft) {
            if (ttdMethod === 'online' && sigCanvas.current && sigCanvas.current.isEmpty && sigCanvas.current.isEmpty()) {
                toast.error('Harap isi Tanda Tangan Online sebagai bukti persetujuan K3.');
                setSubmitLoading(false);
                return;
            }
            if (ttdMethod === 'upload' && !files['file_safety_induksi'] && !formData['file_safety_induksi']) {
                toast.error('Harap unggah Dokumen Safety Induksi yang telah ditandatangani.');
                setSubmitLoading(false);
                return;
            }

            if (formData.id_proyek && proyekData) {
                if ((!proyekData.file_surat_penunjukan || !proyekData.file_kontrak_kerja) || 
                    (proyekData.jenis_proyek !== 'Perpanjangan' && (!proyekData.file_life_saving_talk || !proyekData.file_jsa || !proyekData.file_izin_kerja_umum))) {
                    const errMsg = 'Dokumen Bersama Proyek (Safety / Kontrak) belum lengkap. Anda hanya dapat menggunakan Simpan Sementara.';
                    setError(errMsg);
                    toast.error(errMsg);
                    setSubmitLoading(false);
                    return;
                }
            }

            const requiredFiles = getRequiredFiles();
            const missingFiles = requiredFiles.filter(req => req.id !== 'file_hasil_assessment' && !files[req.id] && !formData[req.id]);
            
            if (missingFiles.length > 0) {
                const errMsg = `Harap unggah dokumen persyaratan berikut untuk mengirim pengajuan: ${missingFiles.map(m => m.label).join(', ')}`;
                setError(errMsg);
                toast.error(errMsg);
                setSubmitLoading(false);
                return;
            }

            if (requiredFiles.some(f => ['file_sim_a', 'file_sim_b1', 'file_sim_b2'].includes(f.id))) {
                if (!formData.tanggal_berlaku_sim) {
                    toast.error('Harap isi Tanggal Berlaku Kendaraan Ringan/Medium (SIM)');
                    setSubmitLoading(false);
                    return;
                }
            }
            if (requiredFiles.some(f => ['file_sio', 'file_sertifikat_sio_sim'].includes(f.id))) {
                if (!formData.tanggal_berlaku_sio) {
                    toast.error('Harap isi Tanggal Berlaku Alat Berat (SIO)');
                    setSubmitLoading(false);
                    return;
                }
            }
        }

        try {
            const submitData = new FormData();

            // Append all text fields
            Object.keys(formData).forEach(key => {
                if (key === 'area_ids') {
                    submitData.append(key, JSON.stringify(formData[key]));
                } else {
                    submitData.append(key, formData[key]);
                }
            });
            submitData.append('is_draft', isDraft);

            // Append user info
            submitData.append('id_user_pengaju', id_user);

            // Append signature if online
            if (ttdMethod === 'online' && sigCanvas.current && typeof sigCanvas.current.isEmpty === 'function' && !sigCanvas.current.isEmpty()) {
                submitData.append('ttd_k3', sigCanvas.current.getCanvas().toDataURL('image/png'));
            }

            // Append all files
            Object.keys(files).forEach(key => {
                submitData.append(key, files[key]);
            });

            const url = editId ? `${import.meta.env.VITE_API_URL}/api/pengajuan/${editId}` : `${import.meta.env.VITE_API_URL}/api/pengajuan`;
            const method = editId ? 'put' : 'post';

            const res = await axios[method](url, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setSuccess(`Pengajuan berhasil ${editId ? 'diperbarui' : 'disubmit'}!`);
                setTimeout(() => {
                    setView('table');
                    setSubmitLoading(false);
                }, 2000);
            }
        } catch (err) {
            console.error("Submission Error:", err);
            const errMsg = err.response?.data?.message || 'Gagal menyimpan pengajuan';
            const detail = err.response?.data?.error ? ` (${err.response.data.error})` : '';
            setError(errMsg + detail + (err.message ? ` - ${err.message}` : ''));
            toast.error(errMsg + detail);
            setSubmitLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!approveModal.id_pengajuan) return;
        setLoading(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/pengajuan/${approveModal.id_pengajuan}/approve`, { role, id_user });
            if (res.data.success) {
                setModal({ isOpen: true, type: 'success', message: 'Pengajuan berhasil disetujui!' });
                setApproveModal({ isOpen: false, id_pengajuan: null });
                setView('table');
            }
        } catch (err) {
            setModal({ isOpen: true, type: 'error', message: err.response?.data?.message || 'Gagal menyetujui pengajuan' });
            setApproveModal({ isOpen: false, id_pengajuan: null });
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectModal.id_pengajuan || !rejectModal.alasan) {
            setModal({ isOpen: true, type: 'error', message: 'Alasan penolakan tidak boleh kosong!' });
            return;
        }
        setLoading(true);
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/pengajuan/${rejectModal.id_pengajuan}/reject`, { role, id_user, alasan: rejectModal.alasan });
            if (res.data.success) {
                setModal({ isOpen: true, type: 'success', message: 'Pengajuan berhasil ditolak.' });
                setRejectModal({ isOpen: false, id_pengajuan: null, alasan: '' });
                setView('table');
            }
        } catch (err) {
            setModal({ isOpen: true, type: 'error', message: err.response?.data?.message || 'Gagal menolak pengajuan' });
            setRejectModal({ isOpen: false, id_pengajuan: null, alasan: '' });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        const form = document.querySelector('form');
        if (form && !form.reportValidity()) {
            return;
        }

        if (step === 3) {
            const requiredFiles = getRequiredFiles();
            // Just check SIM/SIO date if needed, but since draft is allowed, we only enforce this on final submit.
            // We'll move all strict validation to handleSubmit or button disabled state.
        }
        setStep(s => s + 1);
    };
    const prevStep = () => setStep(s => s - 1);

    // Dynamic file requirements based on kategori_pemohon
    const getRequiredFiles = () => {
        let baseFiles = [];

        if (formData.kategori_pemohon === 'Magang') {
            baseFiles = [
                { id: 'file_foto', label: 'Foto Profil (Untuk ID Card)' },
                { id: 'file_data_diri', label: 'Data Diri / KTP' },
                { id: 'file_bpjs', label: 'BPJS Ketenagakerjaan' },
                { id: 'file_surat_pengantar', label: 'Surat Pengantar' }
            ];
        } else if (role === 'Koordinator_Vendor') {
            let files = [
                { id: 'file_foto', label: 'Foto Profil (Untuk ID Card)' },
                { id: 'file_data_diri', label: 'Dokumen Data Diri' },
                { id: 'file_mcu', label: 'MCU / Sehat' },
                { id: 'file_bpjs', label: 'BPJS Ketenagakerjaan' }
            ];

            const isPerpanjangan = user?.jenis_vendor === 'Kontrak' && proyekData?.jenis_proyek === 'Perpanjangan';

            if (!isPerpanjangan) {
                // Dokumen Safety Induksi dipindah ke form persetujuan (ttd)
            }

            if (user?.jenis_vendor === 'Kontrak' && !formData.id_proyek) {
                files.push({ id: 'file_surat_penunjukan', label: 'Surat Penunjukan dari Perusahaan' });
                files.push({ id: 'file_kontrak_kerja', label: 'Kontrak Kerja' });
            }

            baseFiles = files;;
        } else if (formData.kategori_pemohon === 'Internal') {
            baseFiles = [
                { id: 'file_foto', label: 'Foto Profil (Untuk ID Card)' },
                { id: 'file_data_diri', label: 'KTP / Data Diri' },
                { id: 'file_surat_penunjukan', label: 'Surat Permohonan Mine Permit' }
            ];
        } else if (formData.kategori_pemohon === 'Kontraktor') {
            if (formData.id_proyek) {
                baseFiles = [
                    { id: 'file_foto', label: 'Foto Profil (Untuk ID Card)' },
                    { id: 'file_data_diri', label: 'KTP / Data Diri' },
                    { id: 'file_bpjs', label: 'BPJS Ketenagakerjaan' },
                    { id: 'file_mcu', label: 'Hasil MCU' },
                    { id: 'file_hasil_assessment', label: 'Hasil Assessment (Opsional)' }
                ];
            } else {
                baseFiles = [
                    { id: 'file_foto', label: 'Foto Profil (Untuk ID Card)' },
                    { id: 'file_surat_penunjukan', label: 'Surat Penunjukan Perusahaan' },
                    { id: 'file_data_diri', label: 'KTP / Data Diri' },
                    { id: 'file_permohonan_kimper', label: 'Surat Permohonan Penerbitan Kimper' },
                    { id: 'file_bpjs', label: 'BPJS Ketenagakerjaan' },
                    { id: 'file_mcu', label: 'Hasil MCU' },
                    { id: 'file_hasil_assessment', label: 'Hasil Assessment (Opsional)' },
                    { id: 'file_kontrak_kerja', label: 'Kontrak' }
                ];
            }
        }

        let requireSimA = false;
        let requireSimB1 = false;
        let requireSimB2 = false;
        let requireSio = false;

        formData.jenis_kendaraan.forEach(k => {
            const mk = masterKendaraan.find(m => m.nama_kendaraan === k);
            if (mk && mk.syarat_dokumen) {
                if (mk.syarat_dokumen.includes('SIM A')) requireSimA = true;
                if (mk.syarat_dokumen.includes('SIM B1')) requireSimB1 = true;
                if (mk.syarat_dokumen.includes('SIM B2')) requireSimB2 = true;
                if (mk.syarat_dokumen.includes('SIO')) requireSio = true;
            }
        });

        if (requireSimA) baseFiles.push({ id: 'file_sim_a', label: 'SIM A' });
        if (requireSimB1) baseFiles.push({ id: 'file_sim_b1', label: 'SIM B1' });
        
        if (requireSimB2) {
            baseFiles.push({ 
                id: 'file_sim_b2', 
                label: formData.pilihan_dokumen_b2 === 'Sertifikat' ? 'Sertifikat Pelatihan (Roda > 6)' : 'SIM B2', 
                showB2Dropdown: true 
            });
        }

        if (requireSio) {
            baseFiles.push({ 
                id: 'file_sio', 
                label: formData.pilihan_dokumen_sio === 'Sertifikat' ? 'Sertifikat Pelatihan (Alat Berat)' : 'SIO', 
                showSioDropdown: true 
            });
        }

        return baseFiles;
    };

    const renderTable = () => {
        const filteredPengajuanList = pengajuanList.filter((p) => {
            // Sembunyikan Siap_Cetak dan Aktif dari halaman Pengajuan Permit
            if (p.status_berkas === 'Siap_Cetak' || p.status_berkas === 'Aktif') return false;

            const matchSearch = (p.karyawan?.nama_lengkap || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.karyawan?.nik_atau_ktm || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = statusFilter ? p.status_berkas === statusFilter : true;
            return matchSearch && matchStatus;
        });

        return (
            <div className="space-y-4">
                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex gap-3 items-center flex-1">
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
                                <option value="Draft">Draft</option>
                                <option value="Pending_Admin">Pending Admin</option>
                                <option value="Pending_Kasie_Pemohon">Pending Kasie Pemohon</option>
                                <option value="Pending_HSE">Pending HSE</option>
                                <option value="Pending_KTT">Pending KTT</option>
                                <option value="Lulus_Berkas">Lulus Berkas</option>
                                <option value="Menunggu_Ujian">Menunggu Ujian</option>
                                <option value="Ditolak">Ditolak</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {['admin'].includes(role?.toLowerCase()) && (
                            <button onClick={() => setIsFastTrackModalOpen(true)} className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm">
                                <Plus size={16} /> Input Data Cepat VIP
                            </button>
                        )}
                        {['admin', 'pemohon_mandiri', 'koordinator_vendor'].includes(role?.toLowerCase()) && (
                            <>
                                <button onClick={handleExportExcel} className="py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm">
                                    Export Excel
                                </button>
                                <button onClick={handleExportDocs} className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm flex items-center gap-2 text-sm">
                                    Download ZIP (Data + Dokumen)
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center py-20 text-gray-400"><Loader2 size={32} className="animate-spin text-[#E11D2E]" /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-medium">
                                        <th className="px-4 py-4 w-10 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-[#E11D2E] focus:ring-[#E11D2E]"
                                                checked={filteredPengajuanList.length > 0 && selectedRows.length === filteredPengajuanList.length}
                                                onChange={(e) => {
                                                    if (e.target.checked) setSelectedRows(filteredPengajuanList.map(p => p.id_pengajuan));
                                                    else setSelectedRows([]);
                                                }}
                                            />
                                        </th>
                                        <th className="px-6 py-4 border-r border-gray-100">Asal / Proyek</th>
                                        <th className="px-6 py-4">Tgl Pengajuan</th>
                                        <th className="px-6 py-4">Nama Pekerja / NIK</th>
                                        <th className="px-6 py-4">Area & Akses</th>
                                        <th className="px-6 py-4 text-center">Ujian Online</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredPengajuanList.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-10 text-center text-gray-400">Tidak ada pengajuan yang sesuai.</td></tr>
                                    ) : (
                                        Object.entries(filteredPengajuanList.reduce((acc, p) => {
                                            const isInternal = p.kategori_pemohon === 'Internal';
                                            const key = p.proyek_vendor ? `${p.proyek_vendor.nama_proyek}|Kontrak/SPK` : (isInternal ? 'Karyawan PT Semen Padang|Internal' : `${p.kategori_pemohon}|Mandiri`);
                                            if (!acc[key]) acc[key] = [];
                                            acc[key].push(p);
                                            return acc;
                                        }, {})).flatMap(([groupKey, group]) => {
                                            const [proyekName, vendorType] = groupKey.split('|');
                                            return group.map((p, index) => (
                                                <tr key={p.id_pengajuan} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-4 border-b border-gray-100 text-center">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-gray-300 text-[#E11D2E] focus:ring-[#E11D2E]"
                                                            checked={selectedRows.includes(p.id_pengajuan)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) setSelectedRows(prev => [...prev, p.id_pengajuan]);
                                                                else setSelectedRows(prev => prev.filter(id => id !== p.id_pengajuan));
                                                            }}
                                                        />
                                                    </td>
                                                    {index === 0 && (
                                                        <td rowSpan={group.length} className="px-6 py-4 border-r border-b border-gray-200 align-top bg-gray-50/30">
                                                            <div className="font-semibold text-gray-900">{proyekName}</div>
                                                            <div className="text-xs text-gray-500 mt-1">{vendorType}</div>
                                                            <div className="text-xs font-medium bg-gray-200 text-gray-700 inline-block px-2 py-0.5 rounded mt-2">{group.length} Orang</div>
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 border-b border-gray-100">{new Date(p.tanggal_pengajuan).toLocaleDateString('id-ID')}</td>
                                                    <td className="px-6 py-4 border-b border-gray-100">
                                                        <div className="font-medium text-gray-900">{p.karyawan?.nama_lengkap}</div>
                                                        <div className="text-xs text-gray-500">{p.karyawan?.nik_atau_ktm}</div>
                                                    </td>
                                                    <td className="px-6 py-4 border-b border-gray-100">
                                                        <div className="text-xs font-medium bg-gray-100 inline-block px-2 py-1 rounded mb-1">{p.kategori_akses}</div>
                                                        <div className="text-xs text-gray-500">{p.master_areas?.map(a => a.nama_area).join(', ') || '-'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center border-b border-gray-100">
                                                        {p.kode_ujian_online ? (
                                                            <>
                                                                <div className="font-mono bg-gray-100 px-2 py-1 rounded tracking-widest font-bold text-xs inline-block mb-1 border border-gray-200">
                                                                    {p.kode_ujian_online}
                                                                </div>
                                                                <div className="text-[10px] text-gray-500 font-medium">
                                                                    Nilai: {p.nilai_ujian_online !== null ? <span className={p.nilai_ujian_online >= 76 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{p.nilai_ujian_online}</span> : '-'}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="text-xs text-gray-400">-</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 border-b border-gray-100">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium text-xs ${getStatusBadgeClass(p.status_berkas)}`}>
                                                            {p.status_berkas.replace(/_/g, ' ')}
                                                        </span>
                                                        {p.status_berkas === 'Ditolak' && p.riwayat_approvals && p.riwayat_approvals.length > 0 && (
                                                            <div className="text-[11px] text-red-600 mt-1.5 font-medium leading-tight max-w-[150px]">
                                                                <span className="block font-bold">Catatan:</span>
                                                                {p.riwayat_approvals.filter(r => r.status_keputusan === 'Ditolak').pop()?.catatan_revisi}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right border-b border-gray-100 whitespace-nowrap">
                                                        <button onClick={() => handleOpenDetail(p.id_pengajuan)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-xs font-medium px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5">
                                                            <FileText size={14} /> Detail
                                                        </button>
                                                        {p.status_berkas === 'Draft' && (
                                                            <>
                                                                <button onClick={() => handleOpenEdit(p.id_pengajuan)} className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm text-xs font-medium px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 ml-2">
                                                                    <Edit size={14} /> Edit
                                                                </button>
                                                                <button onClick={() => handleKirimAdmin(p.id_pengajuan)} className="bg-green-600 hover:bg-green-700 text-white shadow-sm text-xs font-medium px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1.5 ml-2">
                                                                    <Send size={14} /> Kirim
                                                                </button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ));
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <FastTrackModal 
                    isOpen={isFastTrackModalOpen} 
                    onClose={() => setIsFastTrackModalOpen(false)} 
                    onSuccess={() => {
                        fetchPengajuan();
                    }}
                />
            </div>
        );
    };

    const renderWizard = () => (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-4xl mx-auto overflow-hidden">
            <div className="px-6 pt-8 pb-6 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center justify-between max-w-3xl mx-auto relative">
                    {/* Progress Bar Track */}
                    <div className="absolute left-8 right-8 top-5 transform -translate-y-1/2 h-1.5 bg-gray-200 z-0 rounded-full"></div>
                    {/* Progress Bar Fill */}
                    <div className="absolute left-8 top-5 transform -translate-y-1/2 h-1.5 bg-[#E11D2E] z-0 rounded-full transition-all duration-700 ease-in-out" style={{ width: `${((step - 1) / 3) * 100}%`, maxWidth: 'calc(100% - 4rem)' }}></div>
                    
                    {['Biodata Profil', 'Izin & Kesehatan', 'Unggah Dokumen', 'Persetujuan K3'].map((lbl, idx) => {
                        const isActive = step === idx + 1;
                        const isCompleted = step > idx + 1;
                        return (
                            <div key={idx} className="relative z-10 flex flex-col items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-[3px] transition-all duration-500 ease-out ${isActive ? 'border-[#E11D2E] bg-white text-[#E11D2E] shadow-lg shadow-red-500/30 scale-125' : isCompleted ? 'border-[#E11D2E] bg-[#E11D2E] text-white scale-110' : 'border-gray-200 bg-white text-gray-300'}`}>
                                    {isCompleted ? <CheckCircle2 size={18} strokeWidth={3} /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold tracking-widest uppercase transition-colors duration-300 ${isActive ? 'text-[#E11D2E]' : isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>{lbl}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-6 md:p-8">
                {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm flex items-center gap-2"><AlertCircle size={18} />{error}</div>}
                {success && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2"><CheckCircle2 size={18} />{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* STEP 1: BIODATA */}
                    {step === 1 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                                <div className="p-3 bg-red-50 text-[#E11D2E] rounded-2xl shadow-inner"><User size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Biodata Pekerja</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Lengkapi informasi dasar pekerja dengan benar dan sesuai identitas.</p>
                                </div>
                            </div>

                            {role !== 'Koordinator_Vendor' && (
                                <div className="space-y-2 md:w-1/2 p-5 bg-gray-50/50 rounded-2xl border border-gray-100">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori Pemohon <span className="text-red-500">*</span></label>
                                    <select name="kategori_pemohon" value={formData.kategori_pemohon} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 bg-white font-medium text-gray-800 transition-all outline-none">
                                        <option value="Magang">Mahasiswa / Siswa</option>
                                        <option value="Internal">Karyawan Internal</option>
                                    </select>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">NIK / KTM <span className="text-red-500">*</span></label>
                                    <input type="text" name="nik_atau_ktm" value={formData.nik_atau_ktm} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="Masukkan NIK atau KTM" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="Nama sesuai KTP" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                                    <select name="jenis_kelamin" value={formData.jenis_kelamin} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none">
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tempat Lahir <span className="text-red-500">*</span></label>
                                        <input type="text" name="tempat_lahir" value={formData.tempat_lahir} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="Kota kelahiran" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tgl Lahir <span className="text-red-500">*</span></label>
                                        <input type="date" name="tanggal_lahir" value={formData.tanggal_lahir} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Agama <span className="text-red-500">*</span></label>
                                        <input type="text" name="agama" value={formData.agama} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="Agama" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Golongan Darah</label>
                                        <input type="text" name="golongan_darah" value={formData.golongan_darah} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="O/A/B/AB" />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Rumah (Lengkap) <span className="text-red-500">*</span></label>
                                    <textarea name="alamat_rumah" rows="2" value={formData.alamat_rumah} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="Masukkan alamat lengkap RT/RW, kelurahan, dsb." />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">No. HP / Telepon <span className="text-red-500">*</span></label>
                                    <input type="text" name="no_hp" value={formData.no_hp} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="08..." />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">E-mail</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="email@contoh.com" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Jabatan <span className="text-red-500">*</span></label>
                                    <input type="text" name="jabatan" value={formData.jabatan} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="Jabatan pekerja" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Unit Kerja / Alamat Kantor <span className="text-red-500">*</span></label>
                                    <input type="text" name="unit_kerja" value={formData.unit_kerja} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="Departemen / Biro" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Riwayat Pendidikan <span className="text-red-500">*</span></label>
                                    <input type="text" name="riwayat_pendidikan" value={formData.riwayat_pendidikan} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" required placeholder="SD / SMP / SMA / D3 / S1..." />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Sertifikasi Keahlian</label>
                                    <input type="text" name="sertifikasi_keahlian" value={formData.sertifikasi_keahlian} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="(Opsional)" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pendidikan Khusus / Lainnya</label>
                                    <input type="text" name="pendidikan_khusus" value={formData.pendidikan_khusus} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="(Opsional)" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: IZIN & SEHAT */}
                    {step === 2 && (
                        <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                            {/* Izin Masuk Tambang */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                                    <div className="p-3 bg-red-50 text-[#E11D2E] rounded-2xl shadow-inner"><MapPin size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Izin Masuk Tambang</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Tentukan durasi, kendaraan, dan kategori akses.</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Izin <span className="text-red-500">*</span></label>
                                        <select name="jenis_izin" value={formData.jenis_izin} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none">
                                            <option value="Baru">Izin Baru</option>
                                            <option value="Perpanjangan">Perpanjangan</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Permintaan & Durasi <span className="text-red-500">*</span></label>
                                        <div className="flex gap-3">
                                            <div className="w-1/3">
                                                <select
                                                    name="jenis_permintaan"
                                                    value={(role === 'Koordinator_Vendor' && user?.jenis_vendor === 'SPK') ? 'Sementara' : formData.jenis_permintaan}
                                                    onChange={handleInputChange}
                                                    disabled={role === 'Koordinator_Vendor' && user?.jenis_vendor === 'SPK'}
                                                    className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                >
                                                    <option value="Permanent">Permanent</option>
                                                    <option value="Sementara">Sementara</option>
                                                </select>
                                            </div>
                                            <div className="w-1/3 relative">
                                                <input type="date" name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none text-xs sm:text-sm" title="Tanggal Mulai" required />
                                            </div>
                                            <div className="w-1/3 relative">
                                                <input type="date" name="tanggal_selesai" value={formData.tanggal_selesai} onChange={handleInputChange} className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none text-xs sm:text-sm" title="Tanggal Selesai" required />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Kendaraan (Optional)</label>
                                        <div className="bg-white border-2 border-gray-100 rounded-2xl max-h-48 overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
                                            {masterKendaraan.map(kend => (
                                                <label key={kend.id_kendaraan} className="flex items-center p-3 rounded-xl bg-gray-50/50 border-2 border-transparent hover:border-gray-200 hover:shadow-md cursor-pointer transition-all">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.jenis_kendaraan.includes(kend.nama_kendaraan)}
                                                        onChange={() => handleKendaraanChange(kend.nama_kendaraan)}
                                                        className="w-5 h-5 text-[#E11D2E] rounded border-gray-300 focus:ring-[#E11D2E] transition-colors"
                                                    />
                                                    <span className="ml-3 text-sm font-bold text-gray-700 flex-1">{kend.nama_kendaraan}</span>
                                                    <span className={`ml-auto text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${kend.warna_permit === 'Hijau' ? 'bg-green-100 text-green-700' : kend.warna_permit === 'Biru' ? 'bg-blue-100 text-blue-700' : kend.warna_permit === 'Orange' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{kend.warna_permit}</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5"><Info size={14} className="text-blue-500"/> Memilih kendaraan secara otomatis menentukan warna permit minimum yang dibutuhkan.</p>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 flex justify-between items-center">
                                            Kategori Akses (Warna Permit)
                                            {formData.jenis_kendaraan.length > 0 && <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shadow-sm">Ditentukan Kendaraan</span>}
                                        </label>
                                        <select
                                            name="kategori_akses"
                                            value={formData.kategori_akses}
                                            onChange={handleInputChange}
                                            disabled={formData.jenis_kendaraan.length > 0}
                                            className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-bold text-gray-800 transition-all outline-none disabled:opacity-90 disabled:bg-gray-100 disabled:text-gray-600"
                                        >
                                            <option value="Merah (Pit Worker)">Merah - Tanpa Ujian Online</option>
                                            <option value="Hijau (Full Pit Access)">Hijau - Wajib Ujian (Min. 76)</option>
                                            <option value="Biru (In Pit Access)">Biru - Wajib Ujian (Min. 76)</option>
                                            <option value="Orange">Orange - Wajib Ujian (Min. 76)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Surat Pernyataan Sehat */}
                            <div className="space-y-6 pt-4">
                                <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                                    <div className="p-3 bg-red-50 text-[#E11D2E] rounded-2xl shadow-inner"><Activity size={24} /></div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-800 tracking-tight">Pernyataan Sehat Tenaga Kerja</h2>
                                        <p className="text-sm text-gray-500 mt-0.5">Isi kondisi fisik dan kesehatan pekerja secara jujur.</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Tinggi (cm) <span className="text-red-500">*</span></label>
                                        <input type="number" name="tinggi_badan" value={formData.tinggi_badan} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="Contoh: 170" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Berat (kg) <span className="text-red-500">*</span></label>
                                        <input type="number" name="berat_badan" value={formData.berat_badan} onChange={handleInputChange} required className="w-full px-3 py-2.5 rounded-lg border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-[#E11D2E] focus:ring-4 focus:ring-[#E11D2E]/10 font-medium text-gray-800 transition-all outline-none" placeholder="Contoh: 65" />
                                    </div>
                                </div>
                                <div className="mt-6 bg-white border-2 border-gray-100 p-6 rounded-2xl shadow-sm">
                                    <p className="text-sm font-bold tracking-wide uppercase text-gray-800 mb-5 pb-3 border-b border-gray-100">Kuesioner Kesehatan & Keselamatan (Ya / Tidak)</p>
                                    <div className="space-y-1">
                                        {[
                                            { id: 'q1_sehat', label: '1. Apakah kondisi anda sehat hari ini?' },
                                            { id: 'q2_tidur_cukup', label: '2. Apakah anda tidur lebih dari 6 jam hari ini?' },
                                            { id: 'q3_jantung', label: '3. Apakah anda menderita penyakit Jantung?' },
                                            { id: 'q4_diabetes', label: '4. Apakah anda menderita penyakit Diabetes?' },
                                            { id: 'q5_kolesterol', label: '5. Apakah anda menderita penyakit Kolesterol?' },
                                            { id: 'q6_obat_kantuk', label: '6. Apakah anda mengkonsumsi obat yang dapat menyebabkan kantuk?' },
                                            { id: 'q7_paham_pekerjaan', label: '7. Apakah anda sudah mendapatkan penjelasan mengenai pekerjaan yang akan dilakukan?' },
                                            { id: 'q8_paham_risiko', label: '8. Apakah anda sudah memahami risiko dan pengendalian risiko dari pekerjaan yang akan dilakukan?' },
                                            { id: 'q9_sedia_menegur', label: '9. Apakah anda bersedia menegur jika menjumpai pekerja yang melakukan tindakan tidak aman?' },
                                            { id: 'q10_sedia_melapor', label: '10. Apakah anda bersedia melaporkan jika menjumpai tindakan dan atau kondisi tidak aman?' }
                                        ].map(q => (
                                            <div key={q.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-sm border-b border-gray-50 py-3 last:border-0 hover:bg-gray-50/50 rounded-lg px-2 transition-colors">
                                                <span className="text-gray-700 font-medium pr-4 mb-3 sm:mb-0 leading-relaxed">{q.label}</span>
                                                <div className="flex gap-4 shrink-0 bg-gray-100 p-1.5 rounded-lg border border-gray-200">
                                                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-md transition-colors ${formData[q.id] === true || formData[q.id] === 'true' ? 'bg-white shadow-sm font-bold text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                        <input type="radio" name={q.id} value="true" checked={formData[q.id] === true || formData[q.id] === 'true'} onChange={() => setFormData(p => ({ ...p, [q.id]: true }))} className="text-[#E11D2E] focus:ring-[#E11D2E] w-4 h-4" /> Ya
                                                    </label>
                                                    <label className={`flex items-center gap-2 cursor-pointer px-4 py-1.5 rounded-md transition-colors ${formData[q.id] === false || formData[q.id] === 'false' ? 'bg-white shadow-sm font-bold text-gray-900 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
                                                        <input type="radio" name={q.id} value="false" checked={formData[q.id] === false || formData[q.id] === 'false'} onChange={() => setFormData(p => ({ ...p, [q.id]: false }))} className="text-gray-500 w-4 h-4" /> Tidak
                                                    </label>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: UPLOAD */}
                    {step === 3 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                                <div className="p-3 bg-red-50 text-[#E11D2E] rounded-2xl shadow-inner"><Upload size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Unggah Dokumen Persyaratan</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Unggah berkas dalam format PDF/JPG (Maks 5MB).</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
                                {getRequiredFiles().map(fileReq => {
                                    const isOrRequired = (
                                        (fileReq.id === 'file_sim_b2' && (files['file_sio'] || formData['file_sio'])) ||
                                        (fileReq.id === 'file_sio' && (files['file_sim_b2'] || formData['file_sim_b2']))
                                    );
                                    const isStrictlyRequired = !formData.is_draft && !files[fileReq.id] && !formData[fileReq.id] && !isOrRequired;
                                    const isAssessment = fileReq.id === 'file_hasil_assessment';
                                    const hasFile = files[fileReq.id] || formData[fileReq.id];

                                    return (
                                        <div key={fileReq.id} className="flex flex-col gap-2">
                                            {(fileReq.showB2Dropdown || fileReq.showSioDropdown) && (
                                                <div className="flex flex-col gap-2 mb-1">
                                                    {fileReq.showB2Dropdown && (
                                                        <select 
                                                            name="pilihan_dokumen_b2" 
                                                            value={formData.pilihan_dokumen_b2} 
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none text-xs font-semibold text-blue-800"
                                                        >
                                                            <option value="SIM B2">Kategori Roda {'>'} 6: Gunakan SIM B2</option>
                                                            <option value="Sertifikat">Kategori Roda {'>'} 6: Gunakan Sertifikat Pelatihan</option>
                                                        </select>
                                                    )}
                                                    {fileReq.showSioDropdown && (
                                                        <select 
                                                            name="pilihan_dokumen_sio" 
                                                            value={formData.pilihan_dokumen_sio} 
                                                            onChange={handleInputChange}
                                                            className="w-full px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none text-xs font-semibold text-orange-800"
                                                        >
                                                            <option value="SIO">Kategori Alat Berat: Gunakan SIO</option>
                                                            <option value="Sertifikat">Kategori Alat Berat: Gunakan Sertifikat Pelatihan</option>
                                                        </select>
                                                    )}
                                                </div>
                                            )}
                                            <div className={`p-4 border rounded-xl transition-all duration-300 flex items-center justify-between gap-4 ${hasFile ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white hover:border-[#E11D2E]/40'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2.5 rounded-lg ${hasFile ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                                        {hasFile ? <CheckCircle2 size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-semibold text-gray-800">{fileReq.label} {isStrictlyRequired && !isAssessment && <span className="text-red-500">*</span>}</div>
                                                        <div className="text-xs text-gray-500">{files[fileReq.id] ? files[fileReq.id].name : (formData[fileReq.id] ? 'Tersimpan' : 'PDF/JPG, Maks 5MB')}</div>
                                                    </div>
                                                </div>
                                                <label className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors text-sm font-medium ${hasFile ? 'bg-white border border-green-200 text-green-700 hover:bg-green-50' : 'bg-[#E11D2E]/10 text-[#E11D2E] hover:bg-[#E11D2E]/20'}`}>
                                                    <Upload size={16} />
                                                    {hasFile ? 'Ubah File' : 'Unggah'}
                                                    <input
                                                        type="file"
                                                        name={fileReq.id}
                                                        onChange={handleFileChange}
                                                        className="sr-only"
                                                        accept=".pdf,.jpg,.jpeg,.png"
                                                        required={isStrictlyRequired && !isAssessment}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {getRequiredFiles().some(f => ['file_sim_a', 'file_sim_b1', 'file_sim_b2', 'file_sio', 'file_sertifikat_sio_sim'].includes(f.id)) && (
                                <div className="mt-8 p-6 border-2 border-orange-200 bg-orange-50/50 rounded-2xl shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-orange-100 text-orange-600 rounded-full shrink-0"><Calendar size={24} /></div>
                                        <div className="flex-1 w-full">
                                            <h3 className="font-bold text-gray-800 text-lg mb-1">Masa Berlaku Dokumen (SIM / SIO / Sertifikat)</h3>
                                            <p className="text-sm text-gray-600 mb-5">Karena persyaratan mewajibkan dokumen berkendara, mohon isi tanggal berakhirnya agar sistem dapat mengirimkan pengingat.</p>
                                            
                                            <div className="flex flex-col md:flex-row gap-6 w-full">
                                                {(() => {
                                                    let reqB2OrSim = false;
                                                    let reqSioObj = false;
                                                    formData.jenis_kendaraan.forEach(k => {
                                                        const mk = masterKendaraan.find(m => m.nama_kendaraan === k);
                                                        if (mk && mk.syarat_dokumen) {
                                                            if (mk.syarat_dokumen.includes('SIM')) reqB2OrSim = true;
                                                            if (mk.syarat_dokumen.includes('SIO')) reqSioObj = true;
                                                        }
                                                    });

                                                    return (
                                                        <>
                                                            {reqB2OrSim && (
                                                                <div className="space-y-2 flex-1">
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Berlaku Kendaraan Ringan/Medium <span className="text-red-500">*</span></label>
                                                                    <input
                                                                        type="date"
                                                                        name="tanggal_berlaku_sim"
                                                                        value={formData.tanggal_berlaku_sim}
                                                                        onChange={handleInputChange}
                                                                        required={!formData.is_draft}
                                                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium text-gray-800"
                                                                    />
                                                                </div>
                                                            )}
                                                            {reqSioObj && (
                                                                <div className="space-y-2 flex-1">
                                                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Berlaku Alat Berat <span className="text-red-500">*</span></label>
                                                                    <input
                                                                        type="date"
                                                                        name="tanggal_berlaku_sio"
                                                                        value={formData.tanggal_berlaku_sio}
                                                                        onChange={handleInputChange}
                                                                        required={!formData.is_draft}
                                                                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-medium text-gray-800"
                                                                    />
                                                                </div>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: ATURAN K3 */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                                <div className="p-3 bg-red-50 text-[#E11D2E] rounded-2xl shadow-inner"><ShieldCheck size={24} /></div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800 tracking-tight">Peraturan Umum Keselamatan Kerja</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">Baca dan pahami aturan K3 sebelum memberikan persetujuan.</p>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 p-6 rounded-2xl text-sm text-gray-700 space-y-4 h-64 overflow-y-auto border-2 border-gray-100 leading-relaxed custom-scrollbar shadow-inner">
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">1.</span> <span>Memastikan semua karyawan baru, kontraktor, tamu dan mahasiswa/siswa PKL harus memakai Kartu Tanda Pengenal, dan mengikuti Pengarahan K3 (Safety Induction) dan menandatangani formulir Peraturan Umum Keselamatan Kerja setelah membaca peraturan tersebut.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">2.</span> <span>Memastikan semua karyawan baru, kontraktor, tamu dan mahasiswa/siswa PKL menggunakan APD seperti helm, sepatu, ear plug dan APD lainnya yang dipersyaratkan, serta dilarang keras memasuki area berbahaya tanpa izin.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">3.</span> <span>Untuk menghindari terjadinya bahaya kebakaran dan atau ledakan, dilarang keras merokok di daerah dilarang merokok.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">4.</span> <span>Bagi kendaraan di dalam emplasemen Tambang kecepatan max. 25 km/jam dan di area penambangan max. 40 km/jam. Peralatan produksi max. 35 km/jam. Patuhilah rambu-rambu yang ada, berikan kesempatan pejalan kaki, dan berhenti pada rambu "STOP".</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">5.</span> <span>Setiap pekerjaan berbahaya di dalam Emplasemen harus dilengkapi dengan "IZIN KERJA BERBAHAYA" yang disetujui dan diawasi pelaksanaannya.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">6.</span> <span>Jika alarm keadaan darurat berbunyi, lakukan hal sbb:<br />
                                    - Jangan panik.<br />
                                    - Dilarang berlari, berjalanlah menuju ke titik kumpul.<br />
                                    - Jika mengendarai mobil pinggirkan ke kiri, matikan mesin, kunci, lalu berjalan ke titik kumpul.<br />
                                    - Ikuti petunjuk evakuasi.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">7.</span> <span>Dilarang membuang sampah bukan pada tempatnya, dan dilarang membuang sampah mengandung metal di area penambangan.</span></p>
                                <p className="flex gap-2"><span className="font-bold text-[#E11D2E]">8.</span> <span>Dilarang mengambil foto di lingkungan pabrik tanpa izin, dan dilarang mengupload ke media sosial.</span></p>
                            </div>
                            
                            <div className="mt-6 p-6 border-2 border-gray-100 bg-white rounded-2xl shadow-sm">
                                <h3 className="font-bold text-gray-800 text-lg mb-1">Tanda Tangan Persetujuan</h3>
                                <p className="text-sm text-gray-500 mb-6">Pilih metode pengesahan Anda sebagai bukti kepatuhan K3.</p>
                                
                                <div className="flex gap-4 mb-6">
                                    <label className={`flex items-center gap-3 cursor-pointer px-5 py-3 rounded-xl border-2 transition-all flex-1 ${ttdMethod === 'online' ? 'border-[#E11D2E] bg-red-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                        <input type="radio" name="ttdMethod" value="online" checked={ttdMethod === 'online'} onChange={() => setTtdMethod('online')} className="text-[#E11D2E] focus:ring-[#E11D2E] w-5 h-5" /> 
                                        <span className="text-sm font-bold text-gray-800">Tanda Tangan Online</span>
                                    </label>
                                    <label className={`flex items-center gap-3 cursor-pointer px-5 py-3 rounded-xl border-2 transition-all flex-1 ${ttdMethod === 'upload' ? 'border-[#E11D2E] bg-red-50/50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
                                        <input type="radio" name="ttdMethod" value="upload" checked={ttdMethod === 'upload'} onChange={() => setTtdMethod('upload')} className="text-[#E11D2E] focus:ring-[#E11D2E] w-5 h-5" /> 
                                        <span className="text-sm font-bold text-gray-800">Unggah Dokumen</span>
                                    </label>
                                </div>

                                {ttdMethod === 'online' && (
                                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                                        <div className="border-2 border-gray-200 border-dashed rounded-2xl bg-gray-50/50 max-w-xl mx-auto overflow-hidden relative group">
                                            <div className="absolute top-4 left-4 text-xs font-semibold text-gray-400 select-none pointer-events-none">Gambar tanda tangan Anda disini...</div>
                                            <SignatureCanvas 
                                                ref={sigCanvas} 
                                                penColor="black"
                                                canvasProps={{className: 'sigCanvas w-full h-48 rounded-2xl cursor-crosshair'}} 
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <button type="button" onClick={() => sigCanvas.current.clear()} className="text-sm px-4 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 rounded-lg font-bold transition-colors">
                                                Hapus & Ulangi Tanda Tangan
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {ttdMethod === 'upload' && (
                                    <div className="space-y-3 mt-4 animate-in fade-in zoom-in-95 duration-300">
                                        <label className={`flex items-center justify-center w-full max-w-xl px-4 py-8 mx-auto border-2 border-dashed rounded-2xl cursor-pointer transition-all ${files['file_safety_induksi'] || formData['file_safety_induksi'] ? 'bg-green-50/30 border-green-300' : 'bg-gray-50 hover:border-[#E11D2E] hover:bg-red-50/30 border-gray-300'}`}>
                                            <div className="flex flex-col items-center gap-3 text-sm text-gray-500 text-center">
                                                {files['file_safety_induksi'] || formData['file_safety_induksi'] ? <CheckCircle2 size={32} className="text-green-500" /> : <Upload size={32} className="text-gray-400" />}
                                                <div>
                                                    <div className={files['file_safety_induksi'] || formData['file_safety_induksi'] ? 'font-bold text-green-700' : 'font-bold text-gray-700'}>{files['file_safety_induksi'] ? files['file_safety_induksi'].name : (formData['file_safety_induksi'] ? 'Dokumen Tersimpan (Ketuk ubah)' : 'Pilih/Tarik File Safety Induksi')}</div>
                                                    <div className="text-xs text-gray-500 mt-1">Format PDF/JPG, Maks 5MB</div>
                                                </div>
                                            </div>
                                            <input
                                                type="file"
                                                name="file_safety_induksi"
                                                onChange={handleFileChange}
                                                className="sr-only"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                required={!formData.is_draft && !files['file_safety_induksi'] && !formData['file_safety_induksi']}
                                            />
                                        </label>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* WARNING MESSAGES */}
                    {step === 4 && (
                        <div className="mb-8 space-y-4 pt-4">
                            {getRequiredFiles().filter(req => {
                                if (req.id === 'file_hasil_assessment') return false;
                                return !files[req.id] && !formData[req.id];
                            }).length > 0 && (
                                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 flex items-start gap-4">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0"><AlertCircle size={20} /></div>
                                    <div className="text-sm font-medium leading-relaxed mt-1">
                                        Tombol <span className="font-bold uppercase tracking-wide">Kirim Pengajuan</span> dinonaktifkan karena dokumen persyaratan mandiri belum lengkap. Anda hanya dapat menggunakan Simpan Sementara.
                                    </div>
                                </div>
                            )}
                            {(formData.id_proyek && proyekData && (
                                (!proyekData.file_surat_penunjukan || !proyekData.file_kontrak_kerja) || 
                                (proyekData.jenis_proyek !== 'Perpanjangan' && (!proyekData.file_life_saving_talk || !proyekData.file_jsa || !proyekData.file_izin_kerja_umum))
                            )) ? (
                                <div className="p-4 bg-red-50 text-red-700 rounded-2xl border-2 border-red-100 flex items-start gap-4">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-xl shrink-0"><AlertCircle size={20} /></div>
                                    <div className="text-sm font-medium leading-relaxed mt-1">
                                        Tombol <span className="font-bold uppercase tracking-wide">Kirim Pengajuan</span> dinonaktifkan karena Dokumen Bersama Proyek (Safety / Kontrak) belum lengkap. Anda hanya dapat menggunakan Simpan Sementara.
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="pt-8 mt-8 border-t-2 border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        {step > 1 ? (
                            <button type="button" onClick={prevStep} className="w-full sm:w-auto px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors flex justify-center items-center gap-2">
                                <ArrowLeft size={18} /> Sebelumnya
                            </button>
                        ) : <div className="hidden sm:block"></div>}

                        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                            <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={submitLoading} className="w-full sm:w-auto px-8 py-3.5 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50 text-center">
                                Simpan Sementara
                            </button>
                            
                            {step < 4 ? (
                                <button type="button" onClick={nextStep} className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-black hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                    Selanjutnya <ChevronRight size={18} />
                                </button>
                            ) : (
                                <button 
                                    type="submit" 
                                    disabled={
                                        submitLoading || 
                                        getRequiredFiles().filter(req => {
                                            if (req.id === 'file_hasil_assessment') return false;
                                            return !files[req.id] && !formData[req.id];
                                        }).length > 0 ||
                                        (formData.id_proyek && proyekData && (
                                            (!proyekData.file_surat_penunjukan || !proyekData.file_kontrak_kerja) || 
                                            (proyekData.jenis_proyek !== 'Perpanjangan' && (!proyekData.file_life_saving_talk || !proyekData.file_jsa || !proyekData.file_izin_kerja_umum))
                                        ))
                                    } 
                                    className="w-full sm:w-auto px-10 py-3.5 rounded-xl bg-[#E11D2E] hover:bg-[#C91929] hover:shadow-lg hover:shadow-red-500/30 text-white font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-gray-400 disabled:shadow-none"
                                >
                                    {submitLoading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Pengajuan Sekarang'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );

    const renderDetail = () => {
        if (!selectedPengajuan) return null;
        const p = selectedPengajuan;

        // Define fields to show
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
            { key: 'file_serah_terima_apd', label: 'Serah Terima APD' },
            { key: 'file_permohonan_kimper', label: 'Permohonan Kimper' },
            { key: 'file_sertifikat_sio_sim', label: 'SIO/SIM (Lainnya)' },
            { key: 'file_sim_a', label: 'SIM A' },
            { key: 'file_sim_b1', label: 'SIM B1 Umum' },
            { key: 'file_sim_b2', label: 'SIM B2 Umum' },
            { key: 'file_sio', label: 'SIO' },
            { key: 'file_safety_induksi', label: 'Safety Induksi (TTD K3)' },
            { key: 'file_hasil_assessment', label: 'Hasil Assessment' }
        ];

        return (
            <div className="bg-gray-50/50 min-h-full pb-10">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header Detail */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Detail Pengajuan #{p.id_pengajuan}</h2>
                                <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                    <Calendar size={14} />
                                    Diajukan pada {new Date(p.tanggal_pengajuan).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`px-4 py-2 rounded-xl font-semibold text-sm border shadow-sm ${getStatusBadgeClass(p.status_berkas)}`}>
                                {p.status_berkas.replace(/_/g, ' ')}
                            </span>
                        </div>
                    </div>

                    {/* Alert Penolakan */}
                    {p.status_berkas === 'Ditolak' && p.riwayat_approvals && p.riwayat_approvals.length > 0 && (
                        <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 text-red-800 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            <AlertCircle size={24} className="shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-lg mb-1">Pengajuan Ditolak</p>
                                <p className="text-red-700/80 leading-relaxed">
                                    {p.riwayat_approvals.filter(r => r.status_keputusan === 'Ditolak').pop()?.catatan_revisi || 'Tidak ada catatan revisi yang diberikan.'}
                                </p>
                            </div>
                        </div>
                    )}

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
                                            <p className="font-medium text-gray-800">{p.karyawan?.unit_kerja || p.karyawan?.perusahaan || '-'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Alamat Rumah</p>
                                            <p className="font-medium text-gray-800 flex items-start gap-1.5"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0"/> {p.karyawan?.alamat_rumah || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">No HP</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.no_hp || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Email</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.email || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Agama</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.agama || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Golongan Darah</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.golongan_darah || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Kategori Pemohon</p>
                                            <p className="font-medium text-gray-800">{p.kategori_pemohon || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card Pendidikan & Keahlian */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                                    <GraduationCap size={18} className="text-gray-500" />
                                    <h3 className="font-bold text-gray-800">Pendidikan & Keahlian</h3>
                                </div>
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8">
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Riwayat Pendidikan Terakhir</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.riwayat_pendidikan || '-'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Sertifikasi Keahlian</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.sertifikasi_keahlian || '-'}</p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-gray-500 mb-1">Pendidikan Khusus (Training)</p>
                                            <p className="font-medium text-gray-800">{p.karyawan?.pendidikan_khusus || '-'}</p>
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
                                            <a key={f.key} href={`${import.meta.env.VITE_API_URL}/uploads/${p[f.key].split(/[/\\]/).pop()}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50/50 hover:shadow-sm transition-all group">
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

                            {/* Card Dokumen Proyek (Optional) */}
                            {p.proyek_vendor && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="border-b border-gray-100 bg-orange-50/30 px-6 py-4 flex items-center gap-2">
                                        <Briefcase size={18} className="text-orange-500" />
                                        <h3 className="font-bold text-gray-800">Dokumen Proyek: {p.proyek_vendor.nama_proyek}</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { key: 'file_kontrak_kerja', label: 'Kontrak Kerja' },
                                                { key: 'file_surat_penunjukan', label: 'Surat Penunjukan' },
                                                { key: 'file_prosedur', label: 'Prosedur' },
                                                { key: 'file_izin_kerja_berbahaya', label: 'Izin Kerja Berbahaya' },
                                                { key: 'file_permohonan_kimper', label: 'Permohonan Kimper' },
                                                { key: 'file_life_saving_talk', label: 'Life Saving Talk' },
                                                { key: 'file_jsa', label: 'JSA' },
                                                { key: 'file_izin_kerja_umum', label: 'Izin Kerja Umum' },
                                                { key: 'file_izin_panas', label: 'Izin Kerja Panas' },
                                                { key: 'file_izin_ketinggian', label: 'Izin Kerja Ketinggian' },
                                                { key: 'file_izin_perancah', label: 'Izin Kerja Perancah' },
                                                { key: 'file_izin_beban', label: 'Izin Angkat Beban' },
                                                { key: 'file_izin_ruang_terbatas', label: 'Izin Ruang Terbatas' },
                                                { key: 'file_izin_penggalian', label: 'Izin Penggalian' },
                                                { key: 'file_izin_air', label: 'Izin Kerja Dekat Air' },
                                                { key: 'file_izin_material_panas', label: 'Izin Material Panas' }
                                            ].filter(f => p.proyek_vendor[f.key]).map(f => (
                                                <a key={f.key} href={`${import.meta.env.VITE_API_URL}/uploads/${p.proyek_vendor[f.key].split(/[/\\]/).pop()}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-sm transition-all group">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                                            <FileText size={16} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-700 transition-colors">{f.label}</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-orange-400" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                    {p.jenis_kendaraan && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Kendaraan</p>
                                            <p className="font-medium text-gray-800">{
                                                p.jenis_kendaraan.startsWith('[') ? JSON.parse(p.jenis_kendaraan).map(k => k.nama_kendaraan).join(', ') : p.jenis_kendaraan
                                            }</p>
                                        </div>
                                    )}
                                    {p.tanggal_berlaku_sim && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Tanggal Berlaku SIM/SIO</p>
                                            <p className="font-medium text-gray-800">{new Date(p.tanggal_berlaku_sim).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                                        </div>
                                    )}
                                    {p.alasan_justifikasi && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Justifikasi</p>
                                            <p className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3 py-0.5">{p.alasan_justifikasi}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Ujian K3 */}
                            {p.kode_ujian_online && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                                        <GraduationCap size={18} className="text-gray-500" />
                                        <h3 className="font-bold text-gray-800">Ujian K3 Online</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-1">Kode Ujian (Token)</p>
                                            <div className="font-mono font-bold tracking-widest text-lg bg-gray-50 py-2 px-4 rounded-xl border border-gray-200 text-gray-800 inline-block">
                                                {p.kode_ujian_online}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Nilai Ujian</p>
                                            {p.nilai_ujian_online !== null ? (
                                                <div className="flex items-end gap-2">
                                                    <span className={`text-3xl font-black ${p.nilai_ujian_online >= 76 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {p.nilai_ujian_online}
                                                    </span>
                                                    <span className="text-gray-400 font-medium mb-1">/ 100</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm font-medium text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">Belum Mengikuti Ujian</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Hasil Survei Sehat */}
                            {p.surat_sehat && (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center gap-2">
                                        <Activity size={18} className="text-gray-500" />
                                        <h3 className="font-bold text-gray-800">Deklarasi Kesehatan</h3>
                                    </div>
                                    <div className="p-6 space-y-4">
                                        <div className="flex flex-wrap gap-6 pb-4 border-b border-gray-100">
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Tinggi Badan</p>
                                                <p className="font-semibold text-gray-900">{p.surat_sehat.tinggi_badan} <span className="text-gray-400 font-normal">cm</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Berat Badan</p>
                                                <p className="font-semibold text-gray-900">{p.surat_sehat.berat_badan} <span className="text-gray-400 font-normal">kg</span></p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Gol Darah</p>
                                                <p className="font-semibold text-gray-900">{p.surat_sehat.golongan_darah || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Tekanan Darah</p>
                                                <p className="font-semibold text-gray-900">{p.surat_sehat.tekanan_darah || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Denyut Nadi</p>
                                                <p className="font-semibold text-gray-900">{p.surat_sehat.denyut_nadi || '-'} <span className="text-gray-400 font-normal">bpm</span></p>
                                            </div>
                                        </div>
                                        {p.surat_sehat.riwayat_penyakit && (
                                            <div className="pb-4 border-b border-gray-100">
                                                <p className="text-xs text-gray-500 mb-1">Riwayat Penyakit Khusus</p>
                                                <p className="font-medium text-gray-800">{p.surat_sehat.riwayat_penyakit}</p>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Hasil Kuisioner</p>
                                            <div className="space-y-2 text-sm">
                                                {[
                                                    { q: 'Merasa dalam kondisi sehat?', ans: p.surat_sehat.q1_sehat, good: true },
                                                    { q: 'Tidur lebih dari 6 jam?', ans: p.surat_sehat.q2_tidur_cukup, good: true },
                                                    { q: 'Riwayat penyakit jantung?', ans: p.surat_sehat.q3_jantung, good: false },
                                                    { q: 'Riwayat diabetes?', ans: p.surat_sehat.q4_diabetes, good: false },
                                                    { q: 'Riwayat kolesterol?', ans: p.surat_sehat.q5_kolesterol, good: false },
                                                    { q: 'Sedang minum obat kantuk?', ans: p.surat_sehat.q6_obat_kantuk, good: false },
                                                    { q: 'Paham dengan pekerjaan?', ans: p.surat_sehat.q7_paham_pekerjaan, good: true },
                                                    { q: 'Paham dengan risiko kerja?', ans: p.surat_sehat.q8_paham_risiko, good: true },
                                                    { q: 'Sedia menegur rekan kerja?', ans: p.surat_sehat.q9_sedia_menegur, good: true },
                                                    { q: 'Sedia melapor bahaya?', ans: p.surat_sehat.q10_sedia_melapor, good: true },
                                                ].map((item, idx) => (
                                                    <div key={idx} className="flex justify-between items-start gap-3">
                                                        <span className="text-gray-600 leading-tight">{item.q}</span>
                                                        <span className={`flex items-center gap-1 font-semibold shrink-0 ${item.ans === item.good ? 'text-green-600' : 'text-red-500'}`}>
                                                            {item.ans === item.good ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                                                            {item.ans ? 'Ya' : 'Tidak'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-wrap justify-end gap-3 sticky bottom-4 z-10">
                        <button onClick={() => setView('table')} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                            Tutup
                        </button>
                        
                        {/* Revisi button for Pengaju */}
                        {p.status_berkas === 'Ditolak' && Number(p.id_user_pengaju) === Number(id_user) && (
                            <button onClick={() => handleOpenEdit(p.id_pengajuan)} className="px-6 py-2.5 rounded-xl border-2 border-red-500 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2">
                                Revisi Pengajuan
                            </button>
                        )}
                        
                        {/* Approve / Reject buttons based on role and status */}
                        {role !== 'Pemohon_Mandiri' && role !== 'Koordinator_Vendor' && p.status_berkas.includes('Pending') && (
                            <>
                                <button onClick={() => setRejectModal({ isOpen: true, id_pengajuan: p.id_pengajuan, alasan: '' })} className="px-6 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-bold hover:bg-red-50 hover:border-red-300 transition-colors">
                                    Tolak Pengajuan
                                </button>
                                <button onClick={() => setApproveModal({ isOpen: true, id_pengajuan: p.id_pengajuan })} className="px-8 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all transform hover:-translate-y-0.5">
                                    Setujui Pengajuan
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengajuan Permit</h1>
                    <p className="text-sm text-gray-500 mt-1">Ajukan Izin Masuk Tambang untuk pekerja atau visitor.</p>
                </div>
                {view === 'table' ? (
                    (['pemohon_mandiri', 'koordinator_vendor', 'admin'].includes(role?.toLowerCase())) && (
                        <button onClick={handleOpenAdd} className="py-2.5 px-4 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md flex gap-2">
                            <Plus size={18} /> Buat Pengajuan
                        </button>
                    )
                ) : (
                    <button onClick={() => setView('table')} className="py-2 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium flex gap-2">
                        <ArrowLeft size={18} /> Kembali
                    </button>
                )}
            </div>

            {view === 'table' && renderTable()}
            {view === 'wizard' && renderWizard()}
            {view === 'detail' && renderDetail()}

            {/* MODAL APPROVE */}
            {approveModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Setujui Pengajuan</h3>
                        <p className="text-sm text-gray-600 mb-6">Apakah Anda yakin ingin menyetujui pengajuan permit ini?</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setApproveModal({ isOpen: false, id_pengajuan: null })} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleApprove} disabled={loading} className="px-5 py-2.5 rounded-xl bg-[#E11D2E] text-white font-medium hover:bg-[#B0121F] shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Ya, Setujui
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL REJECT */}
            {rejectModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Tolak Pengajuan</h3>
                        <p className="text-sm text-gray-600 mb-4">Silakan masukkan alasan penolakan agar pemohon dapat memperbaikinya.</p>
                        <textarea
                            value={rejectModal.alasan}
                            onChange={(e) => setRejectModal({ ...rejectModal, alasan: e.target.value })}
                            placeholder="Alasan penolakan..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-6 focus:outline-none focus:border-[#E11D2E] focus:ring-1 focus:ring-[#E11D2E] min-h-[100px] resize-none"
                        ></textarea>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setRejectModal({ isOpen: false, id_pengajuan: null, alasan: '' })} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                                Batal
                            </button>
                            <button onClick={handleReject} disabled={loading} className="px-5 py-2.5 rounded-xl bg-gray-900 text-white font-medium hover:bg-gray-800 shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
                                {loading && <Loader2 size={16} className="animate-spin" />}
                                Tolak Pengajuan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL SUCCESS/ERROR GLOBAL */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-6 text-center animate-in zoom-in-95 duration-200">
                        <div className="flex justify-center mb-4">
                            {modal.type === 'success' ? (
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                                    <CheckCircle2 size={32} />
                                </div>
                            ) : (
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500">
                                    <AlertCircle size={32} />
                                </div>
                            )}
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {modal.type === 'success' ? 'Berhasil' : 'Peringatan'}
                        </h3>
                        <p className="text-sm text-gray-600 mb-6">{modal.message}</p>
                        <button onClick={() => setModal({ isOpen: false, type: '', message: '' })} className="w-full px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
