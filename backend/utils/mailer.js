const nodemailer = require('nodemailer');

// Untuk environment lokal/testing, kita gunakan Ethereal Email.
// Di production, ganti konfigurasi ini menggunakan SMTP sesungguhnya (Gmail, dll) via .env
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

const sendVerificationEmail = async (toEmail, token, namaLengkap, password) => {
    const verificationUrl = `${frontendUrl}/verify?token=${token}`;

    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        subject: 'Verifikasi Email Pendaftaran Akun - PT Semen Padang',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #E11D2E; margin: 0;">Sistem Permit PT Semen Padang</h2>
                </div>
                <p>Halo <strong>${namaLengkap}</strong>,</p>
                <p>Terima kasih telah mendaftar di Sistem Permit PT Semen Padang. Berikut adalah detail akun Anda:</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #E11D2E;">
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${toEmail}</p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> ${password}</p>
                </div>
                
                <p>Untuk menyelesaikan proses pendaftaran dan mengaktifkan akun Anda, silakan verifikasi alamat email ini dengan mengklik tombol di bawah ini:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verificationUrl}" style="background-color: #E11D2E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Verifikasi Email Saya
                    </a>
                </div>
                <p style="font-size: 14px; color: #555;">Jika tombol di atas tidak bisa diklik, silakan *copy* dan *paste* link di bawah ini ke browser komputer Anda:</p>
                <p style="font-size: 14px; color: #0056b3; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px;">${verificationUrl}</p>
                <p>Tautan ini hanya berlaku selama 24 jam. Jika Anda tidak merasa mendaftar di platform ini, abaikan email ini.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Email ini dikirim secara otomatis oleh sistem. Mohon jangan membalas email ini.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);
        // Ethereal email akan generate link preview untuk debugging lokal
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        return { success: true, info };
    } catch (error) {
        console.error('Error sending verification email:', error);
        return { success: false, error };
    }
};

const sendResetPasswordEmail = async (toEmail, code, namaLengkap) => {
    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        subject: 'Reset Password - PT Semen Padang',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #E11D2E; margin: 0;">Sistem Permit PT Semen Padang</h2>
                </div>
                <p>Halo <strong>${namaLengkap}</strong>,</p>
                <p>Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Berikut adalah kode verifikasi Anda:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="background-color: #f1f5f9; color: #333; padding: 15px 30px; border-radius: 5px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border: 1px dashed #ccc;">
                        ${code}
                    </span>
                </div>
                
                <p>Kode ini hanya berlaku selama 1 jam. Jika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan email ini.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Email ini dikirim secara otomatis oleh sistem. Mohon jangan membalas email ini.
                </p>
            </div>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Reset password email sent: %s', info.messageId);
        return { success: true, info };
    } catch (error) {
        console.error('Error sending reset password email:', error);
        return { success: false, error };
    }
};

const sendEvaluationNotification = async (toEmail, permit) => {
    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        cc: 'admin.permit@semenpadang.co.id', // Tembusan ke admin
        subject: 'Pemberitahuan: Evaluasi 3 Bulan Permit Anda',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #E11D2E;">Sistem Permit PT Semen Padang</h2>
                <p>Halo,</p>
                <p>Permit Anda dengan Kategori <strong>${permit.kategori_akses}</strong> telah diterbitkan lebih dari 3 bulan yang lalu.</p>
                <p>Berdasarkan aturan, pemegang permit Biru dan Hijau wajib dievaluasi kembali. Silakan hubungi bagian admin atau HSE untuk informasi lebih lanjut mengenai proses evaluasi Anda.</p>
                <hr />
                <p style="font-size: 12px; color: #888;">Email ini dikirim otomatis oleh sistem.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Evaluasi notification sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending evaluation email:', error);
    }
};

const sendSimExpiryNotification = async (toEmail, permit, sisaHari) => {
    let subjectText = sisaHari <= 0 ? 'Peringatan: Masa Berlaku SIM Anda Telah Habis!' : `Peringatan: Masa Berlaku SIM Anda Tersisa ${sisaHari} Hari`;
    
    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        cc: 'admin.permit@semenpadang.co.id', // Tembusan ke admin
        subject: subjectText,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #E11D2E;">Sistem Permit PT Semen Padang</h2>
                <p>Halo,</p>
                <p>Sistem kami mendeteksi bahwa Masa Berlaku SIM/SIO untuk pengajuan permit Anda ${sisaHari <= 0 ? '<strong>telah habis</strong>' : `akan habis dalam <strong>${sisaHari} hari</strong>`}.</p>
                <p><strong>Tanggal Berakhir:</strong> ${permit.tanggal_berlaku_sim}</p>
                <p>Harap segera memperbarui SIM/SIO Anda dan melapor ke admin permit PT Semen Padang agar izin Anda tetap aktif.</p>
                <hr />
                <p style="font-size: 12px; color: #888;">Email ini dikirim otomatis oleh sistem.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`SIM expiry notification sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending SIM expiry email:', error);
    }
};
const sendPermitNotification = async (toEmail, namaPemohon, perusahaan, actionType, keterangan) => {
    // actionType: 'baru' | 'admin' | 'kasie_pemohon' | 'kasie_hse' | 'ktt'
    
    let subject = "";
    let messageTitle = "";
    let messageBody = "";

    if (actionType === 'baru') {
        subject = "Pengajuan Permit Baru Perlu Verifikasi Admin";
        messageTitle = "Pengajuan Permit Baru";
        messageBody = `Terdapat pengajuan permit baru dari <strong>${namaPemohon} (${perusahaan})</strong> yang menunggu verifikasi dari Admin.`;
    } else if (actionType === 'admin') {
        subject = "Pengajuan Permit Perlu Verifikasi Kasie Pemohon";
        messageTitle = "Verifikasi Kasie Pemohon";
        messageBody = `Pengajuan permit atas nama <strong>${namaPemohon} (${perusahaan})</strong> telah diverifikasi oleh Admin dan sekarang menunggu persetujuan Kasie Pemohon.`;
    } else if (actionType === 'kasie_pemohon') {
        subject = "Pengajuan Permit Perlu Verifikasi Kasie HSE";
        messageTitle = "Verifikasi Kasie HSE";
        messageBody = `Pengajuan permit atas nama <strong>${namaPemohon} (${perusahaan})</strong> telah disetujui Kasie Pemohon dan sekarang menunggu verifikasi Kasie HSE.`;
    } else if (actionType === 'kasie_hse') {
        subject = "Pengajuan Permit Perlu Persetujuan KTT";
        messageTitle = "Persetujuan KTT";
        messageBody = `Pengajuan permit atas nama <strong>${namaPemohon} (${perusahaan})</strong> telah disetujui Kasie HSE dan sekarang menunggu persetujuan akhir dari KTT.`;
    } else if (actionType === 'ktt') {
        subject = "Pengajuan Permit Telah Disetujui Sepenuhnya";
        messageTitle = "Permit Disetujui (KTT)";
        messageBody = `Pengajuan permit atas nama <strong>${namaPemohon} (${perusahaan})</strong> telah disetujui sepenuhnya oleh KTT.`;
    } else if (actionType === 'tolak') {
        subject = "Pengajuan Permit Ditolak";
        messageTitle = "Permit Ditolak";
        messageBody = `Pengajuan permit atas nama <strong>${namaPemohon} (${perusahaan})</strong> telah ditolak.`;
    }

    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        subject: subject,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #E11D2E; margin: 0;">Sistem Permit PT Semen Padang</h2>
                </div>
                <h3 style="color: #333;">${messageTitle}</h3>
                <p>${messageBody}</p>
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #E11D2E;">
                    <p style="margin: 5px 0;"><strong>Nama Pemohon:</strong> ${namaPemohon}</p>
                    <p style="margin: 5px 0;"><strong>Perusahaan:</strong> ${perusahaan}</p>
                    ${keterangan ? `<p style="margin: 5px 0;"><strong>Catatan Tambahan:</strong> ${keterangan}</p>` : ''}
                </div>
                <p>Silakan login ke sistem untuk melakukan proses verifikasi lebih lanjut.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${frontendUrl}/login" style="background-color: #E11D2E; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                        Buka Aplikasi Permit
                    </a>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
                <p style="font-size: 12px; color: #888; text-align: center;">
                    Email ini dikirim secara otomatis oleh sistem. Mohon jangan membalas email ini.
                </p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Permit notification (${actionType}) sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending permit notification:', error);
    }
};

const sendKontrakExpiryNotification = async (toEmail, proyek, sisaHari) => {
    let subjectText = sisaHari <= 0 ? 'Peringatan: Masa Berlaku Kontrak Proyek/Vendor Telah Habis!' : `Peringatan: Masa Berlaku Kontrak Proyek/Vendor Tersisa ${sisaHari} Hari`;
    
    const mailOptions = {
        from: '"Sistem Permit PT Semen Padang" <no-reply@semenpadang.co.id>',
        to: toEmail,
        cc: 'admin.permit@semenpadang.co.id', // Tembusan ke admin
        subject: subjectText,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #E11D2E;">Sistem Permit PT Semen Padang</h2>
                <p>Halo,</p>
                <p>Sistem kami mendeteksi bahwa Masa Berlaku Kontrak/SPK untuk proyek <strong>${proyek.nama_proyek}</strong> ${sisaHari <= 0 ? '<strong>telah habis</strong>' : `akan habis dalam <strong>${sisaHari} hari</strong>`}.</p>
                <p><strong>Tanggal Berakhir Kontrak:</strong> ${proyek.tanggal_selesai}</p>
                <p>Masa berlaku Permit Karyawan di bawah naungan kontrak ini sangat bergantung pada tanggal ini. Harap segera melakukan perpanjangan kontrak jika proyek masih berjalan dan melapor ke admin permit PT Semen Padang.</p>
                <hr />
                <p style="font-size: 12px; color: #888;">Email ini dikirim otomatis oleh sistem.</p>
            </div>
        `
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log(`Kontrak expiry notification sent to ${toEmail}`);
    } catch (error) {
        console.error('Error sending Kontrak expiry email:', error);
    }
};

module.exports = {
    sendVerificationEmail,
    sendResetPasswordEmail,
    sendEvaluationNotification,
    sendSimExpiryNotification,
    sendPermitNotification,
    sendKontrakExpiryNotification
};
