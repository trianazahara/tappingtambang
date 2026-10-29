const express = require('express');
const router = express.Router();
const { ProyekVendor, PengajuanPermit, Karyawan, MasterInstansi } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const docLabels = {
    all: 'Semua Dokumen',
    file_safety_induksi: 'Safety Induksi & K3',
    file_data_diri: 'KTP / Identitas Diri',
    file_foto: 'Foto Profil / Pas Foto',
    file_bpjs: 'BPJS Ketenagakerjaan',
    file_mcu: 'Medical Check Up (MCU)',
    file_sertifikat_sio_sim: 'Sertifikat / SIO / SIM',
    file_kontrak_kerja: 'Kontrak Kerja / SPK',
    file_surat_penunjukan: 'Surat Penunjukan',
    file_surat_pengantar: 'Surat Pengantar',
    file_prosedur: 'Prosedur Kerja',
    file_izin_kerja_berbahaya: 'Izin Kerja Berbahaya',
    file_serah_terima_apd: 'Serah Terima APD',
    file_hasil_assessment: 'Hasil Assessment',
    file_permohonan_kimper: 'Permohonan Kimper',
    file_jsa: 'Job Safety Analysis (JSA)',
    file_life_saving_talk: 'Life Saving Talk',
    file_izin_kerja_umum: 'Izin Kerja Umum'
};

// 1. Endpoint Monitoring Masa Berlaku (Kontrak & SIM/SIO)
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

        monitoringList.sort((a, b) => new Date(a.tanggal_berakhir) - new Date(b.tanggal_berakhir));

        res.json({ success: true, data: monitoringList });

    } catch (error) {
        console.error("Error monitoring:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data monitoring' });
    }
});

// 2. Endpoint Preview Dokumen (Filter Tanggal, Jenis Dokumen, & Search Nama / NIK)
router.get('/preview-docs', async (req, res) => {
    try {
        const { startDate, endDate, docType = 'file_safety_induksi', search = '' } = req.query;

        const isProjectDoc = ['file_jsa', 'file_life_saving_talk', 'file_izin_kerja_umum'].includes(docType);

        if (isProjectDoc) {
            const whereClause = {
                [docType]: { [Op.not]: null }
            };

            if (startDate && endDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt = { [Op.between]: [start, end] };
            } else if (startDate) {
                const start = new Date(startDate);
                start.setHours(0, 0, 0, 0);
                whereClause.createdAt = { [Op.gte]: start };
            } else if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                whereClause.createdAt = { [Op.lte]: end };
            }

            if (search && search.trim() !== '') {
                whereClause.nama_proyek = { [Op.like]: `%${search.trim()}%` };
            }

            const proyekList = await ProyekVendor.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']]
            });

            const results = proyekList.map(p => {
                const fileDbPath = p[docType];
                let fileExists = false;
                if (fileDbPath) {
                    const cleanPath = fileDbPath.startsWith('uploads') ? fileDbPath : path.join('uploads', fileDbPath);
                    const absPath = path.join(__dirname, '..', cleanPath);
                    fileExists = fs.existsSync(absPath);
                }

                const filename = fileDbPath ? fileDbPath.split(/[/\\]/).pop() : '';
                const ext = path.extname(filename).toLowerCase();
                const fileType = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? 'image' : (ext === '.pdf' ? 'pdf' : 'document');

                return {
                    id: `proyek-${p.id_proyek}-${docType}`,
                    id_proyek: p.id_proyek,
                    category: 'proyek',
                    doc_type: docType,
                    doc_label: docLabels[docType] || docType,
                    nama_pemilik: p.nama_proyek,
                    nik_atau_ktm: '-',
                    instansi: 'Vendor / Kontraktor',
                    unit_kerja: '-',
                    jabatan: '-',
                    proyek: p.nama_proyek,
                    tanggal: p.createdAt,
                    status_berkas: p.status_proyek,
                    file_url: fileDbPath ? `uploads/${filename}` : null,
                    file_name: filename,
                    file_type: fileType,
                    file_exists: fileExists,
                    is_digital_agreement: false,
                    keterangan: fileExists ? 'Dokumen Proyek Terlampir' : (fileDbPath ? 'File Tercatat di Database' : '-')
                };
            });

            return res.json({ success: true, count: results.length, data: results });
        }

        // Pengajuan Permit (Karyawan)
        const wherePermit = {};
        if (startDate && endDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            wherePermit.tanggal_pengajuan = { [Op.between]: [start, end] };
        } else if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            wherePermit.tanggal_pengajuan = { [Op.gte]: start };
        } else if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            wherePermit.tanggal_pengajuan = { [Op.lte]: end };
        }

        if (docType === 'file_safety_induksi') {
            wherePermit[Op.or] = [
                { setuju_aturan_k3: true },
                { file_safety_induksi: { [Op.not]: null } }
            ];
        } else if (docType === 'all') {
            // No strict file constraint, will inspect all permit docs
        } else {
            wherePermit[docType] = { [Op.not]: null };
        }

        // Search Karyawan & Instansi
        let instansiIds = [];
        if (search && search.trim() !== '') {
            try {
                const matchingInstansi = await MasterInstansi.findAll({
                    where: { nama_instansi: { [Op.like]: `%${search.trim()}%` } },
                    attributes: ['id_instansi']
                });
                instansiIds = matchingInstansi.map(i => i.id_instansi);
            } catch (err) {
                console.error("Error finding instansi:", err);
            }
        }

        const includeKaryawan = {
            model: Karyawan,
            include: [{ model: MasterInstansi }]
        };

        if (search && search.trim() !== '') {
            const s = `%${search.trim()}%`;
            const orConditions = [
                { nama_lengkap: { [Op.like]: s } },
                { nik_atau_ktm: { [Op.like]: s } },
                { unit_kerja: { [Op.like]: s } }
            ];
            if (instansiIds.length > 0) {
                orConditions.push({ id_instansi: { [Op.in]: instansiIds } });
            }
            includeKaryawan.where = { [Op.or]: orConditions };
        }

        const pengajuanList = await PengajuanPermit.findAll({
            where: wherePermit,
            include: [
                includeKaryawan,
                { model: ProyekVendor }
            ],
            order: [['tanggal_pengajuan', 'DESC']]
        });

        const results = [];

        for (const p of pengajuanList) {
            if (!p.karyawan) continue;

            const nama = p.karyawan?.nama_lengkap || 'Unknown';
            const nik = p.karyawan?.nik_atau_ktm || '-';
            const instansi = p.karyawan?.master_instansi?.nama_instansi || p.karyawan?.unit_kerja || '-';
            const unitKerja = p.karyawan?.unit_kerja || '-';
            const jabatan = p.karyawan?.jabatan || '-';
            const namaProyek = p.proyek_vendor?.nama_proyek || '-';

            if (docType === 'all') {
                const keysToCheck = [
                    'file_safety_induksi',
                    'file_data_diri',
                    'file_foto',
                    'file_bpjs',
                    'file_mcu',
                    'file_kontrak_kerja',
                    'file_sertifikat_sio_sim',
                    'file_sim_a',
                    'file_sio',
                    'file_surat_penunjukan',
                    'file_serah_terima_apd',
                    'file_izin_kerja_berbahaya',
                    'file_hasil_assessment'
                ];

                for (const dk of keysToCheck) {
                    const fileDbPath = p[dk];
                    const isDigitalK3 = dk === 'file_safety_induksi' && p.setuju_aturan_k3 && !fileDbPath;

                    if (fileDbPath || isDigitalK3) {
                        let fileExists = false;
                        if (fileDbPath) {
                            const cleanPath = fileDbPath.startsWith('uploads') ? fileDbPath : path.join('uploads', fileDbPath);
                            const absPath = path.join(__dirname, '..', cleanPath);
                            fileExists = fs.existsSync(absPath);
                        }

                        const filename = fileDbPath ? fileDbPath.split(/[/\\]/).pop() : '';
                        const ext = path.extname(filename).toLowerCase();
                        const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
                        const fileType = isDigitalK3 ? 'digital_agreement' : (isImage ? 'image' : (ext === '.pdf' ? 'pdf' : 'document'));

                        let keterangan = '';
                        if (isDigitalK3) {
                            keterangan = 'Digital Agreement K3 (Disetujui)';
                        } else if (filename.startsWith('ttd_k3')) {
                            keterangan = 'Tanda Tangan K3 Online';
                        } else if (fileExists) {
                            keterangan = 'File Fisik Terlampir';
                        } else {
                            keterangan = 'File Tercatat di Database';
                        }

                        results.push({
                            id: `permit-${p.id_pengajuan}-${dk}`,
                            id_pengajuan: p.id_pengajuan,
                            id_karyawan: p.karyawan?.id_karyawan,
                            category: 'karyawan',
                            doc_type: dk,
                            doc_label: docLabels[dk] || dk,
                            nama_pemilik: nama,
                            nik_atau_ktm: nik,
                            instansi: instansi,
                            unit_kerja: unitKerja,
                            jabatan: jabatan,
                            proyek: namaProyek,
                            tanggal: p.tanggal_pengajuan,
                            status_berkas: p.status_berkas,
                            file_url: fileDbPath ? `uploads/${filename}` : null,
                            file_name: filename,
                            file_type: fileType,
                            file_exists: fileExists,
                            is_digital_agreement: isDigitalK3,
                            setuju_aturan_k3: p.setuju_aturan_k3,
                            keterangan: keterangan
                        });
                    }
                }
            } else {
                const fileDbPath = p[docType];
                const isDigitalK3 = docType === 'file_safety_induksi' && p.setuju_aturan_k3 && !fileDbPath;

                let fileExists = false;
                if (fileDbPath) {
                    const cleanPath = fileDbPath.startsWith('uploads') ? fileDbPath : path.join('uploads', fileDbPath);
                    const absPath = path.join(__dirname, '..', cleanPath);
                    fileExists = fs.existsSync(absPath);
                }

                const filename = fileDbPath ? fileDbPath.split(/[/\\]/).pop() : '';
                const ext = path.extname(filename).toLowerCase();
                const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
                const fileType = isDigitalK3 ? 'digital_agreement' : (isImage ? 'image' : (ext === '.pdf' ? 'pdf' : 'document'));

                let keterangan = '';
                if (isDigitalK3) {
                    keterangan = 'Digital Agreement K3 (Disetujui)';
                } else if (filename.startsWith('ttd_k3')) {
                    keterangan = 'Tanda Tangan K3 Online';
                } else if (fileExists) {
                    keterangan = 'File Fisik Terlampir';
                } else if (fileDbPath) {
                    keterangan = 'File Tercatat di Database';
                } else {
                    keterangan = '-';
                }

                results.push({
                    id: `permit-${p.id_pengajuan}-${docType}`,
                    id_pengajuan: p.id_pengajuan,
                    id_karyawan: p.karyawan?.id_karyawan,
                    category: 'karyawan',
                    doc_type: docType,
                    doc_label: docLabels[docType] || docType,
                    nama_pemilik: nama,
                    nik_atau_ktm: nik,
                    instansi: instansi,
                    unit_kerja: unitKerja,
                    jabatan: jabatan,
                    proyek: namaProyek,
                    tanggal: p.tanggal_pengajuan,
                    status_berkas: p.status_berkas,
                    file_url: fileDbPath ? `uploads/${filename}` : null,
                    file_name: filename,
                    file_type: fileType,
                    file_exists: fileExists,
                    is_digital_agreement: isDigitalK3,
                    setuju_aturan_k3: p.setuju_aturan_k3,
                    keterangan: keterangan
                });
            }
        }

        return res.json({ success: true, count: results.length, data: results });

    } catch (error) {
        console.error("Error preview docs:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat preview data dokumen' });
    }
});

// 3. Endpoint Export Dokumen Audit Massal (ZIP)
router.get('/export-docs', async (req, res) => {
    try {
        const { startDate, endDate, docType, search } = req.query;
        if (!docType) {
            return res.status(400).json({ success: false, message: 'Parameter docType harus diisi' });
        }

        let start = null;
        let end = null;
        if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else if (startDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
        } else if (endDate) {
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        }

        const isProjectDoc = ['file_jsa', 'file_life_saving_talk', 'file_izin_kerja_umum'].includes(docType);

        if (isProjectDoc) {
            const whereClause = {
                [docType]: { [Op.not]: null }
            };
            if (start && end) {
                whereClause.createdAt = { [Op.between]: [start, end] };
            } else if (start) {
                whereClause.createdAt = { [Op.gte]: start };
            } else if (end) {
                whereClause.createdAt = { [Op.lte]: end };
            }

            if (search && search.trim() !== '') {
                whereClause.nama_proyek = { [Op.like]: `%${search.trim()}%` };
            }

            const proyekList = await ProyekVendor.findAll({ where: whereClause });

            if (proyekList.length === 0) {
                return res.status(404).json({ success: false, message: `Tidak ada data dokumen proyek ditemukan untuk kriteria tersebut.` });
            }

            const zip = new AdmZip();
            let fileCount = 0;

            for (const p of proyekList) {
                const namaProyek = p.nama_proyek?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown_Project';
                const fileDbPath = p[docType];
                if (fileDbPath) {
                    const cleanPath = fileDbPath.startsWith('uploads') ? fileDbPath : path.join('uploads', fileDbPath);
                    const filePath = path.join(__dirname, '..', cleanPath);
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
            const dateStr = startDate && endDate ? `_${startDate}_to_${endDate}` : '_filtered';
            res.set('Content-Disposition', `attachment; filename=Export_Proyek_${docType.toUpperCase()}${dateStr}.zip`);
            return res.send(zipBuffer);
        }

        const whereClause = {};
        if (start && end) {
            whereClause.tanggal_pengajuan = { [Op.between]: [start, end] };
        } else if (start) {
            whereClause.tanggal_pengajuan = { [Op.gte]: start };
        } else if (end) {
            whereClause.tanggal_pengajuan = { [Op.lte]: end };
        }

        if (docType === 'file_safety_induksi') {
            whereClause[Op.or] = [
                { setuju_aturan_k3: true },
                { file_safety_induksi: { [Op.not]: null } }
            ];
        } else {
            whereClause[docType] = { [Op.not]: null };
        }

        const includeKaryawan = {
            model: Karyawan,
            include: [{ model: MasterInstansi }]
        };

        if (search && search.trim() !== '') {
            let instansiIds = [];
            try {
                const matchingInstansi = await MasterInstansi.findAll({
                    where: { nama_instansi: { [Op.like]: `%${search.trim()}%` } },
                    attributes: ['id_instansi']
                });
                instansiIds = matchingInstansi.map(i => i.id_instansi);
            } catch (err) {}

            const s = `%${search.trim()}%`;
            const orConditions = [
                { nama_lengkap: { [Op.like]: s } },
                { nik_atau_ktm: { [Op.like]: s } },
                { unit_kerja: { [Op.like]: s } }
            ];
            if (instansiIds.length > 0) {
                orConditions.push({ id_instansi: { [Op.in]: instansiIds } });
            }
            includeKaryawan.where = { [Op.or]: orConditions };
        }

        const pengajuanList = await PengajuanPermit.findAll({
            where: whereClause,
            include: [includeKaryawan]
        });

        if (pengajuanList.length === 0) {
            return res.status(404).json({ success: false, message: `Tidak ada data dokumen ditemukan untuk kriteria tersebut.` });
        }

        const zip = new AdmZip();
        let fileCount = 0;

        for (const p of pengajuanList) {
            if (!p.karyawan) continue;
            const nama = p.karyawan?.nama_lengkap?.replace(/[^a-zA-Z0-9]/g, '_') || 'Unknown';
            const nik = p.karyawan?.nik_atau_ktm || p.id_pengajuan;

            if (docType === 'file_safety_induksi') {
                if (p.file_safety_induksi) {
                    const cleanPath = p.file_safety_induksi.startsWith('uploads') ? p.file_safety_induksi : path.join('uploads', p.file_safety_induksi);
                    const filePath = path.join(__dirname, '..', cleanPath);
                    if (fs.existsSync(filePath)) {
                        const ext = path.extname(filePath) || '.png';
                        zip.addLocalFile(filePath, '', `${nama}_${nik}_SafetyInduksi${ext}`);
                        fileCount++;
                    }
                }
                
                if (p.setuju_aturan_k3 && !p.file_safety_induksi) {
                    const tglStr = p.tanggal_pengajuan ? new Date(p.tanggal_pengajuan).toLocaleString('id-ID') : '-';
                    const logContent = `========================================================\nBUKTI PERSETUJUAN PERATURAN & INDUKSI K3 TAMBANG\n========================================================\n\nNama Pekerja      : ${p.karyawan?.nama_lengkap}\nNomor NIK / KTP   : ${nik}\nUnit Kerja        : ${p.karyawan?.unit_kerja || '-'}\nTanggal Pengajuan : ${tglStr}\nStatus Induksi    : TELAH MENYETUJUI SECARA DIGITAL\n\nPernyataan:\nPekerja telah memahami dan menyatakan tunduk pada Standar Keselamatan dan Kesehatan Kerja (K3) Tambang, Golden Rules, dan Prosedur Keselamatan Kerja PT Semen Padang.\n\n(Dicatat secara otomatis oleh Sistem Tapping Tambang)`;
                    zip.addFile(`${nama}_${nik}_K3_Digital_Agreement.txt`, Buffer.from(logContent, "utf8"));
                    fileCount++;
                }
            } else {
                const fileDbPath = p[docType];
                if (fileDbPath) {
                    const cleanPath = fileDbPath.startsWith('uploads') ? fileDbPath : path.join('uploads', fileDbPath);
                    const filePath = path.join(__dirname, '..', cleanPath);
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
            return res.status(404).json({ success: false, message: 'File fisik dokumen belum tersedia di server.' });
        }

        const zipBuffer = zip.toBuffer();
        res.set('Content-Type', 'application/zip');
        const dateStr = startDate && endDate ? `_${startDate}_to_${endDate}` : '_filtered';
        res.set('Content-Disposition', `attachment; filename=Export_${docType.toUpperCase()}${dateStr}.zip`);
        return res.send(zipBuffer);

    } catch (error) {
        console.error("Error exporting docs:", error);
        res.status(500).json({ success: false, message: 'Gagal mengekspor dokumen' });
    }
});

module.exports = router;
