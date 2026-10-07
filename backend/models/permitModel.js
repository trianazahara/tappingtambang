const db = require('../config/db');

const checkKaryawanByNik = async (nik) => {
    const [rows] = await db.query('SELECT * FROM karyawan WHERE nik_atau_ktm = ?', [nik]);
    return rows[0]; // Mengembalikan data jika ada, undefined jika tidak
};

// Fungsi insert dengan Transaction agar jika satu tabel gagal, semua dibatalkan
const insertPengajuan = async (dataPengajuan, arrayIdArea) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        
        // 1. Insert ke tabel pengajuan_permit
        const queryPermit = `INSERT INTO pengajuan_permit (id_karyawan, jenis_pengajuan, cek_surat_pengantar, cek_ktp, cek_mcu, cek_bpjs, kategori_warna_area, tanggal_pengajuan) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`;
        const valuesPermit = [dataPengajuan.id_karyawan, dataPengajuan.jenis_pengajuan, dataPengajuan.cek_surat_pengantar, dataPengajuan.cek_ktp, dataPengajuan.cek_mcu, dataPengajuan.cek_bpjs, dataPengajuan.kategori_warna_area];
        const [resultPermit] = await connection.query(queryPermit, valuesPermit);
        const idPengajuan = resultPermit.insertId;

        // 2. Insert ke tabel izin_area (Many-to-Many)
        if (arrayIdArea && arrayIdArea.length > 0) {
            const queryArea = `INSERT INTO izin_area (id_pengajuan, id_area) VALUES ?`;
            const valuesArea = arrayIdArea.map(id_area => [idPengajuan, id_area]);
            await connection.query(queryArea, [valuesArea]);
        }

        await connection.commit();
        return idPengajuan;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

module.exports = { checkKaryawanByNik, insertPengajuan };