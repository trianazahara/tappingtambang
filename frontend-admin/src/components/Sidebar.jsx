import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, CreditCard, History, ChevronDown, ChevronRight, Database, Scan, Clock } from 'lucide-react';
import logoSemenPadang from '../assets/LOGO-PT-SEMEN-PADANG.png';

// Pastikan font berikut sudah dimuat secara global (idealnya di index.html):
// Poppins (display) & Inter (body/UI)

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : {};
  const role = user.role || 'Admin';

  const [masterOpen, setMasterOpen] = useState(false);

  const mainMenuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={19} />, roles: ['Admin', 'Satpam', 'Pemohon_Mandiri', 'Koordinator_Vendor', 'Kasie_Pemohon', 'Kasie_HSE', 'KTT'] },
    { name: 'Proyek / Kontrak', path: '/dashboard/proyek', icon: <FileText size={19} />, roles: ['Koordinator_Vendor'] },
    { name: 'Pengajuan Permit', path: '/dashboard/permit', icon: <FileText size={19} />, roles: ['Admin', 'Satpam', 'Pemohon_Mandiri', 'Kasie_Pemohon', 'Kasie_HSE', 'KTT'] },
    { name: 'Kartu Akses', path: '/dashboard/kartu', icon: <CreditCard size={19} />, roles: ['Admin', 'Satpam'] },
    { name: 'Permit Visitor', path: '/dashboard/visitor', icon: <Users size={19} />, roles: ['Admin'] },
    { name: 'Scan Tapping', path: '/dashboard/scan', icon: <Scan size={19} />, roles: ['Satpam'] },
    { name: 'Log Tapping', path: '/dashboard/log', icon: <History size={19} />, roles: ['Admin', 'Satpam'] },
    { name: 'Monitoring Dokumen', path: '/dashboard/monitoring', icon: <Clock size={19} />, roles: ['Admin'] },
  ];

  const masterDataItems = [
    { name: 'Manajemen User', path: '/dashboard/users', icon: <Users size={19} />, roles: ['Admin'] },
    { name: 'Data Instansi', path: '/dashboard/instansi', icon: <Users size={19} />, roles: ['Admin'] },
    { name: 'Master Area', path: '/dashboard/area', icon: <FileText size={19} />, roles: ['Admin'] },
    { name: 'Master Kendaraan', path: '/dashboard/kendaraan', icon: <FileText size={19} />, roles: ['Admin'] },
    { name: 'Master Template', path: '/dashboard/template-permit', icon: <FileText size={19} />, roles: ['Admin'] },
    { name: 'Bank Soal (K3)', path: '/dashboard/bank-soal', icon: <FileText size={19} />, roles: ['Admin'] },
  ];

  // Filter menu based on user role
  const visibleMainMenu = mainMenuItems.filter(item => item.roles.includes(role));
  const visibleMasterData = masterDataItems.filter(item => item.roles.includes(role));

  const displayFont = { fontFamily: "'Poppins', ui-sans-serif, system-ui" };
  const bodyFont = { fontFamily: "'Inter', ui-sans-serif, system-ui" };

  // Check if any master data child is active
  const isMasterActive = visibleMasterData.some(item => location.pathname === item.path);

  return (
    <div
      className="relative overflow-hidden w-64 shrink-0 text-white flex flex-col h-full overflow-y-auto"
      style={{ background: 'linear-gradient(165deg, #E11D2E 0%, #B0121F 55%, #7A0C16 100%)', ...bodyFont }}
    >
      {/* dekorasi gradasi */}
      <div className="pointer-events-none absolute -top-16 -right-14 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-24 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

      {/* Brand */}
      <div className="relative z-10 px-6 py-6 border-b border-white/15">
        <div className="inline-flex items-center bg-white rounded-xl px-3 py-2 shadow-md shadow-black/10">
          <img src={logoSemenPadang} alt="Logo PT Semen Padang" className="h-7 w-auto object-contain" />
        </div>
        <p className="mt-3 text-base font-semibold" style={displayFont}>
          Sistem Permit
        </p>
        <p className="text-xs text-white/70">PT Semen Padang</p>
      </div>

      {/* Navigasi */}
      <nav className="relative z-10 flex-1 px-4 py-6 space-y-1.5">
        {visibleMainMenu.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => onClose && onClose()}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-white text-[#B0121F] font-semibold shadow-md shadow-black/10'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}

        {visibleMasterData.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setMasterOpen(!masterOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                isMasterActive
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Database size={19} />
                <span>Master Data</span>
              </div>
              {masterOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>

            {masterOpen && (
              <div className="mt-1 space-y-1 pl-4 animate-in slide-in-from-top-2 fade-in duration-200">
                {visibleMasterData.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => onClose && onClose()}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all ${
                        isActive
                          ? 'bg-white text-[#B0121F] font-semibold shadow-md shadow-black/10'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Status */}
      <div className="relative z-10 px-6 py-5 border-t border-white/15 flex items-center gap-2 text-xs text-white/70 mt-auto">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
        Sistem aktif
      </div>
    </div>
  );
}