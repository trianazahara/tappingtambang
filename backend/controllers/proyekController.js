const { ProyekVendor, ProyekArea, MasterArea, User, PengajuanPermit } = require('../models');
const fs = require('fs');

const createProyek = async (req, res) => {
    try {
        const { id_user_vendor, nama_proyek, tanggal_mulai, tanggal_selesai, jenis_proyek } = req.body;
        
        // Handle file uploads
        const filePaths = {};
        if (req.files) {
            Object.keys(req.files).forEach(key => {
                filePaths[key] = req.files[key][0].path.replace(/\\/g, '/');
            });
        }

        const proyek = await ProyekVendor.create({
            id_user_vendor,
            nama_proyek,
            jenis_proyek: jenis_proyek || 'Baru',
            tanggal_mulai,
            tanggal_selesai,
            file_kontrak_kerja: filePaths['file_kontrak_kerja'] || null,
            file_surat_penunjukan: filePaths['file_surat_penunjukan'] || null,
            file_prosedur: filePaths['file_prosedur'] || null,
            file_izin_kerja_berbahaya: filePaths['file_izin_kerja_berbahaya'] || null,
            file_permohonan_kimper: filePaths['file_permohonan_kimper'] || null,
        });



        res.status(201).json({ success: true, message: 'Proyek berhasil dibuat', data: proyek });
    } catch (error) {
        console.error("Error createProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal membuat proyek', error: error.message });
    }
};

const getListProyek = async (req, res) => {
    try {
        const { id_user } = req.query; // Koor vendor id
        const whereClause = id_user ? { id_user_vendor: id_user } : {};

        const proyek = await ProyekVendor.findAll({
            where: whereClause,
            include: [

                { model: PengajuanPermit, attributes: ['id_pengajuan', 'status_berkas'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: proyek });
    } catch (error) {
        console.error("Error getListProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data proyek' });
    }
};

const getDetailProyek = async (req, res) => {
    try {
        const { id } = req.params;
        const proyek = await ProyekVendor.findByPk(id, {
            include: [

                { 
                    model: PengajuanPermit, 
                    include: ['karyawan', 'riwayat_approvals'] // We can fetch basic worker info and approvals
                }
            ]
        });

        if (!proyek) return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });

        res.status(200).json({ success: true, data: proyek });
    } catch (error) {
        console.error("Error getDetailProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail proyek' });
    }
};

const uploadDocsProyek = async (req, res) => {
    try {
        const { id } = req.params;
        const proyek = await ProyekVendor.findByPk(id);
        
        if (!proyek) {
            return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
        }

        const filePaths = {};
        if (req.files) {
            Object.keys(req.files).forEach(key => {
                filePaths[key] = req.files[key][0].path.replace(/\\/g, '/');
            });
        }

        await proyek.update({
            file_life_saving_talk: filePaths['file_life_saving_talk'] || proyek.file_life_saving_talk,
            file_jsa: filePaths['file_jsa'] || proyek.file_jsa,
            file_izin_kerja_umum: filePaths['file_izin_kerja_umum'] || proyek.file_izin_kerja_umum,
            file_izin_panas: filePaths['file_izin_panas'] || proyek.file_izin_panas,
            file_izin_ketinggian: filePaths['file_izin_ketinggian'] || proyek.file_izin_ketinggian,
            file_izin_perancah: filePaths['file_izin_perancah'] || proyek.file_izin_perancah,
            file_izin_beban: filePaths['file_izin_beban'] || proyek.file_izin_beban,
            file_izin_ruang_terbatas: filePaths['file_izin_ruang_terbatas'] || proyek.file_izin_ruang_terbatas,
            file_izin_penggalian: filePaths['file_izin_penggalian'] || proyek.file_izin_penggalian,
            file_izin_air: filePaths['file_izin_air'] || proyek.file_izin_air,
            file_izin_material_panas: filePaths['file_izin_material_panas'] || proyek.file_izin_material_panas,
        });

        res.status(200).json({ success: true, message: 'Dokumen safety proyek berhasil diunggah', data: proyek });
    } catch (error) {
        console.error("Error uploadDocsProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal mengunggah dokumen safety', error: error.message });
    }
};

const submitDraftsProyek = async (req, res) => {
    try {
        const { id } = req.params;
        const proyek = await ProyekVendor.findByPk(id);
        if (!proyek) {
            return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
        }

        if (proyek.jenis_proyek !== 'Perpanjangan' && (!proyek.file_life_saving_talk || !proyek.file_jsa || !proyek.file_izin_kerja_umum)) {
            return res.status(400).json({ success: false, message: 'Dokumen safety utama (LST, JSA, Izin Kerja Umum) harus diunggah terlebih dahulu.' });
        }

        if (!proyek.file_surat_penunjukan || !proyek.file_kontrak_kerja) {
            return res.status(400).json({ success: false, message: 'Dokumen bersama proyek (Surat Penunjukan & Kontrak/SPK) harus diunggah terlebih dahulu.' });
        }

        // Update all Draft permits for this project
        await PengajuanPermit.update(
            { status_berkas: 'Pending_Admin' },
            { where: { id_proyek: id, status_berkas: 'Draft' } }
        );

        res.json({ success: true, message: 'Semua pekerja dalam draft berhasil dikirim ke admin' });
    } catch (error) {
        console.error('Error submitting drafts for proyek:', error);
        res.status(500).json({ success: false, message: 'Gagal mengirim draft ke admin', error: error.message });
    }
};

const updateProyek = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_proyek, tanggal_mulai, tanggal_selesai, jenis_proyek } = req.body;
        
        const proyek = await ProyekVendor.findByPk(id);
        if (!proyek) {
            return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
        }

        const filePaths = {};
        if (req.files) {
            Object.keys(req.files).forEach(key => {
                filePaths[key] = req.files[key][0].path.replace(/\\/g, '/');
            });
        }

        await proyek.update({
            nama_proyek: nama_proyek || proyek.nama_proyek,
            jenis_proyek: jenis_proyek || proyek.jenis_proyek,
            tanggal_mulai: tanggal_mulai || proyek.tanggal_mulai,
            tanggal_selesai: tanggal_selesai || proyek.tanggal_selesai,
            file_kontrak_kerja: filePaths['file_kontrak_kerja'] || proyek.file_kontrak_kerja,
            file_surat_penunjukan: filePaths['file_surat_penunjukan'] || proyek.file_surat_penunjukan,
        });

        res.status(200).json({ success: true, message: 'Proyek berhasil diperbarui', data: proyek });
    } catch (error) {
        console.error("Error updateProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal memperbarui proyek', error: error.message });
    }
};

const deleteProyek = async (req, res) => {
    try {
        const { id } = req.params;
        const proyek = await ProyekVendor.findByPk(id);
        if (!proyek) {
            return res.status(404).json({ success: false, message: 'Proyek tidak ditemukan' });
        }

        const pekerja = await PengajuanPermit.count({ where: { id_proyek: id } });
        if (pekerja > 0) {
            return res.status(400).json({ success: false, message: 'Tidak dapat menghapus proyek karena masih ada pekerja yang terdaftar di dalamnya.' });
        }

        await proyek.destroy();
        res.status(200).json({ success: true, message: 'Proyek berhasil dihapus' });
    } catch (error) {
        console.error("Error deleteProyek:", error);
        res.status(500).json({ success: false, message: 'Gagal menghapus proyek', error: error.message });
    }
};

module.exports = {
    createProyek,
    getListProyek,
    getDetailProyek,
    uploadDocsProyek,
    submitDraftsProyek,
    updateProyek,
    deleteProyek
};
