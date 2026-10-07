const { Karyawan, PengajuanPermit, User } = require('../models');

const fastTrackPengajuan = async (req, res) => {
    try {
        const { 
            nik_atau_ktm, nama_lengkap, id_instansi,
            kategori_pemohon, jenis_izin, 
            tanggal_mulai, tanggal_selesai, kategori_akses,
            id_user_pengaju 
        } = req.body;

        if (!nik_atau_ktm || !nama_lengkap || !kategori_pemohon) {
            return res.status(400).json({ success: false, message: "NIK, Nama Lengkap, dan Kategori Pemohon wajib diisi" });
        }

        // 1. Cari atau buat Profil Karyawan
        let karyawan = await Karyawan.findOne({ where: { nik_atau_ktm } });
        
        const parsedIdInstansi = id_instansi ? parseInt(id_instansi) : null;
        
        if (!karyawan) {
            karyawan = await Karyawan.create({
                nik_atau_ktm, 
                nama_lengkap,
                id_instansi: parsedIdInstansi
            });
        }

        const parsedIdUser = id_user_pengaju ? parseInt(id_user_pengaju) : null;

        // 2. Buat Data Pengajuan Permit (Fast Track -> Siap_Cetak)
        const pengajuan = await PengajuanPermit.create({
            id_karyawan: karyawan.id_karyawan,
            id_user_pengaju: parsedIdUser, 
            kategori_pemohon,
            jenis_izin: jenis_izin || 'Baru',
            jenis_permintaan: 'Permanent', 
            tanggal_mulai: tanggal_mulai || null,
            tanggal_selesai: tanggal_selesai || null,
            kategori_akses: kategori_akses || 'Hijau (Full Pit Access)', 
            setuju_aturan_k3: true,
            status_berkas: 'Siap_Cetak', 
            alasan_justifikasi: 'Fast Track API'
        });

        res.status(201).json({ 
            success: true, 
            message: "Pengajuan permit Fast Track berhasil disimpan dan Siap Dicetak", 
            data: pengajuan 
        });

    } catch (error) {
        console.error("Error fastTrackPengajuan:", error);
        res.status(500).json({ success: false, message: "Gagal menyimpan pengajuan fast track", error: error.message });
    }
};

module.exports = {
    fastTrackPengajuan
};
