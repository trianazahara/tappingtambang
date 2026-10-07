const cron = require('node-cron');
const { Op } = require('sequelize');
const { PengajuanPermit, Karyawan, User, ProyekVendor } = require('./models');
const { sendEvaluationNotification, sendSimExpiryNotification, sendKontrakExpiryNotification } = require('./utils/mailer');

const startCronJobs = () => {
    // Jalankan setiap hari jam 08:00 pagi
    cron.schedule('0 8 * * *', async () => {
        console.log('Menjalankan cron job harian: Cek Evaluasi Permit & SIM Expired');
        const now = new Date();
        
        try {
            // 1. Cek Evaluasi 3 Bulan untuk Permit Hijau & Biru
            const tigaBulanLalu = new Date();
            tigaBulanLalu.setMonth(tigaBulanLalu.getMonth() - 3);
            
            // Kita anggap pengajuan yang aktif adalah yang sudah disetujui (minimal Siap_Cetak) 
            // dan memiliki kategori akses Hijau atau Biru
            const permitsEvaluasi = await PengajuanPermit.findAll({
                where: {
                    kategori_akses: {
                        [Op.in]: ['Hijau (Full Pit Access)', 'Biru (In Pit Access)']
                    },
                    status_berkas: {
                        [Op.in]: ['Siap_Cetak', 'Disetujui'] // Status aktif
                    },
                    tanggal_mulai: {
                        [Op.lte]: tigaBulanLalu // Mulai >= 3 bulan yang lalu
                    }
                    // Anda bisa menambahkan flag 'sudah_dievaluasi' ke depannya agar tidak dikirim berkali-kali
                },
                include: [
                    { model: Karyawan },
                    { model: User }
                ]
            });

            for (const permit of permitsEvaluasi) {
                const toEmail = permit.Karyawan?.email || permit.User?.email;
                if (toEmail) {
                    await sendEvaluationNotification(toEmail, permit);
                }
            }

            // 2. Cek SIM Expired
            // H-30, H-14, H-7, H-3, atau expired
            const h30 = new Date(); h30.setDate(h30.getDate() + 30);
            
            const permitsSim = await PengajuanPermit.findAll({
                where: {
                    tanggal_berlaku_sim: {
                        [Op.not]: null,
                        [Op.lte]: h30 // Tgl berlaku kurang dari atau sama dengan H+30
                    },
                    status_berkas: {
                        [Op.notIn]: ['Ditolak']
                    }
                },
                include: [
                    { model: Karyawan },
                    { model: User }
                ]
            });

            for (const permit of permitsSim) {
                const toEmail = permit.Karyawan?.email || permit.User?.email;
                if (toEmail) {
                    const simDate = new Date(permit.tanggal_berlaku_sim);
                    const sisaHari = Math.ceil((simDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (sisaHari === 30 || sisaHari === 14 || sisaHari === 7 || sisaHari === 3 || sisaHari <= 0) {
                        await sendSimExpiryNotification(toEmail, permit, sisaHari);
                    }
                }
            }

            // 3. Cek Kontrak Expired (ProyekVendor)
            // H-30, H-14, H-7, H-3, atau expired
            const proyekAktif = await ProyekVendor.findAll({
                where: {
                    status_proyek: 'Aktif',
                    tanggal_selesai: {
                        [Op.lte]: h30
                    }
                },
                include: [{ model: User }]
            });

            for (const proyek of proyekAktif) {
                const toEmail = proyek.User?.email;
                if (toEmail) {
                    const endDate = new Date(proyek.tanggal_selesai);
                    const sisaHari = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
                    
                    if (sisaHari === 30 || sisaHari === 14 || sisaHari === 7 || sisaHari === 3 || sisaHari <= 0) {
                        await sendKontrakExpiryNotification(toEmail, proyek, sisaHari);
                    }
                }
            }

        } catch (error) {
            console.error('Error saat menjalankan cron job:', error);
        }
    });
};

module.exports = startCronJobs;
