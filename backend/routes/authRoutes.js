const express = require('express');
const router = express.Router();
const { login, register, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');

// Endpoint POST /api/auth/login
router.post('/login', login);
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;