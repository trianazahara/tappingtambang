const db = require('./config/db');

async function migrate() {
    try {
        console.log('Adding jenis_proyek column to proyek_vendor table...');
        await db.query(`
            ALTER TABLE proyek_vendor
            ADD COLUMN jenis_proyek ENUM('Baru', 'Perpanjangan') DEFAULT 'Baru'
        `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
