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
        
        if (!nama_kendaraan || nama_kendaraan.trim() === '') {
            return res.status(400).json({ success: false, message: 'Nama kendaraan wajib diisi' });
        }

        const trimmedNama = nama_kendaraan.trim();
        const { Op } = require('sequelize');
        const existing = await MasterKendaraan.findOne({
            where: {
                nama_kendaraan: { [Op.like]: trimmedNama }
            }
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: `Jenis kendaraan "${trimmedNama}" sudah ada. Silakan edit data kendaraan tersebut untuk menambah atau mengubah tipe unit.` 
            });
        }

        const cleanedTypes = type_unit 
            ? type_unit.split(',').map(s => s.trim()).filter(Boolean).join(', ') 
            : null;

        const newData = await MasterKendaraan.create({
            nama_kendaraan: trimmedNama,
            kategori_kendaraan,
            warna_permit,
            syarat_dokumen,
            type_unit: cleanedTypes
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

        const trimmedNama = nama_kendaraan ? nama_kendaraan.trim() : kendaraan.nama_kendaraan;
        const { Op } = require('sequelize');
        const existing = await MasterKendaraan.findOne({
            where: {
                nama_kendaraan: { [Op.like]: trimmedNama },
                id_kendaraan: { [Op.ne]: id }
            }
        });

        if (existing) {
            return res.status(400).json({ 
                success: false, 
                message: `Jenis kendaraan "${trimmedNama}" sudah digunakan oleh data lain. Gunakan nama yang berbeda atau edit data yang sudah ada.` 
            });
        }

        const cleanedTypes = type_unit !== undefined
            ? (type_unit ? type_unit.split(',').map(s => s.trim()).filter(Boolean).join(', ') : null)
            : kendaraan.type_unit;

        await kendaraan.update({
            nama_kendaraan: trimmedNama,
            kategori_kendaraan,
            warna_permit,
            syarat_dokumen,
            type_unit: cleanedTypes
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
