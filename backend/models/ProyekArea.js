const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const ProyekArea = db.define('proyek_area', {
    id_proyek: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    id_area: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    }
}, {
    tableName: 'proyek_area',
    timestamps: false
});

module.exports = ProyekArea;
