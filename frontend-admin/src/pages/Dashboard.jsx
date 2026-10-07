import { useEffect, useState } from 'react';
import { Users, FileClock, Activity, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);

    const fetchStats = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        setUser(storedUser);
        
        if (storedUser) {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard`, {
            params: { role: storedUser.role, id_user: storedUser.id_user }
          });
          setStats(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    return () => document.head.removeChild(link);
  }, []);

  const displayFont = { fontFamily: "'Poppins', ui-sans-serif, system-ui" };
  const bodyFont = { fontFamily: "'Inter', ui-sans-serif, system-ui" };

  if (loading || !user || !stats) {
    return <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center font-medium text-gray-500">Memuat Dashboard...</div>;
  }

  const role = user.role;
  const isPemohon = role === 'Pemohon_Mandiri' || role === 'Koordinator_Vendor';

  // Sesuaikan Card dengan Role
  let summaryCards = [];
  
  if (isPemohon) {
    summaryCards = [
      {
        label: 'Total Pengajuan Saya',
        value: stats.permitSaya,
        icon: FileText,
        accent: 'text-[#0ea5e9]',
        badgeBg: 'bg-[#e0f2fe]',
        note: 'Semua permit yang diajukan'
      },
      {
        label: 'Permit Disetujui',
        value: stats.permitDisetujui,
        icon: CheckCircle2,
        accent: 'text-[#16a34a]',
        badgeBg: 'bg-[#dcfce3]',
        valueClass: 'text-[#16a34a]',
      },
      {
        label: 'Permit Menunggu Verifikasi',
        value: stats.permitMenunggu, // dari stats global atau bisa difilter
        icon: FileClock,
        accent: 'text-[#f59e0b]',
        badgeBg: 'bg-[#fef3c7]',
      }
    ];
  } else {
    summaryCards = [
      {
        label: 'Total Karyawan Aktif',
        value: stats.totalKaryawan,
        icon: Users,
        accent: 'text-[#E11D2E]',
        badgeBg: 'bg-[#FDECEE]',
        note: 'Terdaftar di database'
      },
      {
        label: 'Permit Menunggu Verifikasi',
        value: stats.permitMenunggu,
        icon: FileClock,
        accent: 'text-[#E11D2E]',
        badgeBg: 'bg-[#FDECEE]',
        valueClass: 'text-[#E11D2E]',
        note: 'Perlu ditinjau segera'
      },
      {
        label: 'Tapping Hari Ini',
        value: stats.tappingHariIni,
        icon: Activity,
        accent: 'text-[#E11D2E]',
        badgeBg: 'bg-[#FDECEE]',
        note: `Masuk: ${stats.tappingMasukHariIni} | Keluar: ${stats.tappingKeluarHariIni}`
      }
    ];
    
    if (stats.peringatan24Jam > 0) {
      summaryCards.push({
        label: 'Warning: Belum Keluar > 24 Jam',
        value: stats.peringatan24Jam,
        icon: ShieldCheck,
        accent: 'text-white',
        badgeBg: 'bg-red-600',
        valueClass: 'text-red-600',
        note: 'Pekerja/Visitor belum tap keluar'
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] px-6 py-8 lg:px-10" style={bodyFont}>
      
      {/* Header Dashboard */}
      <div className="mb-10 bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-60"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-[#1F2328] tracking-tight" style={displayFont}>
            Selamat datang, {user.nama_lengkap}! 👋
          </h1>
          <p className="mt-2 text-[#6B7280] font-medium flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#E11D2E]" />
            Anda masuk sebagai <span className="text-[#1F2328] font-bold">{role.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="relative z-10 bg-gray-50 px-5 py-3 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-semibold text-gray-700">Sistem Online & Real-time</span>
        </div>
      </div>

      {/* Cards */}
      <div className={`grid grid-cols-1 ${summaryCards.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-6 mb-10`}>
        {summaryCards.map(({ label, value, icon: Icon, badgeBg, accent, valueClass, note }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-3xl border border-[#EFEFEF] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-900/5"
          >
            <div
              className="absolute inset-x-0 top-0 h-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'linear-gradient(90deg, #E11D2E 0%, #7A0C16 100%)' }}
            />
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#6B7280] mb-2">{label}</h3>
                <p className={`text-4xl font-bold tracking-tight ${valueClass || 'text-[#1F2328]'}`} style={displayFont}>
                  {value}
                </p>
              </div>
              <span className={`flex h-14 w-14 items-center justify-center rounded-2xl ${badgeBg} transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <Icon className={`h-7 w-7 ${accent}`} strokeWidth={2.5} />
              </span>
            </div>
            {note && <p className="mt-4 text-xs font-medium text-[#9CA3AF] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span> {note}
            </p>}
          </div>
        ))}
      </div>

      {/* List Peringatan 24 Jam */}
      {!isPemohon && stats.peringatan24JamList && stats.peringatan24JamList.length > 0 && (
          <div className="bg-red-50 p-6 rounded-3xl shadow-sm border border-red-100 mb-10">
              <div className="mb-4 flex items-center gap-2 text-red-700">
                  <ShieldCheck size={24} />
                  <h2 className="text-xl font-bold" style={displayFont}>Daftar Pekerja/Visitor Belum Tap Keluar {'>'} 24 Jam</h2>
              </div>
              <div className="bg-white rounded-2xl overflow-hidden border border-red-100">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-red-50 text-red-700">
                          <tr>
                              <th className="px-6 py-4 font-semibold">Nama / UID Kartu</th>
                              <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
                              <th className="px-6 py-4 font-semibold">Durasi</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {stats.peringatan24JamList.map((item, idx) => {
                              const masuk = new Date(item.waktu_scan);
                              const now = new Date();
                              const diffMs = now - masuk;
                              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                              
                              return (
                                  <tr key={idx} className="hover:bg-red-50/50 transition-colors">
                                      <td className="px-6 py-4 font-medium text-gray-800">{item.nama}</td>
                                      <td className="px-6 py-4 text-gray-600">{masuk.toLocaleString('id-ID')}</td>
                                      <td className="px-6 py-4 font-bold text-red-600">{diffHrs} Jam {diffMins} Menit</td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* Visualisasi Data (Chart) - Hanya untuk Admin/Satpam dll */}
      {!isPemohon && stats.tappingChartData && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-800" style={displayFont}>Aktivitas Tapping (7 Hari Terakhir)</h2>
                    <p className="text-sm text-gray-500 mt-1">Tren jumlah akses masuk dan keluar area tambang</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#16a34a]"></div>
                        <span className="text-xs font-semibold text-gray-600">Diizinkan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#dc2626]"></div>
                        <span className="text-xs font-semibold text-gray-600">Ditolak</span>
                    </div>
                </div>
            </div>
            
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.tappingChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorDiizinkan" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorDitolak" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'}}
                            itemStyle={{fontWeight: 'bold'}}
                        />
                        <Area type="monotone" dataKey="Diizinkan" stroke="#16a34a" strokeWidth={3} fillOpacity={1} fill="url(#colorDiizinkan)" />
                        <Area type="monotone" dataKey="Ditolak" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorDitolak)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}

      {/* Shortcut atau Informasi Tambahan untuk Pemohon */}
      {isPemohon && (
          <div className="bg-gradient-to-br from-[#E11D2E] to-[#A80D26] rounded-3xl p-8 text-white shadow-lg shadow-red-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full opacity-5 -mr-20 -mt-20"></div>
              <h2 className="text-2xl font-bold mb-2" style={displayFont}>Butuh Bantuan Pengajuan?</h2>
              <p className="text-red-100 max-w-lg mb-6">Pastikan semua dokumen persyaratan seperti SIM, SIO, dan Surat Keterangan Sehat masih berlaku sebelum mengajukan permit baru.</p>
              <button onClick={() => window.location.href='/dashboard/permit'} className="bg-white text-[#E11D2E] px-6 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm">
                  Lihat Pengajuan Saya
              </button>
          </div>
      )}
    </div>
  );
}