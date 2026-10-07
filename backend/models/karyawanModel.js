const db = require('../config/db');

const getAllKaryawan = async () => {
    const query = `
        SELECT k.*, m.nama_instansi, m.kategori_instansi 
        FROM karyawan k
        LEFT JOIN master_instansi m ON k.id_instansi = m.id_instansi
        ORDER BY k.id_karyawan DESC
    `;
    const [rows] = await db.query(query);
    return rows;
};

const insertKaryawan = async (data) => {
    const query = `
        INSERT INTO karyawan 
        (nik_atau_ktm, nama_lengkap, id_instansi, status_pekerja, jabatan_atau_jurusan, no_sim, foto_wajah) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
        data.nik_atau_ktm, 
        data.nama_lengkap, 
        data.id_instansi || null, 
        data.status_pekerja, 
        data.jabatan_atau_jurusan, 
        data.no_sim || null, 
        data.foto_wajah || null
    ];
    const [result] = await db.query(query, values);
    return result.insertId;
};

module.exports = { getAllKaryawan, insertKaryawan };