const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const MasterArea = db.define('master_area', {
    id_area: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nama_area: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    status_area: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
        defaultValue: 'Aktif'
    }
}, {
    tableName: 'master_area',
    timestamps: false
});

module.exports = MasterArea;
