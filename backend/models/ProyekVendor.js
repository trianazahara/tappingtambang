const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');
const User = require('./User');
const MasterArea = require('./MasterArea');

const ProyekVendor = db.define('proyek_vendor', {
    id_proyek: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_user_vendor: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    nama_proyek: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tanggal_mulai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    tanggal_selesai: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    jenis_proyek: {
        type: DataTypes.ENUM('Baru', 'Perpanjangan'),
        defaultValue: 'Baru'
    },
    // File dokumen bersama
    file_kontrak_kerja: { type: DataTypes.STRING },
    file_surat_penunjukan: { type: DataTypes.STRING },
    file_prosedur: { type: DataTypes.STRING },
    file_izin_kerja_berbahaya: { type: DataTypes.STRING },
    file_permohonan_kimper: { type: DataTypes.STRING },
    file_life_saving_talk: { type: DataTypes.STRING },
    file_jsa: { type: DataTypes.STRING },
    file_izin_kerja_umum: { type: DataTypes.STRING },
    file_izin_panas: { type: DataTypes.STRING },
    file_izin_ketinggian: { type: DataTypes.STRING },
    file_izin_perancah: { type: DataTypes.STRING },
    file_izin_beban: { type: DataTypes.STRING },
    file_izin_ruang_terbatas: { type: DataTypes.STRING },
    file_izin_penggalian: { type: DataTypes.STRING },
    file_izin_air: { type: DataTypes.STRING },
    file_izin_material_panas: { type: DataTypes.STRING },
    
    status_proyek: {
        type: DataTypes.ENUM('Aktif', 'Selesai'),
        defaultValue: 'Aktif'
    }
}, {
    tableName: 'proyek_vendor',
    timestamps: true
});

module.exports = ProyekVendor;
