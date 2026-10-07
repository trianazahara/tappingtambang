const db = require('./config/db');
const { ProyekVendor, ProyekArea, PengajuanPermit } = require('./models');

async function migrate() {
    try {
        await db.authenticate();
        console.log('Database connected.');

        // Alter PengajuanPermit
        await db.query(`ALTER TABLE pengajuan_permit ADD COLUMN IF NOT EXISTS id_proyek INT`);
        await db.query(`ALTER TABLE pengajuan_permit ADD COLUMN IF NOT EXISTS kode_ujian_online VARCHAR(20)`);
        
        // Sync models
        await ProyekVendor.sync({ alter: true });
        await ProyekArea.sync({ alter: true });

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
