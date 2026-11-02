const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');
const upload = require('../middlewares/upload');

const visitorFileFields = [
    { name: 'file_ktp', maxCount: 1 },
    { name: 'file_surat_pengantar', maxCount: 1 },
    { name: 'file_safety_induksi', maxCount: 1 }
];

const handleVisitorUpload = (req, res, next) => {
    upload.fields(visitorFileFields)(req, res, (err) => {
        if (err) {
            console.error("Multer error visitor:", err);
            return res.status(400).json({ success: false, message: "Gagal mengunggah berkas", error: err.message });
        }
        next();
    });
};

router.get('/cards', visitorController.getVisitorCards);
router.post('/cards', visitorController.createVisitorCard);
router.put('/cards/:id', visitorController.editVisitorCard);
router.delete('/cards/:id', visitorController.deleteVisitorCard);

router.get('/', visitorController.getVisitors);
router.post('/', handleVisitorUpload, visitorController.createVisitor);
router.put('/:id', handleVisitorUpload, visitorController.editVisitor);
router.put('/:id/selesai', visitorController.finishVisitor);
router.get('/:id/cetak', visitorController.cetakVisitor);
router.get('/public/:uid', visitorController.getPublicVisitor);

module.exports = router;
