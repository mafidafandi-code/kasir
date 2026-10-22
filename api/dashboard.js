import { db } from '../lib/turso.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const range = url.searchParams.get('range') || '7days';
      const startDate = url.searchParams.get('startDate');
      const endDate = url.searchParams.get('endDate');

      // Tentukan kondisi filter tanggal berdasarkan zona waktu WIB (+7 jam)
      let dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-7 days')`;
      let queryArgs = [];

      if (range === 'today') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours')`;
      } else if (range === 'yesterday') {
        dateCondition = `date(dibuat_pada) = date('now', '+7 hours', '-1 day')`;
      } else if (range === '7days') {
        dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-7 days')`;
      } else if (range === '30days') {
        dateCondition = `dibuat_pada >= datetime('now', '+7 hours', '-30 days')`;
      } else if (range === 'this_month') {
        dateCondition = `strftime('%Y-%m', dibuat_pada) = strftime('%Y-%m', 'now', '+7 hours')`;
      } else if (range === 'last_month') {
        dateCondition = `strftime('%Y-%m', dibuat_pada) = strftime('%Y-%m', 'now', '+7 hours', '-1 month')`;
      } else if (range === 'custom' && startDate && endDate) {
        dateCondition = `date(dibuat_pada) BETWEEN ? AND ?`;
        queryArgs.push(startDate, endDate);
      }

      // 1. Query KPI Keuangan (Omzet, Transaksi, Laba, Rata-rata)
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

      // Total Volume Barang Terjual
      const volumeRes = await db.execute({
        sql: `
          SELECT COALESCE(SUM(d.jumlah), 0) as total_volume
          FROM detail_transaksi d
          JOIN transaksi t ON d.transaksi_id = t.id
          WHERE ${dateCondition}
        `,
        args: queryArgs
      });

      let kpiData = { 
        ...kpiRes.rows[0], 
        total_volume: volumeRes.rows[0].total_volume 
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
        args: queryArgs
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
        args: queryArgs
      });

      // 4. Top Produk Terlaris
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

      // 5. Peringatan Stok Menipis (Real-time inventaris)
      const lowStockRes = await db.execute(`
        SELECT kode_sku, nama_barang, stok 
        FROM barang 
        WHERE stok <= 5 
        ORDER BY stok ASC 
        LIMIT 10
      `);

      // 6. Produk Slow Moving
      const slowMovingRes = await db.execute(`
        SELECT nama_barang, stok 
        FROM barang 
        WHERE stok > 10 
        ORDER BY stok DESC 
        LIMIT 5
      `);

      // 7. Transaksi Terbaru Berdasarkan Filter
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
      return res.status(500).json({ message: error.message });
    }
  }
}
