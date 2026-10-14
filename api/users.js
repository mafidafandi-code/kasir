import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  // Ambil daftar pengguna
  if (req.method === 'GET') {
    try {
      const result = await db.execute('SELECT id, username, nama_lengkap, peran FROM pengguna ORDER BY dibuat_pada DESC');
      return res.status(200).json(result.rows);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  // Tambah pengguna baru
  if (req.method === 'POST') {
    const { username, password, nama, role } = req.body;
    
    // Generate string ID acak sederhana untuk kolom id (TEXT)
    const newId = 'usr_' + Date.now();
    const dibuatPada = Date.now(); // Epoch timestamp

    try {
      await db.execute({
        sql: `INSERT INTO pengguna (id, username, password, nama_lengkap, peran, dibuat_pada) 
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [newId, username, password, nama, role || 'kasir', dibuatPada]
      });
      return res.status(201).json({ message: 'User berhasil ditambahkan' });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
