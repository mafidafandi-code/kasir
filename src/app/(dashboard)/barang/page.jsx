'use client';

import { useState, useEffect } from 'react';

export default function HalamanKelolaBarang() {
  const [daftarBarang, setDaftarBarang] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    kode_sku: '',
    nama_barang: '',
    harga_beli: '',
    harga_jual: '',
    stok: '',
    keterangan: '',
  });

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
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/barang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          harga_beli: Number(form.harga_beli),
          harga_jual: Number(form.harga_jual),
          stok: Number(form.stok),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      alert('Barang berhasil ditambahkan!');
      setForm({ kode_sku: '', nama_barang: '', harga_beli: '', harga_jual: '', stok: '', keterangan: '' });
      fetchBarang();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Tambah Barang Baru</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Kode SKU"
            required
            value={form.kode_sku}
            onChange={(e) => setForm({ ...form, kode_sku: e.target.value })}
            className="w-full p-2 border rounded text-sm"
          />
          <input
            type="text"
            placeholder="Nama Barang"
            required
            value={form.nama_barang}
            onChange={(e) => setForm({ ...form, nama_barang: e.target.value })}
            className="w-full p-2 border rounded text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Harga Beli"
              required
              value={form.harga_beli}
              onChange={(e) => setForm({ ...form, harga_beli: e.target.value })}
              className="w-full p-2 border rounded text-sm"
            />
            <input
              type="number"
              placeholder="Harga Jual"
              required
              value={form.harga_jual}
              onChange={(e) => setForm({ ...form, harga_jual: e.target.value })}
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <input
            type="number"
            placeholder="Stok Awal"
            required
            value={form.stok}
            onChange={(e) => setForm({ ...form, stok: e.target.value })}
            className="w-full p-2 border rounded text-sm"
          />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm">
            + Simpan Barang
          </button>
        </form>
      </div>

      <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-4">Daftar Barang</h3>
        {loading ? (
          <p className="text-slate-400 text-sm">Memuat...</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="p-2">SKU</th>
                <th className="p-2">Nama</th>
                <th className="p-2">Harga Beli</th>
                <th className="p-2">Harga Jual</th>
                <th className="p-2">Stok</th>
              </tr>
            </thead>
            <tbody>
              {daftarBarang.map((b) => (
                <tr key={b.id} className="border-b">
                  <td className="p-2 font-mono text-xs">{b.kode_sku}</td>
                  <td className="p-2 font-medium">{b.nama_barang}</td>
                  <td className="p-2">Rp{Number(b.harga_beli).toLocaleString()}</td>
                  <td className="p-2 text-blue-600 font-bold">Rp{Number(b.harga_jual).toLocaleString()}</td>
                  <td className="p-2 font-bold">{b.stok}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
