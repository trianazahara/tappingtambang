const express = require('express');
const router = express.Router();
const { getUsers, getUserById, addUser, editUser, toggleStatusUser } = require('../controllers/userController');

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', addUser);
router.put('/:id', editUser);
router.put('/:id/status', toggleStatusUser);

module.exports = router;
