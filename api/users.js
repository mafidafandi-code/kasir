import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  // Ambil semua daftar user
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT id, username, nama, role FROM users ORDER BY id DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Tambah user baru
  if (req.method === 'POST') {
    const { username, password, nama, role } = req.body;
    try {
      await db.execute({
        sql: 'INSERT INTO users (username, password, nama, role) VALUES (?, ?, ?, ?)',
        args: [username, password, nama, role || 'kasir']
      });
      return res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
