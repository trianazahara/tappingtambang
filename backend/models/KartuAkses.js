const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const KartuAkses = db.define('kartu_akses', {
    id_kartu: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_karyawan: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    uid_kartu: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    nomor_permit: {
        type: DataTypes.STRING(100),
        unique: true
    },
    jenis_teknologi: {
        type: DataTypes.ENUM('NFC', 'Barcode'),
        allowNull: false
    },
    warna_kartu: {
        type: DataTypes.ENUM('Merah', 'Orange', 'Biru', 'Hijau'),
        allowNull: false
    },
    status_kartu: {
        type: DataTypes.ENUM('Aktif', 'Expired', 'Hilang/Blokir'),
        defaultValue: 'Aktif'
    },
    tanggal_cetak: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    berlaku_hingga: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    nomor_license: {
        type: DataTypes.STRING(100)
    },
    type_unit: {
        type: DataTypes.STRING(100)
    },
    jenis_permit: {
        type: DataTypes.ENUM('Full', 'R')
    },
    issued_at: {
        type: DataTypes.DATEONLY
    }
}, {
    tableName: 'kartu_akses',
    timestamps: false
});

module.exports = KartuAkses;
