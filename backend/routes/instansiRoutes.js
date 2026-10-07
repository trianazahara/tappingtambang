const express = require('express');
const router = express.Router();
const { getInstansi, addInstansi, editInstansi, toggleStatusInstansi } = require('../controllers/instansiController');

router.get('/', getInstansi);
router.post('/', addInstansi);
router.put('/:id', editInstansi);
router.put('/:id/status', toggleStatusInstansi);

module.exports = router;
