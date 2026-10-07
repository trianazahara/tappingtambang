const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const User = db.define('users', {
    id_user: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },

    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_instansi: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('Admin', 'Satpam', 'Pemohon_Mandiri', 'Koordinator_Vendor', 'Kasie_Pemohon', 'Kasie_HSE', 'KTT'),
        allowNull: false
    },
    status_akun: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        defaultValue: 'Aktif'
    },
    jenis_vendor: {
        type: DataTypes.ENUM('SPK', 'Kontrak'),
        allowNull: true
    },
    masa_berlaku_kontrak: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
    },
    is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    verification_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    reset_password_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    reset_password_expires: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'users',
    timestamps: false
});

module.exports = User;
