const express = require('express');
const router = express.Router();
const { KartuAkses, PengajuanPermit, IzinArea, Karyawan, MasterArea, MasterInstansi, ProyekVendor } = require('../models');

// GET all kartu akses or pengajuan siap cetak
router.get('/', async (req, res) => {
    try {
        let pengajuanList = await PengajuanPermit.findAll({
            where: { status_berkas: ['Siap_Cetak', 'Aktif'] },
            include: [
                { 
                    model: Karyawan,
                    include: [
                        { model: KartuAkses },
                        { model: MasterInstansi }
                    ]
                },
                {
                    model: ProyekVendor
                },
                {
                    model: MasterArea,
                    attributes: ['id_area', 'nama_area']
                }
            ],
            order: [['id_pengajuan', 'DESC']]
        });

        res.json({ success: true, data: pengajuanList });
    } catch (error) {
        console.error("Error get kartu:", error);
        res.status(500).json({ success: false, message: 'Gagal memuat data kartu akses' });
    }
});

// POST process kartu akses (Assign Area & Register NFC/Barcode)
router.post('/proses', async (req, res) => {
    try {
        const { id_pengajuan, area_ids, uid_kartu, jenis_teknologi, nomor_permit, warna_kartu, nomor_license, type_unit, jenis_permit, issued_at } = req.body;

        const pengajuan = await PengajuanPermit.findByPk(id_pengajuan);
        if (!pengajuan) {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });
        }

        // 1. Assign Area
        if (area_ids) {
            const parsedAreaIds = typeof area_ids === 'string' ? JSON.parse(area_ids) : area_ids;
            if (Array.isArray(parsedAreaIds)) {
                await IzinArea.destroy({ where: { id_pengajuan: pengajuan.id_pengajuan } });
                if (parsedAreaIds.length > 0) {
                    const izinAreaRecords = parsedAreaIds.map(id_area => ({ 
                        id_pengajuan: pengajuan.id_pengajuan, 
                        id_area: parseInt(id_area) 
                    }));
                    await IzinArea.bulkCreate(izinAreaRecords);
                }
            }
        }

        // 2. Buat Data Kartu Akses
        // Hapus jika sebelumnya sudah ada (regenerate)
        await KartuAkses.destroy({ where: { id_karyawan: pengajuan.id_karyawan } });
        
        // Asumsi masa berlaku kartu = masa berlaku pengajuan permit
        const kartu = await KartuAkses.create({
            id_karyawan: pengajuan.id_karyawan,
            uid_kartu: uid_kartu || `UID-${Date.now()}`, // Kalau barcode, generate UID dummy
            nomor_permit: nomor_permit,
            jenis_teknologi: jenis_teknologi || 'Barcode',
            warna_kartu: warna_kartu || 'Merah',
            status_kartu: 'Aktif',
            tanggal_cetak: new Date(),
            berlaku_hingga: pengajuan.tanggal_selesai,
            nomor_license: nomor_license || null,
            type_unit: type_unit || null,
            jenis_permit: jenis_permit || null,
            issued_at: issued_at || null
        });

        // 3. Update Status Pengajuan
        pengajuan.status_berkas = 'Aktif';
        await pengajuan.save();

        res.status(200).json({ success: true, message: 'Kartu berhasil diproses dan diaktifkan', data: kartu });
    } catch (error) {
        console.error("Error process kartu:", error);
        res.status(500).json({ success: false, message: 'Gagal memproses kartu akses', error: error.message });
    }
});

// Toggle Status Kartu
router.put('/toggle-status/:id', async (req, res) => {
    try {
        const kartu = await KartuAkses.findByPk(req.params.id);
        if (!kartu) {
            return res.status(404).json({ success: false, message: 'Kartu tidak ditemukan' });
        }
        
        kartu.status_kartu = kartu.status_kartu === 'Aktif' ? 'Nonaktif' : 'Aktif';
        await kartu.save();
        
        res.json({ success: true, message: `Status kartu berhasil diubah menjadi ${kartu.status_kartu}`, data: kartu });
    } catch (error) {
        console.error("Error toggle status:", error);
        res.status(500).json({ success: false, message: 'Gagal mengubah status kartu' });
    }
});

// Perpanjang Kartu
router.put('/perpanjang/:id', async (req, res) => {
    try {
        const { tanggal_selesai } = req.body;
        const kartu = await KartuAkses.findByPk(req.params.id);
        if (!kartu) {
            return res.status(404).json({ success: false, message: 'Kartu tidak ditemukan' });
        }
        
        kartu.berlaku_hingga = tanggal_selesai;
        kartu.status_kartu = 'Aktif'; // otomatis aktif jika diperpanjang
        await kartu.save();

        // Update juga di pengajuan permit
        const pengajuan = await PengajuanPermit.findOne({ where: { id_karyawan: kartu.id_karyawan, status_berkas: ['Aktif', 'Siap_Cetak'] } });
        if (pengajuan) {
            pengajuan.tanggal_selesai = tanggal_selesai;
            await pengajuan.save();
        }
        
        res.json({ success: true, message: 'Masa berlaku kartu berhasil diperpanjang', data: kartu });
    } catch (error) {
        console.error("Error perpanjang kartu:", error);
        res.status(500).json({ success: false, message: 'Gagal memperpanjang kartu' });
    }
});

// Export Excel Kartu Akses
router.post('/export/excel', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Pilih data pengajuan terlebih dahulu" });
        }

        const pengajuan = await PengajuanPermit.findAll({
            where: { id_pengajuan: ids },
            include: [
                { 
                    model: Karyawan,
                    include: [{ model: KartuAkses }]
                },
                { model: require('../models/ProyekVendor') },
                { model: MasterArea, attributes: ['nama_area'] }
            ]
        });

        const xlsx = require('xlsx');
        
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const data = pengajuan.map((p, index) => {
            const kartu = p.karyawan && p.karyawan.kartu_akses && p.karyawan.kartu_akses.length > 0 ? p.karyawan.kartu_akses[0] : null;
            let tglLahir = '-';
            if (p.karyawan && p.karyawan.tanggal_lahir) {
                tglLahir = p.karyawan.tanggal_lahir instanceof Date ? p.karyawan.tanggal_lahir.toISOString().split('T')[0] : String(p.karyawan.tanggal_lahir).split('T')[0];
            }
            return {
                "No": index + 1,
                "Nomor Permit": kartu ? kartu.nomor_permit : '-',
                "UID Kartu / NFC": kartu ? kartu.uid_kartu : '-',
                "Nama Pekerja": p.karyawan ? p.karyawan.nama_lengkap : '-',
                "NIK/KTM": p.karyawan ? p.karyawan.nik_atau_ktm : '-',
                "Jenis Kelamin": p.karyawan ? (p.karyawan.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan') : '-',
                "Tempat Lahir": p.karyawan ? p.karyawan.tempat_lahir : '-',
                "Tanggal Lahir": tglLahir,
                "Agama": p.karyawan ? p.karyawan.agama : '-',
                "Golongan Darah": p.karyawan ? p.karyawan.golongan_darah : '-',
                "Alamat Rumah": p.karyawan ? p.karyawan.alamat_rumah : '-',
                "No HP": p.karyawan ? p.karyawan.no_hp : '-',
                "Jabatan": p.karyawan ? p.karyawan.jabatan : '-',
                "Unit Kerja": p.karyawan ? p.karyawan.unit_kerja : '-',
                "Riwayat Pendidikan": p.karyawan ? p.karyawan.riwayat_pendidikan : '-',
                "Perusahaan / Proyek": p.proyek_vendor ? p.proyek_vendor.nama_proyek : 'Internal',
                "Kategori Pemohon": p.kategori_pemohon,
                "Jenis Izin": p.jenis_izin,
                "Jenis Permintaan": p.jenis_permintaan,
                "Kategori Akses": p.kategori_akses,
                "Tanggal Mulai": p.tanggal_mulai instanceof Date ? p.tanggal_mulai.toISOString().split('T')[0] : String(p.tanggal_mulai || '-').split('T')[0],
                "Tanggal Selesai": p.tanggal_selesai instanceof Date ? p.tanggal_selesai.toISOString().split('T')[0] : String(p.tanggal_selesai || '-').split('T')[0],
                "Jenis Kendaraan": p.jenis_kendaraan,
                "Nilai Ujian K3": p.nilai_ujian_online !== null ? p.nilai_ujian_online : '-',
                "Jenis Permit": kartu ? kartu.jenis_permit : '-',
                "Nomor Lisensi": kartu ? kartu.nomor_license : '-',
                "Tipe Unit": kartu ? kartu.type_unit : '-',
                "Masa Berlaku": kartu && kartu.berlaku_hingga ? (kartu.berlaku_hingga instanceof Date ? kartu.berlaku_hingga.toISOString().split('T')[0] : String(kartu.berlaku_hingga).split('T')[0]) : '-',
                "Status Kartu": kartu ? kartu.status_kartu : '-',
                "Tanggal Cetak": kartu && kartu.tanggal_cetak ? (kartu.tanggal_cetak instanceof Date ? kartu.tanggal_cetak.toISOString().split('T')[0] : String(kartu.tanggal_cetak).split('T')[0]) : '-',
                "File Foto": p.file_foto ? p.file_foto.replace(/\\/g, '/') : '-',
                "File KTP / Data Diri": p.file_data_diri ? p.file_data_diri.replace(/\\/g, '/') : '-',
                "File MCU": p.file_mcu ? p.file_mcu.replace(/\\/g, '/') : '-',
                "File BPJS": p.file_bpjs ? p.file_bpjs.replace(/\\/g, '/') : '-',
                "File Kontrak / SPK": p.file_kontrak_kerja ? p.file_kontrak_kerja.replace(/\\/g, '/') : (
                    p.proyek_vendor && p.proyek_vendor.file_kontrak_kerja ? p.proyek_vendor.file_kontrak_kerja.replace(/\\/g, '/') : '-'
                ),
                "File Surat Penunjukan": p.file_surat_penunjukan ? p.file_surat_penunjukan.replace(/\\/g, '/') : (
                    p.proyek_vendor && p.proyek_vendor.file_surat_penunjukan ? p.proyek_vendor.file_surat_penunjukan.replace(/\\/g, '/') : '-'
                ),
                "File Permohonan Kimper": p.file_permohonan_kimper ? p.file_permohonan_kimper.replace(/\\/g, '/') : '-',
                "File Surat Pengantar": p.file_surat_pengantar ? p.file_surat_pengantar.replace(/\\/g, '/') : '-',
                "File Prosedur": p.file_prosedur ? p.file_prosedur.replace(/\\/g, '/') : '-',
                "File Izin Kerja Berbahaya": p.file_izin_kerja_berbahaya ? p.file_izin_kerja_berbahaya.replace(/\\/g, '/') : '-',
                "File Serah Terima APD": p.file_serah_terima_apd ? p.file_serah_terima_apd.replace(/\\/g, '/') : '-',
                "File SIM A": p.file_sim_a ? p.file_sim_a.replace(/\\/g, '/') : '-',
                "File SIM B1": p.file_sim_b1 ? p.file_sim_b1.replace(/\\/g, '/') : '-',
                "File SIM B2": p.file_sim_b2 ? p.file_sim_b2.replace(/\\/g, '/') : '-',
                "File SIO": p.file_sio ? p.file_sio.replace(/\\/g, '/') : '-',
                "File Hasil Assessment": p.file_hasil_assessment ? p.file_hasil_assessment.replace(/\\/g, '/') : '-',
                "File Dok. Safety Induksi": p.file_safety_induksi ? p.file_safety_induksi.replace(/\\/g, '/') : '-'
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Data Kartu Akses");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Data_Kartu_Akses.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error("Error export Excel Kartu Akses:", error);
        res.status(500).json({ success: false, message: "Gagal mengekspor data kartu akses" });
    }
});
// Export Dokumen (ZIP) Kartu Akses
router.post('/export/docs', async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Pilih data yang akan di-export" });
        }

        const dataKartu = await PengajuanPermit.findAll({
            where: { id_pengajuan: ids },
            include: [
                { model: Karyawan },
                { model: require('../models/ProyekVendor') }
            ]
        });

        const AdmZip = require('adm-zip');
        const xlsx = require('xlsx');
        const fs = require('fs');
        const path = require('path');
        const zip = new AdmZip();
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const data = [];

        for (const p of dataKartu) {
            const kartu = await KartuAkses.findOne({ where: { id_karyawan: p.id_karyawan }, order: [['issued_at', 'DESC']] });
            const folderName = `${p.id_pengajuan}_${p.karyawan ? p.karyawan.nama_lengkap.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown'}`;
            
            const filesToAdd = [
                { key: 'file_foto', name: p.file_foto },
                { key: 'file_surat_penunjukan', name: p.file_surat_penunjukan ? p.file_surat_penunjukan : (p.proyek_vendor ? p.proyek_vendor.file_surat_penunjukan : null) },
                { key: 'file_data_diri', name: p.file_data_diri },
                { key: 'file_permohonan_kimper', name: p.file_permohonan_kimper },
                { key: 'file_bpjs', name: p.file_bpjs },
                { key: 'file_mcu', name: p.file_mcu },
                { key: 'file_surat_pengantar', name: p.file_surat_pengantar },
                { key: 'file_prosedur', name: p.file_prosedur },
                { key: 'file_izin_kerja_berbahaya', name: p.file_izin_kerja_berbahaya },
                { key: 'file_serah_terima_apd', name: p.file_serah_terima_apd },
                { key: 'file_kontrak_kerja', name: p.file_kontrak_kerja ? p.file_kontrak_kerja : (p.proyek_vendor ? p.proyek_vendor.file_kontrak_kerja : null) },
                { key: 'file_sim_a', name: p.file_sim_a },
                { key: 'file_sim_b1', name: p.file_sim_b1 },
                { key: 'file_sim_b2', name: p.file_sim_b2 },
                { key: 'file_sio', name: p.file_sio },
                { key: 'file_hasil_assessment', name: p.file_hasil_assessment },
                { key: 'file_safety_induksi', name: p.file_safety_induksi }
            ];

            const getLink = (filePath) => {
                if (!filePath) return '-';
                const localPath = path.join(__dirname, '..', filePath);
                if (!fs.existsSync(localPath)) return '-'; 
                const basename = path.basename(filePath);
                return `LINK:${folderName}/${basename}`;
            };

            filesToAdd.forEach(fileObj => {
                if (fileObj.name) {
                    const filePath = path.join(__dirname, '..', fileObj.name);
                    if (fs.existsSync(filePath)) {
                        zip.addLocalFile(filePath, folderName);
                    }
                }
            });

            let tglLahir = '-';
            if (p.karyawan && p.karyawan.tanggal_lahir) {
                tglLahir = p.karyawan.tanggal_lahir instanceof Date ? p.karyawan.tanggal_lahir.toISOString().split('T')[0] : String(p.karyawan.tanggal_lahir).split('T')[0];
            }

            data.push({
                "ID Pengajuan": p.id_pengajuan,
                "Nomor Permit": kartu ? kartu.nomor_permit : '-',
                "UID Kartu / NFC": kartu ? kartu.uid_kartu : '-',
                "Nama Pekerja": p.karyawan ? p.karyawan.nama_lengkap : '-',
                "NIK/KTM": p.karyawan ? p.karyawan.nik_atau_ktm : '-',
                "Jenis Kelamin": p.karyawan ? (p.karyawan.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan') : '-',
                "Tempat Lahir": p.karyawan ? p.karyawan.tempat_lahir : '-',
                "Tanggal Lahir": tglLahir,
                "Agama": p.karyawan ? p.karyawan.agama : '-',
                "Golongan Darah": p.karyawan ? p.karyawan.golongan_darah : '-',
                "Alamat Rumah": p.karyawan ? p.karyawan.alamat_rumah : '-',
                "No HP": p.karyawan ? p.karyawan.no_hp : '-',
                "Jabatan": p.karyawan ? p.karyawan.jabatan : '-',
                "Unit Kerja": p.karyawan ? p.karyawan.unit_kerja : '-',
                "Riwayat Pendidikan": p.karyawan ? p.karyawan.riwayat_pendidikan : '-',
                "Kategori Pemohon": p.kategori_pemohon,
                "Perusahaan / Proyek": p.proyek_vendor ? p.proyek_vendor.nama_proyek : 'Internal',
                "Jenis Izin": p.jenis_izin,
                "Jenis Permintaan": p.jenis_permintaan,
                "Kategori Akses": p.kategori_akses,
                "Tanggal Mulai": p.tanggal_mulai instanceof Date ? p.tanggal_mulai.toISOString().split('T')[0] : String(p.tanggal_mulai || '-').split('T')[0],
                "Tanggal Selesai": p.tanggal_selesai instanceof Date ? p.tanggal_selesai.toISOString().split('T')[0] : String(p.tanggal_selesai || '-').split('T')[0],
                "Jenis Kendaraan": p.jenis_kendaraan,
                "Nilai Ujian K3": p.nilai_ujian_online !== null ? p.nilai_ujian_online : '-',
                "Jenis Permit": kartu ? kartu.jenis_permit : '-',
                "Nomor Lisensi": kartu ? kartu.nomor_license : '-',
                "Tipe Unit": kartu ? kartu.type_unit : '-',
                "Masa Berlaku": kartu && kartu.berlaku_hingga ? (kartu.berlaku_hingga instanceof Date ? kartu.berlaku_hingga.toISOString().split('T')[0] : String(kartu.berlaku_hingga).split('T')[0]) : '-',
                "Status Kartu": kartu ? kartu.status_kartu : '-',
                "Tanggal Cetak": kartu && kartu.tanggal_cetak ? (kartu.tanggal_cetak instanceof Date ? kartu.tanggal_cetak.toISOString().split('T')[0] : String(kartu.tanggal_cetak).split('T')[0]) : '-',
                "File Foto": getLink(p.file_foto),
                "File Surat Penunjukan": getLink(p.file_surat_penunjukan ? p.file_surat_penunjukan : (p.proyek_vendor ? p.proyek_vendor.file_surat_penunjukan : null)),
                "File KTP / Data Diri": getLink(p.file_data_diri),
                "File Permohonan Kimper": getLink(p.file_permohonan_kimper),
                "File BPJS": getLink(p.file_bpjs),
                "File MCU": getLink(p.file_mcu),
                "File Surat Pengantar": getLink(p.file_surat_pengantar),
                "File Prosedur": getLink(p.file_prosedur),
                "File Izin Kerja Berbahaya": getLink(p.file_izin_kerja_berbahaya),
                "File Serah Terima APD": getLink(p.file_serah_terima_apd),
                "File Kontrak / SPK": getLink(p.file_kontrak_kerja ? p.file_kontrak_kerja : (p.proyek_vendor ? p.proyek_vendor.file_kontrak_kerja : null)),
                "File SIM A": getLink(p.file_sim_a),
                "File SIM B1": getLink(p.file_sim_b1),
                "File SIM B2": getLink(p.file_sim_b2),
                "File SIO": getLink(p.file_sio),
                "File Hasil Assessment": getLink(p.file_hasil_assessment),
                "File Dok. Safety Induksi": getLink(p.file_safety_induksi)
            });
        }

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        
        for (let cellAddress in ws) {
            if (cellAddress[0] === '!') continue;
            const cell = ws[cellAddress];
            if (typeof cell.v === 'string' && cell.v.startsWith('LINK:')) {
                const target = cell.v.substring(5);
                cell.v = "Buka Dokumen";
                cell.l = { Target: target };
            }
        }

        xlsx.utils.book_append_sheet(wb, ws, "Data Kartu Akses");
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        zip.addFile("Data_Kartu_Akses.xlsx", excelBuffer);

        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="Dokumen_Kartu_Akses.zip"');
        res.setHeader('Content-Type', 'application/zip');
        res.send(zipBuffer);
    } catch (error) {
        console.error("Error exportDocs:", error);
        res.status(500).json({ success: false, message: "Gagal mendownload dokumen" });
    }
});

module.exports = router;
