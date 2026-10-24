# Undangan Pernikahan — Ramiz & Denayu

Undangan pernikahan satu halaman dengan sampul personal, RSVP, ucapan, galeri, hadiah, dan dashboard panitia. Data tamu, konfirmasi, dan kehadiran disimpan di Google Spreadsheet melalui Google Apps Script.

Tidak ada proses build. Semua file statis dan bisa langsung diunggah ke GitHub Pages, Netlify, Vercel, cPanel, atau hosting statis lainnya.

## Fitur

- Sampul dengan nama tamu personal dan animasi masuk 3D.
- Verifikasi tamu prioritas lewat kode di Spreadsheet (`?k=KODE`), bukan sekadar nama di URL.
- Tamu umum bernama bisa memakai tautan `?to=Nama`.
- RSVP (hadir / berhalangan, jumlah orang, ucapan) yang tersimpan ke Spreadsheet.
- Hitung mundur, cerita, jadwal acara, peta, hadiah, daftar hadiah, galeri, dan musik.
- Tombol simpan acara ke kalender, salin rekening/alamat, bagikan undangan.
- Dashboard panitia (`admin.html`) dengan PIN untuk melihat tamu, memfilter, check-in, menambah tamu, menyalin link, dan mengirim WhatsApp.
- Mode demo otomatis bila `SCRIPT_URL` belum diisi, sehingga tampilan bisa dicoba tanpa Spreadsheet.
- Tampilan responsif untuk desktop, tablet, dan ponsel, dengan dukungan `prefers-reduced-motion`.

## Struktur file

| File | Kegunaan |
| --- | --- |
| `index.html` | Halaman undangan |
| `style.css` | Tema, animasi, dan layout undangan |
| `script.js` | Data acara, personalisasi tamu, RSVP, galeri, musik |
| `admin.html` | Dashboard panitia |
| `admin.css` | Tampilan dashboard |
| `admin.js` | Logika dashboard dan data demo |
| `config.js` | Satu tempat untuk `SCRIPT_URL` dan `SITE_URL` |
| `apps-script/Code.gs` | Backend Apps Script + Spreadsheet |
| `assets/` | Ikon, favicon, dan file musik |

## Pratinjau lokal

Jalankan server statis dari folder proyek, lalu buka alamatnya di browser:

```bash
python -m http.server 8123
```

- Undangan: <http://localhost:8123/index.html>
- Tamu prioritas demo: <http://localhost:8123/index.html?k=DEMO123>
- Dashboard: <http://localhost:8123/admin.html> → klik **Buka mode demo**

Jangan membuka `index.html` lewat `file://` bila ingin menguji tautan, clipboard, atau musik. Gunakan server lokal seperti di atas.

## Menghubungkan Google Spreadsheet

### 1. Siapkan Spreadsheet dan Apps Script

1. Buat Google Spreadsheet baru.
2. Buka **Extensions → Apps Script**.
3. Hapus isi file default, lalu tempel seluruh isi `apps-script/Code.gs`.
4. Ubah dua pengaturan di bagian atas:

```js
const SITE_URL = 'https://alamat-undangan-anda.com/'; // harus diakhiri "/"
const ADMIN_PIN = 'ganti-pin-ini';
```

5. Simpan, lalu jalankan fungsi `setup` sekali dan izinkan akses. Ini akan membuat sheet `Tamu`, `RSVP`, `Kehadiran`, dan `Ringkasan` beserta header-nya.

Jika sheet sudah pernah dibuat dengan versi lama, `setup()` juga akan:

- menambahkan sheet `Kehadiran` dan kolom `Kode` di `RSVP`;
- memperbaiki header `Tamu` menjadi 12 kolom yang sesuai kode;
- menulis ulang formula `Ringkasan` yang rusak / `#ERROR!`;
- merapikan lebar kolom, format tanggal, dan pilihan `Tipe` (Prioritas/Umum).

Menu **Undangan → Rapikan tampilan & rekap** merapikan format dan menulis ulang formula `Ringkasan`, tanpa mengubah data tamu/RSVP/kehadiran. Menu **Cek kelengkapan lembar** menampilkan header yang masih belum sesuai.

### 2. Deploy sebagai Web App

1. **Deploy → New deployment → Web app**.
2. **Execute as:** Me.
3. **Who has access:** Anyone.
4. Salin URL yang berakhiran `/exec`.

Setiap kali `Code.gs` diubah, buat versi baru lewat **Manage deployments → Edit → New version**. Tanpa itu, Web App masih memakai kode lama.

### 3. Isi `config.js`

```js
window.WEDDING_CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
  SITE_URL: "https://alamat-undangan-anda.com/"
};
```

- `SCRIPT_URL` menghubungkan undangan dan dashboard ke Spreadsheet.
- `SITE_URL` dipakai untuk tombol bagikan dan link tamu. Harus diakhiri `/`.
- Bila `SCRIPT_URL` kosong, semuanya berjalan dalam mode demo dan tidak menyimpan data.

`config.js` dipakai oleh `index.html` dan `admin.html`, jadi keduanya selalu memakai koneksi yang sama.

### 4. Isi daftar tamu

Di sheet `Tamu`, cukup isi kolom berikut:

| Kolom | Isi |
| --- | --- |
| A — `Nama` | Nama tamu atau keluarga, mis. `Budi Santoso` |
| B — `Maks tamu` | Kapasitas maksimal, mis. `3` |
| E — `Tipe` | `Prioritas` atau `Umum` |
| F — `WhatsApp` | Opsional, format `08...` atau `62...` |

Kolom lain diisi otomatis:

- `Kode` dan `Link` dibuat lewat menu **Undangan → Buat / perbarui link tamu**.
- `Konfirmasi`, `Jumlah konfirmasi`, `Check-in`, `Waktu check-in`, `Jumlah hadir`, dan `Catatan` diperbarui oleh sistem.

Urutan kolom baku (jangan diubah):

```text
Tamu      : Nama | Maks tamu | Kode | Link | Tipe | WhatsApp | Konfirmasi | Jumlah konfirmasi | Check-in | Waktu check-in | Jumlah hadir | Catatan
RSVP      : ID | Waktu | Nama | Kehadiran | Jumlah | Ucapan | Tipe | Kode
Kehadiran : ID | Waktu | Nama | Kode | Jumlah | Tipe | Catatan
Ringkasan : Ringkasan | Nilai
```

Tamu prioritas mendapat link `?k=KODE`. Tamu umum mendapat link `?to=Nama`. Jika `SITE_URL` belum diisi, kolom `Link` akan kosong.

## Deploy ke hosting statis

`index.html` dan `admin.html` adalah **dua halaman dari satu situs statis**, bukan dua server terpisah. Tidak perlu build atau server Node. Deploy seluruh isi folder proyek (kecuali folder `apps-script/`) ke satu hosting; kedua halaman memakai `config.js`, folder `assets/`, dan Apps Script yang sama. Simpan kedua HTML sejajar di root — jangan memindahkan `admin.html` ke subfolder karena tautan “Lihat undangan” di dashboard memakai path relatif.

```text
https://domain-anda.com/            -> index.html (undangan untuk tamu)
https://domain-anda.com/admin.html  -> dashboard panitia
https://script.google.com/.../exec  -> API Apps Script -> Spreadsheet
```

File yang harus ada di hosting:

- `index.html`, `admin.html`
- `style.css`, `script.js`, `admin.css`, `admin.js`, `config.js`
- folder `assets/`

Jangan unggah folder `apps-script/` ke hosting publik atau commit ke repo publik karena `Code.gs` berisi `ADMIN_PIN` dan konfigurasi backend. Simpan kode itu hanya di Apps Script. Cara paling aman: salin hanya file-file di atas ke folder `dist/`, lalu deploy folder `dist/` itu.

### Urutan deploy yang disarankan

1. Tentukan alamat situs, misalnya `https://nama.github.io/undangan/` atau `https://undangan-anda.netlify.app/`. Alamat harus diakhiri `/`.
2. Isi `SITE_URL` di `apps-script/Code.gs` dengan alamat itu, lalu deploy Web App dan salin URL `/exec`.
3. Isi `config.js`:

```js
window.WEDDING_CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
  SITE_URL: "https://alamat-situs-anda/"
};
```

4. Unggah seluruh file frontend ke hosting.
5. Buka `https://alamat-situs-anda/admin.html`, masuk dengan PIN, lalu uji dashboard.
6. Di Spreadsheet, jalankan `setup()` dan menu **Undangan → Buat / perbarui link tamu** agar link tamu memakai `SITE_URL` yang benar.

`SITE_URL` di `Code.gs` dipakai untuk membuat link tamu di Spreadsheet. `SITE_URL` di `config.js` dipakai tombol bagikan. Keduanya sebaiknya sama. Jika alamat final belum ada, deploy frontend dulu dalam mode demo, lalu ulangi langkah 2–3 setelah alamatnya diketahui; unggah ulang `config.js` setiap kali diubah.

### Contoh hosting

**GitHub Pages**

1. Buat repo, unggah file frontend (jangan folder `apps-script`).
2. Buka **Settings → Pages → Deploy from a branch**, pilih `main` dan folder root.
3. Undangan: `https://username.github.io/nama-repo/`; dashboard: `https://username.github.io/nama-repo/admin.html`.
4. Isi `SITE_URL` dengan `https://username.github.io/nama-repo/`.

**Netlify**

1. Drag-and-drop folder frontend atau hubungkan repo.
2. Kosongkan build command dan isi publish directory dengan `.` (root).
3. Salin URL yang diberikan; dashboard ada di `/admin.html`.

**cPanel**

1. Upload isi frontend ke `public_html/undangan/` (atau root domain).
2. Pastikan `index.html` ada di folder tersebut.
3. Undangan: `https://domain.com/undangan/`; dashboard: `https://domain.com/undangan/admin.html`.
4. Aktifkan HTTPS.

### Catatan keamanan

- `admin.html` bisa dibuka siapa saja yang tahu URL-nya; PIN tetap diminta dan dicek di Apps Script. Gunakan PIN panjang, bukan `123456`.
- Untuk perlindungan tambahan, pasang password di level hosting untuk `admin.html` (misalnya directory privacy cPanel atau Cloudflare Access).
- Jangan menaruh PIN di `config.js` atau file frontend lain.
- Jika repo/hosting bersifat publik, jangan commit `ADMIN_PIN` asli di `apps-script/Code.gs`. Tempel kode ke Apps Script, lalu ganti PIN langsung di editor Apps Script; file lokal tetap memakai placeholder.
- `config.js` hanya berisi URL, jadi aman dilihat publik.

## Alur data

- RSVP dari undangan masuk ke sheet `RSVP` dan memperbarui status konfirmasi tamu prioritas di sheet `Tamu`.
- Check-in dari dashboard masuk ke sheet `Kehadiran` dan memperbarui kolom check-in di sheet `Tamu`.
- Satu tamu/kode hanya punya satu baris RSVP dan satu baris kehadiran; pengiriman ulang akan memperbarui baris yang sama.
- Sheet `Ringkasan` berisi formula rekap otomatis.

## Dashboard panitia

Buka `admin.html` di hosting yang sama.

- Masukkan `ADMIN_PIN` untuk masuk. PIN disimpan di `sessionStorage` selama tab terbuka.
- Tab **Daftar tamu** menampilkan pencarian, filter prioritas/umum/sudah hadir, tombol check-in, salin link, dan WhatsApp.
- **Tambah tamu** membuat kode dan link otomatis untuk tamu prioritas.
- **Kehadiran** menampilkan riwayat check-in.
- **Ucapan** menampilkan doa yang masuk.
- Bila `SCRIPT_URL` kosong, dashboard menawarkan **mode demo**. Perubahan di mode demo hanya tersimpan selama halaman terbuka.

Dashboard tidak diindeks mesin pencari (`noindex`), tetapi bukan pengganti sistem autentikasi yang kuat. Gunakan PIN yang panjang dan jangan membagikan `admin.html` secara luas.

## Kustomisasi undangan

Sebagian besar konten ada di bagian atas `script.js`, objek `C`:

- `couple` — nama lengkap, nama panggilan, orang tua, dan foto mempelai.
- `story` — linimasa cerita.
- `events` — nama acara, tanggal, jam, dan foto. Gunakan `only: "priority"` untuk acara khusus tamu prioritas.
- `venue`, `mapQuery`, `mapEmbed` — alamat dan peta.
- `generalMax` — kapasitas tamu untuk link `?to=`. Samakan dengan `MAX_UMUM` di `Code.gs`.
- `gifts`, `registry` — rekening, e-wallet, alamat, dan daftar hadiah.
- `gallery` — daftar foto, mis. `["assets/foto-1.jpg", "assets/foto-2.jpg"]`.
- `music`, `musicVolume`, `bgImage`, `cover` — musik dan foto latar/sampul.
- `demoGuests` — data tamu untuk mode demo. Tambahkan kode lain bila perlu.

Warna, font, dan jarak ada di variabel `:root` pada `style.css`. Warna dashboard ada di `:root` pada `admin.css`.

### Mengganti foto

Letakkan foto di `assets/`, lalu isi path-nya:

```js
couple: [
  { /* ... */ photo: "assets/mempelai-pria.jpg" },
  { /* ... */ photo: "assets/mempelai-wanita.jpg" }
],
gallery: ["assets/foto-1.jpg", "assets/foto-2.jpg"]
```

Bila foto kosong, undangan memakai monogram dan latar dekoratif, bukan gambar rusak.

## Sebelum dibagikan

- [ ] Ganti nama, orang tua, tanggal, lokasi, rekening, dan daftar hadiah contoh.
- [ ] Ganti `ADMIN_PIN` dari `123456`.
- [ ] Isi `SITE_URL` dan `SCRIPT_URL`, lalu deploy ulang situs.
- [ ] Jalankan `setup()` dan **Buat / perbarui link tamu**.
- [ ] Uji satu link prioritas dan satu link umum di ponsel.
- [ ] Kirim RSVP uji, lalu cek baris baru di sheet `RSVP`.
- [ ] Lakukan check-in uji dari dashboard, lalu hapus baris uji bila perlu.
- [ ] Pastikan musik yang dipakai berlisensi. File `Glory_of_Love.mp3` hanya contoh dan hak ciptanya bukan milik proyek ini.

## Catatan teknis

- Font diambil dari Google Fonts; peta memakai embed Google Maps. Keduanya membutuhkan koneksi internet.
- Bila peta kosong, coba muat ulang atau matikan pemblokir iklan; iframe Google Maps tidak memengaruhi fungsi RSVP.
- Verifikasi `?k=` memanggil Apps Script. Bila jaringan gagal, halaman tetap tampil sebagai tamu umum, bukan menampilkan nama yang salah.
- Kode tamu ada di URL. Siapa pun yang memiliki link dapat membuka undangan tersebut, jadi perlakukan link seperti undangan pribadi.
- Spreadsheet adalah sumber kebenaran. Hindari mengedit kolom otomatis secara manual saat acara berlangsung.
- Aplikasi ini tidak memakai cookie analitik atau pelacak pihak ketiga.
