const User = require('./User');
const MasterInstansi = require('./MasterInstansi');
const MasterArea = require('./MasterArea');
const MasterSoal = require('./MasterSoal');
const Karyawan = require('./Karyawan');
const PengajuanPermit = require('./PengajuanPermit');
const SuratSehat = require('./SuratSehat');
const IzinArea = require('./IzinArea');
const RiwayatApproval = require('./RiwayatApproval');
const KartuAkses = require('./KartuAkses');
const LogTapping = require('./LogTapping');
const ProyekVendor = require('./ProyekVendor');
const ProyekArea = require('./ProyekArea');
const MasterKendaraan = require('./MasterKendaraan');
const Visitor = require('./Visitor');
const MasterKartuVisitor = require('./MasterKartuVisitor');

// --- Associations ---

// MasterKendaraan & MasterSoal (1:N)
MasterKendaraan.hasMany(MasterSoal, { foreignKey: 'id_kendaraan' });
MasterSoal.belongsTo(MasterKendaraan, { foreignKey: 'id_kendaraan' });


// Karyawan & MasterInstansi (1:N)
MasterInstansi.hasMany(Karyawan, { foreignKey: 'id_instansi' });
Karyawan.belongsTo(MasterInstansi, { foreignKey: 'id_instansi' });

// PengajuanPermit & Karyawan (1:N)
Karyawan.hasMany(PengajuanPermit, { foreignKey: 'id_karyawan' });
PengajuanPermit.belongsTo(Karyawan, { foreignKey: 'id_karyawan' });

// PengajuanPermit & User (Pengaju) (1:N)
User.hasMany(PengajuanPermit, { foreignKey: 'id_user_pengaju' });
PengajuanPermit.belongsTo(User, { foreignKey: 'id_user_pengaju' });

// SuratSehat & PengajuanPermit (1:1)
PengajuanPermit.hasOne(SuratSehat, { foreignKey: 'id_pengajuan' });
SuratSehat.belongsTo(PengajuanPermit, { foreignKey: 'id_pengajuan' });

// IzinArea & PengajuanPermit (M:N)
PengajuanPermit.belongsToMany(MasterArea, { through: IzinArea, foreignKey: 'id_pengajuan', otherKey: 'id_area', timestamps: false });
MasterArea.belongsToMany(PengajuanPermit, { through: IzinArea, foreignKey: 'id_area', otherKey: 'id_pengajuan', timestamps: false });

// RiwayatApproval & PengajuanPermit (1:N)
PengajuanPermit.hasMany(RiwayatApproval, { foreignKey: 'id_pengajuan' });
RiwayatApproval.belongsTo(PengajuanPermit, { foreignKey: 'id_pengajuan' });

// RiwayatApproval & User (Approver) (1:N)
User.hasMany(RiwayatApproval, { foreignKey: 'id_user_approver' });
RiwayatApproval.belongsTo(User, { foreignKey: 'id_user_approver' });

// KartuAkses & Karyawan (1:N)
Karyawan.hasMany(KartuAkses, { foreignKey: 'id_karyawan' });
KartuAkses.belongsTo(Karyawan, { foreignKey: 'id_karyawan' });

// LogTapping & User (Satpam yang ngetap / mengawasi) (1:N)
User.hasMany(LogTapping, { foreignKey: 'id_user' });
LogTapping.belongsTo(User, { foreignKey: 'id_user' });

// ProyekVendor & User (Koordinator Vendor) (1:N)
User.hasMany(ProyekVendor, { foreignKey: 'id_user_vendor' });
ProyekVendor.belongsTo(User, { foreignKey: 'id_user_vendor' });

// ProyekVendor & PengajuanPermit (1:N)
ProyekVendor.hasMany(PengajuanPermit, { foreignKey: 'id_proyek' });
PengajuanPermit.belongsTo(ProyekVendor, { foreignKey: 'id_proyek' });

// ProyekVendor & MasterArea (M:N)
ProyekVendor.belongsToMany(MasterArea, { through: ProyekArea, foreignKey: 'id_proyek', otherKey: 'id_area', timestamps: false });
MasterArea.belongsToMany(ProyekVendor, { through: ProyekArea, foreignKey: 'id_area', otherKey: 'id_proyek', timestamps: false });

// LogTapping & KartuAkses (1:N)
LogTapping.belongsTo(KartuAkses, { foreignKey: 'uid_kartu', targetKey: 'uid_kartu' });
KartuAkses.hasMany(LogTapping, { foreignKey: 'uid_kartu', sourceKey: 'uid_kartu' });

module.exports = {
    User,
    MasterInstansi,
    MasterArea,
    MasterSoal,
    Karyawan,
    PengajuanPermit,
    SuratSehat,
    IzinArea,
    RiwayatApproval,
    LogTapping,
    ProyekVendor,
    ProyekArea,
    MasterKendaraan,
    KartuAkses,
    Visitor,
    MasterKartuVisitor
};