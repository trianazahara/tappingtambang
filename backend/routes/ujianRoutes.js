const express = require('express');
const router = express.Router();
const { loginUjian, submitUjian } = require('../controllers/ujianController');

router.post('/login', loginUjian);
router.post('/submit', submitUjian);

module.exports = router;
