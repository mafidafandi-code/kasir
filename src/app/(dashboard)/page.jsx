'use client';

import { useState, useEffect } from 'react';

export default function HalamanKelolaBarang() {
  const [tabAktif, setTabAktif] = useState('barang'); // 'barang' | 'kategori' | 'stok'
  const [daftarBarang, setDaftarBarang] = useState([]);
  const [daftarKategori, setDaftarKategori] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State Barang Baru
  const [formBarang, setFormBarang] = useState({
    kode_sku: '',
    nama_barang: '',
    kategori_id: '',
    sub_kategori_id: '',
    harga_beli: '',
    harga_jual: '',
    stok: '',
    keterangan: '',
  });

  // Form State Kategori Baru
  const [namaKategoriBaru, setNamaKategoriBaru] = useState('');

  // Form State Restock / Tambah Stok
  const [formStok, setFormStok] = useState({
    barang_id: '',
    jumlah_masuk: '',
    harga_beli_per_unit: '',
    catatan: '',
  });

  useEffect(() => {
    fetchDataBarang();
    fetchDataKategori();
  }, []);

  const fetchDataBarang = async () => {
    try {
      const res = await fetch('/api/barang');
      const data = await res.json();
      if (data.success) setDaftarBarang(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataKategori = async () => {
    try {
      const res = await fetch('/api/kategori');
      const data = await res.json();
      if (data.success) setDaftarKategori(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Submit Tambah Barang Baru
  const handleSimpanBarang = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formBarang,
          harga_beli: Number(formBarang.harga_beli),
          harga_jual: Number(formBarang.harga_jual),
          stok: Number(formBarang.stok),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert('Barang berhasil ditambahkan!');
      setFormBarang({
        kode_sku: '',
        nama_barang: '',
        kategori_id: '',
        sub_kategori_id: '',
        harga_beli: '',
        harga_jual: '',
        stok: '',
        keterangan: '',
      });
      fetchDataBarang();
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. Submit Tambah Kategori
  const handleSimpanKategori = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/kategori', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama_kategori: namaKategoriBaru }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert('Kategori berhasil ditambahkan!');
      setNamaKategoriBaru('');
      fetchDataKategori();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kelola Produk & Inventaris</h1>
          <p className="text-slate-500 text-sm">Manajemen barang, kategori, dan pemasokan stok</p>
        </div>

        {/* Tab Navigasi */}
        <div className="flex gap-2 bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setTabAktif('barang')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tabAktif === 'barang' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Master Barang
          </button>
          <button
            onClick={() => setTabAktif('kategori')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              tabAktif === 'kategori' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600'
            }`}
          >
            Kategori
          </button>
        </div>
      </div>

      {/* TAB 1: MASTER BARANG */}
      {tabAktif === 'barang' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Tambah Barang (Col 4) */}
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Tambah Barang Baru</h3>
            <form onSubmit={handleSimpanBarang} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Kode SKU / Barcode</label>
                <input
                  type="text"
                  required
                  value={formBarang.kode_sku}
                  onChange={(e) => setFormBarang({ ...formBarang, kode_sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8991234567..."
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={formBarang.nama_barang}
                  onChange={(e) => setFormBarang({ ...formBarang, nama_barang: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contoh: Kopi Susu 250ml"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600">Harga Beli (Modal)</label>
                  <input
                    type="number"
                    required
                    value={formBarang.harga_beli}
                    onChange={(e) => setFormBarang({ ...formBarang, harga_beli: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Harga Jual</label>
                  <input
                    type="number"
                    required
                    value={formBarang.harga_jual}
                    onChange={(e) => setFormBarang({ ...formBarang, harga_jual: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Stok Awal</label>
                <input
                  type="number"
                  required
                  value={formBarang.stok}
                  onChange={(e) => setFormBarang({ ...formBarang, stok: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600">Keterangan / Deskripsi</label>
                <textarea
                  rows="2"
                  value={formBarang.keterangan}
                  onChange={(e) => setFormBarang({ ...formBarang, keterangan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Posisi rak, catatan rasa, dll."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
              >
                + Simpan Barang
              </button>
            </form>
          </div>

          {/* Tabel Daftar Barang (Col 8) */}
          <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
            <h3 className="font-bold text-slate-800 mb-4">Daftar Barang Aktif</h3>
            {loading ? (
              <p className="text-slate-400 text-sm">Memuat data...</p>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Nama Barang</th>
                    <th className="p-3">Harga Beli</th>
                    <th className="p-3">Harga Jual</th>
                    <th className="p-3">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftarBarang.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-slate-500">{item.kode_sku}</td>
                      <td className="p-3 font-medium text-slate-800">
                        {item.nama_barang}
                        {item.keterangan && (
                          <span className="block text-xs text-slate-400 font-normal">{item.keterangan}</span>
                        )}
                      </td>
                      <td className="p-3">Rp{Number(item.harga_beli).toLocaleString('id-ID')}</td>
                      <td className="p-3 font-bold text-blue-600">Rp{Number(item.harga_jual).toLocaleString('id-ID')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.stok > 5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.stok}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KATEGORI */}
      {tabAktif === 'kategori' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Tambah Kategori Baru</h3>
            <form onSubmit={handleSimpanKategori} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={namaKategoriBaru}
                  onChange={(e) => setNamaKategoriBaru(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: Makanan Ringan"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm transition"
              >
                + Simpan Kategori
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4">Daftar Kategori</h3>
            <ul className="divide-y divide-slate-100">
              {daftarKategori.map((kat) => (
                <li key={kat.id} className="py-2.5 flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700">{kat.nama_kategori}</span>
                  <span className="text-xs text-slate-400">ID: {kat.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
