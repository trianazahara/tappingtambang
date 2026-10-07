const db = require('../config/db');

const getUserByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows;
};

module.exports = { getUserByEmail };