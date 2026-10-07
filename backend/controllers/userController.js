const { User } = require('../models');
const bcrypt = require('bcryptjs');

const getUsers = async (req, res) => {
    try {
        const data = await User.findAll({
            attributes: { exclude: ['password'] } // Don't send passwords
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memuat user" });
    }
};

const addUser = async (req, res) => {
    try {
        const { email, password, nama_lengkap, role, status_akun, jenis_vendor, masa_berlaku_kontrak, id_instansi } = req.body;

        if (!email || !password || !nama_lengkap || !role) {
            return res.status(400).json({ success: false, message: "Semua field (email, password, nama_lengkap, role) wajib diisi" });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email sudah digunakan" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            email,
            password: hashedPassword,
            nama_lengkap,
            role,
            status_akun: status_akun || 'Aktif',
            jenis_vendor: jenis_vendor || null,
            masa_berlaku_kontrak: masa_berlaku_kontrak || null,
            id_instansi: id_instansi || null,
            is_verified: true
        });

        // Don't return password in response
        const { password: _, ...userData } = newUser.toJSON();

        res.status(201).json({ success: true, message: "User berhasil ditambahkan", data: userData });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({ success: false, message: "Gagal menambahkan user", error: error.message });
    }
};

const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_lengkap, email, role, status_akun, password, jenis_vendor, masa_berlaku_kontrak, id_instansi } = req.body;
        
        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

        // Cek jika email mau diubah
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ where: { email } });
            if (existingEmail) {
                return res.status(400).json({ success: false, message: "Email sudah digunakan oleh akun lain" });
            }
            user.email = email;
        }

        user.nama_lengkap = nama_lengkap || user.nama_lengkap;
        user.role = role || user.role;
        if (status_akun) user.status_akun = status_akun;
        if (jenis_vendor !== undefined) user.jenis_vendor = jenis_vendor;
        if (masa_berlaku_kontrak !== undefined) user.masa_berlaku_kontrak = masa_berlaku_kontrak;
        if (id_instansi !== undefined) user.id_instansi = id_instansi || null;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        
        const { password: _, ...userData } = user.toJSON();
        res.status(200).json({ success: true, message: "User berhasil diupdate", data: userData });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengupdate user", error: error.message });
    }
};

const toggleStatusUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);
        
        if (!user) return res.status(404).json({ success: false, message: "User tidak ditemukan" });

        user.status_akun = user.status_akun === 'Aktif' ? 'Nonaktif' : 'Aktif';
        await user.save();

        res.status(200).json({ success: true, message: `Status user diubah menjadi ${user.status_akun}` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal mengubah status user", error: error.message });
    }
};

module.exports = { getUsers, addUser, editUser, toggleStatusUser };
