const { User } = require('./models');

async function check() {
    try {
        const admins = await User.findAll({ where: { role: 'Admin' } });
        console.log("Admin Users:");
        admins.forEach(a => console.log(a.id_user, a.email, a.role));
    } catch(e) {
        console.log(e);
    }
    process.exit();
}
check();
