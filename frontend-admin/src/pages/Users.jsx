import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserPlus, Shield, Loader2, AlertCircle, Users as UsersIcon, Edit, Power, PowerOff, ArrowLeft, Search, Filter } from 'lucide-react';

export default function Users() {
    const [view, setView] = useState('table');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Semua');
    const [roleFilter, setRoleFilter] = useState('Semua');

    // Form State
    const [editId, setEditId] = useState(null);
    const [namaLengkap, setNamaLengkap] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // password is optional on edit
    const [role, setRole] = useState('');
    const [statusAkun, setStatusAkun] = useState('Aktif');
    const [jenisVendor, setJenisVendor] = useState('');
    const [masaBerlakuKontrak, setMasaBerlakuKontrak] = useState('');
    const [idInstansi, setIdInstansi] = useState('');
    const [instansiLainnya, setInstansiLainnya] = useState('');
    const [instansiList, setInstansiList] = useState([]);
    
    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const roleOptions = ['Admin', 'Satpam', 'Pemohon_Mandiri', 'Koordinator_Vendor', 'Kasie_Pemohon', 'Kasie_HSE', 'KTT'];

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`);
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error(err);
            setError('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'table') {
            fetchUsers();
            setError('');
            setSuccess('');
        }
    }, [view]);

    useEffect(() => {
        const fetchInstansi = async () => {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/instansi`);
                if (res.data.success) {
                    setInstansiList(res.data.data.filter(i => i.status_instansi === 'Aktif'));
                }
            } catch (err) {
                console.error("Gagal memuat instansi", err);
            }
        };
        fetchInstansi();
    }, []);

    const handleOpenAdd = () => {
        setEditId(null);
        setNamaLengkap('');
        setEmail('');
        setPassword('');
        setRole('');
        setStatusAkun('Aktif');
        setJenisVendor('');
        setMasaBerlakuKontrak('');
        setIdInstansi('');
        setInstansiLainnya('');
        setView('form');
    };

    const handleOpenEdit = (user) => {
        setEditId(user.id_user);
        setNamaLengkap(user.nama_lengkap);
        setEmail(user.email);
        setPassword(''); 
        setRole(user.role);
        setStatusAkun(user.status_akun);
        setJenisVendor(user.jenis_vendor || '');
        setMasaBerlakuKontrak(user.masa_berlaku_kontrak || '');
        setIdInstansi(user.id_instansi || '');
        setInstansiLainnya('');
        setView('form');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitLoading(true);

        try {
            let finalIdInstansi = idInstansi;
            
            if (idInstansi === 'lainnya') {
                const resInstansi = await axios.post(`${import.meta.env.VITE_API_URL}/api/instansi`, {
                    nama_instansi: instansiLainnya,
                    kategori_instansi: 'Vendor'
                });
                if (resInstansi.data.success) {
                    finalIdInstansi = resInstansi.data.data.id_instansi;
                } else {
                    setError("Gagal menambahkan instansi baru");
                    setSubmitLoading(false);
                    return;
                }
            }

            const extraPayload = {};
            if (role === 'Koordinator_Vendor') {
                if (jenisVendor) extraPayload.jenis_vendor = jenisVendor;
                if (jenisVendor === 'Kontrak' && masaBerlakuKontrak) extraPayload.masa_berlaku_kontrak = masaBerlakuKontrak;
            }
            if (finalIdInstansi && finalIdInstansi !== 'lainnya') {
                extraPayload.id_instansi = finalIdInstansi;
            } else if (!finalIdInstansi) {
                extraPayload.id_instansi = null;
            }

            if (editId) {
                const payload = { nama_lengkap: namaLengkap, role, status_akun: statusAkun, ...extraPayload };
                if (password) payload.password = password;

                const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${editId}`, payload);
                if (res.data.success) setSuccess('User berhasil diupdate!');
            } else {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/users`, { 
                    nama_lengkap: namaLengkap,
                    email,
                    password,
                    role,
                    status_akun: statusAkun,
                    ...extraPayload
                });
                if (res.data.success) setSuccess('User berhasil ditambahkan!');
            }

            setTimeout(() => setView('table'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menyimpan user');
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleToggleStatus = async (id, currentStatus) => {
        if (!window.confirm(`Yakin ingin ${currentStatus === 'Aktif' ? 'menonaktifkan' : 'mengaktifkan'} user ini?`)) return;
        
        try {
            const res = await axios.put(`${import.meta.env.VITE_API_URL}/api/users/${id}/status`);
            if (res.data.success) fetchUsers();
        } catch (err) {
            alert('Gagal mengubah status user');
        }
    };

    // Filter Logic
    const filteredUsers = users.filter(user => {
        const matchSearch = user.nama_lengkap.toLowerCase().includes(searchTerm.toLowerCase()) || user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = statusFilter === 'Semua' || user.status_akun === statusFilter;
        const matchRole = roleFilter === 'Semua' || user.role === roleFilter;
        return matchSearch && matchStatus && matchRole;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Pengguna</h1>
                    <p className="text-sm text-gray-500 mt-1">Kelola akun pengguna sistem permit PT Semen Padang.</p>
                </div>
                {view === 'table' ? (
                    <button
                        onClick={handleOpenAdd}
                        className="py-2.5 px-4 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md shadow-[#E11D2E]/20 flex justify-center items-center gap-2"
                    >
                        <UserPlus size={18} />
                        Tambah User
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
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 bg-gray-50/30">
                        <div className="relative flex-1">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama atau email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none text-sm"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 md:w-auto w-full">
                            <div className="relative w-full sm:w-48">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <UsersIcon size={18} />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white text-sm appearance-none"
                                >
                                    <option value="Semua">Semua Role</option>
                                    {roleOptions.map(opt => (
                                        <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative w-full sm:w-40">
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
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Loader2 size={32} className="animate-spin text-[#E11D2E] mb-2" />
                            <p className="text-sm">Memuat data user...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-100 text-sm text-gray-500 font-medium">
                                        <th className="px-6 py-4">Nama Lengkap</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-10 text-center text-gray-400">
                                                {users.length === 0 ? 'Belum ada data user.' : 'Tidak ada data yang cocok dengan pencarian/filter.'}
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => (
                                            <tr key={user.id_user} className={`hover:bg-gray-50/50 transition-colors ${user.status_akun === 'Nonaktif' ? 'opacity-60' : ''}`}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{user.nama_lengkap}</td>
                                                <td className="px-6 py-4">{user.email}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 font-medium text-xs">
                                                        {user.role.replace('_', ' ')}
                                                    </span>
                                                    {user.role === 'Koordinator_Vendor' && user.jenis_vendor && (
                                                        <span className="ml-2 inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium text-xs">
                                                            {user.jenis_vendor}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-medium text-xs ${user.status_akun === 'Aktif' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                        {user.status_akun}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button onClick={() => handleOpenEdit(user)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit size={16} />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(user.id_user, user.status_akun)} className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title={user.status_akun === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}>
                                                        {user.status_akun === 'Aktif' ? <PowerOff size={16} /> : <Power size={16} />}
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                        <div className="h-12 w-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                            {editId ? <Edit size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">{editId ? 'Edit User' : 'Registrasi User Baru'}</h2>
                            <p className="text-xs text-gray-500">Pastikan role dan status akun diatur dengan benar.</p>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm flex items-start gap-3">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-xl text-sm font-medium flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Shield size={16} className="text-green-600" />
                            </div>
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={namaLengkap}
                                    onChange={(e) => setNamaLengkap(e.target.value)}
                                    placeholder="Contoh: Budi Santoso"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!!editId} // Disable editing email
                                    placeholder="budi@contoh.com"
                                    className={`w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none ${editId ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Password {editId && <span className="text-xs text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none"
                                    required={!editId}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Role Pengguna</label>
                                <div className="relative">
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white appearance-none pr-10"
                                        required
                                    >
                                        <option value="" disabled>Pilih Role...</option>
                                        {roleOptions.map(opt => (
                                            <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500">
                                        <UsersIcon size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Status Akun</label>
                                <select
                                    value={statusAkun}
                                    onChange={(e) => setStatusAkun(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white"
                                >
                                    <option value="Aktif">Aktif</option>
                                    <option value="Nonaktif">Nonaktif</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700">Instansi / Perusahaan</label>
                                <select
                                    value={idInstansi}
                                    onChange={(e) => setIdInstansi(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white"
                                >
                                    <option value="">Tidak ada / Internal</option>
                                    {instansiList.map(inst => (
                                        <option key={inst.id_instansi} value={inst.id_instansi}>{inst.nama_instansi}</option>
                                    ))}
                                    <option value="lainnya">Lainnya (Ketik Sendiri)</option>
                                </select>
                                {idInstansi === 'lainnya' && (
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            value={instansiLainnya}
                                            onChange={(e) => setInstansiLainnya(e.target.value)}
                                            placeholder="Ketik nama instansi baru..."
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {role === 'Koordinator_Vendor' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-gray-100">
                                <div className="space-y-1.5">
                                    <label className="block text-sm font-medium text-gray-700">Jenis Vendor</label>
                                    <select
                                        value={jenisVendor}
                                        onChange={(e) => setJenisVendor(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none bg-white"
                                        required
                                    >
                                        <option value="" disabled>Pilih Jenis Vendor...</option>
                                        <option value="SPK">SPK</option>
                                        <option value="Kontrak">Kontrak</option>
                                    </select>
                                </div>
                                
                                {jenisVendor === 'Kontrak' && (
                                    <div className="space-y-1.5">
                                        <label className="block text-sm font-medium text-gray-700">Masa Berlaku Kontrak</label>
                                        <input
                                            type="date"
                                            value={masaBerlakuKontrak}
                                            onChange={(e) => setMasaBerlakuKontrak(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#E11D2E] focus:ring focus:ring-[#E11D2E]/20 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={submitLoading}
                                className="py-2.5 px-8 bg-[#E11D2E] hover:bg-[#B0121F] text-white rounded-xl font-medium transition-all shadow-md shadow-[#E11D2E]/20 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                            >
                                {submitLoading ? <Loader2 size={18} className="animate-spin" /> : 'Simpan User'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
