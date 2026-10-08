import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username dan password wajib diisi' }, { status: 400 });
    }

    const res = await db.execute({
      sql: 'SELECT id, nama_lengkap, username, password, peran FROM pengguna WHERE username = ?',
      args: [username],
    });

    if (res.rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Username atau password salah' }, { status: 401 });
    }

    const pengguna = res.rows[0];
    const passwordCocok = await bcrypt.compare(password, String(pengguna.password));

    if (!passwordCocok) {
      return NextResponse.json({ success: false, message: 'Username atau password salah' }, { status: 401 });
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-kasir-super-aman');
    const token = await new SignJWT({
      id: pengguna.id,
      nama_lengkap: pengguna.nama_lengkap,
      username: pengguna.username,
      peran: pengguna.peran,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secretKey);

    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: { nama_lengkap: pengguna.nama_lengkap, peran: pengguna.peran },
    });

    response.cookies.set({
      name: 'token_kasir',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
