import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { no_faktur, total_harga, bayar, kembali, kasir_id, items } = req.body;

  try {
    // 1. Simpan Header Transaksi
    const txResult = await db.execute({
      sql: 'INSERT INTO transaksi (no_faktur, total_harga, bayar, kembali, kasir_id) VALUES (?, ?, ?, ?, ?) RETURNING id',
      args: [no_faktur, total_harga, bayar, kembali, kasir_id || 1]
    });

    const transaksiId = txResult.rows[0].id;

    // 2. Simpan Detail Item & Kurangi Stok
    for (const item of items) {
      await db.execute({
        sql: 'INSERT INTO detail_transaksi (transaksi_id, produk_id, jumlah, harga_satuan, subtotal) VALUES (?, ?, ?, ?, ?)',
        args: [transaksiId, item.id, item.jumlah, item.harga_jual, item.harga_jual * item.jumlah]
      });

      await db.execute({
        sql: 'UPDATE produk SET stok = stok - ? WHERE id = ?',
        args: [item.jumlah, item.id]
      });
    }

    return res.status(200).json({ message: 'Transaksi berhasil disimpan!' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
