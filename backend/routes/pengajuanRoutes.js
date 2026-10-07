const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { submitPengajuan, getListPengajuan, getDetailPengajuan, approvePengajuan, rejectPengajuan, updatePengajuan, submitDraft } = require('../controllers/pengajuanController');

const fileFields = [
    { name: 'file_foto', maxCount: 1 },
    { name: 'file_bpjs', maxCount: 1 },
    { name: 'file_data_diri', maxCount: 1 },
    { name: 'file_mcu', maxCount: 1 },
    { name: 'file_kontrak_kerja', maxCount: 1 },
    { name: 'file_surat_penunjukan', maxCount: 1 },
    { name: 'file_surat_pengantar', maxCount: 1 },
    { name: 'file_prosedur', maxCount: 1 },
    { name: 'file_izin_kerja_berbahaya', maxCount: 1 },
    { name: 'file_serah_terima_apd', maxCount: 1 },
    { name: 'file_permohonan_kimper', maxCount: 1 },
    { name: 'file_sertifikat_sio_sim', maxCount: 1 },
    { name: 'file_sim_a', maxCount: 1 },
    { name: 'file_sim_b1', maxCount: 1 },
    { name: 'file_sim_b2', maxCount: 1 },
    { name: 'file_sio', maxCount: 1 },
    { name: 'file_hasil_assessment', maxCount: 1 },
    { name: 'file_safety_induksi', maxCount: 1 }
];

const handleUpload = (req, res, next) => {
    upload.fields(fileFields)(req, res, (err) => {
        if (err) {
            console.error("Multer error:", err);
            return res.status(400).json({ success: false, message: "Gagal mengunggah file", error: err.message });
        }
        next();
    });
};

router.post('/', handleUpload, submitPengajuan);
router.post('/fast-track', require('../controllers/fastTrackController').fastTrackPengajuan);
router.get('/', getListPengajuan);
router.get('/:id', getDetailPengajuan);
router.put('/:id', handleUpload, updatePengajuan);
router.put('/:id/approve', approvePengajuan);
router.put('/:id/reject', rejectPengajuan);
router.put('/:id/submit-draft', submitDraft);
router.put('/:id/set-area', require('../controllers/pengajuanController').setAreaKerja);
router.get('/:id/cetak-permit', require('../controllers/pengajuanController').cetakPermit);
router.post('/export/excel', require('../controllers/pengajuanController').exportExcel);
router.post('/export/docs', require('../controllers/pengajuanController').exportDocs);

module.exports = router;