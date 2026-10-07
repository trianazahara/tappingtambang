const { Karyawan, MasterInstansi } = require('../models');

const getKaryawan = async (req, res) => {
    try {
        const data = await Karyawan.findAll({
            include: [{ model: MasterInstansi, attributes: ['nama_instansi', 'kategori_instansi'] }],
            order: [['id_karyawan', 'DESC']]
        });
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const addKaryawan = async (req, res) => {
    try {
        const newKaryawan = await Karyawan.create(req.body);
        res.status(201).json({ success: true, data: newKaryawan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal menyimpan" });
    }
};

module.exports = { getKaryawan, addKaryawan };