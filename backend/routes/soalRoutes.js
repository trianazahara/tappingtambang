const express = require('express');
const router = express.Router();
const { getAllSoal, createSoal, updateSoal, deleteSoal } = require('../controllers/soalController');

const upload = require('../middlewares/upload');

router.get('/', getAllSoal);
router.post('/', upload.single('file_gambar'), createSoal);
router.put('/:id', upload.single('file_gambar'), updateSoal);
router.delete('/:id', deleteSoal);

module.exports = router;
