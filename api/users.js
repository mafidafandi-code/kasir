import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  // Ambil daftar pengguna
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT id, username, nama, role FROM pengguna ORDER BY id DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Tambah pengguna baru
  if (req.method === 'POST') {
    const { username, password, nama, role } = req.body;
    try {
      await db.execute({
        sql: 'INSERT INTO pengguna (username, password, nama, role) VALUES (?, ?, ?, ?)',
        args: [username, password, nama, role || 'kasir']
      });
      return res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
