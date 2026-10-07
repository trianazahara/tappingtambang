import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logoSemenPadang from '../assets/LOGO-PT-SEMEN-PADANG.png';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Input Email, 2: Input Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
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

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
        email
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setStep(2);
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || 'Gagal meminta kode reset. Coba lagi.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        email,
        code,
        newPassword
      });

      if (response.data.success) {
        setSuccessMsg(response.data.message);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || 'Gagal reset password. Coba lagi.'
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
            Pemantauan proses tapping tambang secara real-time untuk mendukung keputusan operasional yang cepat dan akurat.
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

      {/* Panel kanan — form forgot password */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-xl font-semibold text-[#1F2328]" style={displayFont}>
            Lupa Password
          </h2>
          <p className="mt-1 text-sm text-[#6B7280]">
            {step === 1 ? 'Masukkan email yang terdaftar untuk menerima kode OTP.' : 'Masukkan kode OTP dan kata sandi baru Anda.'}
          </p>

          {errorMsg && (
            <div className="mt-6 rounded-xl border border-[#F4C2C7] bg-[#FDF1F2] px-4 py-3">
              <p className="text-sm text-[#9B1C2C]">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <p className="text-sm text-green-800">{successMsg}</p>
            </div>
          )}

          {step === 1 ? (
            <form className="mt-8 space-y-5" onSubmit={handleRequestCode} noValidate>
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-medium text-white shadow-md shadow-red-900/20 hover:shadow-lg hover:shadow-red-900/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #E11D2E 0%, #A80D26 100%)' }}
              >
                {isLoading ? 'Memproses...' : 'Kirim Kode OTP'}
              </button>

              <div className="pt-4 text-center">
                <a href="/login" className="text-sm text-[#E11D2E] font-medium hover:underline">
                  Kembali ke Login
                </a>
              </div>
            </form>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleResetPassword} noValidate>
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-[#374151] mb-1.5">
                  Kode OTP
                </label>
                <input
                  id="code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Masukkan 6 digit kode"
                  className="block w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[#1F2328] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:border-[#E11D2E] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-[#374151] mb-1.5">
                  Kata Sandi Baru
                </label>
                <input
                  id="newPassword"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="block w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-3 text-[#1F2328] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#E11D2E]/30 focus:border-[#E11D2E] transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-medium text-white shadow-md shadow-red-900/20 hover:shadow-lg hover:shadow-red-900/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#E11D2E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #E11D2E 0%, #A80D26 100%)' }}
              >
                {isLoading ? 'Memproses...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
