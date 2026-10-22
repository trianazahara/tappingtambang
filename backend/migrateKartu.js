const db = require('./config/db');

async function migrate() {
    try {
        await db.authenticate();
        console.log('Database connected successfully.');

        // Dapatkan semua kolom yang ada di tabel kartu_akses saat ini
        const [columns] = await db.query('SHOW COLUMNS FROM kartu_akses');
        const colNames = columns.map(c => c.Field.toLowerCase());
        console.log('Current columns in kartu_akses:', colNames);

        // 1. Pastikan kolom nomor_license ada
        if (!colNames.includes('nomor_license')) {
            await db.query('ALTER TABLE kartu_akses ADD COLUMN nomor_license VARCHAR(100) NULL');
            console.log('Added column: nomor_license');
        }

        // 2. Pastikan kolom type_unit ada dan bertipe TEXT
        if (!colNames.includes('type_unit')) {
            await db.query('ALTER TABLE kartu_akses ADD COLUMN type_unit TEXT NULL');
            console.log('Added column: type_unit (TEXT)');
        } else {
            await db.query('ALTER TABLE kartu_akses MODIFY COLUMN type_unit TEXT NULL');
            console.log('Modified column: type_unit to TEXT');
        }

        // 3. Pastikan kolom jenis_permit ada
        if (!colNames.includes('jenis_permit')) {
            await db.query("ALTER TABLE kartu_akses ADD COLUMN jenis_permit ENUM('Full', 'R') NULL");
            console.log('Added column: jenis_permit');
        }

        // 4. Pastikan kolom issued_at ada
        if (!colNames.includes('issued_at')) {
            await db.query('ALTER TABLE kartu_akses ADD COLUMN issued_at DATE NULL');
            console.log('Added column: issued_at');
        }

        // 5. Pastikan kolom berlaku_hingga mengizinkan NULL (untuk pemohon permanent/tanpa tgl selesai)
        await db.query('ALTER TABLE kartu_akses MODIFY COLUMN berlaku_hingga DATE NULL');
        console.log('Modified column: berlaku_hingga to allow NULL');

        console.log('--- Migrasi tabel kartu_akses selesai dan aman! ---');
        process.exit(0);
    } catch (error) {
        console.error('Migrasi kartu_akses gagal:', error);
        process.exit(1);
    }
}

migrate();
