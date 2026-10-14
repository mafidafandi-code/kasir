import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  // 1. Ambil Riwayat Transaksi (GET)
  if (req.method === 'GET') {
    try {
      const result = await db.execute(`
        SELECT t.*, p.nama_lengkap as nama_kasir 
        FROM transaksi t 
        LEFT JOIN pengguna p ON t.pengguna_id = p.id 
        ORDER BY t.dibuat_pada DESC LIMIT 100
      `);
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // 2. Proses Transaksi Baru (POST)
  if (req.method === 'POST') {
    const { nomor_faktur, pengguna_id, jumlah_bayar, items } = req.body;

    try {
      let total_belanja = 0;
      let total_laba = 0;

      const processedItems = items.map(item => {
        const subtotal_belanja = item.harga_jual * item.jumlah;
        const subtotal_laba = (item.harga_jual - item.harga_beli) * item.jumlah;
        total_belanja += subtotal_belanja;
        total_laba += subtotal_laba;
        return { ...item, subtotal_belanja, subtotal_laba };
      });

      const kembalian = jumlah_bayar - total_belanja;
      if (kembalian < 0) {
        return res.status(400).json({ message: 'Uang pembayaran kurang!' });
      }

      const transaksiId = 'trx_' + Date.now();

      // Simpan Header Transaksi
      await db.execute({
        sql: `INSERT INTO transaksi (id, nomor_faktur, pengguna_id, total_belanja, total_laba, metode_pembayaran, jumlah_bayar, kembalian) 
              VALUES (?, ?, ?, ?, ?, 'tunai', ?, ?)`,
        args: [transaksiId, nomor_faktur, pengguna_id, total_belanja, total_laba, jumlah_bayar, kembalian]
      });

      // Simpan Detail & Kurangi Stok Barang
      for (const item of processedItems) {
        const detailId = 'dtl_' + Date.now() + Math.random().toString(36).substring(2, 5);
        
        await db.execute({
          sql: `INSERT INTO detail_transaksi (id, transaksi_id, barang_id, jumlah, harga_beli_snapshot, harga_jual_snapshot, subtotal_belanja, subtotal_laba) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [detailId, transaksiId, item.id, item.jumlah, item.harga_beli, item.harga_jual, item.subtotal_belanja, item.subtotal_laba]
        });

        await db.execute({
          sql: 'UPDATE barang SET stok = stok - ? WHERE id = ?',
          args: [item.jumlah, item.id]
        });
      }

      return res.status(200).json({ message: 'Transaksi berhasil!', nomor_faktur });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
