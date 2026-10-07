require('dotenv').config();
const sequelize = require('./config/db');

async function migrateSimDate() {
    try {
        console.log("Menambahkan kolom tanggal_berlaku_sim...");
        await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `tanggal_berlaku_sim` DATE NULL;");
        console.log("Berhasil menambahkan kolom tanggal_berlaku_sim!");
    } catch (err) {
        if (err.message.includes("Duplicate column name")) {
            console.log("Kolom tanggal_berlaku_sim sudah ada.");
        } else {
            console.error("Gagal menambahkan kolom:", err);
        }
    } finally {
        process.exit();
    }
}

migrateSimDate();
