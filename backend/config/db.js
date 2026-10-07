const { Sequelize } = require('sequelize');

// Pastikan parameter ini sesuai dengan database kamu (db_tambang)
const db = new Sequelize('db_tambang', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false // Menyembunyikan log query di terminal agar bersih
});

module.exports = db;