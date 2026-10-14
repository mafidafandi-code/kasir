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
    const { kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok, keterangan } = req.body;
    const id = 'brg_' + Date.now();

    try {
      await db.execute({
        sql: `INSERT INTO barang (id, kode_sku, nama_barang, kategori_id, sub_kategori_id, harga_beli, harga_jual, stok, keterangan) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, kode_sku, nama_barang, kategori_id || null, sub_kategori_id || null, harga_beli || 0, harga_jual || 0, stok || 0, keterangan || '']
      });
      return res.status(201).json({ message: 'Barang berhasil ditambahkan' });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Kode SKU sudah terdaftar!' });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}
