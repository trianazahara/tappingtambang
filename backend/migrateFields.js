const db = require('./config/db');

async function migrate() {
    try {
        await db.authenticate();
        console.log('Database connected.');

        // Add alasan_justifikasi to pengajuan_permit
        await db.query(`
            ALTER TABLE pengajuan_permit 
            ADD COLUMN IF NOT EXISTS alasan_justifikasi VARCHAR(255)
        `);
        console.log('Added alasan_justifikasi to pengajuan_permit');

        // Add pendidikan_khusus to karyawan
        await db.query(`
            ALTER TABLE karyawan 
            ADD COLUMN IF NOT EXISTS pendidikan_khusus VARCHAR(255)
        `);
        console.log('Added pendidikan_khusus to karyawan');

        console.log('Migration done.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
