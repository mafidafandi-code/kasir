'use client';

import { useState, useEffect } from 'react';

export default function HalamanKasir() {
  const [daftarBarang, setDaftarBarang] = useState([]);
  const [pencarian, setPencarian] = useState('');
  const [keranjang, setKeranjang] = useState([]);
  const [metodePembayaran, setMetodePembayaran] = useState('tunai');
  const [jumlahBayar, setJumlahBayar] = useState('');
  const [loadingBarang, setLoadingBarang] = useState(true);
  const [loadingProses, setLoadingProses] = useState(false);
  const [notaTerakhir, setNotaTerakhir] = useState(null);

  useEffect(() => {
    fetchBarang();
  }, []);

  const fetchBarang = async () => {
    try {
      const res = await fetch('/api/barang');
      const data = await res.json();
      if (data.success) setDaftarBarang(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBarang(false);
    }
  };

  const barangFiltered = daftarBarang.filter(
    (b) =>
      b.nama_barang.toLowerCase().includes(pencarian.toLowerCase()) ||
      b.kode_sku.toLowerCase().includes(pencarian.toLowerCase())
  );

  const tambahKeKeranjang = (barang) => {
    if (barang.stok <= 0) return alert('Stok barang habis!');
    const ada = keranjang.find((x) => x.id === barang.id);
    if (ada) {
      if (ada.jumlah + 1 > barang.stok) return alert('Stok tidak mencukupi!');
      setKeranjang(keranjang.map((x) => (x.id === barang.id ? { ...ada, jumlah: ada.jumlah + 1 } : x)));
    } else {
      setKeranjang([...keranjang, { id: barang.id, nama_barang: barang.nama_barang, harga_jual: barang.harga_jual, stok_max: barang.stok, jumlah: 1 }]);
    }
  };

  const ubahJumlah = (id, delta) => {
    setKeranjang(
      keranjang
        .map((item) => {
          if (item.id === id) {
            const newQty = item.jumlah + delta;
            return newQty > 0 && newQty <= item.stok_max ? { ...item, jumlah: newQty } : item;
          }
          return item;
        })
    );
  };

  const hapusItem = (id) => setKeranjang(keranjang.filter((x) => x.id !== id));

  const totalBelanja = keranjang.reduce((acc, curr) => acc + curr.harga_jual * curr.jumlah, 0);
  const nominalBayar = Number(jumlahBayar) || 0;
  const kembalian = nominalBayar - totalBelanja;

  const handleSelesaiTransaksi = async () => {
    if (keranjang.length === 0) return alert('Keranjang kosong!');
    if (metodePembayaran === 'tunai' && nominalBayar < totalBelanja) return alert('Uang bayar kurang!');

    setLoadingProses(true);
    try {
      const payload = {
        pengguna_id: 'usr_01',
        items: keranjang.map((k) => ({ barang_id: k.id, jumlah: k.jumlah })),
        metode_pembayaran: metodePembayaran,
        jumlah_bayar: metodePembayaran === 'tunai' ? nominalBayar : totalBelanja,
      };

      const res = await fetch('/api/transaksi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setNotaTerakhir({
        nomor_faktur: data.data.nomor_faktur,
        items: keranjang,
        total_belanja: totalBelanja,
        jumlah_bayar: payload.jumlah_bayar,
        kembalian: data.data.kembalian,
        metode_pembayaran: metodePembayaran,
        tanggal: new Date().toLocaleString('id-ID'),
      });

      setKeranjang([]);
      setJumlahBayar('');
      fetchBarang();
      alert('Transaksi berhasil!');
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingProses(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 print:hidden">
        <h1 className="text-xl font-bold mb-4">Aplikasi Kasir (POS)</h1>
        <input
          type="text"
          placeholder="Cari barang atau scan SKU..."
          value={pencarian}
          onChange={(e) => setPencarian(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg mb-4 outline-none"
        />
        {loadingBarang ? (
          <p className="text-slate-400">Memuat barang...</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 max-h-[500px] overflow-y-auto">
            {barangFiltered.map((b) => (
              <button
                key={b.id}
                onClick={() => tambahKeKeranjang(b)}
                className="p-3 border rounded-xl text-left hover:border-blue-500 bg-white"
              >
                <div className="font-semibold text-sm line-clamp-1">{b.nama_barang}</div>
                <div className="text-blue-600 font-bold text-sm mt-2">
                  Rp{Number(b.harga_jual).toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-slate-400">Stok: {b.stok}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between print:hidden">
        <div>
          <h2 className="font-bold text-lg mb-4">Keranjang Belanja</h2>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {keranjang.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <div className="text-sm font-medium">{item.nama_barang}</div>
                  <div className="text-xs text-slate-500">Rp{item.harga_jual.toLocaleString()} x {item.jumlah}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => ubahJumlah(item.id, -1)} className="px-2 bg-slate-200 rounded font-bold">-</button>
                  <span className="text-sm font-bold">{item.jumlah}</span>
                  <button onClick={() => ubahJumlah(item.id, 1)} className="px-2 bg-slate-200 rounded font-bold">+</button>
                  <button onClick={() => hapusItem(item.id)} className="text-red-500 text-xs ml-2">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Total:</span>
            <span className="text-2xl font-black">Rp{totalBelanja.toLocaleString('id-ID')}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              value={metodePembayaran}
              onChange={(e) => setMetodePembayaran(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="tunai">Tunai</option>
              <option value="qris">QRIS</option>
            </select>
            <input
              type="number"
              placeholder="Bayar (Rp)"
              value={jumlahBayar}
              onChange={(e) => setJumlahBayar(e.target.value)}
              disabled={metodePembayaran !== 'tunai'}
              className="p-2 border rounded text-sm disabled:bg-slate-100"
            />
          </div>

          <button
            onClick={handleSelesaiTransaksi}
            disabled={loadingProses || keranjang.length === 0}
            className="w-full bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50"
          >
            {loadingProses ? 'Memproses...' : 'Simpan Transaksi'}
          </button>

          {notaTerakhir && (
            <button
              onClick={() => window.print()}
              className="w-full bg-slate-800 text-white font-medium py-2 rounded-xl text-sm"
            >
              🖨️ Cetak Struk Nota
            </button>
          )}
        </div>
      </div>

      {notaTerakhir && (
        <div className="hidden print:block fixed inset-0 bg-white p-4 text-black text-xs font-mono w-[80mm] mx-auto">
          <div className="text-center mb-2">
            <h2 className="text-sm font-bold">STRUK KASIR</h2>
            <p>{notaTerakhir.nomor_faktur}</p>
          </div>
          <div className="border-b border-t py-2 mb-2">
            {notaTerakhir.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.nama_barang} (x{item.jumlah})</span>
                <span>Rp{(item.harga_jual * item.jumlah).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>Rp{notaTerakhir.total_belanja.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}
