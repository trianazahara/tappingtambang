const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const MasterKartuVisitor = db.define('master_kartu_visitor', {
    id_kartu: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nomor_kartu: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    uid_kartu: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Tersedia', 'Digunakan'),
        defaultValue: 'Tersedia'
    }
}, {
    tableName: 'master_kartu_visitor',
    timestamps: false
});

module.exports = MasterKartuVisitor;
