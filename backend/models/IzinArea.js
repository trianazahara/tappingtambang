const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const IzinArea = db.define('izin_area', {
    id_pengajuan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    id_area: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    }
}, {
    tableName: 'izin_area',
    timestamps: false
});

module.exports = IzinArea;
