'use client';
import { useState, useEffect } from 'react';

export default function HalamanKasir() {
  const [keranjang, setKeranjang] = useState([]);
  const [total, setTotal] = useState(0);

  // Fungsi tambah barang ke keranjang belanja
  const tambahItem = (barang) => {
    const ada = keranjang.find((x) => x.id === barang.id);
    if (ada) {
      setKeranjang(
        keranjang.map((x) =>
          x.id === barang.id ? { ...ada, qty: ada.qty + 1 } : x
        )
      );
    } else {
      setKeranjang([...keranjang, { ...barang, qty: 1 }]);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Aplikasi Kasir (POS)</h1>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Kolom Kiri: Tabel Keranjang */}
        <div className="border p-4 rounded bg-white shadow">
          <h2 className="font-semibold mb-2">Keranjang Belanja</h2>
          {keranjang.length === 0 ? (
            <p className="text-gray-500">Keranjang masih kosong</p>
          ) : (
            <ul>
              {keranjang.map((item) => (
                <li key={item.id} className="flex justify-between border-b py-2">
                  <span>{item.nama_barang} (x{item.qty})</span>
                  <span>Rp{(item.harga_jual * item.qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Kolom Kanan: Tombol Aksi */}
        <div className="border p-4 rounded bg-white shadow">
          <h2 className="font-semibold mb-2">Aksi Transaksi</h2>
          <button 
            className="bg-green-600 text-white px-4 py-2 rounded w-full font-bold hover:bg-green-700"
            onClick={() => alert('Proses simpan transaksi...')}
          >
            Bayar & Cetak Nota
          </button>
        </div>
      </div>
    </div>
  );
}
