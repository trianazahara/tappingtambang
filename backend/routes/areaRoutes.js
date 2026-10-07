const express = require('express');
const router = express.Router();
const { getArea, addArea, editArea, toggleStatusArea } = require('../controllers/areaController');

router.get('/', getArea);
router.post('/', addArea);
router.put('/:id', editArea);
router.put('/:id/status', toggleStatusArea);

module.exports = router;