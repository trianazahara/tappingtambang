const db = require('./config/db');

async function migrate() {
    try {
        console.log("Starting migration for Vendor and Permit tables...");

        // 1. Alter Users table
        try {
            await db.query(`ALTER TABLE users 
                ADD COLUMN jenis_vendor ENUM('SPK', 'Kontrak') NULL,
                ADD COLUMN masa_berlaku_kontrak DATE NULL;
            `);
            console.log("Users table updated.");
        } catch (e) { console.log("Users alter error (might exist):", e.message); }

        // 2. Alter PengajuanPermit table
        try {
            await db.query(`ALTER TABLE pengajuan_permit
                MODIFY COLUMN kategori_pemohon ENUM('Internal', 'Magang', 'Visitor', 'Kontraktor') NOT NULL,
                ADD COLUMN file_life_saving_talk VARCHAR(255) NULL,
                ADD COLUMN file_jsa VARCHAR(255) NULL,
                ADD COLUMN file_izin_kerja_umum VARCHAR(255) NULL,
                ADD COLUMN file_izin_panas VARCHAR(255) NULL,
                ADD COLUMN file_izin_ketinggian VARCHAR(255) NULL,
                ADD COLUMN file_izin_perancah VARCHAR(255) NULL,
                ADD COLUMN file_izin_beban VARCHAR(255) NULL,
                ADD COLUMN file_izin_ruang_terbatas VARCHAR(255) NULL,
                ADD COLUMN file_izin_penggalian VARCHAR(255) NULL,
                ADD COLUMN file_izin_air VARCHAR(255) NULL,
                ADD COLUMN file_izin_material_panas VARCHAR(255) NULL;
            `);
            console.log("PengajuanPermit table updated.");
        } catch (e) { console.log("PengajuanPermit alter error (might exist):", e.message); }

        console.log("Migration finished successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err.message);
        process.exit(1);
    }
}

migrate();
