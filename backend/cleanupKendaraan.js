require('dotenv').config();
const { MasterKendaraan, MasterSoal, KartuAkses } = require('./models');
const { Op } = require('sequelize');

async function cleanup() {
    try {
        console.log("Memulai pembersihan dan penggabungan Master Kendaraan...");

        // 1. Ambil semua baris MasterKendaraan
        const allKendaraan = await MasterKendaraan.findAll();
        console.log(`Ditemukan ${allKendaraan.length} data kendaraan.`);

        // 2. Gabungkan tipe unit untuk Light Vehicle
        // ID 2 adalah Light Vehicle utama
        const lvUtama = await MasterKendaraan.findByPk(2);
        if (lvUtama) {
            // Kumpulkan semua tipe unit dari id 2, 11 (LV), 12, 13
            const types = ['01', '02', '03', '05'];
            await lvUtama.update({
                nama_kendaraan: 'Light Vehicle',
                type_unit: types.join(', '),
                kategori_kendaraan: 'Roda 4',
                warna_permit: 'Hijau',
                syarat_dokumen: 'SIM A',
                jumlah_soal: 20
            });
            console.log("Berhasil memperbarui Light Vehicle (ID: 2) dengan type_unit:", types.join(', '));
        }

        // 3. Update Scania jika ada
        const scania = await MasterKendaraan.findByPk(14);
        if (scania) {
            await scania.update({
                nama_kendaraan: 'Scania',
                type_unit: 'P410, P460'
            });
            console.log("Berhasil memperbarui Scania (ID: 14)");
        }

        // 4. Perbarui referensi kartu_akses yang menunjuk ke ID 11, 12, 13
        const allCards = await KartuAkses.findAll();
        for (const card of allCards) {
            if (card.type_unit && card.type_unit.startsWith('[')) {
                try {
                    let units = JSON.parse(card.type_unit);
                    let changed = false;
                    units = units.map(u => {
                        if ([11, 12, 13].includes(u.id_kendaraan) || u.nama_kendaraan === 'LV') {
                            changed = true;
                            return {
                                ...u,
                                id_kendaraan: 2,
                                nama_kendaraan: 'Light Vehicle'
                            };
                        }
                        if (u.id_kendaraan === 14 || u.nama_kendaraan === 'scania') {
                            changed = true;
                            return {
                                ...u,
                                id_kendaraan: 14,
                                nama_kendaraan: 'Scania'
                            };
                        }
                        return u;
                    });
                    if (changed) {
                        await card.update({ type_unit: JSON.stringify(units) });
                        console.log(`Kartu ID ${card.id_kartu} diperbarui referensi kendaraannya.`);
                    }
                } catch (e) {
                    console.error(`Gagal parsing kartu ID ${card.id_kartu}:`, e);
                }
            }
        }

        // 5. Perbarui MasterSoal jika ada yang menunjuk ke 11, 12, 13
        await MasterSoal.update(
            { id_kendaraan: 2 },
            { where: { id_kendaraan: [11, 12, 13] } }
        );

        // 6. Hapus baris duplikat / test (11, 12, 13, 15, 16)
        const deleted = await MasterKendaraan.destroy({
            where: {
                id_kendaraan: [11, 12, 13, 15, 16]
            }
        });
        console.log(`Berhasil menghapus ${deleted} data duplikat/test.`);

        const sisaKendaraan = await MasterKendaraan.findAll({ order: [['id_kendaraan', 'ASC']] });
        console.log("Data Master Kendaraan saat ini:");
        sisaKendaraan.forEach(k => {
            console.log(`- [${k.id_kendaraan}] ${k.nama_kendaraan} | Kategori: ${k.kategori_kendaraan} | Tipe: ${k.type_unit || '-'} | Permit: ${k.warna_permit}`);
        });

        console.log("Pembersihan selesai dengan sukses!");
    } catch (err) {
        console.error("Gagal melakukan pembersihan:", err);
    } finally {
        process.exit();
    }
}

cleanup();
