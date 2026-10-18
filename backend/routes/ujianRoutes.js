const express = require('express');
const router = express.Router();
const { 
    loginUjian, 
    submitUjian, 
    getPengaturanUjian, 
    updatePengaturanUjian 
} = require('../controllers/ujianController');

router.get('/setting', getPengaturanUjian);
router.put('/setting', updatePengaturanUjian);
router.post('/login', loginUjian);
router.post('/submit', submitUjian);

module.exports = router;
