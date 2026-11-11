const db = require('../config/db');
const {
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
    MasterKartuVisitor,
    PengaturanUjian
} = require('../models');

function getDbErrorInfo(err) {
    const msg = err?.original?.message || err?.parent?.message || err?.message || '';
    const errno = err?.original?.errno || err?.parent?.errno || err?.errno;
    const code = err?.original?.code || err?.parent?.code || err?.code;
    return { msg, errno, code };
}

async function ensureTableExists(tableName, model) {
    const [tables] = await db.query(`SHOW TABLES LIKE '${tableName}'`);
    if (tables.length === 0) {
        try {
            await model.sync();
            console.log(`[Schema] Created missing table: ${tableName}`);
        } catch (err) {
            const { msg, errno, code } = getDbErrorInfo(err);
            if (errno !== 1050 && code !== 'ER_TABLE_EXISTS_ERROR' && !/already exists/i.test(msg)) {
                throw err;
            }
        }
    }
}

async function getColumnsMap(tableName) {
    const [columns] = await db.query(`SHOW COLUMNS FROM \`${tableName}\``);
    const map = new Map();
    for (const col of columns) {
        map.set(col.Field.toLowerCase(), col);
    }
    return map;
}

async function addMissingColumns(tableName, colMap, columnDefs) {
    for (const def of columnDefs) {
        if (colMap.has(def.name.toLowerCase())) continue;

        try {
            await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${def.name}\` ${def.sql}`);
            console.log(`[Schema] Added column: ${tableName}.${def.name}`);
        } catch (err) {
            const { msg, errno, code } = getDbErrorInfo(err);
            if (errno === 1060 || code === 'ER_DUP_FIELDNAME' || /Duplicate column name/i.test(msg)) {
                continue;
            }
            if (def.fallbackSql) {
                try {
                    await db.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${def.name}\` ${def.fallbackSql}`);
                    console.log(`[Schema] Added column (fallback): ${tableName}.${def.name}`);
                    continue;
                } catch (fallbackErr) {
                    const fb = getDbErrorInfo(fallbackErr);
                    if (fb.errno === 1060 || fb.code === 'ER_DUP_FIELDNAME' || /Duplicate column name/i.test(fb.msg)) {
                        continue;
                    }
                    console.error(`[Schema] Failed adding column ${tableName}.${def.name}:`, fb.msg);
                    continue;
                }
            }
            console.error(`[Schema] Failed adding column ${tableName}.${def.name}:`, msg);
        }
    }
}

async function ensureSchema() {
    await db.authenticate();

    // 1. Pastikan seluruh tabel dasar tersedia (tanpa alter: true agar aman di MySQL)
    const orderedTables = [
        ['master_area', MasterArea],
        ['master_instansi', MasterInstansi],
        ['master_kendaraan', MasterKendaraan],
        ['users', User],
        ['master_kartu_visitor', MasterKartuVisitor],
        ['pengaturan_ujian', PengaturanUjian],
        ['karyawan', Karyawan],
        ['master_soal', MasterSoal],
        ['proyek_vendor', ProyekVendor],
        ['visitor', Visitor],
        ['pengajuan_permit', PengajuanPermit],
        ['surat_sehat', SuratSehat],
        ['izin_area', IzinArea],
        ['riwayat_approval', RiwayatApproval],
        ['proyek_area', ProyekArea],
        ['kartu_akses', KartuAkses],
        ['log_tapping', LogTapping]
    ];

    for (const [tableName, model] of orderedTables) {
        await ensureTableExists(tableName, model);
    }

    // 2. Pastikan kolom baru di tiap tabel tersedia (kompatibel MySQL 5.7, 8.0, dan MariaDB)
    const tableColumns = {
        proyek_vendor: [
            { name: 'jenis_proyek', sql: "ENUM('Baru', 'Perpanjangan') NULL DEFAULT 'Baru'" },
            { name: 'file_kontrak_kerja', sql: 'VARCHAR(255) NULL' },
            { name: 'file_surat_penunjukan', sql: 'VARCHAR(255) NULL' },
            { name: 'file_prosedur', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_kerja_berbahaya', sql: 'VARCHAR(255) NULL' },
            { name: 'file_permohonan_kimper', sql: 'VARCHAR(255) NULL' },
            { name: 'file_life_saving_talk', sql: 'VARCHAR(255) NULL' },
            { name: 'jenis_dokumen_safety', sql: "VARCHAR(255) NULL DEFAULT 'JSA'" },
            { name: 'file_jsa', sql: 'VARCHAR(255) NULL' },
            { name: 'file_ik', sql: 'VARCHAR(255) NULL' },
            { name: 'link_ik', sql: 'TEXT NULL' },
            { name: 'file_izin_kerja_umum', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_panas', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_ketinggian', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_perancah', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_beban', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_ruang_terbatas', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_penggalian', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_air', sql: 'VARCHAR(255) NULL' },
            { name: 'file_izin_material_panas', sql: 'VARCHAR(255) NULL' },
            { name: 'status_proyek', sql: "ENUM('Aktif', 'Selesai') NULL DEFAULT 'Aktif'" },
            { name: 'createdAt', sql: 'DATETIME NULL' },
            { name: 'updatedAt', sql: 'DATETIME NULL' }
        ],
        visitor: [
            { name: 'uid_kartu', sql: 'VARCHAR(255) NULL' },
            { name: 'type_unit', sql: 'VARCHAR(255) NULL' },
            { name: 'nomor_license', sql: 'VARCHAR(255) NULL' },
            { name: 'issued_at', sql: 'VARCHAR(255) NULL' },
            { name: 'berlaku_hingga', sql: 'DATETIME NULL' },
            { name: 'tanggal_selesai', sql: 'DATETIME NULL' },
            { name: 'file_ktp', sql: 'VARCHAR(255) NULL' },
            { name: 'file_surat_pengantar', sql: 'VARCHAR(255) NULL' },
            { name: 'file_safety_induksi', sql: 'VARCHAR(255) NULL' },
            { name: 'setuju_aturan_k3', sql: 'TINYINT(1) NULL DEFAULT 0' },
            { name: 'assessment_kesehatan', sql: 'JSON NULL', fallbackSql: 'LONGTEXT NULL' }
        ],
        pengajuan_permit: [
            { name: 'id_proyek', sql: 'INT NULL' },
            { name: 'kode_ujian_online', sql: 'VARCHAR(20) NULL' },
            { name: 'alasan_justifikasi', sql: 'VARCHAR(255) NULL' },
            { name: 'tanggal_berlaku_sim', sql: 'DATE NULL' },
            { name: 'tanggal_berlaku_sio', sql: 'DATE NULL' },
            { name: 'file_foto', sql: 'VARCHAR(255) NULL' },
            { name: 'file_sim_a', sql: 'VARCHAR(255) NULL' },
            { name: 'file_sim_b1', sql: 'VARCHAR(255) NULL' },
            { name: 'file_sim_b2', sql: 'VARCHAR(255) NULL' },
            { name: 'file_sio', sql: 'VARCHAR(255) NULL' },
            { name: 'file_hasil_assessment', sql: 'VARCHAR(255) NULL' },
            { name: 'file_safety_induksi', sql: 'VARCHAR(255) NULL' },
            { name: 'setuju_aturan_k3', sql: 'TINYINT(1) NULL DEFAULT 0' },
            { name: 'status_ujian_online', sql: "ENUM('Belum', 'Sedang Mengerjakan', 'Selesai') NULL DEFAULT 'Belum'" },
            { name: 'nilai_ujian_online', sql: 'INT NULL' },
            { name: 'nilai_ujian_tulis', sql: 'INT NULL' }
        ],
        karyawan: [
            { name: 'id_instansi', sql: 'INT NULL' },
            { name: 'pendidikan_khusus', sql: 'VARCHAR(255) NULL' },
            { name: 'file_sim_a', sql: 'VARCHAR(255) NULL' },
            { name: 'foto_3x4', sql: 'VARCHAR(255) NULL' }
        ],
        kartu_akses: [
            { name: 'nomor_license', sql: 'VARCHAR(100) NULL' },
            { name: 'type_unit', sql: 'TEXT NULL' },
            { name: 'jenis_permit', sql: "ENUM('Full', 'R') NULL" },
            { name: 'issued_at', sql: 'DATE NULL' }
        ],
        master_kendaraan: [
            { name: 'type_unit', sql: 'VARCHAR(100) NULL' },
            { name: 'jumlah_soal', sql: 'INT NULL DEFAULT 20' }
        ],
        master_soal: [
            { name: 'file_gambar', sql: 'VARCHAR(255) NULL' },
            { name: 'id_kendaraan', sql: 'INT NULL' }
        ],
        master_area: [
            { name: 'status_area', sql: "ENUM('Aktif', 'Nonaktif') NULL DEFAULT 'Aktif'" }
        ],
        master_instansi: [
            { name: 'status_instansi', sql: "ENUM('Aktif', 'Nonaktif') NULL DEFAULT 'Aktif'" }
        ],
        users: [
            { name: 'id_instansi', sql: 'INT NULL' },
            { name: 'jenis_vendor', sql: "ENUM('SPK', 'Kontrak') NULL" },
            { name: 'masa_berlaku_kontrak', sql: 'DATE NULL' },
            { name: 'is_verified', sql: 'TINYINT(1) NULL DEFAULT 0' },
            { name: 'verification_token', sql: 'VARCHAR(255) NULL' },
            { name: 'verification_expires', sql: 'DATETIME NULL' },
            { name: 'reset_password_token', sql: 'VARCHAR(255) NULL' },
            { name: 'reset_password_expires', sql: 'DATETIME NULL' }
        ]
    };

    const columnMaps = {};
    for (const [tableName, cols] of Object.entries(tableColumns)) {
        const colMap = await getColumnsMap(tableName);
        await addMissingColumns(tableName, colMap, cols);
        columnMaps[tableName] = await getColumnsMap(tableName);
    }

    // 3. Penyesuaian tipe kolom lama yang perlu diubah hanya jika masih bertipe lama
    try {
        const kartuTypeUnit = columnMaps.kartu_akses?.get('type_unit');
        if (kartuTypeUnit && /^varchar/i.test(kartuTypeUnit.Type || '')) {
            await db.query('ALTER TABLE `kartu_akses` MODIFY COLUMN `type_unit` TEXT NULL');
            console.log('[Schema] Updated kartu_akses.type_unit to TEXT');
        }
        const kartuBerlaku = columnMaps.kartu_akses?.get('berlaku_hingga');
        if (kartuBerlaku && kartuBerlaku.Null === 'NO') {
            await db.query('ALTER TABLE `kartu_akses` MODIFY COLUMN `berlaku_hingga` DATE NULL');
            console.log('[Schema] Updated kartu_akses.berlaku_hingga to allow NULL');
        }
        const instansiKat = columnMaps.master_instansi?.get('kategori_instansi');
        if (instansiKat && /^enum/i.test(instansiKat.Type || '')) {
            await db.query("ALTER TABLE `master_instansi` MODIFY COLUMN `kategori_instansi` VARCHAR(50) NOT NULL DEFAULT 'Vendor Outsourcing'");
            console.log('[Schema] Updated master_instansi.kategori_instansi to VARCHAR(50)');
        }
        const statusBerkas = columnMaps.pengajuan_permit?.get('status_berkas');
        if (statusBerkas && !/'aktif'/i.test(statusBerkas.Type || '')) {
            await db.query("ALTER TABLE `pengajuan_permit` MODIFY COLUMN `status_berkas` ENUM('Draft', 'Pending_Admin', 'Pending_Kasie_Pemohon', 'Pending_HSE', 'Pending_KTT', 'Lulus_Berkas', 'Menunggu_Ujian', 'Siap_Cetak', 'Aktif', 'Ditolak') DEFAULT 'Draft'");
            console.log('[Schema] Updated pengajuan_permit.status_berkas ENUM');
        }
        const katPemohon = columnMaps.pengajuan_permit?.get('kategori_pemohon');
        if (katPemohon && !/'kontraktor'/i.test(katPemohon.Type || '')) {
            await db.query("ALTER TABLE `pengajuan_permit` MODIFY COLUMN `kategori_pemohon` ENUM('Internal', 'Magang', 'Visitor', 'Kontraktor') NOT NULL");
            console.log('[Schema] Updated pengajuan_permit.kategori_pemohon ENUM');
        }
    } catch (err) {
        console.warn('[Schema] Column modification notice:', getDbErrorInfo(err).msg);
    }

    // 4. Hapus FK constraint pada log_tapping.uid_kartu -> kartu_akses.uid_kartu jika ada
    // (agar scan QR nomor_permit, kartu visitor, dan kartu tidak terdaftar tetap bisa dicatat tanpa error 500)
    try {
        const [fks] = await db.query(`
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'log_tapping'
              AND COLUMN_NAME = 'uid_kartu'
              AND REFERENCED_TABLE_NAME IS NOT NULL
        `);
        for (const fk of fks) {
            try {
                await db.query(`ALTER TABLE \`log_tapping\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
                console.log(`[Schema] Dropped FK constraint ${fk.CONSTRAINT_NAME} on log_tapping.uid_kartu`);
            } catch (dropErr) {
                const { errno, code, msg } = getDbErrorInfo(dropErr);
                if (errno !== 1091 && code !== 'ER_CANT_DROP_FIELD_OR_KEY') {
                    console.warn(`[Schema] Failed dropping FK ${fk.CONSTRAINT_NAME}:`, msg);
                }
            }
        }
    } catch (fkErr) {
        console.warn('[Schema] FK check notice:', getDbErrorInfo(fkErr).msg);
    }

    console.log('[Schema] Database schema verified.');
}

module.exports = ensureSchema;

