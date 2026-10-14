import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await db.execute(`
        SELECT r.*, b.nama_barang, b.kode_sku, p.nama_lengkap as nama_user 
        FROM riwayat_stok r
        JOIN barang b ON r.barang_id = b.id
        JOIN pengguna p ON r.pengguna_id = p.id
        ORDER BY r.dibuat_pada DESC LIMIT 100
      `);
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { barang_id, pengguna_id, jumlah_masuk, harga_beli_per_unit, catatan } = req.body;

    if (!barang_id) {
      return res.status(400).json({ message: 'Barang tidak valid atau belum dipilih dari daftar!' });
    }

    try {
      // 1. Validasi apakah barang benar-benar ada di database
      const cekBarang = await db.execute({
        sql: `SELECT id FROM barang WHERE id = ?`,
        args: [barang_id]
      });

      if (cekBarang.rows.length === 0) {
        return res.status(400).json({ message: 'Gagal: Barang tersebut tidak ditemukan di data master!' });
      }

      const id = 'stk_' + Date.now();

      // 2. Simpan ke riwayat_stok
      await db.execute({
        sql: `INSERT INTO riwayat_stok (id, barang_id, pengguna_id, jumlah_masuk, harga_beli_per_unit, catatan, dibuat_pada) 
              VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 hours'))`,
        args: [
          id, 
          barang_id, 
          pengguna_id, 
          Number(jumlah_masuk), 
          Number(harga_beli_per_unit) || 0, 
          catatan || 'Restock / Opname Stok'
        ]
      });

      // 3. Update stok barang
      await db.execute({
        sql: `UPDATE barang SET stok = stok + ? WHERE id = ?`,
        args: [Number(jumlah_masuk), barang_id]
      });

      return res.status(201).json({ message: 'Stok opname berhasil disimpan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
