import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FastTrackModal({ isOpen, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nik_atau_ktm: '',
        nama_lengkap: '',
        id_instansi: '',
        kategori_pemohon: 'Internal',
        jenis_izin: 'Baru',
        kategori_akses: 'Hijau (Full Pit Access)'
    });
    
    const [masterInstansi, setMasterInstansi] = useState([]);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : {};

    useEffect(() => {
        if (isOpen) {
            axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`)
                .then(res => setMasterInstansi(res.data.data))
                .catch(err => console.error("Gagal memuat data instansi", err));
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/pengajuan/fast-track`, {
                ...formData,
                id_user_pengaju: user.id_user
            });
            if (res.data.success) {
                toast.success('Permit Fast Track berhasil dibuat!');
                onSuccess();
                onClose();
            } else {
                toast.error(res.data.message || 'Terjadi kesalahan');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal membuat permit fast track');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">Input Data Cepat (Fast Track VIP)</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 transition-colors">
                        <XCircle size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-amber-800 mb-4 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        Data yang dimasukkan akan langsung masuk ke status <b>Siap Cetak</b> tanpa harus mengikuti ujian K3 dan upload dokumen.
                    </p>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">NIK / KTP <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.nik_atau_ktm}
                            onChange={e => setFormData({...formData, nik_atau_ktm: e.target.value})}
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.nama_lengkap}
                            onChange={e => setFormData({...formData, nama_lengkap: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perusahaan / Instansi</label>
                        <select 
                            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                            value={formData.id_instansi}
                            onChange={e => setFormData({...formData, id_instansi: e.target.value})}
                        >
                            <option value="">-- Pilih Instansi --</option>
                            {masterInstansi?.map(inst => (
                                <option key={inst.id_instansi} value={inst.id_instansi}>{inst.nama_instansi}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Pemohon <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.kategori_pemohon}
                                onChange={e => setFormData({...formData, kategori_pemohon: e.target.value})}
                            >
                                <option value="Internal">Internal</option>
                                <option value="Kontraktor">Kontraktor</option>
                                <option value="Visitor">Visitor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori Akses <span className="text-red-500">*</span></label>
                            <select 
                                required
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                                value={formData.kategori_akses}
                                onChange={e => setFormData({...formData, kategori_akses: e.target.value})}
                            >
                                <option value="Hijau (Full Pit Access)">Hijau (Full Pit)</option>
                                <option value="Biru (In Pit Access)">Biru (In Pit)</option>
                                <option value="Orange">Orange</option>
                                <option value="Merah (Pit Worker)">Merah (Pit Worker)</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                        >
                            Batal
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors flex items-center"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                            Simpan & Siap Cetak
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
