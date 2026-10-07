const fs = require('fs');
const path = require('path');

const uploadTemplate = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
        }
        res.status(200).json({ 
            success: true, 
            message: `Template untuk ${req.params.kategori} berhasil diunggah`,
            filename: req.file.filename
        });
    } catch (error) {
        console.error("Error uploadTemplate:", error);
        res.status(500).json({ success: false, message: 'Gagal mengunggah template' });
    }
};

const listTemplates = (req, res) => {
    try {
        const dir = path.join(__dirname, '../uploads/templates');
        if (!fs.existsSync(dir)) {
            return res.status(200).json({ success: true, data: [] });
        }
        const files = fs.readdirSync(dir);
        // files = ["magang.docx", "merah.docx", ...]
        const templates = files.map(f => f.replace('.docx', ''));
        res.status(200).json({ success: true, data: templates });
    } catch (error) {
        console.error("Error listTemplates:", error);
        res.status(500).json({ success: false, message: 'Gagal mengambil daftar template' });
    }
};

module.exports = {
    uploadTemplate,
    listTemplates
};
