import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { pengguna_id, items, metode_pembayaran, jumlah_bayar } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ success: false, message: 'Item transaksi kosong' }, { status: 400 });
    }

    const idTransaksi = `TRX-${Date.now()}`;
    const nomorFaktur = `INV/${new Date().toISOString().slice(0, 10).replace(/-/g, '')}/${Math.floor(1000 + Math.random() * 9000)}`;

    let totalBelanja = 0;
    let totalLaba = 0;
    const detailQueries = [];
    const updateStokQueries = [];

    for (const item of items) {
      const resBarang = await db.execute({
        sql: 'SELECT id, harga_beli, harga_jual, stok FROM barang WHERE id = ?',
        args: [item.barang_id],
      });

      if (resBarang.rows.length === 0) {
        return NextResponse.json({ success: false, message: `Barang tidak ditemukan` }, { status: 404 });
      }

      const barang = resBarang.rows[0];
      if (Number(barang.stok) < item.jumlah) {
        return NextResponse.json({ success: false, message: `Stok barang tidak mencukupi` }, { status: 400 });
      }

      const hargaBeli = Number(barang.harga_beli);
      const hargaJual = Number(barang.harga_jual);
      const subtotalBelanja = hargaJual * item.jumlah;
      const subtotalLaba = (hargaJual - hargaBeli) * item.jumlah;

      totalBelanja += subtotalBelanja;
      totalLaba += subtotalLaba;

      detailQueries.push({
        sql: `INSERT INTO detail_transaksi (id, transaksi_id, barang_id, jumlah, harga_beli_snapshot, harga_jual_snapshot, subtotal_belanja, subtotal_laba)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [`DTL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, idTransaksi, item.barang_id, item.jumlah, hargaBeli, hargaJual, subtotalBelanja, subtotalLaba],
      });

      updateStokQueries.push({
        sql: 'UPDATE barang SET stok = stok - ? WHERE id = ?',
        args: [item.jumlah, item.barang_id],
      });
    }

    const kembalian = jumlah_bayar - totalBelanja;
    const headerQuery = {
      sql: `INSERT INTO transaksi (id, nomor_faktur, pengguna_id, total_belanja, total_laba, metode_pembayaran, jumlah_bayar, kembalian)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [idTransaksi, nomorFaktur, pengguna_id, totalBelanja, totalLaba, metode_pembayaran, jumlah_bayar, kembalian],
    };

    await db.batch([headerQuery, ...detailQueries, ...updateStokQueries], 'write');

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: { nomor_faktur: nomorFaktur, total_belanja: totalBelanja, kembalian },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
