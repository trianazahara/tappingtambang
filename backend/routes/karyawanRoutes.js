const express = require('express');
const router = express.Router();
const { getKaryawan, addKaryawan } = require('../controllers/karyawanController');

router.get('/', getKaryawan);
router.post('/', addKaryawan);

module.exports = router;