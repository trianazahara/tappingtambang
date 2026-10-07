import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Save, CheckSquare, AlertCircle } from 'lucide-react';

export default function PermitData() {
  const [nikSearch, setNikSearch] = useState('');
  const [statusPengajuan, setStatusPengajuan] = useState(null); // 'Baru' atau 'Perpanjangan'
  const [karyawanData, setKaryawanData] = useState(null);
  const [masterAreas, setMasterAreas] = useState([]);
  
  // State untuk form permit
  const [berkas, setBerkas] = useState({
    ktp: false, mcu: false, bpjs: false, surat_pengantar: false
  });
  const [selectedAreas, setSelectedAreas] = useState([]);

  // Menarik data master area dari database saat halaman dibuka
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/area`);
        if (response.data.success) {
          setMasterAreas(response.data.data);
        }
      } catch (error) {
        console.error("Gagal menarik data area:", error);
      }
    };
    fetchAreas();
  }, []);

  // Fungsi mengecek NIK ke database
  const handleCheckNik = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/permit/check-nik/${nikSearch}`);
      if (response.data.isExisting) {
        setKaryawanData(response.data.data);
        setStatusPengajuan('Perpanjangan');
      } else {
        setKaryawanData(null);
        setStatusPengajuan('Baru');
      }
    } catch (error) {
      alert("Gagal mengecek NIK");
    }
  };

  const handleAreaToggle = (id_area) => {
    setSelectedAreas(prev => 
      prev.includes(id_area) ? prev.filter(id => id !== id_area) : [...prev, id_area]
    );
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 mb-6">Form Pengajuan Permit</h2>

      {/* Bagian 1: Pengecekan NIK */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-200">
        <form onSubmit={handleCheckNik} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cek NIK / KTM</label>
            <input 
              type="text" 
              value={nikSearch}
              onChange={(e) => setNikSearch(e.target.value)}
              placeholder="Masukkan NIK untuk mengecek status..." 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
          <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <Search size={18} /> Cek Data
          </button>
        </form>
      </div>

      {/* Bagian 2: Form Utama (Hanya muncul jika statusPengajuan sudah ada) */}
      {statusPengajuan && (
        <div className="space-y-8 animate-fade-in">
          <div className={`p-4 rounded-lg flex gap-3 border ${statusPengajuan === 'Baru' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
            <AlertCircle size={24} />
            <div>
              <p className="font-bold">Status Pengajuan: {statusPengajuan}</p>
              <p className="text-sm">
                {statusPengajuan === 'Baru' 
                  ? 'NIK belum terdaftar. Silakan lengkapi data diri dan area akses.' 
                  : `Data ditemukan a/n ${karyawanData?.nama_lengkap}. Silakan pilih perpanjangan area.`}
              </p>
            </div>
          </div>

          {/* Kelengkapan Berkas */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Kelengkapan Berkas</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(berkas).map((key) => (
                <label key={key} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={berkas[key]} 
                    onChange={(e) => setBerkas({...berkas, [key]: e.target.checked})}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500" 
                  />
                  <span className="text-sm font-medium uppercase">{key.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pemilihan Area dari Database */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">Pilih Area Akses</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {masterAreas.map((area) => (
                <label key={area.id_area} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedAreas.includes(area.id_area) ? 'bg-red-50 border-red-200' : 'hover:bg-gray-50'}`}>
                  <input 
                    type="checkbox" 
                    checked={selectedAreas.includes(area.id_area)}
                    onChange={() => handleAreaToggle(area.id_area)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500" 
                  />
                  <span className="text-sm font-medium text-gray-700">{area.nama_area}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold flex items-center gap-2">
              <Save size={20} /> Simpan Pengajuan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}