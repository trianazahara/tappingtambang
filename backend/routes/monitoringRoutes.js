const express = require('express');
const router = express.Router();
const { ProyekVendor, PengajuanPermit, Karyawan, MasterInstansi } = require('../models');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
    try {
        const monitoringList = [];

        // 1. Ambil data Proyek Vendor (Kontrak)
        const proyekList = await ProyekVendor.findAll({
            where: { status_proyek: 'Aktif' },
            order: [['tanggal_selesai', 'ASC']]
        });

        for (const p of proyekList) {
            monitoringList.push({
                id: `proyek-${p.id_proyek}`,
                jenis_dokumen: 'Kontrak / SPK',
                nama_pemilik: p.nama_proyek,
                instansi_atau_proyek: '-',
                tanggal_berakhir: p.tanggal_selesai,
                keterangan: `Proyek / Vendor`,
                file_url: p.file_kontrak_kerja ? `uploads/${p.file_kontrak_kerja.split(/[/\\]/).pop()}` : null
            });
        }

        // 2. Ambil data Pengajuan Permit yang ada tanggal berlaku SIM
        const simList = await PengajuanPermit.findAll({
            where: { 
                tanggal_berlaku_sim: { [Op.not]: null },
                status_berkas: { [Op.in]: ['Aktif', 'Siap_Cetak', 'Menunggu_Ujian', 'Lulus_Berkas'] }
            },
            include: [
                { 
                    model: Karyawan, 
                    include: [{ model: MasterInstansi }]
                },
                { model: ProyekVendor }
            ],
            order: [['tanggal_berlaku_sim', 'ASC']]
        });

        for (const s of simList) {
            const namaPerusahaan = s.karyawan?.master_instansi?.nama_instansi || s.karyawan?.unit_kerja || '-';
            // Gabungkan semua file SIM/SIO jika ada
            const files = [];
            if (s.file_sim_a) files.push(s.file_sim_a);
            if (s.file_sim_b1) files.push(s.file_sim_b1);
            if (s.file_sim_b2) files.push(s.file_sim_b2);
            if (s.file_sio) files.push(s.file_sio);
            
            monitoringList.push({
                id: `sim-${s.id_pengajuan}`,
                jenis_dokumen: 'SIM / SIO',
                nama_pemilik: s.karyawan?.nama_lengkap || 'Unknown',
                instansi_atau_proyek: namaPerusahaan,
                tanggal_berakhir: s.tanggal_berlaku_sim,
                keterangan: s.jenis_kendaraan || 'Kendaraan Umum',
                file_url: files.length > 0 ? `uploads/${files[0].split(/[/\\]/).pop()}` : null
            });
        }

        // Urutkan semua data berdasarkan tanggal berakhir paling dekat
        monitoringList.sort((a, b) => new Date(a.tanggal_berakhir) - new Date(b.tanggal_berakhir));

        res.json({ success: true, data: monitoringList });

    } catch (error) {
        console.error("Error monitoring:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data monitoring' });
    }
});

// Endpoint untuk Export Dokumen Audit massal
router.get('/export-docs', async (req, res) => {
    try {
        const { startDate, endDate, docType } = req.query;
        if (!startDate || !endDate || !docType) {
            return res.status(400).json({ success: false, message: 'Parameter startDate, endDate, dan docType harus diisi' });
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // Kriteria pencarian
        const isProjectDoc = ['file_jsa', 'file_life_saving_talk', 'file_izin_kerja_umum'].includes(docType);

        if (isProjectDoc) {
            const { ProyekVendor } = require('../models');
            const proyekList = await ProyekVendor.findAll({
                where: {
                    createdAt: { [Op.between]: [start, end] },
                    [docType]: { [Op.not]: null }
                }
            });

            if (proyekList.length === 0) {
                return res.status(404).json({ success: false, message: `Tidak ada data dokumen proyek ditemukan untuk rentang tanggal tersebut.` });
            }

            const AdmZip = require('adm-zip');
            const zip = new AdmZip();
            const fs = require('fs');
            const path = require('path');
            let fileCount = 0;

            for (const p of proyekList) {
                const namaProyek = p.nama_proyek?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Project';
                const fileDbPath = p[docType];
                if (fileDbPath) {
                    const filePath = path.join(__dirname, '..', fileDbPath);
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath) || '.pdf';
                        const fileLabel = docType.replace('file_', '').toUpperCase();
                        zip.addLocalFile(filePath, '', `${namaProyek}_${fileLabel}${ext}`);
                        fileCount++;
                    }
                }
            }

            if (fileCount === 0) {
                return res.status(404).json({ success: false, message: 'File fisik tidak ditemukan di server.' });
            }

            const zipBuffer = zip.toBuffer();
            res.set('Content-Type', 'application/zip');
            res.set('Content-Disposition', `attachment; filename=Export_Proyek_${docType.toUpperCase()}_${startDate}_to_${endDate}.zip`);
            return res.send(zipBuffer);
        }

        const whereClause = {
            tanggal_pengajuan: {
                [Op.between]: [start, end]
            }
        };

        // Jika minta safety induksi, ambil yg upload fisik ATAU yg setuju virtual
        if (docType === 'file_safety_induksi') {
            whereClause[Op.or] = [
                { setuju_aturan_k3: true },
                { file_safety_induksi: { [Op.not]: null } }
            ];
        } else {
            // Untuk file lainnya, pastikan filenya tidak null
            whereClause[docType] = { [Op.not]: null };
        }

        const pengajuanList = await PengajuanPermit.findAll({
            where: whereClause,
            include: [{ model: Karyawan }]
        });

        if (pengajuanList.length === 0) {
            return res.status(404).json({ success: false, message: `Tidak ada data dokumen ditemukan untuk rentang tanggal tersebut.` });
        }

        const AdmZip = require('adm-zip');
        const zip = new AdmZip();
        const fs = require('fs');
        const path = require('path');

        let fileCount = 0;

        for (const p of pengajuanList) {
            const nama = p.karyawan?.nama_lengkap?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
            const nik = p.karyawan?.nik_atau_ktm || p.id_pengajuan;

            if (docType === 'file_safety_induksi') {
                // 1. File Fisik
                if (p.file_safety_induksi) {
                    const filePath = path.join(__dirname, '..', p.file_safety_induksi);
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath) || '.png';
                        zip.addLocalFile(filePath, '', `${nama}_${nik}_SafetyInduksi${ext}`);
                        fileCount++;
                    }
                }
                
                // 2. Jika dia setuju_aturan_k3 tapi tidak ada file, buatkan file text sbg bukti audit log
                if (p.setuju_aturan_k3 && !p.file_safety_induksi) {
                    const logContent = `BUKTI PERSETUJUAN PERATURAN K3\n\nNama: ${p.karyawan?.nama_lengkap}\nNIK: ${nik}\nTanggal Pengajuan: ${p.tanggal_pengajuan}\n\nStatus: MENYETUJUI (Digital Agreement - Timestamp: ${p.tanggal_pengajuan})`;
                    zip.addFile(`${nama}_${nik}_K3_Digital_Agreement.txt`, Buffer.from(logContent, "utf8"));
                    fileCount++;
                }
            } else {
                // Export file generik lainnya (misal file_bpjs)
                const fileDbPath = p[docType];
                if (fileDbPath) {
                    const filePath = path.join(__dirname, '..', fileDbPath);
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath) || '.pdf';
                        const fileLabel = docType.replace('file_', '').toUpperCase();
                        zip.addLocalFile(filePath, '', `${nama}_${nik}_${fileLabel}${ext}`);
                        fileCount++;
                    }
                }
            }
        }

        if (fileCount === 0) {
            return res.status(404).json({ success: false, message: 'File fisik tidak ditemukan di server/gagal dibaca.' });
        }

        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        res.set('Content-Disposition', `attachment; filename=Export_${docType.toUpperCase()}_${startDate}_to_${endDate}.zip`);
        res.send(zipBuffer);

    } catch (error) {
        console.error("Error exporting docs:", error);
        res.status(500).json({ success: false, message: 'Gagal mengekspor dokumen' });
    }
});

module.exports = router;
