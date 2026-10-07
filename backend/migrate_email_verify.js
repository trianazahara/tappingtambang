const db = require('./config/db');

async function migrate() {
    try {
        console.log('Menambahkan kolom email, is_verified, verification_token, verification_expires ke tabel users...');
        await db.query(`ALTER TABLE users 
            ADD COLUMN email VARCHAR(255) NULL,
            ADD COLUMN is_verified BOOLEAN DEFAULT false,
            ADD COLUMN verification_token VARCHAR(255) NULL,
            ADD COLUMN verification_expires DATETIME NULL;
        `);
        console.log('Kolom berhasil ditambahkan. Memperbarui email dummy untuk user lama...');
        await db.query(`UPDATE users SET email = CONCAT(username, '@dummy.com') WHERE email IS NULL`);
        console.log('Mengubah kolom email menjadi NOT NULL dan UNIQUE...');
        await db.query(`ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NOT NULL UNIQUE;`);
        
        console.log('Selesai!');
        process.exit(0);
    } catch (err) {
        console.error('Error saat migrasi:', err);
        process.exit(1);
    }
}

migrate();
