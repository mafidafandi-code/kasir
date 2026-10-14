import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const katRes = await db.execute('SELECT * FROM kategori ORDER BY dibuat_pada DESC');
      const subRes = await db.execute('SELECT * FROM sub_kategori ORDER BY dibuat_pada DESC');
      return res.status(200).json({ kategori: katRes.rows, sub_kategori: subRes.rows });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { tipe, nama, kategori_id } = req.body;
    const id = 'kat_' + Date.now();
    try {
      if (tipe === 'kategori') {
        await db.execute({ sql: 'INSERT INTO kategori (id, nama_kategori) VALUES (?, ?)', args: [id, nama] });
      } else if (tipe === 'sub') {
        await db.execute({ sql: 'INSERT INTO sub_kategori (id, kategori_id, nama_sub_kategori) VALUES (?, ?, ?)', args: [id, kategori_id, nama] });
      }
      return res.status(201).json({ message: 'Berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'DELETE') {
    const { tipe, id } = req.body;
    try {
      if (tipe === 'kategori') {
        await db.execute({ sql: 'DELETE FROM kategori WHERE id = ?', args: [id] });
      } else if (tipe === 'sub') {
        await db.execute({ sql: 'DELETE FROM sub_kategori WHERE id = ?', args: [id] });
      }
      return res.status(200).json({ message: 'Berhasil dihapus' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
