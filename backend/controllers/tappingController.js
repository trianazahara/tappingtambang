const { KartuAkses, Karyawan, LogTapping, PengajuanPermit, User, MasterInstansi, ProyekVendor } = require('../models');
const { Op } = require('sequelize');

const parseKendaraanList = (rawTypeUnit) => {
    if (!rawTypeUnit) return [];
    if (Array.isArray(rawTypeUnit)) return rawTypeUnit;
    if (typeof rawTypeUnit !== 'string') return [];

    const trimmed = rawTypeUnit.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
        try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [{ nama_kendaraan: trimmed }];
        } catch (e) {
            return [{ nama_kendaraan: trimmed }];
        }
    }
    return [{ nama_kendaraan: trimmed }];
};

const prosesTapping = async (req, res) => {
    try {
        let { uid_kartu, id_user } = req.body;

        if (!uid_kartu || !id_user) {
            return res.status(400).json({ success: false, message: 'UID Kartu dan ID User harus dikirim' });
        }

        uid_kartu = String(uid_kartu).trim();

        if (uid_kartu.includes('/v/')) {
            const parts = uid_kartu.split('/v/');
            uid_kartu = parts[parts.length - 1].split(/[?#]/)[0].replace(/\/+$/, '');
        }

        try {
            uid_kartu = decodeURIComponent(uid_kartu).trim();
        } catch (e) {}

        console.log("=== TAPPING DEBUG ===");
        console.log("Original UID:", uid_kartu);

        // Normalisasi UID (hapus spasi, titik dua, dash) dan buat format dengan titik dua
        const normalizedUid = String(uid_kartu).toUpperCase().replace(/[:-]/g, '').replace(/\s/g, '');
        const formattedUid = normalizedUid.match(/.{1,2}/g)?.join(':') || normalizedUid;

        // Konversi Hex (dari HP) ke Decimal 10 digit (format alat scanner USB PC)
        let decimalUid = null;
        if (/^[0-9A-F]+$/.test(normalizedUid) && normalizedUid.length >= 2 && normalizedUid.length <= 14 && normalizedUid.length % 2 === 0) {
            const reversedHex = normalizedUid.match(/.{2}/g).reverse().join('');
            decimalUid = parseInt(reversedHex, 16).toString().padStart(10, '0');
        }

        console.log("Normalized:", normalizedUid);
        console.log("Formatted:", formattedUid);
        console.log("Decimal Format (USB):", decimalUid);

        // Siapkan array pencarian
        const searchUids = Array.from(new Set([uid_kartu, normalizedUid, formattedUid, ...(decimalUid ? [decimalUid] : [])].filter(Boolean)));

        // Cari kartu akses berdasarkan uid atau nomor barcode (nomor_permit)
        const kartu = await KartuAkses.findOne({
            where: {
                [Op.or]: [
                    { uid_kartu: { [Op.in]: searchUids } },
                    { nomor_permit: { [Op.in]: searchUids } }
                ]
            },
            include: [{
                model: Karyawan,
                include: [{ model: MasterInstansi }]
            }]
        });

        let statusAkses = 'Ditolak';
        let keteranganSistem = 'Kartu tidak terdaftar';
        let jenisAktivitas = req.body.jenis_aktivitas || 'Masuk';
        let karyawanInfo = null;
        let visitor = null;
        let color = 'red'; // Untuk UI HP Satpam (merah/hijau)

        if (kartu) {
            karyawanInfo = kartu.karyawan ? kartu.karyawan.toJSON() : null;
            const kartuLookupUids = Array.from(new Set([...searchUids, kartu.uid_kartu, kartu.nomor_permit].filter(Boolean)));

            // Cek apakah status kartu aktif
            if (kartu.status_kartu !== 'Aktif') {
                keteranganSistem = `Akses ditolak: Status kartu ${kartu.status_kartu}`;
            }
            // Cek masa berlaku (jika ada masa berlaku)
            else if (kartu.berlaku_hingga && new Date(kartu.berlaku_hingga) < new Date()) {
                keteranganSistem = 'Akses ditolak: Masa berlaku permit telah habis (Expired)';
            }
            else {
                statusAkses = 'Diizinkan';
                keteranganSistem = 'Akses diberikan';
                color = 'green';

                // Cari riwayat log terakhir untuk kartu ini untuk menentukan Masuk/Keluar
                const lastLog = await LogTapping.findOne({
                    where: { uid_kartu: { [Op.in]: kartuLookupUids } },
                    order: [['waktu_scan', 'DESC']]
                });

                if (!req.body.jenis_aktivitas) {
                    if (lastLog && lastLog.jenis_aktivitas === 'Masuk' && lastLog.status_akses === 'Diizinkan') {
                        jenisAktivitas = 'Keluar';
                    } else {
                        jenisAktivitas = 'Masuk';
                    }
                }
            }
        } else {
            // Cek Visitor
            const { Visitor } = require('../models');
            visitor = await Visitor.findOne({
                where: {
                    [Op.or]: [
                        { nomor_kartu: { [Op.in]: searchUids } },
                        { uid_kartu: { [Op.in]: searchUids } }
                    ],
                    status: 'Aktif'
                }
            });

            if (visitor) {
                const { MasterArea } = require('../models');
                const visitorLookupUids = Array.from(new Set([...searchUids, visitor.uid_kartu, visitor.nomor_kartu].filter(Boolean)));
                let visitorAreas = [];
                if (visitor.area_akses) {
                    try {
                        const areaIds = typeof visitor.area_akses === 'string' ? JSON.parse(visitor.area_akses) : visitor.area_akses;
                        if (Array.isArray(areaIds) && areaIds.length > 0) {
                            const areas = await MasterArea.findAll({ where: { id_area: areaIds } });
                            visitorAreas = areas.map(a => a.nama_area);
                        }
                    } catch (e) { }
                }

                // Format Kendaraan untuk Visitor
                const visitorKendaraan = parseKendaraanList(visitor.type_unit);

                karyawanInfo = {
                    nama_lengkap: `${visitor.nama} (Visitor)`,
                    perusahaan: visitor.perusahaan,
                    jabatan: 'Visitor',
                    kategori_akses: visitor.warna_permit,
                    masa_berlaku: visitor.berlaku_hingga,
                    akses_area: visitorAreas.length > 0 ? visitorAreas : ['Sesuai Pendamping'],
                    kendaraan: visitorKendaraan,
                    nomor_license: visitor.nomor_license || '-',
                    issued_at: visitor.issued_at || '-',
                    nik_atau_ktm: '-'
                };

                if (visitor.berlaku_hingga && new Date(visitor.berlaku_hingga) < new Date()) {
                    keteranganSistem = 'Akses ditolak: Masa berlaku visitor telah habis (Expired)';
                } else {
                    statusAkses = 'Diizinkan';
                    keteranganSistem = 'Akses diberikan (Visitor)';
                    color = 'green';

                    const lastLog = await LogTapping.findOne({
                        where: { uid_kartu: { [Op.in]: visitorLookupUids } },
                        order: [['waktu_scan', 'DESC']]
                    });

                    if (!req.body.jenis_aktivitas) {
                        if (lastLog && lastLog.jenis_aktivitas === 'Masuk' && lastLog.status_akses === 'Diizinkan') {
                            jenisAktivitas = 'Keluar';
                        } else {
                            jenisAktivitas = 'Masuk';
                        }
                    }
                }
            }
        }

        const canonicalLogUid = String(
            (kartu && kartu.uid_kartu)
            || (visitor && (visitor.uid_kartu || visitor.nomor_kartu))
            || uid_kartu
        ).slice(0, 100);

        const anomalyLookupUids = Array.from(new Set([
            ...searchUids,
            canonicalLogUid,
            ...(kartu ? [kartu.uid_kartu, kartu.nomor_permit] : []),
            ...(visitor ? [visitor.uid_kartu, visitor.nomor_kartu] : [])
        ].filter(Boolean)));

        // Check anomaly if user explicitly selected jenis_aktivitas and didn't force
        if (req.body.jenis_aktivitas && !req.body.force && statusAkses === 'Diizinkan') {
            const lastLogAny = await LogTapping.findOne({
                where: { uid_kartu: { [Op.in]: anomalyLookupUids } },
                order: [['waktu_scan', 'DESC']]
            });

            if (lastLogAny && lastLogAny.status_akses === 'Diizinkan' && lastLogAny.jenis_aktivitas === req.body.jenis_aktivitas) {
                return res.status(200).json({
                    success: false,
                    needs_confirmation: true,
                    message: `Pekerja ini terakhir sudah tap ${lastLogAny.jenis_aktivitas}. Yakin ingin tap ${req.body.jenis_aktivitas} lagi?`
                });
            }
        }

        // Simpan log tapping (gunakan canonical UID agar relasi kartu_akses & riwayat masuk/keluar konsisten)
        await LogTapping.create({
            uid_kartu: canonicalLogUid,
            id_user: id_user,
            jenis_aktivitas: jenisAktivitas,
            status_akses: statusAkses,
            keterangan_sistem: keteranganSistem
        });

        let fotoURL = null;
        let aksesAreaArr = [];
        let kendaraanArr = [];
        let masaBerlaku = '-';
        let nomorLicense = '-';
        let issuedAt = '-';
        let perusahaanName = karyawanInfo?.perusahaan || karyawanInfo?.master_instansi?.nama_instansi || null;

        if (kartu) {
            masaBerlaku = kartu.berlaku_hingga || '-';
            nomorLicense = kartu.nomor_license || '-';
            issuedAt = kartu.issued_at || '-';

            // Format Kendaraan
            kendaraanArr = parseKendaraanList(kartu.type_unit);

            // Ambil Foto & Area
            if (kartu.id_karyawan) {
                const { MasterArea } = require('../models');
                const lastPermit = await PengajuanPermit.findOne({
                    where: { id_karyawan: kartu.id_karyawan },
                    order: [['tanggal_pengajuan', 'DESC']],
                    include: [
                        {
                            model: MasterArea,
                            through: { attributes: [] }
                        },
                        {
                            model: ProyekVendor,
                            attributes: ['id_proyek', 'nama_proyek']
                        }
                    ]
                });
                if (lastPermit) {
                    if (lastPermit.file_foto) {
                        const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
                        fotoURL = `${backendUrl}/${lastPermit.file_foto.replace(/\\/g, '/')}`;
                    }
                    if (lastPermit.master_areas && lastPermit.master_areas.length > 0) {
                        aksesAreaArr = lastPermit.master_areas.map(a => a.nama_area);
                    }
                    if (!perusahaanName && lastPermit.proyek_vendor?.nama_proyek) {
                        perusahaanName = lastPermit.proyek_vendor.nama_proyek;
                    }
                }
            }

            if (karyawanInfo) {
                karyawanInfo.masa_berlaku = masaBerlaku;
                karyawanInfo.akses_area = aksesAreaArr;
                karyawanInfo.kendaraan = kendaraanArr;
                karyawanInfo.nomor_license = nomorLicense;
                karyawanInfo.issued_at = issuedAt;
                karyawanInfo.kategori_akses = kartu.warna_kartu || karyawanInfo.kategori_akses;
                karyawanInfo.perusahaan = perusahaanName || karyawanInfo.unit_kerja || '-';
            }
        }

        const responseDataObj = karyawanInfo ? {
            nama_lengkap: karyawanInfo.nama_lengkap,
            perusahaan: karyawanInfo.perusahaan || '-',
            nik: karyawanInfo.nik_atau_ktm || '-',
            jabatan: karyawanInfo.jabatan || '-',
            departemen: karyawanInfo.unit_kerja || '-',
            kategori_akses: karyawanInfo.kategori_akses || '-',
            masa_berlaku: karyawanInfo.masa_berlaku || '-',
            akses_area: karyawanInfo.akses_area || [],
            kendaraan: karyawanInfo.kendaraan || [],
            nomor_license: karyawanInfo.nomor_license || '-',
            issued_at: karyawanInfo.issued_at || '-',
            foto: fotoURL,
            jenis_aktivitas: jenisAktivitas,
            uid_kartu: canonicalLogUid
        } : null;

        if (statusAkses === 'Diizinkan') {
            return res.status(200).json({
                success: true,
                message: `Akses Diterima - ${jenisAktivitas}`,
                color: color,
                data: responseDataObj
            });
        } else {
            return res.status(403).json({
                success: false,
                message: keteranganSistem,
                color: color,
                data: responseDataObj,
                uid_kartu: canonicalLogUid
            });
        }

    } catch (error) {
        console.error('Error prosesTapping:', error);
        res.status(500).json({ success: false, message: 'Gagal memproses tapping server error', error: error.message });
    }
};

const getLogTapping = async (req, res) => {
    try {
        const logs = await LogTapping.findAll({
            include: [
                {
                    model: User,
                    attributes: ['id_user', 'nama_lengkap', 'role']
                }
            ],
            order: [['waktu_scan', 'DESC']]
        });

        // Resolve manual join karena log.uid_kartu bisa berupa nomor_permit dari barcode
        const enrichedLogs = await Promise.all(logs.map(async (log) => {
            const normalizedUid = String(log.uid_kartu).toUpperCase().replace(/[:-]/g, '').replace(/\s/g, '');
            const formattedUid = normalizedUid.match(/.{1,2}/g)?.join(':') || normalizedUid;

            let decimalUid = null;
            if (/^[0-9A-F]+$/.test(normalizedUid) && normalizedUid.length % 2 === 0) {
                const reversedHex = normalizedUid.match(/.{2}/g).reverse().join('');
                decimalUid = parseInt(reversedHex, 16).toString().padStart(10, '0');
            }

            const searchUids = [log.uid_kartu, normalizedUid, formattedUid];
            if (decimalUid) searchUids.push(decimalUid);

            const kartu = await KartuAkses.findOne({
                where: {
                    [Op.or]: [
                        { uid_kartu: { [Op.in]: searchUids } },
                        { nomor_permit: { [Op.in]: searchUids } }
                    ]
                },
                include: [{ model: Karyawan }]
            });
            const logJSON = log.toJSON();
            logJSON.kartu_akse = kartu ? kartu.toJSON() : null;

            if (kartu && kartu.karyawan) {
                const { PengajuanPermit } = require('../models');
                const lastPermit = await PengajuanPermit.findOne({
                    where: { id_karyawan: kartu.karyawan.id_karyawan },
                    order: [['id_pengajuan', 'DESC']]
                });
                if (lastPermit && lastPermit.file_foto) {
                    logJSON.kartu_akse.karyawan.foto_3x4 = lastPermit.file_foto.replace(/\\/g, '/');
                }
            }

            if (!kartu) {
                const { Visitor } = require('../models');
                const visitor = await Visitor.findOne({
                    where: {
                        [Op.or]: [
                            { nomor_kartu: { [Op.in]: searchUids } },
                            { uid_kartu: { [Op.in]: searchUids } }
                        ]
                    }
                });
                if (visitor) {
                    logJSON.kartu_akse = {
                        karyawan: {
                            nama_lengkap: `${visitor.nama} (Visitor)`
                        }
                    };
                }
            }

            return logJSON;
        }));

        res.status(200).json(enrichedLogs);
    } catch (error) {
        console.error('Error getLogTapping:', error);
        res.status(500).json({ message: 'Gagal mengambil data log tapping', error: error.message });
    }
};

module.exports = {
    prosesTapping,
    getLogTapping
};
