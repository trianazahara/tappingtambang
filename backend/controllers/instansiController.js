const { MasterInstansi } = require('../models');
const db = require('../config/db');

const getInstansi = async (req, res) => {
    try {
        const data = await MasterInstansi.findAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat instansi" });
    }
};

const addInstansi = async (req, res) => {
    try {
        const { nama_instansi, kategori_instansi } = req.body;

        if (!nama_instansi || !nama_instansi.toString().trim()) {
            return res.status(400).json({ success: false, message: "Nama instansi wajib diisi" });
        }

        const cleanNama = nama_instansi.toString().trim();
        const cleanKategori = (kategori_instansi && kategori_instansi.toString().trim()) 
            ? kategori_instansi.toString().trim() 
            : 'Vendor Outsourcing';

        // Cek jika instansi sudah ada di database (case-insensitive)
        const existing = await MasterInstansi.findOne({
            where: db.where(
                db.fn('LOWER', db.col('nama_instansi')),
                cleanNama.toLowerCase()
            )
        });

        if (existing) {
            // Jika sudah ada tapi nonaktif, aktifkan kembali
            if (existing.status_instansi === 'Nonaktif') {
                await existing.update({ status_instansi: 'Aktif' });
            }
            return res.status(200).json({ 
                success: true, 
                message: "Instansi berhasil ditemukan", 
                data: existing 
            });
        }

        const newInstansi = await MasterInstansi.create({
            nama_instansi: cleanNama,
            kategori_instansi: cleanKategori,
            status_instansi: 'Aktif'
        });

        res.status(201).json({ success: true, message: "Instansi berhasil ditambahkan", data: newInstansi });
    } catch (error) {
        console.error("Error addInstansi:", error);
        res.status(500).json({ success: false, message: "Gagal menambahkan instansi", error: error.message });
    }
};

const editInstansi = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_instansi, kategori_instansi } = req.body;
        
        const instansi = await MasterInstansi.findByPk(id);
        if (!instansi) return res.status(404).json({ success: false, message: "Instansi tidak ditemukan" });

        instansi.nama_instansi = nama_instansi || instansi.nama_instansi;
        instansi.kategori_instansi = kategori_instansi || instansi.kategori_instansi;
        await instansi.save();

        res.status(200).json({ success: true, message: "Instansi berhasil diupdate", data: instansi });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengupdate instansi", error: error.message });
    }
};

const toggleStatusInstansi = async (req, res) => {
    try {
        const { id } = req.params;
        const instansi = await MasterInstansi.findByPk(id);
        
        if (!instansi) return res.status(404).json({ success: false, message: "Instansi tidak ditemukan" });

        instansi.status_instansi = instansi.status_instansi === 'Aktif' ? 'Nonaktif' : 'Aktif';
        await instansi.save();

        res.status(200).json({ success: true, message: `Status instansi diubah menjadi ${instansi.status_instansi}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengubah status instansi", error: error.message });
    }
};

module.exports = { getInstansi, addInstansi, editInstansi, toggleStatusInstansi };
