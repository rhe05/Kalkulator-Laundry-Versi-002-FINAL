// [2026-07-14] DIUJI & TERBUKTI TIDAK BISA DIPAKAI - proxy sederhana begini
// bikin Google minta pengunjung LOGIN AKUN GOOGLE (bukan tampilkan login
// Kalkulator Laundry), karena akses anonim "Anyone" di Apps Script
// mengandalkan negosiasi cookie langsung di browser pengunjung - begitu
// dilewatkan fetch() server-side Vercel, negosiasi itu gagal. Lihat
// KONTEKS_PROYEK.md bagian "Custom Domain / Reverse Proxy" untuk detail.
// File ini DIBIARKAN (tidak dihapus) sebagai referensi kalau nanti mau
// dicoba lagi dengan pendekatan cookie-forwarding yang lebih lengkap -
// JANGAN langsung pakai apa adanya tanpa perbaikan itu.
//
// Reverse proxy minimal: neruskan SEMUA request ke URL exec Apps Script
// apa adanya, supaya address bar browser tetap pakai domain custom Anda.
// Edge Runtime dipilih (bukan Node serverless biasa) supaya jalan di lokasi
// server Vercel yang paling dekat user - overhead tambahan dari proxy ini
// jadi seminimal mungkin.
export const config = { runtime: 'edge' };

// Override lewat Environment Variable GAS_EXEC_URL di dashboard Vercel kalau
// URL exec berubah (harusnya TIDAK berubah selama Anda selalu pakai
// "Deploy > Manage deployments > Edit > New version", bukan bikin deployment
// baru) - default di bawah ini cuma fallback kalau env var belum diisi.
const GAS_EXEC_URL =
  process.env.GAS_EXEC_URL ||
  'https://script.google.com/macros/s/AKfycbxQPKNOM8aTSZtWaRwp6GENbE2dT5nERK1Yd1cakULzKN2Pxrqpcui_88R_6jSCyR73xg/exec';

// Header "hop-by-hop" ini WAJIB dibuang - kalau ikut diteruskan apa adanya,
// respons bisa korup (mis. Content-Length yang salah karena body sudah
// diproses ulang oleh fetch()) atau request ke Google ditolak (Host header
// yang salah, harus punya Host punya Google sendiri bukan domain custom Anda).
const HOP_BY_HOP_REQUEST_HEADERS = ['host', 'connection', 'content-length'];
const HOP_BY_HOP_RESPONSE_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding', 'connection'];

export default async function handler(request) {
  const incoming = new URL(request.url);
  const target = new URL(GAS_EXEC_URL);
  target.search = incoming.search;

  const headers = new Headers(request.headers);
  HOP_BY_HOP_REQUEST_HEADERS.forEach((h) => headers.delete(h));

  const init = { method: request.method, headers, redirect: 'follow' };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const gasResponse = await fetch(target.toString(), init);

  const responseHeaders = new Headers(gasResponse.headers);
  HOP_BY_HOP_RESPONSE_HEADERS.forEach((h) => responseHeaders.delete(h));

  return new Response(gasResponse.body, { status: gasResponse.status, headers: responseHeaders });
}
