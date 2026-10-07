const express = require('express');
const router = express.Router();
const tappingController = require('../controllers/tappingController');

// Route untuk memproses tap NFC / Barcode
router.post('/', tappingController.prosesTapping);

// Route untuk get semua log tapping
router.get('/', tappingController.getLogTapping);

module.exports = router;
