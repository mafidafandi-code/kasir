import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // 1. Hitung Ringkasan KPI (Total Omzet, Transaksi, Laba)
      const kpiRes = await db.execute(`
        SELECT 
          COALESCE(SUM(total_belanja), 0) as total_omzet,
          COUNT(*) as total_transaksi,
          COALESCE(SUM(total_laba), 0) as total_laba,
          COALESCE(AVG(total_belanja), 0) as rata_rata_transaksi
        FROM transaksi
      `);

      // 2. Ambil Top 5 Produk Terlaris
      const topProdukRes = await db.execute(`
        SELECT b.nama_barang, SUM(d.jumlah) as total_terjual
        FROM detail_transaksi d
        JOIN barang b ON d.barang_id = b.id
        GROUP BY d.barang_id
        ORDER BY total_terjual DESC
        LIMIT 5
      `);

      // 3. Ambil Daftar Stok Menipis (< 5 unit)
      const lowStockRes = await db.execute(`
        SELECT kode_sku, nama_barang, stok 
        FROM barang 
        WHERE stok <= 5 
        ORDER BY stok ASC 
        LIMIT 10
      `);

      // 4. Ambil 5 Transaksi Terbaru
      const recentTxRes = await db.execute(`
        SELECT t.nomor_faktur, t.dibuat_pada, p.nama_lengkap as nama_kasir, t.total_belanja, t.metode_pembayaran 
        FROM transaksi t
        LEFT JOIN pengguna p ON t.pengguna_id = p.id
        ORDER BY t.dibuat_pada DESC
        LIMIT 5
      `);

      return res.status(200).json({
        kpi: kpiRes.rows[0],
        top_produk: topProdukRes.rows,
        low_stock: lowStockRes.rows,
        recent_transactions: recentTxRes.rows
      });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
