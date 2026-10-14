import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT * FROM produk ORDER BY id DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { kode_barang, nama_barang, harga_jual, stok } = req.body;
    try {
      await db.execute({
        sql: 'INSERT INTO produk (kode_barang, nama_barang, harga_jual, stok) VALUES (?, ?, ?, ?)',
        args: [kode_barang, nama_barang, harga_jual, stok]
      });
      return res.status(201).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
