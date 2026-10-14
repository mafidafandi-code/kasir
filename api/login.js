import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  // Tambahkan header CORS & pastikan method POST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    const result = await db.execute({
      sql: 'SELECT * FROM pengguna WHERE username = ? AND password = ?',
      args: [username, password]
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah!' });
    }

    const user = result.rows[0];
    return res.status(200).json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        username: user.username,
        nama: user.nama_lengkap,
        role: user.peran
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
