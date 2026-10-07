const db = require('./config/db');

async function run() {
    try {
        await db.query("ALTER TABLE proyek_vendor DROP COLUMN kategori_akses;");
        console.log("Column kategori_akses dropped successfully.");
    } catch (e) {
        console.log("Error or column already dropped:", e.message);
    }
    process.exit();
}
run();
