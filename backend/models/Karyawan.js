const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const Karyawan = db.define('karyawan', {
    id_karyawan: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_instansi: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nik_atau_ktm: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    jenis_kelamin: {
        type: DataTypes.ENUM('L', 'P')
    },
    tempat_lahir: {
        type: DataTypes.STRING(100)
    },
    tanggal_lahir: {
        type: DataTypes.DATEONLY
    },
    agama: {
        type: DataTypes.STRING(50)
    },
    golongan_darah: {
        type: DataTypes.STRING(10)
    },
    alamat_rumah: {
        type: DataTypes.TEXT
    },
    email: {
        type: DataTypes.STRING(100)
    },
    no_hp: {
        type: DataTypes.STRING(20)
    },
    jabatan: {
        type: DataTypes.STRING(100)
    },
    unit_kerja: {
        type: DataTypes.STRING(100)
    },
    riwayat_pendidikan: {
        type: DataTypes.STRING(255)
    },
    sertifikasi_keahlian: {
        type: DataTypes.STRING(255)
    },
    foto_3x4: {
        type: DataTypes.STRING(255)
    },
    file_sim_a: {
        type: DataTypes.STRING(255)
    },
    pendidikan_khusus: {
        type: DataTypes.STRING(255)
    }
}, {
    tableName: 'karyawan',
    timestamps: false
});

module.exports = Karyawan;
