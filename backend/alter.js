require('dotenv').config();
const db = require('./config/db');

async function alterTable() {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
        await db.query(`ALTER TABLE master_soal ADD COLUMN kategori_akses ENUM('Merah (Pit Worker)', 'Orange', 'Biru (In Pit Access)', 'Hijau (Full Pit Access)', 'Umum') NOT NULL DEFAULT 'Umum'`);
        console.log("Table altered successfully");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
alterTable();
