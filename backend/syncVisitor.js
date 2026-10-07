const { sequelize } = require('./models');
const Visitor = require('./models/Visitor');

async function sync() {
    await Visitor.sync({ alter: true });
    console.log("Visitor table synced!");
    process.exit();
}

sync();
