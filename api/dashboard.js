import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const range = url.searchParams.get('range') || '7days';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      // Menentukan kondisi filter tanggal berdasarkan query parameter
      let dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-7 days')`;
      let queryArgs = [];

      if (range === 'today') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours')`;
      } else if (range === 'yesterday') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours', '-1 day')`;
      } else if (range === '7days') {
        dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-7 days')`;
      } else if (range === 'this_month') {
        dateCondition = `strftime('%Y-%m', dibuat_pada) = strftime('%Y-%m', 'now', '+7 hours')`;
      } else if (range === 'last_month') {
        dateCondition = `strftime('%Y-%m', dibuat_pada) = strftime('%Y-%m', 'now', '+7 hours', '-1 month')`;
      } else if (range === 'custom' && startDate && endDate) {
        dateCondition = `date(dibuat_pada) BETWEEN ? AND ?`;
        queryArgs.push(startDate, endDate);
      }

      // 1. Hitung Ringkasan KPI (Total Omzet, Transaksi, Laba) dengan Filter Tanggal
      const kpiRes = await db.execute({
        sql: `
          SELECT 
            COALESCE(SUM(total_belanja), 0) as total_omzet,
            COUNT(*) as total_transaksi,
            COALESCE(SUM(total_laba), 0) as total_laba,
            COALESCE(AVG(total_belanja), 0) as rata_rata_transaksi
          FROM transaksi
          WHERE ${dateCondition}
        `,
        args: queryArgs
      });

      // 2. Ambil Top 5 Produk Terlaris (Berdasarkan filter transaksi)
      const topProdukRes = await db.execute({
        sql: `
          SELECT b.nama_barang, SUM(d.jumlah) as total_terjual
          FROM detail_transaksi d
          JOIN transaksi t ON d.transaksi_id = t.id
          JOIN barang b ON d.barang_id = b.id
          WHERE ${dateCondition}
          GROUP BY d.barang_id
          ORDER BY total_terjual DESC
          LIMIT 5
        `,
        args: queryArgs
      });

      // 3. Ambil Daftar Stok Menipis (< 5 unit) - Global (tidak terikat filter waktu)
      const lowStockRes = await db.execute(`
        SELECT kode_sku, nama_barang, stok 
        FROM barang 
        WHERE stok <= 5 
        ORDER BY stok ASC 
        LIMIT 10
      `);

      // 4. Ambil 5 Transaksi Terbaru (Berdasarkan filter tanggal)
      const recentTxRes = await db.execute({
        sql: `
          SELECT t.nomor_faktur, t.dibuat_pada, p.nama_lengkap as nama_kasir, t.total_belanja 
          FROM transaksi t
          LEFT JOIN pengguna p ON t.pengguna_id = p.id
          WHERE ${dateCondition}
          ORDER BY t.dibuat_pada DESC
          LIMIT 5
        `,
        args: queryArgs
      });

      // 5. Data Trend untuk Grafik Harian
      const trendRes = await db.execute({
        sql: `
          SELECT date(dibuat_pada) as tanggal, SUM(total_belanja) as omzet
          FROM transaksi
          WHERE ${dateCondition}
          GROUP BY date(dibuat_pada)
          ORDER BY tanggal ASC
        `,
        args: queryArgs
      });

      // 6. Data Kontribusi Kategori (Berdasarkan produk di database)
      const kategoriRes = await db.execute(`
        SELECT k.nama_kategori, COUNT(b.id) as total_produk
        FROM kategori k
        LEFT JOIN barang b ON k.id = b.kategori_id
        GROUP BY k.id
      `);

      return res.status(200).json({
        kpi: kpiRes.rows[0],
        top_produk: topProdukRes.rows,
        low_stock: lowStockRes.rows,
        recent_transactions: recentTxRes.rows,
        trend: trendRes.rows,
        kategori: kategoriRes.rows
      });

    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}
