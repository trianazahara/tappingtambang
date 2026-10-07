const db = require('./config/db');

async function migrateSehat() {
    try {
        await db.authenticate();
        console.log('Database connected.');

        // Add missing fields to surat_sehat
        await db.query(`
            ALTER TABLE surat_sehat 
            ADD COLUMN IF NOT EXISTS riwayat_penyakit VARCHAR(255),
            ADD COLUMN IF NOT EXISTS tekanan_darah VARCHAR(50),
            ADD COLUMN IF NOT EXISTS denyut_nadi INT,
            ADD COLUMN IF NOT EXISTS golongan_darah VARCHAR(10)
        `);
        console.log('Added missing fields to surat_sehat');

        console.log('Migration done.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateSehat();
