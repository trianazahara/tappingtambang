require('dotenv').config();
const db = require('./config/db');

async function migrate() {
    try {
        await db.authenticate();
        console.log('Database connected.');
        await db.query(`ALTER TABLE master_instansi MODIFY COLUMN kategori_instansi VARCHAR(50) NOT NULL DEFAULT 'Visitor'`);
        console.log('Successfully altered master_instansi.kategori_instansi to VARCHAR(50)');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
