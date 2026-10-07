const { Karyawan, PengajuanPermit, LogTapping, KartuAkses } = require('../models');
const { Op } = require('sequelize');

const getDashboardStats = async (req, res) => {
    try {
        const { role, id_user } = req.query;

        // Basic stats
        const totalKaryawan = await Karyawan.count();
        const permitMenunggu = await PengajuanPermit.count({ 
            where: { 
                status_berkas: {
                    [Op.in]: ['Pending_Admin', 'Pending_Kasie_Pemohon', 'Pending_HSE', 'Pending_KTT', 'Menunggu_Ujian']
                } 
            } 
        });
        const kartuMenunggu = await PengajuanPermit.count({ 
            where: { status_berkas: 'Siap_Cetak' } 
        });
        
        // Tapping hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tappingHariIni = await LogTapping.count({
            where: { waktu_scan: { [Op.gte]: today } }
        });
        const tappingMasukHariIni = await LogTapping.count({
            where: { waktu_scan: { [Op.gte]: today }, jenis_aktivitas: 'Masuk', status_akses: 'Diizinkan' }
        });
        const tappingKeluarHariIni = await LogTapping.count({
            where: { waktu_scan: { [Op.gte]: today }, jenis_aktivitas: 'Keluar', status_akses: 'Diizinkan' }
        });

        // Data chart: Tapping per hari (7 hari terakhir)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        
        const recentTappings = await LogTapping.findAll({
            where: { waktu_scan: { [Op.gte]: sevenDaysAgo } },
            attributes: ['waktu_scan', 'status_akses']
        });

        const tappingChartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(sevenDaysAgo);
            d.setDate(d.getDate() + i);
            const dateStr = d.toLocaleDateString('id-ID', { weekday: 'short' });
            
            // Filter logs for this specific day
            const nextDay = new Date(d);
            nextDay.setDate(nextDay.getDate() + 1);

            const dayLogs = recentTappings.filter(log => {
                const logDate = new Date(log.waktu_scan);
                return logDate >= d && logDate < nextDay;
            });

            const diizinkan = dayLogs.filter(l => l.status_akses === 'Diizinkan').length;
            const ditolak = dayLogs.filter(l => l.status_akses === 'Ditolak').length;

            tappingChartData.push({
                name: dateStr,
                Diizinkan: diizinkan,
                Ditolak: ditolak,
            });
        }

        // Data spesifik role
        let permitSaya = 0;
        let permitDisetujui = 0;
        if (role === 'Pemohon_Mandiri' || role === 'Koordinator_Vendor') {
            permitSaya = await PengajuanPermit.count({ where: { id_user_pengaju: id_user } });
            permitDisetujui = await PengajuanPermit.count({ 
                where: { 
                    id_user_pengaju: id_user, 
                    status_berkas: 'Aktif' 
                } 
            });
        }

        // Hitung pekerja belum keluar > 24 Jam
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
        
        const allDiizinkanLogs = await LogTapping.findAll({
            where: { status_akses: 'Diizinkan' },
            order: [['waktu_scan', 'DESC']],
            include: [{
                model: KartuAkses,
                include: [{ model: Karyawan }]
            }]
        });
        const latestLogs = {};
        allDiizinkanLogs.forEach(log => {
            if (!latestLogs[log.uid_kartu]) {
                latestLogs[log.uid_kartu] = log;
            }
        });
        let peringatan24Jam = 0;
        let peringatan24JamList = [];
        Object.values(latestLogs).forEach(log => {
            if (log.jenis_aktivitas === 'Masuk' && new Date(log.waktu_scan) < twentyFourHoursAgo) {
                peringatan24Jam++;
                const nama = log.KartuAkses?.Karyawan?.nama_lengkap || log.uid_kartu;
                peringatan24JamList.push({ 
                    nama, 
                    waktu_scan: log.waktu_scan, 
                    uid_kartu: log.uid_kartu 
                });
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalKaryawan,
                permitMenunggu,
                kartuMenunggu,
                tappingHariIni,
                tappingMasukHariIni,
                tappingKeluarHariIni,
                tappingChartData,
                permitSaya,
                permitDisetujui,
                peringatan24Jam,
                peringatan24JamList
            }
        });
    } catch (error) {
        console.error('Error getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data dashboard' });
    }
};

module.exports = {
    getDashboardStats
};
