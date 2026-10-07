const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

router.get('/cards', visitorController.getVisitorCards);
router.post('/cards', visitorController.createVisitorCard);
router.put('/cards/:id', visitorController.editVisitorCard);
router.delete('/cards/:id', visitorController.deleteVisitorCard);

router.get('/', visitorController.getVisitors);
router.post('/', visitorController.createVisitor);
router.put('/:id', visitorController.editVisitor);
router.put('/:id/selesai', visitorController.finishVisitor);
router.get('/:id/cetak', visitorController.cetakVisitor);
router.get('/public/:uid', visitorController.getPublicVisitor);

module.exports = router;
