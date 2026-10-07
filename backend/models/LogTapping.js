const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const LogTapping = db.define('log_tapping', {
    id_log: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    uid_kartu: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    waktu_scan: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    },
    jenis_aktivitas: {
        type: DataTypes.ENUM('Masuk', 'Keluar'),
        allowNull: false
    },
    status_akses: {
        type: DataTypes.ENUM('Diizinkan', 'Ditolak'),
        allowNull: false
    },
    keterangan_sistem: {
        type: DataTypes.STRING(255)
    }
}, {
    tableName: 'log_tapping',
    timestamps: false
});

module.exports = LogTapping;
