const express = require('express');
const router = express.Router();
const { MasterKendaraan } = require('../models');

// GET all kendaraan
router.get('/', async (req, res) => {
    try {
        const data = await MasterKendaraan.findAll({
            order: [['nama_kendaraan', 'ASC']]
        });
        res.json({ success: true, data });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal memuat data kendaraan' });
    }
});

// POST new kendaraan
router.post('/', async (req, res) => {
    try {
        const { nama_kendaraan, kategori_kendaraan, warna_permit, syarat_dokumen, type_unit } = req.body;
        const newData = await MasterKendaraan.create({
            nama_kendaraan,
            kategori_kendaraan,
            warna_permit,
            syarat_dokumen,
            type_unit: type_unit || null
        });
        res.status(201).json({ success: true, message: 'Kendaraan berhasil ditambahkan', data: newData });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menambahkan kendaraan' });
    }
});

// PUT update kendaraan
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_kendaraan, kategori_kendaraan, warna_permit, syarat_dokumen, type_unit } = req.body;
        
        const kendaraan = await MasterKendaraan.findByPk(id);
        if (!kendaraan) return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan' });

        await kendaraan.update({
            nama_kendaraan,
            kategori_kendaraan,
            warna_permit,
            syarat_dokumen,
            type_unit: type_unit || null
        });
        res.json({ success: true, message: 'Kendaraan berhasil diupdate', data: kendaraan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal mengupdate kendaraan' });
    }
});

// DELETE kendaraan
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const kendaraan = await MasterKendaraan.findByPk(id);
        if (!kendaraan) return res.status(404).json({ success: false, message: 'Kendaraan tidak ditemukan' });

        await kendaraan.destroy();
        res.json({ success: true, message: 'Kendaraan berhasil dihapus' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Gagal menghapus kendaraan' });
    }
});

module.exports = router;
