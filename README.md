# Undangan Pernikahan — Ramiz & Denayu

Undangan pernikahan satu halaman dengan sampul personal, RSVP, ucapan, galeri, hadiah, dan dashboard panitia. Data tamu, konfirmasi, dan kehadiran disimpan di Google Spreadsheet melalui Google Apps Script.

Tidak ada proses build. Semua file statis dan bisa langsung diunggah ke GitHub Pages, Netlify, Vercel, cPanel, atau hosting statis lainnya.

## Fitur

- Sampul dengan nama tamu personal dan animasi masuk 3D.
- Verifikasi tamu prioritas lewat kode di Spreadsheet (`?k=KODE`), bukan sekadar nama di URL.
- Tamu umum bernama bisa memakai tautan `?to=Nama`.
- RSVP (hadir / berhalangan, jumlah orang, ucapan) yang tersimpan ke Spreadsheet.
- Hitung mundur, cerita, jadwal acara (kartu mengikuti gerak pointer), lokasi dengan tombol buka di Maps, hadiah, daftar hadiah, galeri, dan musik.
- Ucapan (Wishes) dan galeri (Our Moment) bergeser otomatis tiap 10 detik; keduanya punya tombol jeda, dan Wishes juga berhenti saat pointer di atasnya.
- Tombol simpan acara ke kalender, salin rekening/alamat, bagikan undangan.
- Dashboard panitia (`admin.html`) dengan login **administrator** dan **moderator**. Admin dapat melihat tamu, check-in, menambah tamu, menyalin link, mengirim WhatsApp, serta membuat/mengatur akun moderator.
- Moderator dapat melihat data tamu, memantau ucapan, dan mencatat kehadiran, tetapi tidak dapat menambah tamu atau mengelola akun.
- Tombol **Ajukan akun moderator** di halaman login mengarah ke WhatsApp administrator.
- Mode demo otomatis bila `SCRIPT_URL` belum diisi, dengan login demo `admin` / `admin` atau `moderator` / `moderator`.
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
| `config.js` | Satu tempat untuk `SCRIPT_URL`, `SITE_URL`, dan kontak admin |
| `apps-script/Code.gs` | Backend Apps Script + Spreadsheet |
| `assets/` | Ikon, favicon, dan file musik |

## Pratinjau lokal

Jalankan server statis dari folder proyek, lalu buka alamatnya di browser:

```bash
python -m http.server 8123
```

- Undangan: <http://localhost:8123/index.html>
- Tamu prioritas demo: <http://localhost:8123/index.html?k=DEMO123>
- Dashboard: <http://localhost:8123/admin.html> → login dengan `admin` / `admin` atau `moderator` / `moderator` (mode demo)

Jangan membuka `index.html` lewat `file://` bila ingin menguji tautan, clipboard, atau musik. Gunakan server lokal seperti di atas.

## Menghubungkan Google Spreadsheet

### 1. Siapkan Spreadsheet dan Apps Script

1. Buat Google Spreadsheet baru.
2. Buka **Extensions → Apps Script**.
3. Hapus isi file default, lalu tempel seluruh isi `apps-script/Code.gs`.
4. Ubah pengaturan di bagian atas:

```js
const SITE_URL = 'https://alamat-undangan-anda.com/'; // harus diakhiri "/"
const ADMIN_USERNAME = 'admin';                       // ganti sebelum dibagikan
const ADMIN_PASSWORD = 'ganti-password-ini';          // minimal 8 karakter
const ADMIN_NAME = 'Administrator';
```

5. Simpan, lalu jalankan fungsi `setup` sekali dan izinkan akses. Ini akan membuat sheet `Tamu`, `RSVP`, `Kehadiran`, `Ringkasan`, dan `Akun` beserta header-nya.

Jika sheet sudah pernah dibuat dengan versi lama, `setup()` juga akan:

- menambahkan sheet `Kehadiran`, `Akun`, dan kolom `Kode` di `RSVP`;
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
  SITE_URL: "https://alamat-undangan-anda.com/",
  ADMIN_WA: "6281234567890",
  ADMIN_NAME: "Administrator"
};
```

- `SCRIPT_URL` menghubungkan undangan dan dashboard ke Spreadsheet.
- `SITE_URL` dipakai untuk tombol bagikan dan link tamu. Harus diakhiri `/`.
- `ADMIN_WA` adalah nomor WhatsApp administrator untuk pengajuan akun moderator. Gunakan kode negara, misalnya `6281234567890`. Jika kosong, tombol tetap membuka WhatsApp agar pengirim memilih kontak admin.
- `ADMIN_NAME` adalah nama yang muncul pada pesan pengajuan akun.
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
Akun      : Username | Nama | Password hash | Salt | Role | Status | Dibuat | Terakhir login
```

Sheet `Akun` dibuat otomatis oleh `setup()`. Kolom `Password hash` dan `Salt` disembunyikan; akun moderator sebaiknya dibuat dari tab **Akun** di dashboard, bukan diedit manual.

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

Jangan unggah folder `apps-script/` ke hosting publik atau commit ke repo publik karena `Code.gs` berisi `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan konfigurasi backend. Simpan kode itu hanya di Apps Script. Cara paling aman: salin hanya file-file di atas ke folder `dist/`, lalu deploy folder `dist/` itu.

### Urutan deploy yang disarankan

1. Tentukan alamat situs, misalnya `https://nama.github.io/undangan/` atau `https://undangan-anda.netlify.app/`. Alamat harus diakhiri `/`.
2. Isi `SITE_URL` di `apps-script/Code.gs` dengan alamat itu, lalu deploy Web App dan salin URL `/exec`.
3. Isi `config.js`:

```js
window.WEDDING_CONFIG = {
  SCRIPT_URL: "https://script.google.com/macros/s/XXXXXXXX/exec",
  SITE_URL: "https://alamat-situs-anda/",
  ADMIN_WA: "6281234567890",
  ADMIN_NAME: "Administrator"
};
```

4. Unggah seluruh file frontend ke hosting.
5. Buka `https://alamat-situs-anda/admin.html`, masuk sebagai administrator, lalu uji dashboard dan buat satu akun moderator percobaan.
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

- `admin.html` bisa dibuka siapa saja yang tahu URL-nya, tetapi data hanya terbuka setelah login. Username dan password administrator dicek di Apps Script; akun moderator disimpan sebagai hash SHA-256 + salt di sheet `Akun`.
- Ganti `ADMIN_USERNAME` dan `ADMIN_PASSWORD` bawaan sebelum dibagikan. Gunakan password panjang dan unik, bukan `123456`.
- Sesi login memakai token acak yang berlaku 6 jam. Menutup tab tidak menghapus sesi; tombol **Keluar** menghapus token. Menonaktifkan atau menghapus akun moderator langsung memutus aksesnya pada permintaan berikutnya.
- Login dibatasi 5 percobaan gagal per username, lalu dikunci 10 menit.
- Moderator hanya dapat melihat data dan mencatat kehadiran. Tambah tamu serta pengelolaan akun moderator hanya untuk administrator, dan aturan ini juga ditegakkan di Apps Script, bukan hanya disembunyikan di tampilan.
- Untuk perlindungan tambahan, pasang password di level hosting untuk `admin.html` (misalnya directory privacy cPanel atau Cloudflare Access).
- Jangan menaruh password di `config.js` atau file frontend lain.
- Jika repo/hosting bersifat publik, jangan commit `ADMIN_PASSWORD` asli di `apps-script/Code.gs`. Tempel kode ke Apps Script, lalu ganti nilainya langsung di editor Apps Script; file lokal tetap memakai placeholder.
- `config.js` hanya berisi URL dan nomor WhatsApp admin, jadi aman dilihat publik.

## Alur data

- RSVP dari undangan masuk ke sheet `RSVP` dan memperbarui status konfirmasi tamu prioritas di sheet `Tamu`.
- Check-in dari dashboard masuk ke sheet `Kehadiran` dan memperbarui kolom check-in di sheet `Tamu`.
- Satu tamu/kode hanya punya satu baris RSVP dan satu baris kehadiran; pengiriman ulang akan memperbarui baris yang sama.
- Sheet `Ringkasan` berisi formula rekap otomatis.

## Dashboard panitia

Buka `admin.html` di hosting yang sama, lalu masuk dengan akun panitia.

### Hak akses

| Peran | Dapat dilakukan |
| --- | --- |
| **Administrator** | Melihat ringkasan, tamu, kehadiran, ucapan; menambah tamu; check-in; membuat, mereset password, menonaktifkan, dan menghapus akun moderator. |
| **Moderator** | Melihat ringkasan, tamu, kehadiran, ucapan; check-in tamu. Tidak dapat menambah tamu atau membuka tab **Akun**. |

Akun administrator utama diatur lewat `ADMIN_USERNAME`, `ADMIN_PASSWORD`, dan `ADMIN_NAME` di `Code.gs`. Akun moderator dibuat dari tab **Akun** setelah login sebagai administrator, lalu dibagikan username dan password-nya secara pribadi.

### Pengajuan akun moderator

Halaman login memiliki tombol **Ajukan akun moderator** yang membuka WhatsApp ke nomor `ADMIN_WA`. Pesan sudah terisi nama, username yang diinginkan, dan nomor WhatsApp pendaftar. Jika `ADMIN_WA` kosong, WhatsApp tetap terbuka dan pengirim memilih kontak admin sendiri.

### Bagian dashboard

- **Ringkasan** menampilkan statistik tamu, progres kehadiran, check-in terbaru, dan status konfirmasi.
- **Daftar tamu** menyediakan pencarian, filter prioritas/umum/sudah hadir, tombol check-in, salin link, dan WhatsApp.
- **Tambah tamu** (admin) membuat kode dan link otomatis untuk tamu prioritas.
- **Kehadiran** menampilkan riwayat check-in dan tombol check-in tamu baru.
- **Ucapan** menampilkan doa yang masuk.
- **Akun** (admin) menampilkan akun administrator utama dan daftar moderator. Setiap moderator dapat direset password-nya, dinonaktifkan sementara, atau dihapus.
- Bila `SCRIPT_URL` kosong, dashboard menawarkan mode demo. Masuk dengan `admin` / `admin` atau `moderator` / `moderator`; tombol **Isi akun** hanya mengisi form, bukan langsung membuka dashboard. Perubahan di mode demo hanya tersimpan selama halaman terbuka.

Dashboard tidak diindeks mesin pencari (`noindex`). Meski begitu, gunakan password yang kuat dan jangan membagikan `admin.html` secara luas.

### Untuk deployment yang sudah berjalan

Jika sebelumnya memakai `ADMIN_PIN`, lakukan sekali setelah memperbarui `Code.gs`:

1. Ganti `ADMIN_PIN` dengan `ADMIN_USERNAME` dan `ADMIN_PASSWORD` di editor Apps Script.
2. Jalankan `setup()` agar sheet `Akun` dan header barunya dibuat.
3. Deploy → **Manage deployments** → **Edit** → **New version**. Tanpa langkah ini, Web App masih menjalankan kode lama.
4. Masuk ke `admin.html`, buka tab **Akun**, lalu buat akun moderator yang dibutuhkan.
5. Bagikan `admin.html` beserta username/password masing-masing; minta moderator mengganti password melalui admin bila perlu.

## Kustomisasi undangan

Sebagian besar konten ada di bagian atas `script.js`, objek `C`:

- `couple` — nama lengkap, nama panggilan, orang tua, dan foto mempelai.
- `story` — linimasa cerita.
- `events` — nama acara, tanggal, jam, dan foto. Gunakan `only: "priority"` untuk acara khusus tamu prioritas.
- `venue`, `mapQuery` — alamat dan kata kunci untuk tombol **Buka di Maps** (tidak ada lagi pratinjau peta di halaman).
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
- [ ] Ganti `ADMIN_USERNAME` dan `ADMIN_PASSWORD` dari nilai contoh `admin` / `123456`.
- [ ] Isi `SITE_URL`, `SCRIPT_URL`, `ADMIN_WA`, dan `ADMIN_NAME`, lalu deploy ulang situs.
- [ ] Jalankan `setup()` dan **Buat / perbarui link tamu**.
- [ ] Deploy ulang Web App sebagai **New version** setiap kali `Code.gs` berubah.
- [ ] Buat akun moderator yang diperlukan dan uji login admin + moderator.
- [ ] Uji satu link prioritas dan satu link umum di ponsel.
- [ ] Kirim RSVP uji, lalu cek baris baru di sheet `RSVP`.
- [ ] Lakukan check-in uji dari dashboard, lalu hapus baris uji bila perlu.
- [ ] Pastikan musik yang dipakai berlisensi. File `Glory_of_Love.mp3` hanya contoh dan hak ciptanya bukan milik proyek ini.

## Catatan teknis

- Font diambil dari Google Fonts dan membutuhkan koneksi internet.
- Kecepatan geser otomatis: `data-auto="10000"` pada `.s-wish` di `index.html` (Wishes) dan `AUTO_MS` di `initGallery()` pada `script.js` (Our Moment), dalam milidetik.
- Verifikasi `?k=` memanggil Apps Script. Bila jaringan gagal, halaman tetap tampil sebagai tamu umum, bukan menampilkan nama yang salah.
- Kode tamu ada di URL. Siapa pun yang memiliki link dapat membuka undangan tersebut, jadi perlakukan link seperti undangan pribadi.
- Login dashboard memakai token sesi 6 jam yang disimpan di `sessionStorage`; token tidak pernah ditulis ke `config.js` atau URL undangan.
- Password moderator disimpan sebagai hash SHA-256 + salt di sheet `Akun`. Tetap gunakan password unik karena hash tanpa key derivation hanya melindungi dari pembacaan langsung.
- Spreadsheet adalah sumber kebenaran. Hindari mengedit kolom otomatis secara manual saat acara berlangsung.
- Aplikasi ini tidak memakai cookie analitik atau pelacak pihak ketiga.