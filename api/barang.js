import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await db.execute(`
        SELECT b.*, k.nama_kategori, sk.nama_sub_kategori 
        FROM barang b 
        LEFT JOIN kategori k ON b.kategori_id = k.id 
        LEFT JOIN sub_kategori sk ON b.sub_kategori_id = sk.id 
        ORDER BY b.dibuat_pada DESC
      `);
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok } = req.body;
    try {
      await db.execute({
        sql: `INSERT INTO barang (id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, kode_sku, nama_barang, kategori_id || null, sub_kategori_id || null, harga_beli, harga_jual, stok]
      });
      return res.status(201).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok } = req.body;
    try {
      await db.execute({
        sql: `UPDATE barang SET kode_sku=?, nama_barang=?, kategori_id=?, sub_kategori_id=?, harga_beli=?, harga_jual=?, stok=? WHERE id=?`,
        args: [kode_sku, nama_barang, kategori_id || null, sub_kategori_id || null, harga_beli, harga_jual, stok, id]
      });
      return res.status(200).json({ message: 'Barang berhasil diperbarui' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    try {
      await db.execute({ sql: 'DELETE FROM barang WHERE id = ?', args: [id] });
      return res.status(200).json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
