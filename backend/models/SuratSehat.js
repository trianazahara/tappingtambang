const { Sequelize, DataTypes } = require('sequelize');
const db = require('../config/db');

const SuratSehat = db.define('surat_sehat', {
    id_surat: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_pengajuan: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tinggi_badan: {
        type: DataTypes.INTEGER
    },
    berat_badan: {
        type: DataTypes.INTEGER
    },
    riwayat_penyakit: {
        type: DataTypes.STRING
    },
    tekanan_darah: {
        type: DataTypes.STRING
    },
    denyut_nadi: {
        type: DataTypes.INTEGER
    },
    golongan_darah: {
        type: DataTypes.STRING
    },
    q1_sehat: {
        type: DataTypes.BOOLEAN
    },
    q2_tidur_cukup: {
        type: DataTypes.BOOLEAN
    },
    q3_jantung: {
        type: DataTypes.BOOLEAN
    },
    q4_diabetes: {
        type: DataTypes.BOOLEAN
    },
    q5_kolesterol: {
        type: DataTypes.BOOLEAN
    },
    q6_obat_kantuk: {
        type: DataTypes.BOOLEAN
    },
    q7_paham_pekerjaan: {
        type: DataTypes.BOOLEAN
    },
    q8_paham_risiko: {
        type: DataTypes.BOOLEAN
    },
    q9_sedia_menegur: {
        type: DataTypes.BOOLEAN
    },
    q10_sedia_melapor: {
        type: DataTypes.BOOLEAN
    }
}, {
    tableName: 'surat_sehat',
    timestamps: false
});

module.exports = SuratSehat;
