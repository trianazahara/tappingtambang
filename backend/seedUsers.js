const bcrypt = require('bcryptjs');
const { User } = require('./models');
const db = require('./config/db');

async function seedUsers() {
    try {
        await db.authenticate();
        console.log('Database connected.');

        // Sync the database to apply schema changes
        await db.sync({ alter: true });

        const usersData = [
            {
                email: 'admin@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Administrator',
                role: 'Admin',
                status_akun: 'Aktif'
            },
            {
                email: 'satpam1@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Budi Satpam',
                role: 'Satpam',
                status_akun: 'Aktif'
            },
            {
                email: 'pemohon1@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Andi Pemohon',
                role: 'Pemohon_Mandiri',
                status_akun: 'Aktif'
            },
            {
                email: 'vendor_koor@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Citra Koordinator',
                role: 'Koordinator_Vendor',
                status_akun: 'Aktif'
            },
            {
                email: 'kasie_pemohon@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Deni Kasie',
                role: 'Kasie_Pemohon',
                status_akun: 'Aktif'
            },
            {
                email: 'kasie_hse@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Eka HSE',
                role: 'Kasie_HSE',
                status_akun: 'Aktif'
            },
            {
                email: 'ktt_utama@semenpadang.co.id',
                password: 'password123',
                nama_lengkap: 'Fajar KTT',
                role: 'KTT',
                status_akun: 'Aktif'
            }
        ];

        for (let user of usersData) {
            // Check if user already exists
            const existingUser = await User.findOne({ where: { email: user.email } });
            if (!existingUser) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);
                
                await User.create({
                    ...user,
                    password: hashedPassword,
                    is_verified: true
                });
                console.log(`User ${user.email} created successfully.`);
            } else {
                console.log(`User ${user.email} already exists.`);
            }
        }

        console.log('Seeding completed.');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
