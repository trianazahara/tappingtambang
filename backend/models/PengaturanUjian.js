const { DataTypes } = require('sequelize');
const db = require('../config/db');

const PengaturanUjian = db.define('pengaturan_ujian', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    jumlah_soal: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        allowNull: false
    },
    gunakan_waktu: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    durasi_menit: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        allowNull: false
    },
    passing_grade: {
        type: DataTypes.INTEGER,
        defaultValue: 76,
        allowNull: false
    }
}, {
    tableName: 'pengaturan_ujian',
    timestamps: false
});

module.exports = PengaturanUjian;
