import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT id, username, nama_lengkap, peran, dibuat_pada FROM pengguna ORDER BY dibuat_pada DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  if (req.method === 'POST') {
    const { username, password, nama_lengkap, peran } = req.body;
    const id = 'usr_' + Date.now();

    try {
      await db.execute({
        sql: `INSERT INTO pengguna (id, username, password, nama_lengkap, peran) VALUES (?, ?, ?, ?, ?)`,
        args: [id, username, password, nama_lengkap, peran || 'kasir']
      });
      return res.status(201).json({ message: 'Pengguna berhasil ditambahkan' });
    } catch (error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Username sudah digunakan!' });
      }
      return res.status(500).json({ message: error.message });
    }
  }
}
