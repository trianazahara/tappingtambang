const { PengajuanPermit, Karyawan, MasterSoal, PengaturanUjian, MasterKendaraan } = require('../models');
const db = require('../config/db');

// Helper untuk ambil atau buat pengaturan ujian default jika belum ada
const getSetting = async () => {
    try {
        await PengaturanUjian.sync();
        // Pastikan kolom jumlah_soal ada di master_kendaraan
        await db.query("ALTER TABLE `master_kendaraan` ADD COLUMN `jumlah_soal` INT DEFAULT 20;").catch(() => {});

        let setting = await PengaturanUjian.findOne({ where: { id: 1 } });
        if (!setting) {
            setting = await PengaturanUjian.create({
                id: 1,
                jumlah_soal: 20, // default umum
                gunakan_waktu: true,
                durasi_menit: 60,
                passing_grade: 76
            });
        }
        return setting;
    } catch (e) {
        console.error("Error getSetting:", e);
        return {
            jumlah_soal: 20,
            gunakan_waktu: true,
            durasi_menit: 60,
            passing_grade: 76
        };
    }
};

const getPengaturanUjian = async (req, res) => {
    try {
        const setting = await getSetting();
        const kendaraanList = await MasterKendaraan.findAll({
            attributes: ['id_kendaraan', 'nama_kendaraan', 'kategori_kendaraan', 'warna_permit', 'jumlah_soal'],
            order: [['id_kendaraan', 'ASC']]
        });

        res.status(200).json({ 
            success: true, 
            data: {
                id: setting.id,
                jumlah_soal: setting.jumlah_soal,
                gunakan_waktu: setting.gunakan_waktu,
                durasi_menit: setting.durasi_menit,
                passing_grade: setting.passing_grade,
                kendaraan_list: kendaraanList
            } 
        });
    } catch (error) {
        console.error("Error getPengaturanUjian:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil pengaturan ujian' });
    }
};

const updatePengaturanUjian = async (req, res) => {
    try {
        const { jumlah_soal, gunakan_waktu, durasi_menit, passing_grade, kendaraan_settings } = req.body;
        const setting = await getSetting();

        await setting.update({
            jumlah_soal: Math.max(1, parseInt(jumlah_soal) || 20),
            gunakan_waktu: Boolean(gunakan_waktu),
            durasi_menit: Math.max(1, parseInt(durasi_menit) || 60),
            passing_grade: Math.min(100, Math.max(0, parseInt(passing_grade) || 76))
        });

        // Update batas soal per unit kendaraan jika disediakan
        if (Array.isArray(kendaraan_settings)) {
            for (const item of kendaraan_settings) {
                if (item.id_kendaraan && item.jumlah_soal !== undefined) {
                    await MasterKendaraan.update(
                        { jumlah_soal: Math.max(1, parseInt(item.jumlah_soal) || 20) },
                        { where: { id_kendaraan: item.id_kendaraan } }
                    );
                }
            }
        }

        const updatedKendaraan = await MasterKendaraan.findAll({
            attributes: ['id_kendaraan', 'nama_kendaraan', 'kategori_kendaraan', 'warna_permit', 'jumlah_soal'],
            order: [['id_kendaraan', 'ASC']]
        });

        res.status(200).json({ 
            success: true, 
            message: 'Pengaturan ujian berhasil diperbarui', 
            data: {
                id: setting.id,
                jumlah_soal: setting.jumlah_soal,
                gunakan_waktu: setting.gunakan_waktu,
                durasi_menit: setting.durasi_menit,
                passing_grade: setting.passing_grade,
                kendaraan_list: updatedKendaraan
            } 
        });
    } catch (error) {
        console.error("Error updatePengaturanUjian:", error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate pengaturan ujian' });
    }
};

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

        const setting = await getSetting();
        let limitSoal = setting.jumlah_soal || 20;
        let kendaraanIds = [];

        if (kendaraanNames.length > 0) {
            const kends = await MasterKendaraan.findAll({ where: { nama_kendaraan: kendaraanNames } });
            kendaraanIds = kends.map(k => k.id_kendaraan);

            // Ambil batas soal spesifik untuk kendaraan yang diajukan (misal Dump Truck: 50, LV: 20)
            const vehicleLimits = kends.map(k => k.jumlah_soal).filter(Boolean);
            if (vehicleLimits.length > 0) {
                limitSoal = Math.max(...vehicleLimits);
            }
        }

        const { Op } = require('sequelize');
        
        // Ambil soal secara acak: Umum (null) + Kendaraan spesifik (jika ada), sesuai batas soal kendaraan
        const soalList = await MasterSoal.findAll({
            where: { 
                status_soal: 'Aktif',
                [Op.or]: [
                    { id_kendaraan: null },
                    kendaraanIds.length > 0 ? { id_kendaraan: { [Op.in]: kendaraanIds } } : null
                ].filter(Boolean)
            },
            order: db.random(),
            limit: limitSoal
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
                soal: soalList,
                setting: {
                    jumlah_soal: limitSoal,
                    gunakan_waktu: setting.gunakan_waktu,
                    durasi_menit: setting.durasi_menit,
                    passing_grade: setting.passing_grade,
                    unit_terpilih: kendaraanNames.join(', ') || 'Umum'
                }
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

        // Ambil passing grade dari setting (default 76)
        const setting = await getSetting();
        const passingGrade = setting.passing_grade || 76;
        const lulus = nilai >= passingGrade;
        
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
                salah,
                passingGrade
            }
        });

    } catch (error) {
        console.error("Error submitUjian:", error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan hasil ujian' });
    }
};

module.exports = {
    loginUjian,
    submitUjian,
    getPengaturanUjian,
    updatePengaturanUjian
};
