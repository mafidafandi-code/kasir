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

    // Loop barang untuk ambil harga beli & jual snapshot
    for (const item of items) {
      const resBarang = await db.execute({
        sql: 'SELECT id, harga_beli, harga_jual, stok FROM barang WHERE id = ?',
        args: [item.barang_id],
      });

      if (resBarang.rows.length === 0) {
        return NextResponse.json({ success: false, message: `Barang ID ${item.barang_id} tidak ditemukan` }, { status: 404 });
      }

      const barang = resBarang.rows[0];
      const stokSekarang = Number(barang.stok);

      if (stokSekarang < item.jumlah) {
        return NextResponse.json({ success: false, message: `Stok tidak mencukupi untuk item ID ${item.barang_id}` }, { status: 400 });
      }

      const hargaBeli = Number(barang.harga_beli);
      const hargaJual = Number(barang.harga_jual);
      const subtotalBelanja = hargaJual * item.jumlah;
      const subtotalLaba = (hargaJual - hargaBeli) * item.jumlah;

      totalBelanja += subtotalBelanja;
      totalLaba += subtotalLaba;

      // Masukkan ke detail transaksi
      detailQueries.push({
        sql: `INSERT INTO detail_transaksi (id, transaksi_id, barang_id, jumlah, harga_beli_snapshot, harga_jual_snapshot, subtotal_belanja, subtotal_laba)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          `DTL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          idTransaksi,
          item.barang_id,
          item.jumlah,
          hargaBeli,
          hargaJual,
          subtotalBelanja,
          subtotalLaba,
        ],
      });

      // Kurangi stok barang
      updateStokQueries.push({
        sql: 'UPDATE barang SET stok = stok - ? WHERE id = ?',
        args: [item.jumlah, item.barang_id],
      });
    }

    const kembalian = jumlah_bayar - totalBelanja;
    if (kembalian < 0) {
      return NextResponse.json({ success: false, message: 'Jumlah bayar kurang' }, { status: 400 });
    }

    // Header Transaksi
    const headerQuery = {
      sql: `INSERT INTO transaksi (id, nomor_faktur, pengguna_id, total_belanja, total_laba, metode_pembayaran, jumlah_bayar, kembalian)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [idTransaksi, nomorFaktur, pengguna_id, totalBelanja, totalLaba, metode_pembayaran, jumlah_bayar, kembalian],
    };

    // Jalankan semua query sekaligus dalam 1 transaksi DB aman
    await db.batch([headerQuery, ...detailQueries, ...updateStokQueries], 'write');

    return NextResponse.json({
      success: true,
      message: 'Transaksi berhasil disimpan',
      data: {
        nomor_faktur: nomorFaktur,
        total_belanja: totalBelanja,
        total_laba: totalLaba,
        kembalian: kembalian,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
