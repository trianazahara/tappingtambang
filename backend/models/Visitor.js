const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const Visitor = db.define('visitor', {
    id_visitor: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomor_kartu: {
        type: DataTypes.STRING,
        allowNull: false
    },
    uid_kartu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    nama: {
        type: DataTypes.STRING,
        allowNull: false
    },
    no_telp: {
        type: DataTypes.STRING
    },
    perusahaan: {
        type: DataTypes.STRING
    },
    warna_permit: {
        type: DataTypes.ENUM('Merah', 'Orange', 'Biru', 'Hijau'),
        allowNull: false
    },
    area_akses: {
        type: DataTypes.JSON
    },
    type_unit: {
        type: DataTypes.STRING
    },
    nomor_license: {
        type: DataTypes.STRING
    },
    issued_at: {
        type: DataTypes.STRING
    },
    status: {
        type: DataTypes.ENUM('Aktif', 'Selesai'),
        defaultValue: 'Aktif'
    },
    tanggal_masuk: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    berlaku_hingga: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tanggal_selesai: {
        type: DataTypes.DATE
    },
    file_ktp: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    file_surat_pengantar: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    file_safety_induksi: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    setuju_aturan_k3: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    assessment_kesehatan: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'visitor',
    timestamps: false
});

module.exports = Visitor;
