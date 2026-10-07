const db = require('./config/db');

async function migrate() {
    try {
        await db.authenticate();
        console.log('Database connected.');

        // Tambah kolom status di master_area jika belum ada
        await db.query(`
            ALTER TABLE master_area 
            ADD COLUMN IF NOT EXISTS status_area ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif'
        `);
        console.log('Added status_area to master_area');

        // Tambah kolom status di master_instansi jika belum ada
        await db.query(`
            ALTER TABLE master_instansi 
            ADD COLUMN IF NOT EXISTS status_instansi ENUM('Aktif', 'Nonaktif') DEFAULT 'Aktif'
        `);
        console.log('Added status_instansi to master_instansi');

        // Tambah opsi 'Aktif' di ENUM status_berkas pengajuan_permit
        await db.query(`
            ALTER TABLE pengajuan_permit 
            MODIFY COLUMN status_berkas ENUM('Draft', 'Pending_Admin', 'Pending_Kasie_Pemohon', 'Pending_HSE', 'Pending_KTT', 'Lulus_Berkas', 'Menunggu_Ujian', 'Siap_Cetak', 'Aktif', 'Ditolak') DEFAULT 'Draft'
        `);
        console.log('Modified status_berkas in pengajuan_permit');

        console.log('Migration done.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
