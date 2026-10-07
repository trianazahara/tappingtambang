import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoSemenPadang from '../assets/LOGO-PT-SEMEN-PADANG.png';

// Pastikan font berikut sudah dimuat di index.html atau lewat useEffect di bawah:
// Poppins (display) & Inter (body/UI)

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password,
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data));
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || 'Koneksi ke server gagal. Coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const displayFont = { fontFamily: "'Poppins', ui-sans-serif, system-ui" };
  const bodyFont = { fontFamily: "'Inter', ui-sans-serif, system-ui" };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white" style={bodyFont}>
      {/* Panel kiri — identitas sistem, dengan gradasi */}
      <div
        className="relative overflow-hidden lg:w-[44%] flex flex-col justify-between px-8 py-10 lg:px-14 lg:py-14 text-white"
        style={{ background: 'linear-gradient(150deg, #E11D2E 0%, #B0121F 55%, #7A0C16 100%)' }}
      >
        {/* Dekorasi gradasi lingkaran blur */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 inline-flex items-center bg-white rounded-2xl px-4 py-3 w-fit shadow-lg shadow-black/10">
          <img
            src={logoSemenPadang}
            alt="Logo PT Semen Padang"
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="relative z-10 mt-12 lg:mt-0">
          <h1
            className="text-4xl lg:text-[2.75rem] leading-[1.15] font-semibold"
            style={displayFont}
          >
            Sistem Tapping
            <br />
            Tambang
          </h1>
          <p className="mt-4 text-sm text-white/80 max-w-[30ch]">
            Pemantauan proses tapping tambang secara real-time untuk mendukung
            keputusan operasional yang cepat dan akurat.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-sm text-white/80">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          Sistem aktif
        </div>
      </div>

      {/* Panel kanan — form login */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-[#1F2328]" style={displayFont}>
            Masuk ke akun Anda
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            Gunakan kredensial operator yang terdaftar.
          </p>

          {errorMsg && (
            <div className="mt-6 rounded-xl border border-[#F4C2C7] bg-[#FDF1F2] px-4 py-3">
              <p className="text-sm text-[#9B1C2C]">{errorMsg}</p>
            </div>
          )}

          <form className="mt-8 space-y-5" onSubmit={handleLogin} noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="block w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[#1F2328] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:border-[#E11D2E] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[#374151]">
                  Kata sandi
                </label>
                <a href="/forgot-password" className="text-sm font-medium text-[#E11D2E] hover:underline">
                  Lupa Password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="block w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[#1F2328] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:border-[#E11D2E] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-medium text-white shadow-md shadow-red-900/20 hover:shadow-lg hover:shadow-red-900/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #E11D2E 0%, #A80D26 100%)' }}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="pt-4 text-center border-t border-gray-100 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Belum punya akun pemohon mandiri?</p>
                <a href="/register" className="inline-flex justify-center w-full py-2.5 rounded-xl text-sm font-medium text-[#E11D2E] border border-[#E11D2E]/30 bg-white hover:bg-red-50 transition-colors">
                  Daftar Akun Baru (Visitor/Internal/Magang)
                </a>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-2">Pekerja Tambang yang akan ujian?</p>
                <a href="/ujian/login" className="inline-flex justify-center w-full py-2.5 rounded-xl text-sm font-medium text-[#E11D2E] border border-[#E11D2E]/30 bg-red-50 hover:bg-red-100 transition-colors">
                  Masuk ke Ruang Ujian Online
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}