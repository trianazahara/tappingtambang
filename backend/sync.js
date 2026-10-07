require('dotenv').config();
const sequelize = require('./config/db');

async function syncDb() {
    try {
        console.log("Menambahkan kolom file_foto...");
        await sequelize.query("ALTER TABLE `pengajuan_permit` ADD COLUMN `file_foto` VARCHAR(255) NULL;");
        console.log("Berhasil menambahkan kolom file_foto!");
    } catch (err) {
        if (err.message.includes("Duplicate column name")) {
            console.log("Kolom file_foto sudah ada.");
        } else {
            console.error("Gagal menambahkan kolom:", err);
        }
    } finally {
        process.exit();
    }
}

syncDb();
