require('dotenv').config();
const { sendPermitNotification } = require('./utils/mailer');

async function check() {
    console.log("Sending email...");
    await sendPermitNotification('trianazahara03@gmail.com', 'Test User', 'Test Vendor', 'baru', '');
    console.log("Done");
    process.exit();
}
check();
