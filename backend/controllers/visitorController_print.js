
exports.cetakVisitor = async (req, res) => {
    try {
        const { id } = params = req.params;
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).json({ success: false, message: "Visitor tidak ditemukan" });

        // Cari template (gunakan template permit default/karyawan)
        const { MasterTemplate } = require('../models');
        const template = await MasterTemplate.findOne({ where: { jenis_template: 'Permit', status_template: 'Aktif' } });
        if (!template) return res.status(404).json({ success: false, message: "Template permit tidak ditemukan" });

        const templatePath = path.join(__dirname, '..', template.file_path);
        if (!fs.existsSync(templatePath)) return res.status(404).json({ success: false, message: "File template fisik tidak ditemukan" });

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

        // 2. Data QR
        let qrBuffer = null;
        const qrContent = visitor.uid_kartu || visitor.nomor_kartu;
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
