const express = require('express');
const router = express.Router();
const { getPengajuan, createPengajuan, cekNik } = require('../controllers/permitController');

router.get('/', getPengajuan);
router.post('/', createPengajuan);
router.get('/check-nik/:nik', cekNik);

module.exports = router;