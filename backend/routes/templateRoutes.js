const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/templates');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const kategori = req.params.kategori; // misalnya: "merah", "hijau", "magang"
        cb(null, `${kategori}.docx`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.originalname.endsWith('.docx')) {
            cb(null, true);
        } else {
            cb(new Error('Hanya menerima file .docx'));
        }
    }
});

router.post('/upload/:kategori', upload.single('template'), templateController.uploadTemplate);
router.get('/list', templateController.listTemplates);

module.exports = router;
