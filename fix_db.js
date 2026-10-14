const db = require('./backend/config/db');
db.query('UPDATE pengajuan_permit SET id_proyek = NULL WHERE id_proyek NOT IN (SELECT id_proyek FROM proyek_vendor);')
    .then(() => console.log('Fixed orphan rows'))
    .catch(console.error)
    .finally(() => process.exit());
