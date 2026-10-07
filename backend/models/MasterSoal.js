const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const MasterSoal = db.define('master_soal', {
    id_soal: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    pertanyaan: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    pilihan_a: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    pilihan_b: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    pilihan_c: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    pilihan_d: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    kunci_jawaban: {
        type: DataTypes.ENUM('A', 'B', 'C', 'D'),
        allowNull: false
    },
    status_soal: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        defaultValue: 'Aktif'
    },
    id_kendaraan: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    file_gambar: {
        type: DataTypes.STRING(255),
        allowNull: true
    }
}, {
    tableName: 'master_soal',
    timestamps: false
});

module.exports = MasterSoal;
