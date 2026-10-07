import { useState, useEffect } from 'react';
import axios from 'axios';
import { History, Search, ArrowLeftRight, CheckCircle2, XCircle } from 'lucide-react';

const LogTapping = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAktivitas, setFilterAktivitas] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tapping`);
      setLogs(res.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const nama = log.kartu_akse?.karyawan?.nama_lengkap?.toLowerCase() || '';
    const uid = log.uid_kartu?.toLowerCase() || '';
    const matchSearch = nama.includes(search.toLowerCase()) || uid.includes(search.toLowerCase());
    const matchAktivitas = filterAktivitas ? log.jenis_aktivitas === filterAktivitas : true;
    return matchSearch && matchAktivitas;
  });

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/\./g, ':');
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50/50">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <History className="text-red-600" />
            Riwayat Log Tapping
          </h1>
          <p className="text-gray-500 text-sm mt-1">Data historis akses masuk dan keluar area tambang</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Cari nama atau UID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <select
              value={filterAktivitas}
              onChange={(e) => setFilterAktivitas(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-white"
            >
              <option value="">Semua Aktivitas</option>
              <option value="Masuk">Masuk</option>
              <option value="Keluar">Keluar</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/80 sticky top-0 shadow-sm z-10 text-gray-700">
              <tr>
                <th className="py-4 px-6 font-semibold whitespace-nowrap">Waktu Scan</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap">Pegawai / Tamu</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap">ID Kartu / QR</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap text-center">Aktivitas</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap">Petugas</th>
                <th className="py-4 px-6 font-semibold whitespace-nowrap">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p>Memuat riwayat tapping...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id_log} className="hover:bg-red-50/30 transition-colors group">
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="font-medium text-gray-800">{formatDate(log.waktu_scan).split(',')[0]}</div>
                      <div className="text-xs text-gray-500">{formatDate(log.waktu_scan).split(',')[1]}</div>
                    </td>
                    <td className="py-4 px-6">
                      {log.kartu_akse?.karyawan ? (
                        <div className="flex items-center gap-3">
                          {log.kartu_akse.karyawan.foto_3x4 ? (
                            <img 
                              src={`${import.meta.env.VITE_API_URL}/${log.kartu_akse.karyawan.foto_3x4}`} 
                              alt="Profil" 
                              className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border border-gray-100"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0 ${log.kartu_akse.karyawan.foto_3x4 ? 'hidden' : ''}`}>
                            {log.kartu_akse.karyawan.nama_lengkap.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 line-clamp-1">{log.kartu_akse.karyawan.nama_lengkap}</div>
                            <div className="text-xs text-gray-500 line-clamp-1">{log.kartu_akse.karyawan.perusahaan || log.kartu_akse.karyawan.unit_kerja || '-'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                            ?
                          </div>
                          <span className="text-gray-400 italic font-medium">Tidak terdaftar</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                        <div className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 max-w-[150px] sm:max-w-[200px] truncate" title={log.uid_kartu}>
                            {log.uid_kartu}
                        </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                        log.jenis_aktivitas === 'Masuk' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-orange-50 text-orange-700 border border-orange-100'
                      }`}>
                        <ArrowLeftRight size={14} className={log.jenis_aktivitas === 'Masuk' ? 'rotate-90' : '-rotate-90'} />
                        {log.jenis_aktivitas}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                        log.status_akses === 'Diizinkan' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
                      }`}>
                        {log.status_akses === 'Diizinkan' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                        {log.status_akses}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap text-gray-700 font-medium">
                        {log.user?.nama_lengkap || 'Unknown'}
                    </td>
                    <td className="py-4 px-6">
                        <div className="text-xs text-gray-500 max-w-[200px] line-clamp-2" title={log.keterangan_sistem}>
                            {log.keterangan_sistem}
                        </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <History size={48} className="mb-4 opacity-50" />
                      <p className="text-lg font-medium text-gray-500">Tidak ada data log tapping</p>
                      <p className="text-sm">Silakan coba kata kunci pencarian yang lain.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogTapping;
