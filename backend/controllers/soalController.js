const { MasterSoal } = require('../models');

// Get all soal
const getAllSoal = async (req, res) => {
    try {
        const soal = await MasterSoal.findAll({
            include: [{ model: require('../models/MasterKendaraan'), attributes: ['nama_kendaraan'] }]
        });
        res.status(200).json({ success: true, data: soal });
    } catch (error) {
        console.error("Error getAllSoal:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data soal' });
    }
};

// Create soal
const createSoal = async (req, res) => {
    try {
        const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban, status_soal, id_kendaraan } = req.body;
        const file_gambar = req.file ? req.file.path.replace(/\\/g, '/') : null;
        
        const newSoal = await MasterSoal.create({
            pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban, status_soal, 
            id_kendaraan: id_kendaraan || null, 
            file_gambar
        });
        res.status(201).json({ success: true, message: 'Soal berhasil ditambahkan', data: newSoal });
    } catch (error) {
        console.error("Error createSoal:", error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan soal' });
    }
};

// Update soal
const updateSoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban, status_soal, id_kendaraan } = req.body;

        const soal = await MasterSoal.findByPk(id);
        if (!soal) {
            return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
        }

        const updateData = {
            pertanyaan, pilihan_a, pilihan_b, pilihan_c, pilihan_d, kunci_jawaban, status_soal, 
            id_kendaraan: id_kendaraan || null
        };
        
        if (req.file) {
            updateData.file_gambar = req.file.path.replace(/\\/g, '/');
        }

        await soal.update(updateData);

        res.status(200).json({ success: true, message: 'Soal berhasil diupdate', data: soal });
    } catch (error) {
        console.error("Error updateSoal:", error);
        res.status(500).json({ success: false, message: 'Gagal mengupdate soal' });
    }
};

// Delete soal
const deleteSoal = async (req, res) => {
    try {
        const { id } = req.params;
        const soal = await MasterSoal.findByPk(id);
        if (!soal) {
            return res.status(404).json({ success: false, message: 'Soal tidak ditemukan' });
        }

        await soal.destroy();
        res.status(200).json({ success: true, message: 'Soal berhasil dihapus' });
    } catch (error) {
        console.error("Error deleteSoal:", error);
        res.status(500).json({ success: false, message: 'Gagal menghapus soal' });
    }
};

module.exports = {
    getAllSoal,
    createSoal,
    updateSoal,
    deleteSoal
};
