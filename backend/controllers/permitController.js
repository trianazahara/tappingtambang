const { PengajuanPermit, Karyawan, MasterArea, db } = require('../models');

const getPengajuan = async (req, res) => {
    try {
        const data = await PengajuanPermit.findAll({
            include: [
                { model: Karyawan, attributes: ['nik_atau_ktm', 'nama_lengkap'] },
                { model: MasterArea, attributes: ['id_area', 'nama_area'], through: { attributes: [] } }
            ],
            order: [['id_pengajuan', 'DESC']]
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const createPengajuan = async (req, res) => {
    const t = await db.transaction();
    try {
        const { areas, ...permitData } = req.body; // areas adalah array id_area dari React
        permitData.tanggal_pengajuan = new Date();

        // 0. Validasi NIK di project yang sama
        if (permitData.id_proyek && permitData.nik_atau_ktm) {
            const existingPermit = await PengajuanPermit.findOne({ 
                where: { nik_atau_ktm: permitData.nik_atau_ktm, id_proyek: permitData.id_proyek },
                transaction: t
            });
            if (existingPermit) {
                await t.rollback();
                return res.status(400).json({ success: false, message: "Pekerja dengan NIK/NIM ini sudah terdaftar di proyek ini." });
            }
        }

        // 1. Simpan tabel pengajuan_permit
        const permit = await PengajuanPermit.create(permitData, { transaction: t });

        // 2. Simpan tabel relasi izin_area
        if (areas && areas.length > 0) {
            await permit.addMasterAreas(areas, { transaction: t }); 
        }

        await t.commit();
        res.status(201).json({ success: true, message: "Pengajuan berhasil disimpan" });
    } catch (error) {
        await t.rollback();
        res.status(500).json({ success: false, message: "Gagal menyimpan pengajuan" });
    }
};

const cekNik = async (req, res) => {
    try {
        const karyawan = await Karyawan.findOne({ where: { nik_atau_ktm: req.params.nik } });
        if (karyawan) {
            res.status(200).json({ success: true, isExisting: true, data: karyawan });
        } else {
            res.status(200).json({ success: true, isExisting: false });
        }
    } catch (error) {
        res.status(500).json({ success: false });
    }
};

module.exports = { getPengajuan, createPengajuan, cekNik };