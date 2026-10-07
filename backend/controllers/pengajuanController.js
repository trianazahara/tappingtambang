const { Karyawan, PengajuanPermit, SuratSehat, IzinArea, MasterArea } = require('../models');

// Handler untuk POST /api/pengajuan
const submitPengajuan = async (req, res) => {
    try {
        const { 
            // Biodata
            nik_atau_ktm, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, 
            agama, golongan_darah, alamat_rumah, no_hp, email, jabatan, unit_kerja, id_instansi,
            riwayat_pendidikan, sertifikasi_keahlian, pendidikan_khusus,
            
            // Pengajuan details
            id_user_pengaju, kategori_pemohon, jenis_izin, jenis_permintaan, 
            tanggal_mulai, tanggal_selesai, kategori_akses, jenis_kendaraan, setuju_aturan_k3,
            alasan_justifikasi, id_proyek, tanggal_berlaku_sim, tanggal_berlaku_sio,
            
            // Area
            area_ids, // array of id_area

            // Surat Sehat Details
            riwayat_penyakit, tinggi_badan, berat_badan, tekanan_darah, denyut_nadi, golongan_darah_sehat,
            q1_sehat, q2_tidur_cukup, q3_jantung, q4_diabetes, q5_kolesterol, 
            q6_obat_kantuk, q7_paham_pekerjaan, q8_paham_risiko, q9_sedia_menegur, q10_sedia_melapor,
            is_draft
        } = req.body;

        // 1. Cari atau buat Profil Karyawan
        let karyawan = null;
        if (nik_atau_ktm && nik_atau_ktm.trim() !== '') {
            karyawan = await Karyawan.findOne({ where: { nik_atau_ktm } });
        }
        const _idInstansi = parseInt(id_instansi);
        const parsedIdInstansi = !isNaN(_idInstansi) ? _idInstansi : null;
        
        const _idProyek = parseInt(id_proyek);
        const parsedIdProyek = !isNaN(_idProyek) ? _idProyek : null;
        
        if (karyawan && parsedIdProyek !== null) {
            const existingPermits = await PengajuanPermit.findAll({
                where: { id_karyawan: karyawan.id_karyawan, id_proyek: parsedIdProyek }
            });
            const isProcessing = existingPermits.some(p => 
                !['Aktif', 'Kedaluwarsa', 'Ditolak'].includes(p.status_berkas)
            );
            if (isProcessing) {
                return res.status(400).json({ success: false, message: "Pekerja ini memiliki pengajuan yang masih diproses di proyek ini (Draft/Pending)." });
            }
        }

        if (!karyawan) {
            karyawan = await Karyawan.create({
                nik_atau_ktm, nama_lengkap, jenis_kelamin, tempat_lahir, 
                tanggal_lahir: (tanggal_lahir && tanggal_lahir !== 'null' && tanggal_lahir !== '') ? tanggal_lahir : null,
                agama, golongan_darah, alamat_rumah, no_hp, email, jabatan, unit_kerja,
                riwayat_pendidikan, sertifikasi_keahlian, pendidikan_khusus,
                id_instansi: parsedIdInstansi
            });
        }

        // 2. Susun path file yang diunggah
        const files = req.files || {};
        const filePaths = {};
        for (const fieldname in files) {
            if (files[fieldname] && files[fieldname].length > 0) {
                // Simpan relative path (e.g., uploads/file-123.pdf)
                filePaths[fieldname] = 'uploads/' + files[fieldname][0].filename;
            }
        }

        // Jika ada ttd_k3 (online signature), simpan sebagai file_safety_induksi
        if (req.body.ttd_k3) {
            const fs = require('fs');
            const path = require('path');
            const base64Data = req.body.ttd_k3.replace(/^data:image\/png;base64,/, "");
            const filename = `ttd_k3_${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
            const filepath = path.join(__dirname, '../uploads', filename);
            fs.writeFileSync(filepath, base64Data, 'base64');
            filePaths['file_safety_induksi'] = 'uploads/' + filename;
        }

        // 3. Jika ini adalah dari Proyek Kolektif, timpa beberapa value dari proyek
        let final_kategori_akses = kategori_akses;
        let final_tanggal_mulai = tanggal_mulai;
        let final_tanggal_selesai = tanggal_selesai;
        let final_area_ids = area_ids;

        if (id_proyek && id_proyek !== 'null') {
            const { ProyekVendor, ProyekArea } = require('../models');
            const proyek = await ProyekVendor.findByPk(id_proyek, {
                include: [{ model: require('../models/MasterArea'), through: { attributes: [] } }]
            });
            if (proyek) {
                // Gunakan default dari proyek hanya jika tidak diisi secara spesifik untuk orang ini
                if (!tanggal_mulai) final_tanggal_mulai = proyek.tanggal_mulai;
                if (!tanggal_selesai) final_tanggal_selesai = proyek.tanggal_selesai;
                if (!area_ids || area_ids.length === 0) final_area_ids = proyek.master_areas ? proyek.master_areas.map(a => a.id_area) : area_ids;
            }
        }

        final_kategori_akses = final_kategori_akses || '';

        const _idUser = parseInt(id_user_pengaju);
        const parsedIdUser = !isNaN(_idUser) ? _idUser : null;

        // 4. Buat Data Pengajuan Permit
        const pengajuan = await PengajuanPermit.create({
            id_karyawan: karyawan.id_karyawan,
            id_user_pengaju: parsedIdUser,
            kategori_pemohon,
            jenis_izin,
            jenis_permintaan,
            tanggal_mulai: (final_tanggal_mulai && final_tanggal_mulai !== 'null' && final_tanggal_mulai !== '') ? final_tanggal_mulai : null,
            tanggal_selesai: (final_tanggal_selesai && final_tanggal_selesai !== 'null' && final_tanggal_selesai !== '') ? final_tanggal_selesai : null,
            kategori_akses: final_kategori_akses,
            jenis_kendaraan,
            alasan_justifikasi,
            setuju_aturan_k3: setuju_aturan_k3 === 'true' || setuju_aturan_k3 === true,
            id_proyek: parsedIdProyek,
            tanggal_berlaku_sim: (tanggal_berlaku_sim && tanggal_berlaku_sim !== 'null' && tanggal_berlaku_sim !== '') ? tanggal_berlaku_sim : null,
            tanggal_berlaku_sio: (tanggal_berlaku_sio && tanggal_berlaku_sio !== 'null' && tanggal_berlaku_sio !== '') ? tanggal_berlaku_sio : null,
            kode_ujian_online: ['Hijau', 'Biru', 'Orange'].some(color => final_kategori_akses.includes(color)) 
                ? Math.random().toString(36).substring(2, 8).toUpperCase() 
                : null,
            status_berkas: is_draft === 'true' || is_draft === true ? 'Draft' : 
                (['Hijau', 'Biru', 'Orange'].some(color => final_kategori_akses.includes(color)) ? 'Menunggu_Ujian' : 'Pending_Admin'),

            
            // Masukkan data file
            file_foto: filePaths['file_foto'],
            file_bpjs: filePaths['file_bpjs'],
            file_data_diri: filePaths['file_data_diri'],
            file_mcu: filePaths['file_mcu'],
            file_kontrak_kerja: filePaths['file_kontrak_kerja'],
            file_surat_penunjukan: filePaths['file_surat_penunjukan'],
            file_surat_pengantar: filePaths['file_surat_pengantar'],
            file_prosedur: filePaths['file_prosedur'],
            file_izin_kerja_berbahaya: filePaths['file_izin_kerja_berbahaya'],
            file_serah_terima_apd: filePaths['file_serah_terima_apd'],
            file_permohonan_kimper: filePaths['file_permohonan_kimper'],
            file_sertifikat_sio_sim: filePaths['file_sertifikat_sio_sim'],
            file_sim_a: filePaths['file_sim_a'],
            file_sim_b1: filePaths['file_sim_b1'],
            file_sim_b2: filePaths['file_sim_b2'],
            file_sio: filePaths['file_sio'],
            file_hasil_assessment: filePaths['file_hasil_assessment'],
            file_safety_induksi: filePaths['file_safety_induksi']
        });

        // 4. Buat data Surat Sehat (Linked ke pengajuan)
        if (tinggi_badan && berat_badan) {
            await SuratSehat.create({
                id_pengajuan: pengajuan.id_pengajuan,
                riwayat_penyakit: riwayat_penyakit || '',
                tinggi_badan: parseFloat(tinggi_badan),
                berat_badan: parseFloat(berat_badan),
                tekanan_darah: tekanan_darah || '',
                denyut_nadi: denyut_nadi ? parseInt(denyut_nadi) : null,
                golongan_darah: golongan_darah_sehat || golongan_darah,
                q1_sehat: q1_sehat === 'true' || q1_sehat === true,
                q2_tidur_cukup: q2_tidur_cukup === 'true' || q2_tidur_cukup === true,
                q3_jantung: q3_jantung === 'true' || q3_jantung === true,
                q4_diabetes: q4_diabetes === 'true' || q4_diabetes === true,
                q5_kolesterol: q5_kolesterol === 'true' || q5_kolesterol === true,
                q6_obat_kantuk: q6_obat_kantuk === 'true' || q6_obat_kantuk === true,
                q7_paham_pekerjaan: q7_paham_pekerjaan === 'true' || q7_paham_pekerjaan === true,
                q8_paham_risiko: q8_paham_risiko === 'true' || q8_paham_risiko === true,
                q9_sedia_menegur: q9_sedia_menegur === 'true' || q9_sedia_menegur === true,
                q10_sedia_melapor: q10_sedia_melapor === 'true' || q10_sedia_melapor === true
            });
        }

        // 6. Hubungkan Area (Junction Table IzinArea)
        if (final_area_ids) {
            let parsedAreaIds = typeof final_area_ids === 'string' ? JSON.parse(final_area_ids) : final_area_ids;
            
            if (Array.isArray(parsedAreaIds) && parsedAreaIds.length > 0) {
                const izinAreaRecords = parsedAreaIds.map(id_area => ({
                    id_pengajuan: pengajuan.id_pengajuan,
                    id_area: parseInt(id_area)
                }));
                const { IzinArea } = require('../models');
                await IzinArea.bulkCreate(izinAreaRecords);
            }
        }

        // Send Email Notification to Admin
        const isDraftSubmit = is_draft === 'true' || is_draft === true;
        if (!isDraftSubmit) {
            try {
                const { User } = require('../models');
                const { sendPermitNotification } = require('../utils/mailer');
                const admins = await User.findAll({ where: { role: 'Admin' } });
                for (const admin of admins) {
                    if (admin.email) {
                        await sendPermitNotification(admin.email, nama_lengkap, (id_proyek && id_proyek !== 'null') ? 'Vendor' : 'Internal', 'baru', '');
                    }
                }
            } catch (err) {
                console.error("Failed to send notification email", err);
            }
        }

        res.status(201).json({ 
            success: true, 
            message: "Pengajuan permit berhasil disimpan dan dikirim ke Admin", 
            data: pengajuan 
        });

    } catch (error) {
        console.error("Error submitPengajuan:", error);
        require('fs').writeFileSync('last_error.log', error.stack || error.message);
        res.status(500).json({ success: false, message: "Gagal menyimpan pengajuan", error: error.message });
    }
};

// Handler untuk GET /api/pengajuan (List Pengajuan)
const getListPengajuan = async (req, res) => {
    try {
        const { id_user, role } = req.query; // Ambil role dan id dari query parameter

        let whereClause = {};

        // Filter berdasarkan role
        if (role === 'Pemohon_Mandiri' || role === 'Koordinator_Vendor') {
            // Pemohon hanya melihat pengajuan yang dibuatnya sendiri
            whereClause.id_user_pengaju = id_user;
        } else if (role === 'Kasie_Pemohon') {
            whereClause.status_berkas = 'Pending_Kasie_Pemohon';
        } else if (role === 'Kasie_HSE') {
            whereClause.status_berkas = 'Pending_HSE';
        } else if (role === 'KTT') {
            whereClause.status_berkas = 'Pending_KTT';
        }
        // Admin melihat semuanya, jadi tidak ada where clause tambahan

        const pengajuan = await PengajuanPermit.findAll({
            where: whereClause,
            include: [
                { model: Karyawan, attributes: ['nik_atau_ktm', 'nama_lengkap', 'jabatan', 'unit_kerja'] },
                { model: MasterArea, attributes: ['id_area', 'nama_area'], through: { attributes: [] } },
                { model: require('../models/ProyekVendor') },
                { model: require('../models').RiwayatApproval }
            ],
            order: [['tanggal_pengajuan', 'DESC']]
        });

        res.status(200).json({ success: true, data: pengajuan });
    } catch (error) {
        console.error("Error getListPengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil data pengajuan" });
    }
};

// Handler untuk GET /api/pengajuan/:id (Detail Pengajuan)
const getDetailPengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const { RiwayatApproval } = require('../models');
        const pengajuan = await PengajuanPermit.findByPk(id, {
            include: [
                { model: Karyawan },
                { model: SuratSehat },
                { model: MasterArea, through: { attributes: [] } },
                { model: RiwayatApproval },
                { model: require('../models/ProyekVendor') }
            ]
        });

        if (!pengajuan) {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });
        }

        res.status(200).json({ success: true, data: pengajuan });
    } catch (error) {
        console.error("Error getDetailPengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal mengambil detail pengajuan" });
    }
};

// Handler untuk PUT /api/pengajuan/:id/approve
const approvePengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id_user } = req.body; // Role approver (Admin, Kasie_Pemohon, dll)

        const pengajuan = await PengajuanPermit.findByPk(id);
        if (!pengajuan) return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

        let nextStatus = '';
        let validRole = false;

        switch (pengajuan.status_berkas) {
            case 'Pending_Admin':
                if (role === 'Admin') {
                    // Cek apakah butuh ujian tapi belum selesai
                    const butuhUjian = ['Hijau', 'Biru', 'Orange'].some(color => (pengajuan.kategori_akses || '').includes(color));
                    if (butuhUjian && pengajuan.status_ujian_online !== 'Selesai') {
                        return res.status(400).json({ success: false, message: "Pekerja harus menyelesaikan ujian K3 terlebih dahulu sebelum disetujui Admin." });
                    }
                    nextStatus = 'Pending_Kasie_Pemohon';
                    validRole = true;
                }
                break;
            case 'Pending_Kasie_Pemohon':
                if (role === 'Kasie_Pemohon') {
                    nextStatus = 'Pending_HSE';
                    validRole = true;
                }
                break;
            case 'Pending_HSE':
                if (role === 'Kasie_HSE') {
                    nextStatus = 'Pending_KTT';
                    validRole = true;
                }
                break;
            case 'Pending_KTT':
                if (role === 'KTT') {
                    nextStatus = 'Siap_Cetak';
                    validRole = true;
                }
                break;
            default:
                return res.status(400).json({ success: false, message: "Status tidak dapat di-approve pada tahap ini" });
        }

        if (!validRole) {
            return res.status(403).json({ success: false, message: "Anda tidak memiliki akses untuk menyetujui pada tahap ini" });
        }

        pengajuan.status_berkas = nextStatus;
        await pengajuan.save();

        // (Optional) Catat ke RiwayatApproval
        const { RiwayatApproval } = require('../models');
        await RiwayatApproval.create({
            id_pengajuan: pengajuan.id_pengajuan,
            id_user_approver: id_user,
            status_keputusan: 'Disetujui',
            catatan_revisi: `Disetujui oleh ${role}`
        });

        // Send notification to next approver
        try {
            const { User, Karyawan } = require('../models');
            const { sendPermitNotification } = require('../utils/mailer');
            
            // Get employee name
            const karyawan = await Karyawan.findByPk(pengajuan.id_karyawan);
            const namaPemohon = karyawan ? karyawan.nama_lengkap : 'Pekerja';
            const perusahaan = pengajuan.id_proyek ? 'Vendor' : 'Internal';

            let nextRole = '';
            let actionType = '';
            
            if (nextStatus === 'Pending_Kasie_Pemohon') {
                nextRole = 'Kasie_Pemohon';
                actionType = 'admin';
            } else if (nextStatus === 'Pending_HSE') {
                nextRole = 'Kasie_HSE';
                actionType = 'kasie_pemohon';
            } else if (nextStatus === 'Pending_KTT') {
                nextRole = 'KTT';
                actionType = 'kasie_hse';
            } else if (nextStatus === 'Siap_Cetak') {
                // If fully approved, notify the requester
                actionType = 'ktt';
                const requester = await User.findByPk(pengajuan.id_user_pengaju);
                if (requester && requester.email) {
                    await sendPermitNotification(requester.email, namaPemohon, perusahaan, actionType, '');
                }
            }

            if (nextRole) {
                const nextApprovers = await User.findAll({ where: { role: nextRole } });
                for (const approver of nextApprovers) {
                    if (approver.email) {
                        await sendPermitNotification(approver.email, namaPemohon, perusahaan, actionType, '');
                    }
                }
            }
        } catch (err) {
            console.error("Failed to send approval email", err);
        }

        res.status(200).json({ success: true, message: `Berhasil disetujui. Status: ${nextStatus}`, data: pengajuan });
    } catch (error) {
        console.error("Error approvePengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal memproses persetujuan" });
    }
};

// Handler untuk PUT /api/pengajuan/:id/reject
const rejectPengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, id_user, alasan } = req.body;

        const pengajuan = await PengajuanPermit.findByPk(id);
        if (!pengajuan) return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

        pengajuan.status_berkas = 'Ditolak';
        await pengajuan.save();

        const { RiwayatApproval } = require('../models');
        const catatan = alasan || `Ditolak oleh ${role}`;
        await RiwayatApproval.create({
            id_pengajuan: pengajuan.id_pengajuan,
            id_user_approver: id_user,
            status_keputusan: 'Ditolak',
            catatan_revisi: catatan
        });

        // Send notification to requester
        try {
            const { User, Karyawan } = require('../models');
            const { sendPermitNotification } = require('../utils/mailer');
            
            const requester = await User.findByPk(pengajuan.id_user_pengaju);
            if (requester && requester.email) {
                const karyawan = await Karyawan.findByPk(pengajuan.id_karyawan);
                const namaPemohon = karyawan ? karyawan.nama_lengkap : 'Pekerja';
                const perusahaan = (pengajuan.id_proyek && pengajuan.id_proyek !== 'null') ? 'Vendor' : 'Internal';
                await sendPermitNotification(requester.email, namaPemohon, perusahaan, 'tolak', catatan);
            }
        } catch (err) {
            console.error("Failed to send reject email", err);
        }

        res.status(200).json({ success: true, message: "Pengajuan berhasil ditolak" });
    } catch (error) {
        console.error("Error rejectPengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal menolak pengajuan" });
    }
};
// Handler untuk PUT /api/pengajuan/:id
const updatePengajuan = async (req, res) => {
    try {
        const { id } = req.params;
        const pengajuan = await PengajuanPermit.findByPk(id, { include: [SuratSehat] });
        if (!pengajuan) return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

        const { 
            nik_atau_ktm, nama_lengkap, jenis_kelamin, tempat_lahir, tanggal_lahir, 
            agama, golongan_darah, alamat_rumah, no_hp, email, jabatan, unit_kerja, id_instansi,
            riwayat_pendidikan, sertifikasi_keahlian, pendidikan_khusus,
            kategori_pemohon, jenis_izin, jenis_permintaan, 
            tanggal_mulai, tanggal_selesai, kategori_akses, jenis_kendaraan, setuju_aturan_k3,
            alasan_justifikasi, id_proyek, area_ids, tanggal_berlaku_sim, tanggal_berlaku_sio,
            riwayat_penyakit, tinggi_badan, berat_badan, tekanan_darah, denyut_nadi, golongan_darah_sehat,
            q1_sehat, q2_tidur_cukup, q3_jantung, q4_diabetes, q5_kolesterol, 
            q6_obat_kantuk, q7_paham_pekerjaan, q8_paham_risiko, q9_sedia_menegur, q10_sedia_melapor,
            is_draft
        } = req.body;

        const _idInstansi = parseInt(id_instansi);
        const parsedIdInstansi = !isNaN(_idInstansi) ? _idInstansi : null;

        const _idProyek = parseInt(id_proyek);
        const parsedIdProyek = !isNaN(_idProyek) ? _idProyek : null;

        // Update Karyawan
        let karyawan = await Karyawan.findByPk(pengajuan.id_karyawan);
        if (karyawan) {
            await karyawan.update({
                nik_atau_ktm, nama_lengkap, jenis_kelamin, tempat_lahir, 
                tanggal_lahir: (tanggal_lahir && tanggal_lahir !== 'null' && tanggal_lahir !== '') ? tanggal_lahir : null,
                agama, golongan_darah, alamat_rumah, no_hp, email, jabatan, unit_kerja,
                riwayat_pendidikan, sertifikasi_keahlian, pendidikan_khusus,
                id_instansi: (id_instansi && id_instansi !== 'null' && id_instansi !== 'undefined') ? parseInt(id_instansi) : null
            });
        }

        // Susun path file baru (jika ada)
        const files = req.files || {};
        const filePaths = {};
        for (const fieldname in files) {
            if (files[fieldname] && files[fieldname].length > 0) {
                filePaths[fieldname] = 'uploads/' + files[fieldname][0].filename;
            }
        }

        // Jika ada ttd_k3 (online signature), simpan sebagai file_safety_induksi
        if (req.body.ttd_k3) {
            const fs = require('fs');
            const path = require('path');
            const base64Data = req.body.ttd_k3.replace(/^data:image\/png;base64,/, "");
            const filename = `ttd_k3_update_${Date.now()}_${Math.floor(Math.random()*1000)}.png`;
            const filepath = path.join(__dirname, '../uploads', filename);
            fs.writeFileSync(filepath, base64Data, 'base64');
            filePaths['file_safety_induksi'] = 'uploads/' + filename;
        }

        let final_kategori_akses = kategori_akses || '';
        let final_tanggal_mulai = tanggal_mulai;
        let final_tanggal_selesai = tanggal_selesai;
        let final_area_ids = area_ids;

        if (id_proyek && id_proyek !== 'null') {
            const { ProyekVendor, ProyekArea } = require('../models');
            const proyek = await ProyekVendor.findByPk(id_proyek, {
                include: [{ model: require('../models/MasterArea'), through: { attributes: [] } }]
            });
            if (proyek) {
                if (!tanggal_mulai) final_tanggal_mulai = proyek.tanggal_mulai;
                if (!tanggal_selesai) final_tanggal_selesai = proyek.tanggal_selesai;
                if (!area_ids || area_ids.length === 0) final_area_ids = proyek.master_areas ? proyek.master_areas.map(a => a.id_area) : area_ids;
            }
        }

        // Update Pengajuan
        await pengajuan.update({
            kategori_pemohon, jenis_izin, jenis_permintaan,
            tanggal_mulai: (final_tanggal_mulai && final_tanggal_mulai !== 'null' && final_tanggal_mulai !== '') ? final_tanggal_mulai : null, 
            tanggal_selesai: (final_tanggal_selesai && final_tanggal_selesai !== 'null' && final_tanggal_selesai !== '') ? final_tanggal_selesai : null,
            kategori_akses: final_kategori_akses, jenis_kendaraan, alasan_justifikasi,
            setuju_aturan_k3: setuju_aturan_k3 === 'true' || setuju_aturan_k3 === true,
            status_berkas: is_draft === 'true' || is_draft === true ? 'Draft' : (
                (['Hijau', 'Biru', 'Orange'].some(color => final_kategori_akses.includes(color)) && pengajuan.status_ujian_online !== 'Selesai')
                ? 'Menunggu_Ujian' : 'Pending_Admin'
            ),
            id_proyek: parsedIdProyek,
            tanggal_berlaku_sim: (tanggal_berlaku_sim && tanggal_berlaku_sim !== 'null' && tanggal_berlaku_sim !== '') ? tanggal_berlaku_sim : null,
            tanggal_berlaku_sio: (tanggal_berlaku_sio && tanggal_berlaku_sio !== 'null' && tanggal_berlaku_sio !== '') ? tanggal_berlaku_sio : null,
            kode_ujian_online: ['Hijau', 'Biru', 'Orange'].some(color => final_kategori_akses.includes(color)) 
                ? (pengajuan.kode_ujian_online || Math.random().toString(36).substring(2, 8).toUpperCase()) 
                : null,
            ...filePaths
        });

        // Update Surat Sehat
        if (pengajuan.surat_sehat) {
            await pengajuan.surat_sehat.update({
                riwayat_penyakit, 
                tinggi_badan: (tinggi_badan && tinggi_badan !== 'null' && tinggi_badan !== '') ? parseFloat(tinggi_badan) : null,
                berat_badan: (berat_badan && berat_badan !== 'null' && berat_badan !== '') ? parseFloat(berat_badan) : null, 
                tekanan_darah, 
                denyut_nadi: (denyut_nadi && denyut_nadi !== 'null' && denyut_nadi !== '') ? parseInt(denyut_nadi) : null,
                golongan_darah: golongan_darah_sehat,
                q1_sehat: q1_sehat === 'true' || q1_sehat === true,
                q2_tidur_cukup: q2_tidur_cukup === 'true' || q2_tidur_cukup === true,
                q3_jantung: q3_jantung === 'true' || q3_jantung === true,
                q4_diabetes: q4_diabetes === 'true' || q4_diabetes === true,
                q5_kolesterol: q5_kolesterol === 'true' || q5_kolesterol === true,
                q6_obat_kantuk: q6_obat_kantuk === 'true' || q6_obat_kantuk === true,
                q7_paham_pekerjaan: q7_paham_pekerjaan === 'true' || q7_paham_pekerjaan === true,
                q8_paham_risiko: q8_paham_risiko === 'true' || q8_paham_risiko === true,
                q9_sedia_menegur: q9_sedia_menegur === 'true' || q9_sedia_menegur === true,
                q10_sedia_melapor: q10_sedia_melapor === 'true' || q10_sedia_melapor === true
            });
        } else if (tinggi_badan && berat_badan && tinggi_badan !== 'null' && berat_badan !== 'null') {
            await SuratSehat.create({
                id_pengajuan: pengajuan.id_pengajuan,
                riwayat_penyakit: riwayat_penyakit || '',
                tinggi_badan: parseFloat(tinggi_badan),
                berat_badan: parseFloat(berat_badan),
                tekanan_darah: tekanan_darah || '',
                denyut_nadi: (denyut_nadi && denyut_nadi !== 'null' && denyut_nadi !== '') ? parseInt(denyut_nadi) : null,
                golongan_darah: golongan_darah_sehat || golongan_darah,
                q1_sehat: q1_sehat === 'true' || q1_sehat === true,
                q2_tidur_cukup: q2_tidur_cukup === 'true' || q2_tidur_cukup === true,
                q3_jantung: q3_jantung === 'true' || q3_jantung === true,
                q4_diabetes: q4_diabetes === 'true' || q4_diabetes === true,
                q5_kolesterol: q5_kolesterol === 'true' || q5_kolesterol === true,
                q6_obat_kantuk: q6_obat_kantuk === 'true' || q6_obat_kantuk === true,
                q7_paham_pekerjaan: q7_paham_pekerjaan === 'true' || q7_paham_pekerjaan === true,
                q8_paham_risiko: q8_paham_risiko === 'true' || q8_paham_risiko === true,
                q9_sedia_menegur: q9_sedia_menegur === 'true' || q9_sedia_menegur === true,
                q10_sedia_melapor: q10_sedia_melapor === 'true' || q10_sedia_melapor === true
            });
        }

        // Update IzinArea
        if (final_area_ids) {
            const parsedAreaIds = typeof final_area_ids === 'string' ? JSON.parse(final_area_ids) : final_area_ids;
            if (Array.isArray(parsedAreaIds)) {
                const { IzinArea } = require('../models');
                await IzinArea.destroy({ where: { id_pengajuan: pengajuan.id_pengajuan } });
                if (parsedAreaIds.length > 0) {
                    const izinAreaRecords = parsedAreaIds.map(id_area => ({ id_pengajuan: pengajuan.id_pengajuan, id_area: parseInt(id_area) }));
                    await IzinArea.bulkCreate(izinAreaRecords);
                }
            }
        }

        res.status(200).json({ success: true, message: "Pengajuan berhasil diperbarui", data: pengajuan });
    } catch (error) {
        console.error("Error updatePengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal memperbarui pengajuan" });
    }
};

// Handler untuk PUT /api/pengajuan/:id/submit-draft
const submitDraft = async (req, res) => {
    try {
        const { id } = req.params;
        const pengajuan = await PengajuanPermit.findByPk(id);
        if (!pengajuan) return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

        if (pengajuan.status_berkas !== 'Draft') {
            return res.status(400).json({ success: false, message: "Pengajuan bukan merupakan draft" });
        }

        if (['Hijau', 'Biru', 'Orange'].some(color => (pengajuan.kategori_akses || '').includes(color)) && pengajuan.status_ujian_online !== 'Selesai') {
            pengajuan.status_berkas = 'Menunggu_Ujian';
        } else {
            pengajuan.status_berkas = 'Pending_Admin';
        }
        await pengajuan.save();

        res.status(200).json({ success: true, message: "Pengajuan berhasil dikirim ke Admin", data: pengajuan });
    } catch (error) {
        console.error("Error submitDraft:", error);
        res.status(500).json({ success: false, message: "Gagal memproses pengajuan draft" });
    }
};

const cetakPermit = async (req, res) => {
    try {
        const { id } = req.params;
        const fs = require('fs');
        const path = require('path');
        const PizZip = require('pizzip');
        const Docxtemplater = require('docxtemplater');
        const ImageModule = require('docxtemplater-image-module-free');
        const QRCode = require('qrcode');
        const { Karyawan, MasterArea, KartuAkses } = require('../models');

        const pengajuan = await PengajuanPermit.findByPk(id, {
            include: [
                { model: Karyawan },
                { model: MasterArea, through: { attributes: [] } } // Ambil area yg diizinkan
            ]
        });

        if (!pengajuan) {
            return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });
        }

        // Tentukan template berdasarkan kategori akses atau pemohon
        let templateName = 'merah.docx';
        if (pengajuan.kategori_pemohon === 'Magang') {
            templateName = 'magang.docx';
        } else if (pengajuan.kategori_akses) {
            const lowerAkses = pengajuan.kategori_akses.toLowerCase();
            if (lowerAkses.includes('merah')) templateName = 'merah.docx';
            else if (lowerAkses.includes('hijau')) templateName = 'hijau.docx';
            else if (lowerAkses.includes('biru')) templateName = 'biru.docx';
            else if (lowerAkses.includes('orange')) templateName = 'orange.docx';
        }

        const templatePath = path.join(__dirname, '../uploads/templates', templateName);
        if (!fs.existsSync(templatePath)) {
            return res.status(404).json({ success: false, message: `Template ${templateName} belum diunggah oleh Admin` });
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        // --- IMAGE MODULE SETUP ---
        // Kita butuh buffer gambar untuk dikirim ke docxtemplater
        const imageOpts = {
            centered: false,
            getImage: (tagValue, tagName) => {
                if (!tagValue) {
                    // Return dummy 1x1 transparent PNG to prevent crash
                    return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
                }
                return Buffer.from(tagValue, 'base64'); 
            },
            getSize: (img, tagValue, tagName) => {
                // Jika tidak ada gambar, set ukuran 1x1 agar tidak merusak layout / mendorong teks ke bawah
                if (!tagValue) return [1, 1];
                
                // Sesuaikan ukuran gambar (dalam pixel)
                if (tagName === 'qr_code') return [25, 25]; 
                if (tagName === 'foto') return [55, 74]; // rasio 3x4 standar ID card, diperkecil lagi
                return [50, 50];
            }
        };
        const imageModule = new ImageModule(imageOpts);

        const doc = new Docxtemplater(zip, { 
            paragraphLoop: true, 
            linebreaks: true,
            modules: [imageModule]
        });

        // --- PREPARE DATA ---
        
        // 1. Data Area Baris (Dynamic Looping 3 Kolom)
        // Ambil SEMUA area aktif dari database
        const semuaArea = await MasterArea.findAll({ 
            where: { status_area: 'Aktif' },
            order: [['id_area', 'ASC']]
        });

        // Kumpulkan ID area yang diizinkan untuk pengajuan ini
        const allowedAreaIds = pengajuan.master_areas ? pengajuan.master_areas.map(a => a.id_area) : [];

        // Buat array hasil gabungan (nama area + icon checkbox)
        const areaList = semuaArea.map(area => {
            const isChecked = allowedAreaIds.includes(area.id_area);
            return {
                nama: area.nama_area,
                box: isChecked ? '☑' : '☐'
            };
        });

        // Pecah list menjadi per-baris, masing-masing 3 kolom
        const areaRows = [];
        for (let i = 0; i < areaList.length; i += 3) {
            areaRows.push({
                col1_box: areaList[i] ? areaList[i].box : '',
                col1_nama: areaList[i] ? areaList[i].nama : '',
                col1: areaList[i] ? `${areaList[i].box} ${areaList[i].nama}` : '', // Gabungan box & nama

                col2_box: areaList[i+1] ? areaList[i+1].box : '',
                col2_nama: areaList[i+1] ? areaList[i+1].nama : '',
                col2: areaList[i+1] ? `${areaList[i+1].box} ${areaList[i+1].nama}` : '', // Gabungan box & nama

                col3_box: areaList[i+2] ? areaList[i+2].box : '',
                col3_nama: areaList[i+2] ? areaList[i+2].nama : '',
                col3: areaList[i+2] ? `${areaList[i+2].box} ${areaList[i+2].nama}` : '' // Gabungan box & nama
            });
        }

        // 2. Data QR Code
        // Coba cari kartu akses untuk pengajuan ini. 
        // Biasa dicari lewat id_karyawan (karena tabel KartuAkses relasi ke Karyawan)
        const kartu = await KartuAkses.findOne({
            where: { id_karyawan: pengajuan.id_karyawan },
            order: [['id_kartu', 'DESC']]
        });
        
        let qrBuffer = null;
        const qrContent = kartu ? (kartu.nomor_permit || kartu.uid_kartu) : `PGJ-${pengajuan.id_pengajuan}`;
        try {
            // Generate QR sbg base64, lalu convert ke buffer
            const qrDataUrl = await QRCode.toDataURL(qrContent, { margin: 1 });
            const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, "");
            qrBuffer = Buffer.from(base64Data, 'base64');
        } catch (e) {
            console.error("Gagal generate QR Code", e);
        }

        // 3. Data Foto
        let fotoBuffer = null;
        if (pengajuan.file_foto) {
            // File foto tersimpan misal 'uploads/pengajuan/foto-123.jpg'
            // Kita coba fetch dari lokal
            const fotoPath = path.join(__dirname, '..', pengajuan.file_foto);
            if (fs.existsSync(fotoPath)) {
                fotoBuffer = fs.readFileSync(fotoPath);
            }
        }

        // Fungsi format tanggal agar lebih rapi (misal: 01 Okt 2026)
        const formatDate = (dateStr) => {
            if (!dateStr || dateStr === '-') return '-';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
        };

        // Fungsi format tanggal pendek (misal: 01 Okt)
        const formatDateShort = (dateStr) => {
            if (!dateStr || dateStr === '-') return '-';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
            return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`;
        };

        // 4. Data Kimper (dari KartuAkses)
        let kimperRows = [];
        // Cek kategori akses (Merah biasanya tidak punya KIMPER)
        const isKimperAllowed = pengajuan.kategori_akses && !pengajuan.kategori_akses.toLowerCase().includes('merah');

        if (isKimperAllowed && kartu && (kartu.nomor_license || kartu.type_unit)) {
            let parsedUnits = [];
            try {
                if (kartu.type_unit && kartu.type_unit.startsWith('[')) {
                    parsedUnits = JSON.parse(kartu.type_unit);
                } else if (kartu.type_unit) {
                    parsedUnits = kartu.type_unit.split(',').map(u => ({
                        nama_kendaraan: u.trim(),
                        type_unit: '',
                        status_fr: kartu.jenis_permit || 'F',
                        issued_at: kartu.issued_at || ''
                    })).filter(u => u.nama_kendaraan !== '');
                }
            } catch(e) {
                console.error("Failed to parse type_unit for printing", e);
            }
            
            if (parsedUnits.length === 0) {
                parsedUnits.push({ nama_kendaraan: '-', type_unit: '', status_fr: '-', issued_at: '' });
            }

            parsedUnits.forEach(unit => {
                const combinedUnitStr = unit.type_unit ? `${unit.nama_kendaraan} - ${unit.type_unit}` : unit.nama_kendaraan;
                kimperRows.push({
                    no_license: kartu.nomor_license || '-',
                    type_unit: combinedUnitStr,
                    permit: unit.status_fr === 'R' ? 'Restricted (R)' : 'Full (F)',
                    issued_at: formatDate(unit.issued_at)
                });
            });
        }

        // Siapkan data untuk dirender ke dalam template word
        let perusahaan = pengajuan.karyawan.perusahaan || '-';
        if (pengajuan.kategori_pemohon === 'Internal') {
            perusahaan = 'PT Semen Padang';
        }

        doc.render({
            nama_lengkap: pengajuan.karyawan.nama_lengkap || '-',
            nik: pengajuan.karyawan.nik_atau_ktm || '-',
            departemen: pengajuan.karyawan.departemen || '-',
            perusahaan: perusahaan,
            jabatan: pengajuan.karyawan.jabatan || '-',
            kategori_akses: pengajuan.kategori_akses || '-',
            tanggal_mulai: formatDate(pengajuan.tanggal_mulai),
            tanggal_selesai: formatDate(pengajuan.tanggal_selesai),
            tanggal_cetak: kartu && kartu.tanggal_cetak ? formatDate(kartu.tanggal_cetak) : formatDate(new Date()),
            tanggal_cetak_short: kartu && kartu.tanggal_cetak ? formatDateShort(kartu.tanggal_cetak) : formatDateShort(new Date()),
            qr_code: qrBuffer ? qrBuffer.toString('base64') : null, // konversi ke base64
            foto: fotoBuffer ? fotoBuffer.toString('base64') : null,   // konversi ke base64
            area_rows: areaRows, // untuk perulangan dinamis tabel 3 kolom
            kimper: kimperRows   // untuk tabel KIMPER
        });

        const buf = doc.getZip().generate({ type: 'nodebuffer' });

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'Content-Disposition': `attachment; filename=Permit_${pengajuan.karyawan.nama_lengkap}.docx`,
            'Content-Length': buf.length
        });
        res.send(buf);

    } catch (error) {
        let details = null;
        if (error.properties && error.properties.errors) {
            details = error.properties.errors.map(e => e.message || e.name).join(', ');
        }
        console.error("Error cetakPermit:", error, details);
        res.status(500).json({ success: false, message: "Gagal mencetak permit", error: error.message, stack: error.stack, details });
    }
};

const setAreaKerja = async (req, res) => {
    try {
        const { id } = req.params;
        const { area_ids } = req.body;

        const pengajuan = await PengajuanPermit.findByPk(id);
        if (!pengajuan) return res.status(404).json({ success: false, message: "Pengajuan tidak ditemukan" });

        // Update IzinArea
        if (area_ids) {
            const parsedAreaIds = typeof area_ids === 'string' ? JSON.parse(area_ids) : area_ids;
            if (Array.isArray(parsedAreaIds)) {
                const { IzinArea } = require('../models');
                await IzinArea.destroy({ where: { id_pengajuan: pengajuan.id_pengajuan } });
                if (parsedAreaIds.length > 0) {
                    const izinAreaRecords = parsedAreaIds.map(id_area => ({ id_pengajuan: pengajuan.id_pengajuan, id_area: parseInt(id_area) }));
                    await IzinArea.bulkCreate(izinAreaRecords);
                }
            }
        }

        res.status(200).json({ success: true, message: "Area kerja berhasil diatur" });
    } catch (error) {
        console.error("Error setAreaKerja:", error);
        res.status(500).json({ success: false, message: "Gagal mengatur area kerja" });
    }
};

// Handler untuk Ekspor Excel
const exportExcel = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Pilih data pengajuan terlebih dahulu" });
        }

        const pengajuan = await PengajuanPermit.findAll({
            where: { id_pengajuan: ids },
            include: [
                { model: Karyawan },
                { model: require('../models/ProyekVendor') }
            ]
        });

        const xlsx = require('xlsx');
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const data = pengajuan.map((p, index) => {
            let tglLahir = '-';
            if (p.karyawan && p.karyawan.tanggal_lahir) {
                tglLahir = p.karyawan.tanggal_lahir instanceof Date ? p.karyawan.tanggal_lahir.toISOString().split('T')[0] : String(p.karyawan.tanggal_lahir).split('T')[0];
            }

            return {
                "No": index + 1,
                "ID Pengajuan": p.id_pengajuan,
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
                "Kategori": p.kategori_pemohon,
                "Perusahaan / Proyek": p.proyek_vendor ? p.proyek_vendor.nama_proyek : 'Internal',
                "Jenis Izin": p.jenis_izin,
                "Jenis Permintaan": p.jenis_permintaan,
                "Kategori Akses (Warna)": p.kategori_akses,
                "Tanggal Mulai": p.tanggal_mulai instanceof Date ? p.tanggal_mulai.toISOString().split('T')[0] : String(p.tanggal_mulai || '-').split('T')[0],
                "Tanggal Selesai": p.tanggal_selesai instanceof Date ? p.tanggal_selesai.toISOString().split('T')[0] : String(p.tanggal_selesai || '-').split('T')[0],
                "Jenis Kendaraan": p.jenis_kendaraan,
                "Nilai Ujian K3": p.nilai_ujian_online !== null ? p.nilai_ujian_online : '-',
                "Status": p.status_berkas,
                "File KTP / Data Diri": p.file_data_diri ? p.file_data_diri.replace(/\\/g, '/') : '-',
                "File MCU": p.file_mcu ? p.file_mcu.replace(/\\/g, '/') : '-',
                "File BPJS": p.file_bpjs ? p.file_bpjs.replace(/\\/g, '/') : '-',
                "File Kontrak / SPK": p.file_kontrak_kerja ? p.file_kontrak_kerja.replace(/\\/g, '/') : (
                    p.proyek_vendor && p.proyek_vendor.file_kontrak_kerja ? p.proyek_vendor.file_kontrak_kerja.replace(/\\/g, '/') : '-'
                ),
                "File Surat Penunjukan": p.file_surat_penunjukan ? p.file_surat_penunjukan.replace(/\\/g, '/') : (
                    p.proyek_vendor && p.proyek_vendor.file_surat_penunjukan ? p.proyek_vendor.file_surat_penunjukan.replace(/\\/g, '/') : '-'
                ),
                "File Dok. Safety Induksi": p.file_safety_induksi ? p.file_safety_induksi.replace(/\\/g, '/') : '-'
            };
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Pengajuan Permit");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Disposition', 'attachment; filename="Laporan_Permit.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error("Error exportExcel:", error);
        res.status(500).json({ success: false, message: "Gagal mengekspor data" });
    }
};

// Handler untuk Download Dokumen (ZIP)
const exportDocs = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: "Pilih data pengajuan terlebih dahulu" });
        }

        const pengajuan = await PengajuanPermit.findAll({
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
        
        const data = [];

        pengajuan.forEach((p, index) => {
            const folderName = `${p.id_pengajuan}_${p.karyawan ? p.karyawan.nama_lengkap.replace(/[^a-zA-Z0-9]/g, '_') : 'Unknown'}`;
            
            const filesToAdd = [
                { key: 'file_foto', name: p.file_foto },
                { key: 'file_surat_penunjukan', name: p.file_surat_penunjukan },
                { key: 'file_data_diri', name: p.file_data_diri },
                { key: 'file_permohonan_kimper', name: p.file_permohonan_kimper },
                { key: 'file_bpjs', name: p.file_bpjs },
                { key: 'file_mcu', name: p.file_mcu },
                { key: 'file_surat_pengantar', name: p.file_surat_pengantar },
                { key: 'file_prosedur', name: p.file_prosedur },
                { key: 'file_izin_kerja_berbahaya', name: p.file_izin_kerja_berbahaya },
                { key: 'file_serah_terima_apd', name: p.file_serah_terima_apd },
                { key: 'file_kontrak_kerja', name: p.file_kontrak_kerja },
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
                if (!fs.existsSync(localPath)) return '-'; // Pastikan file benar-benar ada di server agar sinkron dengan zip
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
                "No": index + 1,
                "ID Pengajuan": p.id_pengajuan,
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
                "Kategori": p.kategori_pemohon,
                "Perusahaan / Proyek": p.proyek_vendor ? p.proyek_vendor.nama_proyek : 'Internal',
                "Jenis Izin": p.jenis_izin,
                "Jenis Permintaan": p.jenis_permintaan,
                "Kategori Akses (Warna)": p.kategori_akses,
                "Tanggal Mulai": p.tanggal_mulai instanceof Date ? p.tanggal_mulai.toISOString().split('T')[0] : String(p.tanggal_mulai || '-').split('T')[0],
                "Tanggal Selesai": p.tanggal_selesai instanceof Date ? p.tanggal_selesai.toISOString().split('T')[0] : String(p.tanggal_selesai || '-').split('T')[0],
                "Jenis Kendaraan": p.jenis_kendaraan,
                "Nilai Ujian K3": p.nilai_ujian_online !== null ? p.nilai_ujian_online : '-',
                "Status": p.status_berkas,
                "Link Foto": getLink(p.file_foto),
                "Link KTP / Data Diri": getLink(p.file_data_diri),
                "Link MCU": getLink(p.file_mcu),
                "Link BPJS": getLink(p.file_bpjs),
                "Link Kontrak / SPK": getLink(p.file_kontrak_kerja),
                "Link Surat Penunjukan": getLink(p.file_surat_penunjukan),
                "Link Dok. Safety Induksi": getLink(p.file_safety_induksi),
                "Link Permohonan Kimper": getLink(p.file_permohonan_kimper),
                "Link Surat Pengantar": getLink(p.file_surat_pengantar),
                "Link Prosedur": getLink(p.file_prosedur),
                "Link Izin Kerja Berbahaya": getLink(p.file_izin_kerja_berbahaya),
                "Link Serah Terima APD": getLink(p.file_serah_terima_apd),
                "Link SIM A": getLink(p.file_sim_a),
                "Link SIM B1": getLink(p.file_sim_b1),
                "Link SIM B2": getLink(p.file_sim_b2),
                "Link SIO": getLink(p.file_sio),
                "Link Hasil Assessment": getLink(p.file_hasil_assessment)
            });
        });

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        
        // Convert the "LINK:..." string to a clickable hyperlink in Excel
        for (let cellAddress in ws) {
            if (cellAddress[0] === '!') continue;
            const cell = ws[cellAddress];
            if (typeof cell.v === 'string' && cell.v.startsWith('LINK:')) {
                const target = cell.v.substring(5);
                cell.v = "Buka Dokumen"; // display text
                cell.l = { Target: target }; // set hyperlink
            }
        }

        xlsx.utils.book_append_sheet(wb, ws, "Pengajuan Permit");
        const excelBuffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Tambahkan file Excel ke dalam root zip
        zip.addFile("Data_Pengajuan_Permit.xlsx", excelBuffer);

        const zipBuffer = zip.toBuffer();
        res.setHeader('Content-Disposition', 'attachment; filename="Dokumen_dan_Data_Permit.zip"');
        res.setHeader('Content-Type', 'application/zip');
        res.send(zipBuffer);
    } catch (error) {
        console.error("Error exportDocs:", error);
        res.status(500).json({ success: false, message: "Gagal mendownload dokumen" });
    }
};

module.exports = {
    submitPengajuan,
    getListPengajuan,
    getDetailPengajuan,
    updatePengajuan,
    approvePengajuan,
    rejectPengajuan,
    submitDraft,
    setAreaKerja,
    cetakPermit,
    exportExcel,
    exportDocs
};