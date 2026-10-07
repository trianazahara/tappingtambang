const { PengajuanPermit, Karyawan, MasterSoal } = require('../models');
const db = require('../config/db');

const loginUjian = async (req, res) => {
    try {
        const { nik_atau_ktm, kode_ujian_online } = req.body;

        // Cari karyawan berdasarkan NIK
        const karyawan = await Karyawan.findOne({ where: { nik_atau_ktm } });
        if (!karyawan) {
            return res.status(404).json({ success: false, message: 'NIK tidak ditemukan' });
        }

        // Cari pengajuan dengan kode_ujian_online yang cocok
        const pengajuan = await PengajuanPermit.findOne({
            where: {
                id_karyawan: karyawan.id_karyawan,
                kode_ujian_online
            },
            include: ['karyawan']
        });

        if (!pengajuan) {
            return res.status(401).json({ success: false, message: 'Kode ujian tidak valid untuk NIK ini' });
        }

        if (pengajuan.status_ujian_online === 'Selesai') {
            return res.status(400).json({ success: false, message: 'Anda sudah menyelesaikan ujian ini' });
        }

        // Determine vehicle IDs based on pengajuan.jenis_kendaraan
        let kendaraanNames = [];
        if (pengajuan.jenis_kendaraan) {
            try {
                if (pengajuan.jenis_kendaraan.startsWith('[')) {
                    kendaraanNames = JSON.parse(pengajuan.jenis_kendaraan).map(k => k.nama_kendaraan);
                } else {
                    kendaraanNames = pengajuan.jenis_kendaraan.split(',').map(s => s.trim());
                }
            } catch (e) { console.error("Error parsing jenis_kendaraan", e); }
        }

        let kendaraanIds = [];
        if (kendaraanNames.length > 0) {
            const { MasterKendaraan } = require('../models');
            const kends = await MasterKendaraan.findAll({ where: { nama_kendaraan: kendaraanNames } });
            kendaraanIds = kends.map(k => k.id_kendaraan);
        }

        const { Op } = require('sequelize');
        
        // Ambil soal secara acak: Umum (null) + Kendaraan spesifik (jika ada)
        const soalList = await MasterSoal.findAll({
            where: { 
                status_soal: 'Aktif',
                [Op.or]: [
                    { id_kendaraan: null },
                    kendaraanIds.length > 0 ? { id_kendaraan: { [Op.in]: kendaraanIds } } : null
                ].filter(Boolean)
            },
            order: db.random(),
            limit: 20
        });

        // Set status jadi Sedang Mengerjakan
        await pengajuan.update({ status_ujian_online: 'Sedang Mengerjakan' });

        res.status(200).json({
            success: true,
            message: 'Berhasil masuk ke ujian',
            data: {
                pengajuan: {
                    id_pengajuan: pengajuan.id_pengajuan,
                    nama_lengkap: pengajuan.karyawan.nama_lengkap,
                    nik: pengajuan.karyawan.nik_atau_ktm,
                    kategori_akses: pengajuan.kategori_akses
                },
                soal: soalList
            }
        });
    } catch (error) {
        console.error("Error loginUjian:", error);
        res.status(500).json({ success: false, message: 'Gagal memproses login ujian' });
    }
};

const submitUjian = async (req, res) => {
    try {
        const { id_pengajuan, jawaban } = req.body; 
        // jawaban: { [id_soal]: 'A', [id_soal]: 'B', ... }

        const pengajuan = await PengajuanPermit.findByPk(id_pengajuan);
        if (!pengajuan) return res.status(404).json({ success: false, message: 'Pengajuan tidak ditemukan' });

        // Ambil kunci jawaban
        const soalIds = Object.keys(jawaban);
        const soalList = await MasterSoal.findAll({
            where: { id_soal: soalIds }
        });

        let benar = 0;
        let salah = 0;

        soalList.forEach(soal => {
            const jawab = jawaban[soal.id_soal];
            if (jawab === soal.kunci_jawaban) {
                benar++;
            } else {
                salah++;
            }
        });

        const totalSoal = soalList.length;
        // Hitung nilai (0 - 100)
        const nilai = totalSoal > 0 ? (benar / totalSoal) * 100 : 0;

        // Standar kelulusan K3 adalah 76
        const lulus = nilai >= 76;
        
        // Jika lulus, naikkan status ke Pending_Admin, jika gagal biarkan Menunggu_Ujian
        const updatedStatus = lulus ? 'Pending_Admin' : 'Menunggu_Ujian';

        await pengajuan.update({
            status_ujian_online: lulus ? 'Selesai' : 'Belum',
            nilai_ujian_online: nilai,
            status_berkas: updatedStatus
        });

        res.status(200).json({
            success: true,
            message: lulus ? 'Selamat, Anda lulus ujian K3!' : 'Maaf, Anda belum memenuhi standar kelulusan K3.',
            data: {
                nilai,
                lulus,
                benar,
                salah
            }
        });

    } catch (error) {
        console.error("Error submitUjian:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan hasil ujian' });
    }
};

module.exports = {
    loginUjian,
    submitUjian
};
