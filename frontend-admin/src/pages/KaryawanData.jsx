import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit, Trash2, X } from 'lucide-react';

export default function KaryawanData() {
  const [karyawan, setKaryawan] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk Modal dan Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nik_atau_ktm: '',
    nama_lengkap: '',
    id_instansi: 1, // Default sementara (bisa dikembangkan dinamis dari API Instansi)
    status_pekerja: 'Karyawan Tetap',
    jabatan_atau_jurusan: ''
  });

  // Fungsi untuk mengambil data karyawan
  const fetchKaryawan = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/karyawan`);
      if (response.data.success) {
        setKaryawan(response.data.data);
      }
    } catch (error) {
      console.error("Gagal menarik data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKaryawan();
  }, []);

  // Fungsi menangani perubahan input form
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Fungsi menyimpan data baru
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/karyawan`, formData);
      if (response.data.success) {
        setIsModalOpen(false); // Tutup modal
        fetchKaryawan(); // Refresh tabel otomatis
        setFormData({ // Reset isian form
          nik_atau_ktm: '', 
          nama_lengkap: '', 
          id_instansi: 1, 
          status_pekerja: 'Karyawan Tetap', 
          jabatan_atau_jurusan: ''
        });
      }
    } catch (error) {
      alert("Gagal menyimpan data! Cek koneksi server.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative">
      
      {/* Header & Fitur Pencarian */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-xl font-bold text-gray-800">Data Pekerja & Mahasiswa</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Cari nama atau NIK..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={18} />
            Tambah Data
          </button>
        </div>
      </div>

      {/* Tabel Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm text-gray-600">
              <th className="p-4 font-semibold">NIK / KTM</th>
              <th className="p-4 font-semibold">Nama Lengkap</th>
              <th className="p-4 font-semibold">Instansi</th>
              <th className="p-4 font-semibold">Status Pekerja</th>
              <th className="p-4 font-semibold">Jabatan</th>
              <th className="p-4 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-500">Memuat data...</td>
              </tr>
            ) : karyawan.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-8 text-gray-500">Belum ada data karyawan.</td>
              </tr>
            ) : (
              karyawan.map((item) => (
                <tr key={item.id_karyawan} className="border-b border-gray-100 hover:bg-gray-50 transition-colors text-sm">
                  <td className="p-4 font-medium text-gray-800">{item.nik_atau_ktm}</td>
                  <td className="p-4">{item.nama_lengkap}</td>
                  <td className="p-4">{item.nama_instansi || 'Internal'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status_pekerja === 'Karyawan Tetap' ? 'bg-blue-100 text-blue-700' :
                      item.status_pekerja === 'Outsourcing' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.status_pekerja}
                    </span>
                  </td>
                  <td className="p-4">{item.jabatan_atau_jurusan}</td>
                  <td className="p-4 flex justify-center gap-2">
                    <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                      <Edit size={16} />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Data */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Tambah Data Pekerja</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIK / KTM</label>
                <input type="text" name="nik_atau_ktm" required value={formData.nik_atau_ktm} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" name="nama_lengkap" required value={formData.nama_lengkap} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status Pekerja</label>
                <select name="status_pekerja" value={formData.status_pekerja} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500">
                  <option value="Karyawan Tetap">Karyawan Tetap</option>
                  <option value="Outsourcing">Outsourcing</option>
                  <option value="Magang/Penelitian">Magang/Penelitian</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jabatan / Jurusan</label>
                <input type="text" name="jabatan_atau_jurusan" required value={formData.jabatan_atau_jurusan} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg focus:ring-red-500 focus:border-red-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}