const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const RiwayatApproval = db.define('riwayat_approval', {
    id_riwayat: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_pengajuan: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    id_user_approver: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status_keputusan: {
        type: DataTypes.ENUM('Disetujui', 'Ditolak'),
        allowNull: false
    },
    catatan_revisi: {
        type: DataTypes.TEXT
    },
    tanggal_waktu: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.NOW
    }
}, {
    tableName: 'riwayat_approval',
    timestamps: false
});

module.exports = RiwayatApproval;
