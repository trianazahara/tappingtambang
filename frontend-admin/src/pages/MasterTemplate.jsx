import { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function MasterTemplate() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const kategoriList = ['magang', 'merah', 'orange', 'hijau', 'biru'];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/template/list`);
            if (res.data.success) {
                setTemplates(res.data.data);
            }
        } catch (error) {
            console.error("Gagal menarik daftar template:", error);
        }
    };

    const handleUpload = async (e, kategori) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.name.endsWith('.docx')) {
            setMessage('File harus berekstensi .docx!');
            return;
        }

        const formData = new FormData();
        formData.append('template', file);

        setLoading(true);
        setMessage('');
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/template/upload/${kategori}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                setMessage(`Berhasil mengunggah template ${kategori}!`);
                fetchTemplates();
            } else {
                setMessage(`Gagal: ${res.data.message}`);
            }
        } catch (error) {
            setMessage('Terjadi kesalahan saat mengunggah.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Master Template Permit</h2>
            <p className="text-gray-500 mb-6">Kelola file template Word (.docx) yang akan digunakan saat mencetak permit/ID Card.</p>
            
            {message && (
                <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${message.includes('Gagal') || message.includes('kesalahan') || message.includes('harus') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message.includes('Berhasil') ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium">{message}</span>
                </div>
            )}

            <div className="space-y-4">
                {kategoriList.map(kategori => {
                    const isUploaded = templates.includes(kategori);
                    return (
                        <div key={kategori} className="flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors bg-gray-50">
                            <div className="flex items-center gap-4 w-full md:w-1/2 mb-4 md:mb-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isUploaded ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400'}`}>
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 capitalize">Template {kategori}</h3>
                                    <p className="text-sm text-gray-500">
                                        {isUploaded ? '✅ Sudah terunggah (Aktif)' : '⚠️ Belum ada template (Wajib diunggah)'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="w-full md:w-auto">
                                <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-colors justify-center md:justify-start">
                                    <Upload size={18} />
                                    <span>{isUploaded ? 'Ganti File .docx' : 'Unggah File .docx'}</span>
                                    <input 
                                        type="file" 
                                        accept=".docx" 
                                        className="hidden" 
                                        onChange={(e) => handleUpload(e, kategori)}
                                        disabled={loading}
                                    />
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-8 bg-blue-50 p-5 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><AlertCircle size={18}/> Panduan Template</h4>
                <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                    <li>Pastikan file berformat <strong>.docx</strong> (Bukan .doc atau PDF).</li>
                    <li>Gunakan penanda dengan kurung kurawal ganda di dalam file Word untuk data otomatis.</li>
                    <li>Variabel yang tersedia: <strong>&#123;&#123;nama_lengkap&#125;&#125;</strong>, <strong>&#123;&#123;nik&#125;&#125;</strong>, <strong>&#123;&#123;departemen&#125;&#125;</strong>, <strong>&#123;&#123;perusahaan&#125;&#125;</strong>, <strong>&#123;&#123;jabatan&#125;&#125;</strong>, <strong>&#123;&#123;kategori_akses&#125;&#125;</strong>, <strong>&#123;&#123;tanggal_mulai&#125;&#125;</strong>, <strong>&#123;&#123;tanggal_selesai&#125;&#125;</strong></li>
                </ul>
            </div>
        </div>
    );
}
