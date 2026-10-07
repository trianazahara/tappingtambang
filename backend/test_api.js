const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function run() {
    try {
        const form = new FormData();
        form.append('kategori_pemohon', 'Internal');
        form.append('nik_atau_ktm', '987654321');
        form.append('nama_lengkap', 'Test 3');
        form.append('id_user_pengaju', '1');
        form.append('id_proyek', 'null');
        form.append('is_draft', 'true');
        form.append('kategori_akses', 'Merah (Pit Worker)');
        form.append('jenis_kendaraan', '[]');
        form.append('area_ids', '[]');
        form.append('tanggal_mulai', '');
        form.append('tanggal_selesai', '');
        form.append('tinggi_badan', '');
        form.append('berat_badan', '');
        form.append('jenis_kelamin', 'L');
        
        // Simpan sementara step 1 simulation
        const res = await axios.post('http://localhost:3000/api/pengajuan', form, {
            headers: form.getHeaders()
        });
        console.log("SUCCESS:", res.data);
    } catch (err) {
        console.log("ERROR:", err.response?.data);
        if (fs.existsSync('last_error.log')) {
            console.log("LAST ERROR LOG:");
            console.log(fs.readFileSync('last_error.log', 'utf8'));
        }
    }
}
run();
