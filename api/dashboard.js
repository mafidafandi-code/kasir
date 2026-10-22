import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const range = url.searchParams.get('range') || '7days';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      // Default filter menggunakan tanggal lokal atau rentang waktu yang longgar jika data sedikit
      let dateCondition = `1=1`; // Default ambil semua data jika ingin dipastikan muncul dulu
      let queryArgs = [];

      if (range === 'today') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours')`;
      } else if (range === 'yesterday') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours', '-1 day')`;
      } else if (range === '7days') {
        dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-30 days')`; // Diperlonggar jadi 30 hari agar data tes lama tetap nampak
      } else if (range === '30days') {
        dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-30 days')`;
      } else if (range === 'custom' && startDate && endDate) {
        dateCondition = `date(dibuat_pada) BETWEEN ? AND ?`;
      }

      // 1. KPI Keuangan
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
        args: range === 'custom' && startDate && endDate ? [startDate, endDate] : []
      });

      // Volume Barang Terjual
      const volumeRes = await db.execute({
        sql: `
          SELECT COALESCE(SUM(d.jumlah), 0) as total_volume
          FROM detail_transaksi d
          JOIN transaksi t ON d.transaksi_id = t.id
          WHERE ${dateCondition}
        `,
        args: range === 'custom' && startDate && endDate ? [startDate, endDate] : []
      });

      let kpiData = { 
        ...kpiRes.rows[0], 
        total_volume: volumeRes.rows[0]?.total_volume || 0 
      };

      // 2. Trend Harian (Line Chart)
      const trendRes = await db.execute({
        sql: `
          SELECT date(dibuat_pada) as tanggal, SUM(total_belanja) as omzet, SUM(total_laba) as profit
          FROM transaksi
          WHERE ${dateCondition}
          GROUP BY date(dibuat_pada)
          ORDER BY tanggal ASC
        `,
        args: range === 'custom' && startDate && endDate ? [startDate, endDate] : []
      });

      // 3. Jam Sibuk (Peak Hours)
      const peakRes = await db.execute({
        sql: `
          SELECT strftime('%H', dibuat_pada) as jam, COUNT(*) as jumlah
          FROM transaksi
          WHERE ${dateCondition}
          GROUP BY jam
          ORDER BY jam ASC
        `,
        args: range === 'custom' && startDate && endDate ? [startDate, endDate] : []
      });

      // 4. Top Produk Terlaris
      const topProdukRes = await db.execute({
        sql: `
          SELECT b.nama_barang, SUM(d.jumlah) as total_terjual
          FROM detail_transaksi d
          JOIN transaksi t ON d.transaksi_id = t.id
          JOIN barang b ON d.barang_id = b.id
          GROUP BY d.barang_id
          ORDER BY total_terjual DESC
          LIMIT 5
        `
      });

      // 5. Stok Menipis
      const lowStockRes = await db.execute(`
        SELECT kode_sku, nama_barang, stok 
        FROM barang 
        WHERE stok <= 5 
        ORDER BY stok ASC 
        LIMIT 10
      `);

      // 6. Slow Moving
      const slowMovingRes = await db.execute(`
        SELECT nama_barang, stok 
        FROM barang 
        WHERE stok > 10 
        ORDER BY stok DESC 
        LIMIT 5
      `);

      // 7. Transaksi Terbaru
      const recentTxRes = await db.execute(`
        SELECT t.nomor_faktur, t.dibuat_pada, p.nama_lengkap as nama_kasir, t.total_belanja 
        FROM transaksi t
        LEFT JOIN pengguna p ON t.pengguna_id = p.id
        ORDER BY t.dibuat_pada DESC
        LIMIT 5
      `);

      return res.status(200).json({
        kpi: kpiData,
        trend: trendRes.rows,
        peak_hours: peakRes.rows,
        top_produk: topProdukRes.rows,
        low_stock: lowStockRes.rows,
        slow_moving: slowMovingRes.rows,
        recent_transactions: recentTxRes.rows
      });

    } catch (error) {
      console.error("Dashboard API Error:", error.message);
      return res.status(500).json({ message: error.message });
    }
  }
}
