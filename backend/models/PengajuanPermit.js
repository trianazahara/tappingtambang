const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const PengajuanPermit = db.define('pengajuan_permit', {
    id_pengajuan: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_karyawan: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_user_pengaju: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_proyek: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    kategori_pemohon: {
        type: DataTypes.ENUM('Internal', 'Magang', 'Visitor', 'Kontraktor'),
        allowNull: false
    },
    jenis_izin: {
        type: DataTypes.ENUM('Baru', 'Perpanjangan', 'Pengaktifan Kembali', 'Penonaktifan')
    },
    jenis_permintaan: {
        type: DataTypes.ENUM('Permanent', 'Sementara')
    },
    tanggal_mulai: {
        type: DataTypes.DATEONLY
    },
    tanggal_selesai: {
        type: DataTypes.DATEONLY
    },
    kategori_akses: {
        type: DataTypes.ENUM('Merah (Pit Worker)', 'Orange', 'Biru (In Pit Access)', 'Hijau (Full Pit Access)')
    },
    jenis_kendaraan: {
        type: DataTypes.TEXT
    },
    file_bpjs: {
        type: DataTypes.STRING(255)
    },
    file_foto: {
        type: DataTypes.STRING(255)
    },
    file_data_diri: {
        type: DataTypes.STRING(255)
    },
    file_mcu: {
        type: DataTypes.STRING(255)
    },
    file_kontrak_kerja: {
        type: DataTypes.STRING(255)
    },
    file_surat_penunjukan: {
        type: DataTypes.STRING(255)
    },
    file_surat_pengantar: {
        type: DataTypes.STRING(255)
    },
    file_prosedur: {
        type: DataTypes.STRING(255)
    },
    file_izin_kerja_berbahaya: {
        type: DataTypes.STRING(255)
    },
    file_serah_terima_apd: {
        type: DataTypes.STRING(255)
    },
    file_permohonan_kimper: {
        type: DataTypes.STRING(255)
    },
    file_sertifikat_sio_sim: {
        type: DataTypes.STRING(255)
    },
    file_sim_a: { type: DataTypes.STRING(255) },
    file_sim_b1: { type: DataTypes.STRING(255) },
    file_sim_b2: { type: DataTypes.STRING(255) },
    file_sio: { type: DataTypes.STRING(255) },
    file_hasil_assessment: {
        type: DataTypes.STRING(255)
    },
    file_safety_induksi: {
        type: DataTypes.STRING(255)
    },
    setuju_aturan_k3: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    kode_ujian_online: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    status_ujian_online: {
        type: DataTypes.ENUM('Belum', 'Sedang Mengerjakan', 'Selesai'),
        defaultValue: 'Belum'
    },
    nilai_ujian_online: {
        type: DataTypes.INTEGER
    },
    nilai_ujian_tulis: {
        type: DataTypes.INTEGER
    },
    status_berkas: {
        type: DataTypes.ENUM('Draft', 'Pending_Admin', 'Pending_Kasie_Pemohon', 'Pending_HSE', 'Pending_KTT', 'Lulus_Berkas', 'Menunggu_Ujian', 'Siap_Cetak', 'Aktif', 'Ditolak'),
        defaultValue: 'Draft'
    },
    alasan_justifikasi: {
        type: DataTypes.STRING(255)
    },
    tanggal_berlaku_sim: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    tanggal_berlaku_sio: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    tanggal_pengajuan: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    tableName: 'pengajuan_permit',
    timestamps: false
});

module.exports = PengajuanPermit;
