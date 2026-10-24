/* =====================================================================
   KONEKSI KE SPREADSHEET (satu pengaturan untuk undangan & dashboard)
   ---------------------------------------------------------------------
   1. Deploy apps-script/Code.gs sebagai Web App (Execute as: Me,
      Who has access: Anyone), lalu salin URL yang berakhiran /exec.
   2. Tempel URL tersebut di bawah. Jika dibiarkan kosong, undangan
      berjalan dalam mode demo (tidak menyimpan data).
   ===================================================================== */
window.WEDDING_CONFIG = {
  SCRIPT_URL: "",
  // Opsional: alamat halaman undangan yang sudah online (dipakai tombol bagikan)
  SITE_URL: ""
};

/* Penanda bahwa JavaScript aktif — agar animasi reveal tidak menyembunyikan
   konten bila JavaScript dimatikan. */
document.documentElement.classList.add("js");
