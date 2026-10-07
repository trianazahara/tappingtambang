const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const MasterInstansi = db.define('master_instansi', {
    id_instansi: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nama_instansi: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    kategori_instansi: {
        type: DataTypes.ENUM('Vendor Outsourcing', 'Universitas', 'Dinas', 'Internal'),
        allowNull: false
    },
    status_instansi: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        defaultValue: 'Aktif'
    }
}, {
    tableName: 'master_instansi',
    timestamps: false
});

module.exports = MasterInstansi;
