const db = require('./config/db');

async function alterSoal() {
    try {
        console.log("Altering master_soal table...");
        
        // Add file_gambar column
        await db.query(`ALTER TABLE master_soal ADD COLUMN file_gambar VARCHAR(255) NULL;`).catch(()=>console.log('file_gambar maybe exists'));
        
        // Drop kategori_akses and add id_kendaraan
        await db.query(`ALTER TABLE master_soal DROP COLUMN kategori_akses;`).catch(()=>console.log('kategori_akses dropped or not exist'));
        
        await db.query(`ALTER TABLE master_soal ADD COLUMN id_kendaraan INT NULL;`).catch(()=>console.log('id_kendaraan maybe exists'));
        
        console.log("Success altering master_soal!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
alterSoal();
