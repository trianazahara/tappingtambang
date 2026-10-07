import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Scan, User as UserIcon, CheckCircle, XCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';

const ScanTapping = () => {
  const [uid, setUid] = useState('');
  const [status, setStatus] = useState(null); // 'idle', 'success', 'error'
  const [scanResult, setScanResult] = useState(null);
  const inputRef = useRef(null);

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : {};

  // Auto focus input to capture barcode/NFC scanner input
  useEffect(() => {
    inputRef.current?.focus();
    const interval = setInterval(() => {
      inputRef.current?.focus();
    }, 2000); // keep focusing in case it loses focus

    // Web NFC Support (Untuk HP Android)
    if ('NDEFReader' in window) {
      const ndef = new window.NDEFReader();
      ndef.scan().then(() => {
        ndef.addEventListener("reading", ({ serialNumber }) => {
          if (serialNumber) {
            setUid(serialNumber); // akan memicu useEffect auto-submit
          }
        });
      }).catch(err => console.log("Web NFC Error:", err));
    }

    return () => clearInterval(interval);
  }, []);

  // Auto-submit (Debounce) jika alat scanner USB tidak mengirim tombol "Enter"
  useEffect(() => {
    if (uid.trim().length > 3) {
      const timer = setTimeout(() => {
        handleScan({ preventDefault: () => {} });
      }, 500); // Tunggu 500ms setelah karakter terakhir diketik
      return () => clearTimeout(timer);
    }
  }, [uid]);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!uid.trim()) return;

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/tapping`, {
        uid_kartu: uid.trim(),
        id_user: currentUser.id
      });
      
      setScanResult(res.data);
      setStatus('success');
      toast.success(res.data.message);
    } catch (error) {
      if (error.response?.data) {
        setScanResult(error.response.data);
        setStatus('error');
        toast.error(error.response.data.message);
      } else {
        setStatus('error');
        setScanResult({ message: 'Terjadi kesalahan sistem', color: 'red' });
        toast.error('Gagal terhubung ke server');
      }
    } finally {
      setUid(''); // Reset for next scan
      // Return to idle after 8 seconds
      setTimeout(() => {
        setStatus('idle');
        setScanResult(null);
      }, 8000);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col items-center justify-center bg-gray-50/50">
      
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden text-center p-8 relative">
        <div className="mb-6 flex justify-center">
          <div className="h-20 w-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
            <Scan size={40} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Sistem Tapping Akses</h1>
        <p className="text-gray-500 mb-8">Silahkan tempelkan Kartu Akses / Scan Barcode pada scanner</p>

        {/* Hidden form for scanner input */}
        <form onSubmit={handleScan} className="mb-6">
          <input
            ref={inputRef}
            type="text"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="w-full text-center border-b-2 border-gray-300 focus:border-red-500 outline-none pb-2 text-lg text-gray-800 font-mono tracking-widest opacity-0 h-0"
            placeholder="Menunggu scan..."
            autoFocus
            autoComplete="off"
          />
          <div className="h-12 flex items-center justify-center text-sm font-medium text-gray-400 bg-gray-50 rounded-lg animate-pulse border border-gray-200">
            Menunggu input scanner...
          </div>
        </form>

        {/* Scan Result Alert */}
        {status === 'success' && scanResult && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <CheckCircle className="text-green-500 mb-4" size={72} />
            <h3 className="text-3xl font-bold text-green-700 mb-2">{scanResult.message}</h3>
            
            <div className="mt-6 w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-green-200 overflow-hidden text-left relative">
              <div className={`h-4 w-full ${
                  scanResult.data?.kategori_akses === 'Merah' ? 'bg-red-600' :
                  scanResult.data?.kategori_akses === 'Hijau' ? 'bg-green-600' :
                  scanResult.data?.kategori_akses === 'Biru' ? 'bg-blue-600' : 'bg-orange-500'
                }`}></div>
              <div className="p-8 flex flex-col items-center">
                {scanResult.data?.foto ? (
                  <img src={scanResult.data.foto} alt="Foto Profil" className="w-40 h-52 object-cover rounded-lg shadow-md mb-6 border-4 border-gray-100" />
                ) : (
                  <div className="w-40 h-52 bg-gray-100 rounded-lg shadow-md mb-6 flex items-center justify-center border-4 border-gray-200">
                    <UserIcon size={64} className="text-gray-400" />
                  </div>
                )}
                <h4 className="text-2xl font-bold text-gray-900 text-center uppercase leading-tight mb-2">{scanResult.data?.nama_lengkap || 'Unknown'}</h4>
                <p className="text-lg font-semibold text-gray-500 mb-6">{scanResult.data?.nik || '-'}</p>
                
                <div className="w-full text-base space-y-4 border-t border-gray-100 pt-6">
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Perusahaan</span>
                    <span className="font-bold text-gray-800 text-right">{scanResult.data?.perusahaan || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Departemen</span>
                    <span className="font-semibold text-gray-800 text-right">{scanResult.data?.departemen || '-'}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-50 pb-2">
                    <span className="text-gray-500">Jabatan</span>
                    <span className="font-semibold text-gray-800 text-right">{scanResult.data?.jabatan || '-'}</span>
                  </div>
                  <div className="flex justify-between pb-2">
                    <span className="text-gray-500">UID Kartu</span>
                    <span className="font-mono font-bold text-gray-800 text-right">{scanResult.data?.uid_kartu || '-'}</span>
                  </div>
                </div>

                <div className="w-full mt-6 pt-4 border-t-2 border-gray-100 flex justify-between items-center">
                  <span className="text-gray-500 font-bold text-lg">ZONA AKSES</span>
                  <span className={`px-4 py-2 rounded-lg font-bold text-lg uppercase tracking-wider ${
                    scanResult.data?.kategori_akses === 'Merah' ? 'bg-red-100 text-red-700 border-2 border-red-200' :
                    scanResult.data?.kategori_akses === 'Hijau' ? 'bg-green-100 text-green-700 border-2 border-green-200' :
                    scanResult.data?.kategori_akses === 'Biru' ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' : 'bg-orange-100 text-orange-700 border-2 border-orange-200'
                  }`}>{scanResult.data?.kategori_akses || '-'}</span>
                </div>
              </div>
            </div>
            
            <button onClick={() => { setStatus('idle'); setScanResult(null); }} className="mt-8 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors">
              Tutup (atau tunggu 8 detik)
            </button>
          </div>
        )}

        {status === 'error' && scanResult && (
          <div className="absolute inset-0 bg-white z-50 flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-300">
            <XCircle className="text-red-500 mb-4" size={72} />
            <h3 className="text-3xl font-bold text-red-700 mb-2">Akses Ditolak</h3>
            <p className="text-xl text-red-600/90 mb-8 font-medium">{scanResult.message}</p>
            
            {scanResult.data ? (
              <div className="w-full max-w-lg bg-red-50 rounded-2xl shadow-xl border-2 border-red-200 overflow-hidden text-left relative opacity-90">
                <div className="p-6 flex gap-6 items-center">
                  {scanResult.data.foto ? (
                    <img src={scanResult.data.foto} alt="Foto Profil" className="w-24 h-32 object-cover rounded-lg shadow-md border-2 border-red-200 grayscale" />
                  ) : (
                    <div className="w-24 h-32 bg-gray-200 rounded-lg shadow-md flex items-center justify-center border-2 border-gray-300">
                      <UserIcon size={40} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 uppercase leading-tight mb-2">{scanResult.data.nama_lengkap}</h4>
                    <p className="text-base font-semibold text-gray-600 mb-1">NIK: {scanResult.data.nik}</p>
                    <p className="text-base text-gray-700 mb-3">{scanResult.data.perusahaan}</p>
                    <div className="inline-block bg-white px-3 py-1 rounded border border-gray-200 text-sm font-mono font-semibold text-gray-700">
                      UID: {scanResult.data.uid_kartu || scanResult.uid_kartu || '-'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-md bg-gray-50 rounded-xl p-6 border-2 border-gray-200 text-center">
                <p className="text-gray-600 mb-2">UID Kartu / Barcode yang discan:</p>
                <p className="text-2xl font-mono font-bold text-gray-800 bg-white py-3 rounded-lg border border-gray-300 shadow-inner">
                  {scanResult.uid_kartu || '-'}
                </p>
                <p className="text-sm text-gray-500 mt-4">Pastikan kartu sudah didaftarkan di sistem.</p>
              </div>
            )}
            
            <button onClick={() => { setStatus('idle'); setScanResult(null); }} className="mt-8 px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold transition-colors">
              Tutup (atau tunggu 8 detik)
            </button>
          </div>
        )}

        {status === 'idle' && (
          <div className="flex items-center gap-2 text-xs text-gray-400 justify-center mt-6">
            <Info size={14} />
            <span>Pastikan kursor selalu aktif di halaman ini saat melakukan scan.</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default ScanTapping;
