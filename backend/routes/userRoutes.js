const express = require('express');
const router = express.Router();
const { getUsers, addUser, editUser, toggleStatusUser } = require('../controllers/userController');

// You might want to add middleware to protect this route later (e.g., only Admin can access)
router.get('/', getUsers);
router.post('/', addUser);
router.put('/:id', editUser);
router.put('/:id/status', toggleStatusUser);

module.exports = router;
