const fs = require('fs');
const xlsx = require('xlsx');
const { MasterSoal, MasterKendaraan } = require('../models');

// Get all soal
const getAllSoal = async (req, res) => {
    try {
        const { id_kendaraan, status_soal, search } = req.query;
        const whereClause = {};

        if (id_kendaraan !== undefined && id_kendaraan !== '' && id_kendaraan !== 'all') {
            if (id_kendaraan === 'umum' || id_kendaraan === 'null') {
                whereClause.id_kendaraan = null;
            } else {
                whereClause.id_kendaraan = parseInt(id_kendaraan);
            }
        }

        if (status_soal && status_soal !== 'all') {
            whereClause.status_soal = status_soal;
        }

        if (search && search.trim() !== '') {
            const { Op } = require('sequelize');
            whereClause.pertanyaan = { [Op.like]: `%${search.trim()}%` };
        }

        const soal = await MasterSoal.findAll({
            where: whereClause,
            include: [{ model: MasterKendaraan, attributes: ['id_kendaraan', 'nama_kendaraan', 'kategori_kendaraan', 'warna_permit'] }],
            order: [['id_soal', 'DESC']]
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

// Download template Excel untuk impor soal
const downloadTemplate = async (req, res) => {
    try {
        const kendaraanList = await MasterKendaraan.findAll({ 
            attributes: ['id_kendaraan', 'nama_kendaraan', 'kategori_kendaraan', 'warna_permit'] 
        });

        // Sheet 1: Template Soal
        const sampleData = [
            {
                "Pertanyaan": "Berapakah batas kecepatan maksimal kendaraan sarana (Light Vehicle) di area tambang aktif?",
                "Pilihan A": "40 km/jam",
                "Pilihan B": "60 km/jam",
                "Pilihan C": "80 km/jam",
                "Pilihan D": "100 km/jam",
                "Kunci Jawaban": "A",
                "Jenis Kendaraan": "Umum",
                "Status": "Aktif"
            },
            {
                "Pertanyaan": "Alat Pelindung Diri (APD) mandatory yang wajib dipakai saat berada di front penambangan adalah...",
                "Pilihan A": "Helm safety, rompi reflektif, dan sepatu safety",
                "Pilihan B": "Kacamata renang dan sandal gunung",
                "Pilihan C": "Jaket parasut dan sarung tangan wol",
                "Pilihan D": "Topi kain biasa",
                "Kunci Jawaban": "A",
                "Jenis Kendaraan": "Umum",
                "Status": "Aktif"
            },
            {
                "Pertanyaan": "Pemeriksaan harian keliling unit sebelum dioperasikan oleh operator/driver disebut...",
                "Pilihan A": "P2H (Pemeriksaan dan Perawatan Harian)",
                "Pilihan B": "Tune Up Mesin",
                "Pilihan C": "Ganti Sparepart",
                "Pilihan D": "Overhaul",
                "Kunci Jawaban": "A",
                "Jenis Kendaraan": "Dump Truck",
                "Status": "Aktif"
            }
        ];

        const wb = xlsx.utils.book_new();
        const wsSoal = xlsx.utils.json_to_sheet(sampleData);

        wsSoal['!cols'] = [
            { wch: 65 }, // Pertanyaan
            { wch: 35 }, // Pilihan A
            { wch: 35 }, // Pilihan B
            { wch: 35 }, // Pilihan C
            { wch: 35 }, // Pilihan D
            { wch: 15 }, // Kunci Jawaban
            { wch: 22 }, // Jenis Kendaraan
            { wch: 12 }  // Status
        ];

        xlsx.utils.book_append_sheet(wb, wsSoal, "Template Soal");

        // Sheet 2: Panduan & Daftar Kendaraan
        const listData = [
            {
                "Nama Kendaraan": "Umum",
                "Keterangan": "Soal berlaku untuk semua pengemudi/pekerja tanpa memandang unit"
            }
        ];

        kendaraanList.forEach(k => {
            listData.push({
                "Nama Kendaraan": k.nama_kendaraan,
                "Keterangan": `Kategori: ${k.kategori_kendaraan} | Permit: ${k.warna_permit}`
            });
        });

        const wsKendaraan = xlsx.utils.json_to_sheet(listData);
        wsKendaraan['!cols'] = [
            { wch: 30 },
            { wch: 60 }
        ];

        xlsx.utils.book_append_sheet(wb, wsKendaraan, "Daftar Jenis Kendaraan");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Template_Bank_Soal.xlsx"');
        return res.send(buffer);
    } catch (error) {
        console.error("Error downloadTemplate:", error);
        return res.status(500).json({ success: false, message: 'Gagal mengunduh template Excel' });
    }
};

// Import soal dari Excel / CSV
const importSoal = async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'File Excel / CSV wajib diunggah' });
        }

        filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
            return res.status(400).json({ success: false, message: 'File Excel / CSV kosong atau tidak memiliki baris data' });
        }

        // Fetch master kendaraan untuk matching nama kendaraan ke id_kendaraan
        const allKendaraan = await MasterKendaraan.findAll();
        const kendaraanMap = new Map();
        allKendaraan.forEach(k => {
            kendaraanMap.set(k.nama_kendaraan.trim().toLowerCase(), k.id_kendaraan);
        });

        const defaultIdKendaraan = req.body.id_kendaraan_default ? parseInt(req.body.id_kendaraan_default) : null;

        const recordsToInsert = [];
        const skipped = [];

        rawRows.forEach((row, idx) => {
            const rowNumber = idx + 2; // Asumsi baris 1 adalah header

            let pertanyaan = '';
            let pilihan_a = '';
            let pilihan_b = '';
            let pilihan_c = '';
            let pilihan_d = '';
            let kunci_raw = '';
            let kendaraan_raw = '';
            let status_raw = 'Aktif';

            for (const key of Object.keys(row)) {
                const cleanKey = key.toString().trim().toLowerCase().replace(/[^a-z0-9]/g, '');
                const val = (row[key] !== undefined && row[key] !== null) ? row[key].toString().trim() : '';

                if (cleanKey.includes('tanya') || cleanKey.includes('soal') || cleanKey.includes('question')) {
                    pertanyaan = val;
                } else if (cleanKey === 'a' || cleanKey === 'pilihana' || cleanKey === 'opsia' || cleanKey === 'jawabana' || cleanKey === 'optiona') {
                    pilihan_a = val;
                } else if (cleanKey === 'b' || cleanKey === 'pilihanb' || cleanKey === 'opsib' || cleanKey === 'jawabanb' || cleanKey === 'optionb') {
                    pilihan_b = val;
                } else if (cleanKey === 'c' || cleanKey === 'pilihanc' || cleanKey === 'opsic' || cleanKey === 'jawabanc' || cleanKey === 'optionc') {
                    pilihan_c = val;
                } else if (cleanKey === 'd' || cleanKey === 'pilihand' || cleanKey === 'opsid' || cleanKey === 'jawaband' || cleanKey === 'optiond') {
                    pilihan_d = val;
                } else if (cleanKey.includes('kunci') || cleanKey.includes('jawabanbenar') || cleanKey === 'key' || cleanKey === 'answer') {
                    kunci_raw = val;
                } else if (cleanKey.includes('kendaraan') || cleanKey.includes('unit') || cleanKey.includes('kategori')) {
                    kendaraan_raw = val;
                } else if (cleanKey.includes('status')) {
                    status_raw = val;
                }
            }

            // Jika seluruh baris kosong, lewati tanpa dicatat skip
            if (!pertanyaan && !pilihan_a && !pilihan_b && !pilihan_c && !pilihan_d && !kunci_raw) {
                return;
            }

            // Validasi pertanyaan
            if (!pertanyaan) {
                skipped.push({ row: rowNumber, reason: 'Teks pertanyaan kosong' });
                return;
            }

            // Validasi opsi jawaban
            if (!pilihan_a || !pilihan_b || !pilihan_c || !pilihan_d) {
                skipped.push({ row: rowNumber, reason: 'Pilihan A, B, C, dan D harus diisi lengkap' });
                return;
            }

            // Normalisasi Kunci Jawaban
            let kunci_jawaban = null;
            const cleanedKunci = kunci_raw.trim().toUpperCase();

            if (['A', 'B', 'C', 'D'].includes(cleanedKunci)) {
                kunci_jawaban = cleanedKunci;
            } else {
                // Pola 'A. ...' atau 'A) ...'
                const matchLetter = cleanedKunci.match(/^([A-D])[\.\)\s\:\-]/);
                if (matchLetter) {
                    kunci_jawaban = matchLetter[1];
                } else {
                    // Cek jika teks kunci sama persis dengan salah satu opsi (kasus kuis Google Form)
                    const kLower = kunci_raw.trim().toLowerCase();
                    if (kLower === pilihan_a.toLowerCase()) kunci_jawaban = 'A';
                    else if (kLower === pilihan_b.toLowerCase()) kunci_jawaban = 'B';
                    else if (kLower === pilihan_c.toLowerCase()) kunci_jawaban = 'C';
                    else if (kLower === pilihan_d.toLowerCase()) kunci_jawaban = 'D';
                }
            }

            if (!kunci_jawaban) {
                skipped.push({ row: rowNumber, reason: `Kunci jawaban '${kunci_raw}' tidak valid (harus A, B, C, atau D)` });
                return;
            }

            // Normalisasi Status
            const status_soal = status_raw.toLowerCase().includes('non') ? 'Nonaktif' : 'Aktif';

            // Normalisasi id_kendaraan
            let id_kendaraan = null;
            if (kendaraan_raw) {
                const kClean = kendaraan_raw.trim().toLowerCase();
                if (kClean !== 'umum' && kClean !== 'all' && kClean !== 'semua' && kClean !== '-') {
                    if (kendaraanMap.has(kClean)) {
                        id_kendaraan = kendaraanMap.get(kClean);
                    } else {
                        // Cari partial match
                        for (const [namaK, idK] of kendaraanMap.entries()) {
                            if (namaK.includes(kClean) || kClean.includes(namaK)) {
                                id_kendaraan = idK;
                                break;
                            }
                        }
                    }
                }
            }

            // Jika masih null, cek apakah ada default yang dipilih user
            if (id_kendaraan === null && defaultIdKendaraan) {
                id_kendaraan = defaultIdKendaraan;
            }

            recordsToInsert.push({
                pertanyaan,
                pilihan_a,
                pilihan_b,
                pilihan_c,
                pilihan_d,
                kunci_jawaban,
                status_soal,
                id_kendaraan,
                file_gambar: null
            });
        });

        if (recordsToInsert.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Tidak ada data soal valid yang dapat diimpor. Silakan periksa kembali format kolom file Anda.',
                skipped
            });
        }

        const inserted = await MasterSoal.bulkCreate(recordsToInsert);

        return res.status(200).json({
            success: true,
            message: `Berhasil mengimpor ${inserted.length} soal ke database!`,
            count: inserted.length,
            skippedCount: skipped.length,
            skipped
        });

    } catch (error) {
        console.error("Error importSoal:", error);
        return res.status(500).json({ success: false, message: 'Gagal mengimpor file: ' + error.message });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
    }
};

module.exports = {
    getAllSoal,
    createSoal,
    updateSoal,
    deleteSoal,
    downloadTemplate,
    importSoal
};
