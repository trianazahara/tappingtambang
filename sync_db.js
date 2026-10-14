const db = require('./backend/config/db');
require('./backend/models'); // to load the associations
db.sync({ alter: true })
    .then(() => console.log('DB synced successfully'))
    .catch(console.error);
