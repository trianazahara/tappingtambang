require('dotenv').config();
const db = require('./config/db');

async function run() {
    try {
        await db.query(`ALTER TABLE users ADD COLUMN reset_password_token VARCHAR(255) NULL`);
        await db.query(`ALTER TABLE users ADD COLUMN reset_password_expires DATETIME NULL`);
        console.log("Columns added");
    } catch(err) {
        console.error(err);
    }
    process.exit();
}
run();
