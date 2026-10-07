import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogOut, User, Bell, Search, Menu, FileText, CreditCard, AlertTriangle } from 'lucide-react';
import axios from 'axios';

// Pastikan font berikut sudah dimuat secara global (idealnya di index.html):
// Poppins (display) & Inter (body/UI)

export default function Header({ onMenuClick }) {
  const navigate = useNavigate();
  // Mengambil data user dari Local Storage yang disimpan saat login
  const userData = JSON.parse(localStorage.getItem('user')) || {};
  const displayName = userData.nama_lengkap || 'Admin';
  const initial = displayName.trim().charAt(0).toUpperCase();

  const [showNotif, setShowNotif] = useState(false);
  const [notifData, setNotifData] = useState({ permitMenunggu: 0, kartuMenunggu: 0, peringatan24Jam: 0 });
  const notifRef = useRef(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  useEffect(() => {
    const fetchNotif = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard?role=${userData.role}&id_user=${userData.id_user}`);
        if (res.data.success) {
          setNotifData({
            permitMenunggu: res.data.data.permitMenunggu || 0,
            kartuMenunggu: res.data.data.kartuMenunggu || 0,
            peringatan24Jam: res.data.data.peringatan24Jam || 0,
          });
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    
    fetchNotif();
    const interval = setInterval(fetchNotif, 30000);
    return () => clearInterval(interval);
  }, [userData.role, userData.id_user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const displayFont = { fontFamily: "'Poppins', ui-sans-serif, system-ui" };
  const bodyFont = { fontFamily: "'Inter', ui-sans-serif, system-ui" };

  const totalNotif = notifData.permitMenunggu + notifData.kartuMenunggu + notifData.peringatan24Jam;

  return (
    <header
      className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 h-20 flex items-center justify-between px-4 lg:px-8 shadow-sm"
      style={bodyFont}
    >
      <div className="flex items-center lg:hidden">
        <button onClick={onMenuClick} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
          <Menu size={24} />
        </button>
      </div>

      <div className="flex items-center gap-3 lg:gap-5 ml-auto">
        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotif(!showNotif)} 
            className="relative p-2.5 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          >
              <Bell size={20} />
              {totalNotif > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white shadow-sm">{totalNotif}</span>
              )}
          </button>
          
          {showNotif && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <span className="font-semibold text-gray-800">Notifikasi</span>
                {totalNotif > 0 && (
                    <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-semibold">{totalNotif} Baru</span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {totalNotif === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
                    <Bell size={32} className="text-gray-300 mb-2" />
                    <p className="text-sm">Tidak ada notifikasi baru</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {notifData.permitMenunggu > 0 && (
                      <Link to="/dashboard/permit" onClick={() => setShowNotif(false)} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group">
                        <div className="p-2.5 bg-blue-50 group-hover:bg-blue-100 text-blue-600 rounded-xl transition-colors"><FileText size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">Permit Menunggu</p>
                          <p className="text-xs text-gray-500 leading-relaxed">Ada <span className="font-semibold text-gray-700">{notifData.permitMenunggu}</span> pengajuan permit yang menunggu untuk direview.</p>
                        </div>
                      </Link>
                    )}
                    {notifData.kartuMenunggu > 0 && (
                      <Link to="/dashboard/kartu" onClick={() => setShowNotif(false)} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group">
                        <div className="p-2.5 bg-purple-50 group-hover:bg-purple-100 text-purple-600 rounded-xl transition-colors"><CreditCard size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">Kartu Akses Siap Cetak</p>
                          <p className="text-xs text-gray-500 leading-relaxed">Ada <span className="font-semibold text-gray-700">{notifData.kartuMenunggu}</span> kartu akses yang menunggu untuk dicetak.</p>
                        </div>
                      </Link>
                    )}
                    {notifData.peringatan24Jam > 0 && (
                      <Link to="/dashboard" onClick={() => setShowNotif(false)} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors group">
                        <div className="p-2.5 bg-red-50 group-hover:bg-red-100 text-red-600 rounded-xl transition-colors"><AlertTriangle size={18} /></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800 mb-0.5">Peringatan 24 Jam</p>
                          <p className="text-xs text-gray-500 leading-relaxed">Terdapat <span className="font-semibold text-red-600">{notifData.peringatan24Jam}</span> pekerja di area tambang lebih dari 24 jam.</p>
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200 mx-1"></div>

        {/* User Profile Chip */}
        <Link to="/dashboard/profile" className="flex items-center gap-3 bg-white border border-gray-100 rounded-full pl-2 pr-5 py-1.5 hover:shadow-md hover:border-gray-200 transition-all duration-300">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full text-white text-sm font-bold shadow-sm shadow-red-500/20"
            style={{ background: 'linear-gradient(135deg, #E11D2E 0%, #A80D26 100%)' }}
          >
            {initial || <User size={16} />}
          </span>
          <div className="flex flex-col">
              <span className="text-sm font-bold text-gray-700 leading-tight">{displayName}</span>
              <span className="text-[10px] text-gray-500 font-medium">{userData.role ? userData.role.replace('_', ' ') : 'Administrator'}</span>
          </div>
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors ml-1"
          title="Keluar"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}