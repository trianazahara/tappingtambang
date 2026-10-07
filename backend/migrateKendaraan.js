require('dotenv').config();
const { MasterKendaraan, PengajuanPermit } = require('./models');
const sequelize = require('./config/db');

async function migrateKendaraan() {
    try {
        console.log("Membuat tabel Master Kendaraan...");
        await MasterKendaraan.sync({ force: true });
        
        console.log("Menambahkan data dummy Master Kendaraan...");
        const data = [
            { nama_kendaraan: 'Light Truck', kategori_kendaraan: 'Roda 4', warna_permit: 'Hijau', syarat_dokumen: 'SIM A' },
            { nama_kendaraan: 'Light Vehicle', kategori_kendaraan: 'Roda 4', warna_permit: 'Hijau', syarat_dokumen: 'SIM A' },
            { nama_kendaraan: 'Medium Truck', kategori_kendaraan: 'Roda 6', warna_permit: 'Biru', syarat_dokumen: 'SIM B1' },
            { nama_kendaraan: 'Heavy Truck', kategori_kendaraan: '> Roda 6', warna_permit: 'Orange', syarat_dokumen: 'SIM B2' },
            { nama_kendaraan: 'Dump Truck', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
            { nama_kendaraan: 'Buldozer', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
            { nama_kendaraan: 'Grader', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
            { nama_kendaraan: 'Loader', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
            { nama_kendaraan: 'Excavator', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
            { nama_kendaraan: 'Drill Machine', kategori_kendaraan: 'Alat Berat', warna_permit: 'Orange', syarat_dokumen: 'SIO' },
        ];
        await MasterKendaraan.bulkCreate(data);
        console.log("Berhasil menambahkan data Master Kendaraan.");

        console.log("Menambahkan kolom dokumen SIM/SIO di PengajuanPermit...");
        try { await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `file_sim_a` VARCHAR(255) NULL;"); } catch(e){}
        try { await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `file_sim_b1` VARCHAR(255) NULL;"); } catch(e){}
        try { await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `file_sim_b2` VARCHAR(255) NULL;"); } catch(e){}
        try { await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `file_sio` VARCHAR(255) NULL;"); } catch(e){}
        console.log("Berhasil menambah kolom SIM/SIO!");
    } catch (err) {
        console.error("Gagal melakukan migrasi:", err);
    } finally {
        process.exit();
    }
}

migrateKendaraan();
