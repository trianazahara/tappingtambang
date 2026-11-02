const { Visitor, MasterArea, MasterKartuVisitor } = require('../models');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const ImageModule = require('docxtemplater-image-module-free');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// MasterKartuVisitor CRUD
exports.getVisitorCards = async (req, res) => {
    try {
        const cards = await MasterKartuVisitor.findAll({
            order: [['id_kartu', 'ASC']]
        });
        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        console.error("Error getVisitorCards:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data kartu visitor" });
    }
};

exports.createVisitorCard = async (req, res) => {
    try {
        const { nomor_kartu, uid_kartu } = req.body;
        const existing = await MasterKartuVisitor.findOne({ where: { nomor_kartu } });
        if (existing) {
            return res.status(400).json({ success: false, message: "Nomor kartu sudah ada" });
        }
        if (uid_kartu) {
            const existingUid = await MasterKartuVisitor.findOne({ where: { uid_kartu } });
            if (existingUid) {
                return res.status(400).json({ success: false, message: "UID NFC sudah digunakan oleh kartu lain" });
            }
        }
        const card = await MasterKartuVisitor.create({ nomor_kartu, uid_kartu: uid_kartu || null });
        res.status(201).json({ success: true, message: "Kartu berhasil ditambahkan", data: card });
    } catch (error) {
        console.error("Error createVisitorCard:", error);
        res.status(500).json({ success: false, message: "Gagal menambah kartu visitor" });
    }
};

exports.editVisitorCard = async (req, res) => {
    try {
        const { id } = req.params;
        const { nomor_kartu, uid_kartu } = req.body;
        const card = await MasterKartuVisitor.findByPk(id);
        if (!card) return res.status(404).json({ success: false, message: "Kartu tidak ditemukan" });

        if (nomor_kartu !== card.nomor_kartu) {
            const existing = await MasterKartuVisitor.findOne({ where: { nomor_kartu } });
            if (existing) {
                return res.status(400).json({ success: false, message: "Nomor kartu sudah ada" });
            }
        }
        if (uid_kartu && uid_kartu !== card.uid_kartu) {
            const existingUid = await MasterKartuVisitor.findOne({ where: { uid_kartu } });
            if (existingUid) {
                return res.status(400).json({ success: false, message: "UID NFC sudah digunakan oleh kartu lain" });
            }
        }

        card.nomor_kartu = nomor_kartu;
        card.uid_kartu = uid_kartu || null;
        await card.save();
        res.status(200).json({ success: true, message: "Kartu berhasil diupdate", data: card });
    } catch (error) {
        console.error("Error editVisitorCard:", error);
        res.status(500).json({ success: false, message: "Gagal mengupdate kartu visitor" });
    }
};

exports.deleteVisitorCard = async (req, res) => {
    try {
        const { id } = req.params;
        const card = await MasterKartuVisitor.findByPk(id);
        if (!card) return res.status(404).json({ success: false, message: "Kartu tidak ditemukan" });
        if (card.status === 'Digunakan') {
            return res.status(400).json({ success: false, message: "Tidak dapat menghapus kartu yang sedang digunakan" });
        }
        await card.destroy();
        res.status(200).json({ success: true, message: "Kartu berhasil dihapus" });
    } catch (error) {
        console.error("Error deleteVisitorCard:", error);
        res.status(500).json({ success: false, message: "Gagal menghapus kartu visitor" });
    }
};

// Get all visitor logs
exports.getVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.findAll({
            order: [['tanggal_masuk', 'DESC']]
        });
        res.json({ success: true, data: visitors });
    } catch (err) {
        console.error("Error getVisitors:", err);
        res.status(500).json({ success: false, message: "Gagal mengambil data visitor" });
    }
};

// Get single active visitor for public scan
exports.getPublicVisitor = async (req, res) => {
    try {
        const { uid } = req.params;
        let decodedUid = uid;
        try {
            decodedUid = decodeURIComponent(uid);
        } catch (e) {}
        const { Op } = require('sequelize');
        
        const visitor = await Visitor.findOne({
            where: {
                [Op.or]: [
                    { nomor_kartu: uid },
                    { nomor_kartu: decodedUid },
                    { uid_kartu: uid },
                    { uid_kartu: decodedUid }
                ],
                status: 'Aktif'
            }
        });

        if (!visitor) {
            return res.json({ success: false, message: "Kartu visitor tidak aktif atau tidak ditemukan." });
        }

        res.json({ success: true, data: visitor });
    } catch (err) {
        console.error("Error getPublicVisitor:", err);
        res.status(500).json({ success: false, message: "Terjadi kesalahan sistem." });
    }
};

// Create new active visitor
exports.createVisitor = async (req, res) => {
    try {
        const { nomor_kartu, uid_kartu, nama, no_telp, perusahaan, warna_permit, area_akses, berlaku_hingga, type_unit, nomor_license, issued_at } = req.body;
        
        // Check if card exists in master and is available
        const masterCard = await MasterKartuVisitor.findOne({ where: { nomor_kartu } });
        if (!masterCard) {
            return res.status(404).json({ success: false, message: `Kartu dengan nomor ${nomor_kartu} tidak terdaftar di sistem.` });
        }
        if (masterCard.status === 'Digunakan') {
            // Ensure no active session
            const activeSession = await Visitor.findOne({ where: { nomor_kartu, status: 'Aktif' } });
            if (activeSession) {
                return res.status(400).json({ success: false, message: `Kartu ${nomor_kartu} saat ini sedang digunakan oleh ${activeSession.nama}.` });
            }
        }

        // Parse berlaku_hingga if provided, else valid for 1 day
        let validUntil = new Date();
        if (berlaku_hingga) {
            validUntil = new Date(berlaku_hingga);
        } else {
            validUntil.setDate(validUntil.getDate() + 1); // default 1 hari
        }

        // Handle uploaded files
        const files = req.files || {};
        const filePaths = {};
        for (const fieldname in files) {
            if (files[fieldname] && files[fieldname].length > 0) {
                filePaths[fieldname] = 'uploads/' + files[fieldname][0].filename;
            }
        }

        // Handle online signature canvas (ttd_k3 base64)
        if (req.body.ttd_k3) {
            try {
                const base64Data = req.body.ttd_k3.replace(/^data:image\/png;base64,/, "");
                const filename = `ttd_k3_visitor_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
                const filepath = path.join(__dirname, '../uploads', filename);
                fs.writeFileSync(filepath, base64Data, 'base64');
                filePaths['file_safety_induksi'] = 'uploads/' + filename;
            } catch (errSig) {
                console.error("Gagal menyimpan ttd digital visitor:", errSig);
            }
        }

        // Parse area_akses
        let areaAksesData = area_akses;
        if (typeof areaAksesData === 'string') {
            try {
                areaAksesData = JSON.parse(areaAksesData);
            } catch (e) {}
        }

        // Parse assessment_kesehatan
        let assessmentData = req.body.assessment_kesehatan;
        if (typeof assessmentData === 'string') {
            try {
                assessmentData = JSON.parse(assessmentData);
            } catch (e) {}
        } else if (!assessmentData && (req.body.tinggi_badan || req.body.q1_sehat !== undefined)) {
            assessmentData = {
                tinggi_badan: req.body.tinggi_badan || null,
                berat_badan: req.body.berat_badan || null,
                tekanan_darah: req.body.tekanan_darah || '',
                denyut_nadi: req.body.denyut_nadi || null,
                golongan_darah: req.body.golongan_darah || '',
                riwayat_penyakit: req.body.riwayat_penyakit || '',
                q1_sehat: req.body.q1_sehat === true || req.body.q1_sehat === 'true',
                q2_tidur_cukup: req.body.q2_tidur_cukup === true || req.body.q2_tidur_cukup === 'true',
                q3_jantung: req.body.q3_jantung === true || req.body.q3_jantung === 'true',
                q4_diabetes: req.body.q4_diabetes === true || req.body.q4_diabetes === 'true',
                q5_kolesterol: req.body.q5_kolesterol === true || req.body.q5_kolesterol === 'true',
                q6_obat_kantuk: req.body.q6_obat_kantuk === true || req.body.q6_obat_kantuk === 'true',
                q7_paham_pekerjaan: req.body.q7_paham_pekerjaan === true || req.body.q7_paham_pekerjaan === 'true',
                q8_paham_risiko: req.body.q8_paham_risiko === true || req.body.q8_paham_risiko === 'true',
                q9_sedia_menegur: req.body.q9_sedia_menegur === true || req.body.q9_sedia_menegur === 'true',
                q10_sedia_melapor: req.body.q10_sedia_melapor === true || req.body.q10_sedia_melapor === 'true',
            };
        }

        const setujuK3 = req.body.setuju_aturan_k3 === true || req.body.setuju_aturan_k3 === 'true';

        const newVisitor = await Visitor.create({
            nomor_kartu,
            uid_kartu: uid_kartu || null,
            nama,
            no_telp,
            perusahaan,
            warna_permit,
            area_akses: areaAksesData,
            type_unit,
            nomor_license,
            issued_at,
            berlaku_hingga: validUntil,
            status: 'Aktif',
            file_ktp: filePaths['file_ktp'] || req.body.file_ktp || null,
            file_surat_pengantar: filePaths['file_surat_pengantar'] || req.body.file_surat_pengantar || null,
            file_safety_induksi: filePaths['file_safety_induksi'] || req.body.file_safety_induksi || null,
            setuju_aturan_k3: setujuK3,
            assessment_kesehatan: assessmentData || null
        });

        // Update master card status to Digunakan
        masterCard.status = 'Digunakan';
        await masterCard.save();

        res.status(201).json({ success: true, message: "Berhasil menambahkan visitor", data: newVisitor });
    } catch (err) {
        console.error("Error createVisitor:", err);
        res.status(500).json({ success: false, message: "Gagal menambah visitor" });
    }
};

// Edit visitor
exports.editVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const { nomor_kartu, uid_kartu, nama, no_telp, perusahaan, warna_permit, area_akses, berlaku_hingga, type_unit, nomor_license, issued_at } = req.body;
        
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).json({ success: false, message: "Visitor tidak ditemukan" });

        // Check if new nomor_kartu is used by another active visitor
        if (nomor_kartu !== visitor.nomor_kartu) {
            const activeCard = await Visitor.findOne({
                where: { nomor_kartu, status: 'Aktif' }
            });
            if (activeCard) {
                return res.status(400).json({ success: false, message: `Kartu ${nomor_kartu} saat ini sedang aktif digunakan oleh ${activeCard.nama}.` });
            }
        }

        // Handle uploaded files
        const files = req.files || {};
        const filePaths = {};
        for (const fieldname in files) {
            if (files[fieldname] && files[fieldname].length > 0) {
                filePaths[fieldname] = 'uploads/' + files[fieldname][0].filename;
            }
        }

        // Handle online signature canvas (ttd_k3 base64)
        if (req.body.ttd_k3) {
            try {
                const base64Data = req.body.ttd_k3.replace(/^data:image\/png;base64,/, "");
                const filename = `ttd_k3_visitor_${Date.now()}_${Math.floor(Math.random() * 1000)}.png`;
                const filepath = path.join(__dirname, '../uploads', filename);
                fs.writeFileSync(filepath, base64Data, 'base64');
                filePaths['file_safety_induksi'] = 'uploads/' + filename;
            } catch (errSig) {
                console.error("Gagal menyimpan ttd digital visitor:", errSig);
            }
        }

        // Parse area_akses
        let areaAksesData = area_akses;
        if (typeof areaAksesData === 'string') {
            try {
                areaAksesData = JSON.parse(areaAksesData);
            } catch (e) {}
        }

        // Parse assessment_kesehatan
        let assessmentData = req.body.assessment_kesehatan;
        if (typeof assessmentData === 'string') {
            try {
                assessmentData = JSON.parse(assessmentData);
            } catch (e) {}
        } else if (!assessmentData && (req.body.tinggi_badan || req.body.q1_sehat !== undefined)) {
            assessmentData = {
                tinggi_badan: req.body.tinggi_badan || null,
                berat_badan: req.body.berat_badan || null,
                tekanan_darah: req.body.tekanan_darah || '',
                denyut_nadi: req.body.denyut_nadi || null,
                golongan_darah: req.body.golongan_darah || '',
                riwayat_penyakit: req.body.riwayat_penyakit || '',
                q1_sehat: req.body.q1_sehat === true || req.body.q1_sehat === 'true',
                q2_tidur_cukup: req.body.q2_tidur_cukup === true || req.body.q2_tidur_cukup === 'true',
                q3_jantung: req.body.q3_jantung === true || req.body.q3_jantung === 'true',
                q4_diabetes: req.body.q4_diabetes === true || req.body.q4_diabetes === 'true',
                q5_kolesterol: req.body.q5_kolesterol === true || req.body.q5_kolesterol === 'true',
                q6_obat_kantuk: req.body.q6_obat_kantuk === true || req.body.q6_obat_kantuk === 'true',
                q7_paham_pekerjaan: req.body.q7_paham_pekerjaan === true || req.body.q7_paham_pekerjaan === 'true',
                q8_paham_risiko: req.body.q8_paham_risiko === true || req.body.q8_paham_risiko === 'true',
                q9_sedia_menegur: req.body.q9_sedia_menegur === true || req.body.q9_sedia_menegur === 'true',
                q10_sedia_melapor: req.body.q10_sedia_melapor === true || req.body.q10_sedia_melapor === 'true',
            };
        }

        visitor.nomor_kartu = nomor_kartu;
        visitor.uid_kartu = uid_kartu || null;
        visitor.nama = nama;
        visitor.no_telp = no_telp;
        visitor.perusahaan = perusahaan;
        visitor.warna_permit = warna_permit;
        visitor.area_akses = areaAksesData;
        visitor.type_unit = type_unit || '';
        visitor.nomor_license = nomor_license || '';
        visitor.issued_at = issued_at || '';
        
        if (berlaku_hingga) {
            visitor.berlaku_hingga = new Date(berlaku_hingga);
        }

        if (filePaths['file_ktp']) visitor.file_ktp = filePaths['file_ktp'];
        if (filePaths['file_surat_pengantar']) visitor.file_surat_pengantar = filePaths['file_surat_pengantar'];
        if (filePaths['file_safety_induksi']) visitor.file_safety_induksi = filePaths['file_safety_induksi'];
        if (req.body.setuju_aturan_k3 !== undefined) {
            visitor.setuju_aturan_k3 = req.body.setuju_aturan_k3 === true || req.body.setuju_aturan_k3 === 'true';
        }
        if (assessmentData !== undefined) {
            visitor.assessment_kesehatan = assessmentData;
        }

        await visitor.save();

        res.status(200).json({ success: true, message: "Berhasil mengupdate visitor", data: visitor });
    } catch (err) {
        console.error("Error editVisitor:", err);
        res.status(500).json({ success: false, message: "Gagal mengupdate visitor" });
    }
};

// Mark visitor as finished
exports.finishVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).json({ success: false, message: "Visitor tidak ditemukan" });

        visitor.status = 'Selesai';
        visitor.tanggal_selesai = new Date();
        await visitor.save();

        // Release the master card
        const masterCard = await MasterKartuVisitor.findOne({ where: { nomor_kartu: visitor.nomor_kartu } });
        if (masterCard) {
            masterCard.status = 'Tersedia';
            await masterCard.save();
        }

        res.json({ success: true, message: "Visitor berhasil diselesaikan" });
    } catch (err) {
        console.error("Error finishVisitor:", err);
        res.status(500).json({ success: false, message: "Gagal menyelesaikan visitor" });
    }
};

exports.cetakVisitor = async (req, res) => {
    try {
        const { id } = params = req.params;
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).json({ success: false, message: "Visitor tidak ditemukan" });

        let templateName = 'merah.docx';
        if (visitor.warna_permit) {
            const lowerAkses = visitor.warna_permit.toLowerCase();
            if (lowerAkses.includes('merah')) templateName = 'merah.docx';
            else if (lowerAkses.includes('hijau')) templateName = 'hijau.docx';
            else if (lowerAkses.includes('biru')) templateName = 'biru.docx';
            else if (lowerAkses.includes('orange')) templateName = 'orange.docx';
        }

        const templatePath = path.join(__dirname, '../uploads/templates', templateName);
        if (!fs.existsSync(templatePath)) return res.status(404).json({ success: false, message: `File template ${templateName} tidak ditemukan` });

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const imageOpts = {
            centered: false,
            getImage: (tagValue, tagName) => {
                if (!tagValue) return Buffer.from('');
                return Buffer.from(tagValue, 'base64'); 
            },
            getSize: (img, tagValue, tagName) => {
                if (!tagValue) return [1, 1];
                if (tagName === 'qr_code') return [25, 25]; 
                if (tagName === 'foto') return [55, 74]; 
                return [50, 50];
            }
        };
        const imageModule = new ImageModule(imageOpts);

        const doc = new Docxtemplater(zip, { 
            paragraphLoop: true, 
            linebreaks: true,
            modules: [imageModule]
        });

        // 1. Data Area
        const semuaArea = await MasterArea.findAll({ where: { status_area: 'Aktif' }, order: [['id_area', 'ASC']] });
        let allowedAreaIds = [];
        try {
            if (visitor.area_akses) {
                allowedAreaIds = typeof visitor.area_akses === 'string' ? JSON.parse(visitor.area_akses) : visitor.area_akses;
            }
        } catch(e) {}
        
        const areaList = semuaArea.map(area => ({
            nama: area.nama_area,
            box: allowedAreaIds.includes(area.id_area) ? '☑' : '☐'
        }));

        const areaRows = [];
        for (let i = 0; i < areaList.length; i += 3) {
            areaRows.push({
                col1: areaList[i] ? `${areaList[i].box} ${areaList[i].nama}` : '',
                col2: areaList[i+1] ? `${areaList[i+1].box} ${areaList[i+1].nama}` : '',
                col3: areaList[i+2] ? `${areaList[i+2].box} ${areaList[i+2].nama}` : ''
            });
        }

        // 2. Data QR (Sekarang mengarah ke URL Publik)
        let qrBuffer = null;
        const uid = visitor.uid_kartu || visitor.nomor_kartu;
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const qrContent = `${frontendUrl}/taptbg/v/${encodeURIComponent(uid)}`; // URL Public Profile Visitor
        try {
            const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1 });
            const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            qrBuffer = Buffer.from(base64Data, 'base64');
        } catch (e) {}

        const formatDate = (date) => {
            if (!date) return '-';
            const d = new Date(date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
        };
        const formatDateShort = (date) => {
            if (!date) return '-';
            const d = new Date(date);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${d.getDate().toString().padStart(2, '0')} ${months[d.getMonth()]}`;
        };

        doc.render({
            nama_lengkap: visitor.nama,
            nik: visitor.no_telp || '-',
            departemen: '-',
            perusahaan: visitor.perusahaan || '-',
            jabatan: 'Visitor',
            kategori_akses: visitor.warna_permit,
            tanggal_mulai: formatDate(visitor.tanggal_masuk),
            tanggal_selesai: formatDate(visitor.berlaku_hingga),
            tanggal_cetak: formatDate(visitor.tanggal_masuk),
            tanggal_cetak_short: formatDateShort(visitor.tanggal_masuk),
            qr_code: qrBuffer ? qrBuffer.toString('base64') : null,
            foto: null,
            area_rows: areaRows,
            kimper: [{ type_unit: '-', no_license: '-', permit: '-', issued_at: '-' }]
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer' });

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=VisitorPermit_${visitor.nama}.docx`,
            'Content-Length': buf.length
        });
        res.send(buf);

    } catch (error) {
        console.error("Error cetakVisitor:", error);
        res.status(500).json({ success: false, message: "Gagal mencetak permit visitor" });
    }
};

