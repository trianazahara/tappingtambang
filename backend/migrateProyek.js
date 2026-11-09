const ensureSchema = require('./utils/ensureSchema');

async function migrate() {
    try {
        await ensureSchema();
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
