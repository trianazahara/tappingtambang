const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const MasterKendaraan = db.define('master_kendaraan', {
    id_kendaraan: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nama_kendaraan: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    kategori_kendaraan: {
        type: DataTypes.ENUM('Roda 4', 'Roda 6', '> Roda 6', 'Alat Berat'),
        allowNull: false
    },
    warna_permit: {
        type: DataTypes.ENUM('Hijau', 'Biru', 'Orange'),
        allowNull: false
    },
    syarat_dokumen: {
        type: DataTypes.ENUM('SIM A', 'SIM B1', 'SIM B2', 'SIO', 'Tidak Ada'),
        defaultValue: 'Tidak Ada'
    },
    type_unit: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    tableName: 'master_kendaraan',
    timestamps: false
});

module.exports = MasterKendaraan;
