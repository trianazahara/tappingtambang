const db = require('../config/db');

const createPengajuan = async (data) => {
    // Gunakan connection khusus untuk Transaksi
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Cek apakah Karyawan sudah ada berdasarkan NIK/KTM
        let id_karyawan;
        const [existingKaryawan] = await connection.query(
            'SELECT id_karyawan FROM karyawan WHERE nik_atau_ktm = ?',
            [data.nik_atau_ktm]
        );

        if (existingKaryawan.length > 0) {
            id_karyawan = existingKaryawan[0].id_karyawan; // Gunakan profil lama
        } else {
            // Insert profil baru jika NIK belum terdaftar
            const [newKaryawan] = await connection.query(
                `INSERT INTO karyawan (nik_atau_ktm, nama_lengkap, id_instansi, status_pekerja, jabatan_atau_jurusan) 
                 VALUES (?, ?, ?, ?, ?)`,
                [data.nik_atau_ktm, data.nama_lengkap, data.id_instansi || null, data.status_pekerja, data.jabatan_atau_jurusan]
            );
            id_karyawan = newKaryawan.insertId;
        }

        // 2. Insert Data Pengajuan Permit
        const [pengajuanResult] = await connection.query(
            `INSERT INTO pengajuan (id_karyawan, status_pengajuan, dokumen_surat_sehat) 
             VALUES (?, 'Menunggu', ?)`,
            [id_karyawan, data.dokumen_surat_sehat || '']
        );
        const id_pengajuan = pengajuanResult.insertId;

        // 3. Insert ke Tabel Izin Area (jika ada area yang diceklis)
        // data.area_ids adalah array berisi angka ID area, contoh: [1, 3, 4]
        if (data.area_ids && data.area_ids.length > 0) {
            const areaValues = data.area_ids.map(id_area => [id_pengajuan, id_area]);
            await connection.query(
                'INSERT INTO izin_area (id_pengajuan, id_area) VALUES ?',
                [areaValues] // Format multi-insert di MySQL2
            );
        }

        await connection.commit(); // Simpan permanen semua perubahan
        return id_pengajuan;
    } catch (error) {
        await connection.rollback(); // Batalkan semua jika ada yang error
        throw error;
    } finally {
        connection.release(); // Kembalikan koneksi ke pool
    }
};

// Fungsi untuk menampilkan riwayat pengajuan di tabel frontend
const getAllPengajuan = async () => {
    const query = `
        SELECT p.id_pengajuan, p.status_pengajuan, p.tanggal_pengajuan, 
               k.nik_atau_ktm, k.nama_lengkap, i.nama_instansi
        FROM pengajuan p
        JOIN karyawan k ON p.id_karyawan = k.id_karyawan
        LEFT JOIN master_instansi i ON k.id_instansi = i.id_instansi
        ORDER BY p.tanggal_pengajuan DESC
    `;
    const [rows] = await db.query(query);
    return rows;
};

module.exports = { createPengajuan, getAllPengajuan };