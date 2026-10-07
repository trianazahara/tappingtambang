require('dotenv').config();
const db = require('./config/db');

async function alterTable() {
    try {
        await db.authenticate();
        console.log('Connection has been established successfully.');
        
        // Add tanggal_berlaku_sio column to pengajuan_permit
        await db.query(`ALTER TABLE pengajuan_permit ADD COLUMN tanggal_berlaku_sio DATE NULL`);
        console.log("Column tanggal_berlaku_sio added successfully");
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
alterTable();
