const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { createProyek, getListProyek, getDetailProyek, uploadDocsProyek, submitDraftsProyek, updateProyek, deleteProyek } = require('../controllers/proyekController');

const fileFields = [
    { name: 'file_kontrak_kerja', maxCount: 1 },
    { name: 'file_surat_penunjukan', maxCount: 1 },
    { name: 'file_prosedur', maxCount: 1 },
    { name: 'file_izin_kerja_berbahaya', maxCount: 1 },
    { name: 'file_permohonan_kimper', maxCount: 1 }
];

const safetyDocsFields = [
    { name: 'file_life_saving_talk', maxCount: 1 },
    { name: 'file_jsa', maxCount: 1 },
    { name: 'file_izin_kerja_umum', maxCount: 1 },
    { name: 'file_izin_panas', maxCount: 1 },
    { name: 'file_izin_ketinggian', maxCount: 1 },
    { name: 'file_izin_perancah', maxCount: 1 },
    { name: 'file_izin_beban', maxCount: 1 },
    { name: 'file_izin_ruang_terbatas', maxCount: 1 },
    { name: 'file_izin_penggalian', maxCount: 1 },
    { name: 'file_izin_air', maxCount: 1 },
    { name: 'file_izin_material_panas', maxCount: 1 }
];

router.post('/', upload.fields(fileFields), createProyek);
router.post('/:id/upload-docs', upload.fields(safetyDocsFields), uploadDocsProyek);
router.post('/:id/submit-drafts', submitDraftsProyek);
router.get('/', getListProyek);
router.get('/:id', getDetailProyek);
router.put('/:id', upload.fields(fileFields), updateProyek);
router.delete('/:id', deleteProyek);

module.exports = router;
