// Import model User dari folder models (yang sudah disatukan di index.js)
const { User } = require('../models'); 
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');

const login = async (req, res) => {
    // Menerima 'username' sebagai fallback jika client (frontend/mobile) belum direfresh
    const email = req.body.email || req.body.username;
    const password = req.body.password;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email tidak boleh kosong" });
    }
    try {
        // Menggunakan fungsi findOne bawaan Sequelize
        const user = await User.findOne({ where: { email: email } });
        
        // Jika user tidak ditemukan (hasilnya null)
        if (!user) {
            return res.status(401).json({ success: false, message: "Email atau Password salah!" });
        }

        if (user.status_akun === 'Nonaktif') {
            return res.status(403).json({ success: false, message: "Akun ini sudah dinonaktifkan" });
        }
        
        if (!user.is_verified) {
            return res.status(403).json({ success: false, message: "Akun Anda belum terverifikasi. Silakan cek email Anda untuk memverifikasi pendaftaran." });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ success: false, message: "Email atau Password salah!" });
        }

        const token = jwt.sign(
            { id_user: user.id_user, role: user.role },
            process.env.JWT_SECRET || 'secret-key-sementara', // Pastikan JWT_SECRET ada
            { expiresIn: '1d' }
        );

        res.status(200).json({
            success: true,
            message: "Login berhasil",
            token: token,
            data: {
                id_user: user.id_user,
                nama_lengkap: user.nama_lengkap,
                role: user.role,
                jenis_vendor: user.jenis_vendor,
                masa_berlaku_kontrak: user.masa_berlaku_kontrak
            }
        });

    } catch (error) {
        console.error("Error Login:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};

const register = async (req, res) => {
    const { nama_lengkap, password, email, id_instansi } = req.body;

    try {
        if (!password || !nama_lengkap || !email) {
            return res.status(400).json({ success: false, message: "Semua field (nama lengkap, password, email) wajib diisi" });
        }

        const existingEmail = await User.findOne({ where: { email } });
        if (existingEmail) {
            return res.status(400).json({ success: false, message: "Email sudah terdaftar" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 24); // Berlaku 24 jam

        const newUser = await User.create({
            password: hashedPassword,
            nama_lengkap,
            email,
            id_instansi: id_instansi || null,
            role: 'Pemohon_Mandiri',
            status_akun: 'Aktif',
            is_verified: false,
            verification_token: verificationToken,
            verification_expires: tokenExpires
        });
        
        // Send email
        const mailResult = await sendVerificationEmail(email, verificationToken, nama_lengkap, password);

        res.status(201).json({ 
            success: true, 
            message: "Registrasi berhasil, silakan cek email Anda untuk verifikasi.",
            mailInfo: mailResult.success ? "Email terkirim" : "Gagal mengirim email, hubungi admin."
        });

    } catch (error) {
        console.error("Error Register:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server saat registrasi" });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;
    
    try {
        const user = await User.findOne({ where: { verification_token: token } });
        
        if (!user) {
            return res.status(400).json({ success: false, message: "Token verifikasi tidak valid atau tidak ditemukan." });
        }
        
        if (new Date() > user.verification_expires) {
            return res.status(400).json({ success: false, message: "Token verifikasi sudah kedaluwarsa. Silakan minta tautan baru." });
        }
        
        // Update user
        user.is_verified = true;
        user.verification_token = null;
        user.verification_expires = null;
        await user.save();
        
        res.status(200).json({ success: true, message: "Email berhasil diverifikasi! Anda sekarang dapat login." });
    } catch (error) {
        console.error("Error Verify Email:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server saat verifikasi." });
    }
};

const forgotPassword = async (req, res) => {
    const { email } = req.body;
    
    if (!email) {
        return res.status(400).json({ success: false, message: "Email wajib diisi" });
    }

    try {
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            // Untuk keamanan, tetap berikan pesan berhasil meskipun email tidak ditemukan, 
            // atau beri tahu email tidak terdaftar. Sesuai kebutuhan:
            return res.status(404).json({ success: false, message: "Email tidak terdaftar" });
        }

        // Generate 6-digit verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const tokenExpires = new Date();
        tokenExpires.setHours(tokenExpires.getHours() + 1); // Berlaku 1 jam

        user.reset_password_token = code;
        user.reset_password_expires = tokenExpires;
        await user.save();

        const mailResult = await sendResetPasswordEmail(email, code, user.nama_lengkap);

        if (mailResult.success) {
            res.status(200).json({ success: true, message: "Kode OTP untuk reset password telah dikirim ke email Anda" });
        } else {
            res.status(500).json({ success: false, message: "Gagal mengirim email reset password" });
        }

    } catch (error) {
        console.error("Error Forgot Password:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};

const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ success: false, message: "Semua field (email, kode, password baru) wajib diisi" });
    }

    try {
        const user = await User.findOne({ where: { email, reset_password_token: code } });

        if (!user) {
            return res.status(400).json({ success: false, message: "Kode OTP salah atau email tidak cocok" });
        }

        if (new Date() > user.reset_password_expires) {
            return res.status(400).json({ success: false, message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        res.status(200).json({ success: true, message: "Password berhasil diubah. Silakan login menggunakan password baru." });

    } catch (error) {
        console.error("Error Reset Password:", error);
        res.status(500).json({ success: false, message: "Terjadi kesalahan pada server" });
    }
};

module.exports = { login, register, verifyEmail, forgotPassword, resetPassword };