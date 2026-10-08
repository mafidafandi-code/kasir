import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const res = await db.execute(`
      SELECT b.id, b.kode_sku, b.nama_barang, b.harga_beli, b.harga_jual, b.stok, b.keterangan,
             k.nama_kategori
      FROM barang b
      LEFT JOIN kategori k ON b.kategori_id = k.id
      ORDER BY b.dibuat_pada DESC
    `);
    return NextResponse.json({ success: true, data: res.rows });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { kode_sku, nama_barang, kategori_id, harga_beli, harga_jual, stok, keterangan } = body;
    const id = `BRG-${Date.now()}`;

    await db.execute({
      sql: `INSERT INTO barang (id, kode_sku, nama_barang, kategori_id, harga_beli, harga_jual, stok, keterangan)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, kode_sku, nama_barang, kategori_id || null, harga_beli, harga_jual, stok || 0, keterangan || ''],
    });

    return NextResponse.json({ success: true, message: 'Barang berhasil disimpan' });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
