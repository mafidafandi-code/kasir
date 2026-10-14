import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const search = url.searchParams.get('search');

      let query = `
        SELECT b.*, k.nama_kategori, s.nama_sub_kategori 
        FROM barang b 
        LEFT JOIN kategori k ON b.kategori_id = k.id 
        LEFT JOIN sub_kategori s ON b.sub_kategori_id = s.id
      `;

      let result;
      // Jika ada parameter pencarian yang dikirim dari frontend
      if (search && search.trim() !== '') {
        query += ` WHERE b.nama_barang LIKE ? OR b.kode_sku LIKE ? OR b.keterangan LIKE ? LIMIT 50`;
        const keyword = `%${search.trim()}%`;
        result = await db.execute({ sql: query, args: [keyword, keyword, keyword] });
      } else {
        // Jika tidak ada pencarian sama sekali, kembalikan array kosong agar hemat kuota baca
        return res.status(200).json([]);
      }

      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // --- Bagian POST, PUT, DELETE (Tetap seperti sebelumnya) ---
  if (req.method === 'POST') {
    const { id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok, keterangan } = req.body;
    try {
      await db.execute({
        sql: `INSERT INTO barang (id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok, keterangan) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, kode_sku, nama_barang, kategori_id || null, sub_kategori_id || null, harga_beli, harga_jual, stok, keterangan]
      });
      return res.status(200).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'PUT') {
    const { id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok, keterangan } = req.body;
    try {
      await db.execute({
        sql: `UPDATE barang SET kode_sku = ?, nama_barang = ?, kategori_id = ?, sub_kategori_id = ?, harga_beli = ?, harga_jual = ?, stok = ?, keterangan = ? WHERE id = ?`,
        args: [kode_sku, nama_barang, kategori_id || null, sub_kategori_id || null, harga_beli, harga_jual, stok, keterangan, id]
      });
      return res.status(200).json({ message: 'Barang berhasil diperbarui' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { id } = req.body;
    try {
      await db.execute({
        sql: `DELETE FROM barang WHERE id = ?`,
        args: [id]
      });
      return res.status(200).json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
