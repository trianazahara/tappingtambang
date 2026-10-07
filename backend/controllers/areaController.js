const { MasterArea } = require('../models');

const getArea = async (req, res) => {
    try {
        const data = await MasterArea.findAll();
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat area" });
    }
};

const addArea = async (req, res) => {
    try {
        const { nama_area } = req.body;
        if (!nama_area) {
            return res.status(400).json({ success: false, message: "Nama area wajib diisi" });
        }
        
        const existingArea = await MasterArea.findOne({ where: { nama_area } });
        if (existingArea) {
            return res.status(400).json({ success: false, message: "Nama area sudah ada" });
        }

        const newArea = await MasterArea.create({ nama_area });
        res.status(201).json({ success: true, message: "Area berhasil ditambahkan", data: newArea });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal menambahkan area", error: error.message });
    }
};

const editArea = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_area } = req.body;
        
        const area = await MasterArea.findByPk(id);
        if (!area) return res.status(404).json({ success: false, message: "Area tidak ditemukan" });

        area.nama_area = nama_area || area.nama_area;
        await area.save();

        res.status(200).json({ success: true, message: "Area berhasil diupdate", data: area });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengupdate area", error: error.message });
    }
};

const toggleStatusArea = async (req, res) => {
    try {
        const { id } = req.params;
        const area = await MasterArea.findByPk(id);
        
        if (!area) return res.status(404).json({ success: false, message: "Area tidak ditemukan" });

        area.status_area = area.status_area === 'Aktif' ? 'Nonaktif' : 'Aktif';
        await area.save();

        res.status(200).json({ success: true, message: `Status area diubah menjadi ${area.status_area}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengubah status area", error: error.message });
    }
};

module.exports = { getArea, addArea, editArea, toggleStatusArea };