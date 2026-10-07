require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath, stat) => {
        const filename = path.basename(filePath);
        res.set('Content-Disposition', `inline; filename="${filename}"`);
        if (filePath.toLowerCase().endsWith('.pdf')) {
            res.set('Content-Type', 'application/pdf');
        } else if (filePath.toLowerCase().endsWith('.jpg') || filePath.toLowerCase().endsWith('.jpeg')) {
            res.set('Content-Type', 'image/jpeg');
        } else if (filePath.toLowerCase().endsWith('.png')) {
            res.set('Content-Type', 'image/png');
        }
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
}));
// Daftarkan semua routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/karyawan', require('./routes/karyawanRoutes'));
app.use('/api/area', require('./routes/areaRoutes'));
app.use('/api/permit', require('./routes/permitRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/instansi', require('./routes/instansiRoutes'));
app.use('/api/pengajuan', require('./routes/pengajuanRoutes'));
app.use('/api/proyek', require('./routes/proyekRoutes'));
app.use('/api/ujian', require('./routes/ujianRoutes'));
app.use('/api/soal', require('./routes/soalRoutes'));
app.use('/api/template', require('./routes/templateRoutes'));
app.use('/api/kendaraan', require('./routes/kendaraanRoutes'));
app.use('/api/kartu', require('./routes/kartuRoutes'));
app.use('/api/tapping', require('./routes/tappingRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/visitor', require('./routes/visitorRoutes'));
app.use('/api/monitoring', require('./routes/monitoringRoutes'));

// Start Cron Jobs
const startCronJobs = require('./cronJobs');
startCronJobs();

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});