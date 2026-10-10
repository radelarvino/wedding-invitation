/* ===== Ubah data di sini ===== */
const C = {
  SCRIPT_URL: "ramizdenayuwedding",                 // URL Web App Apps Script (kosong = mode demo)
  music: "",                      // opsional: alamat file audio lain. Kosong = pakai src pada <audio id="bgm"> di index.html (assets/audio/Glory_of_Love.mp3)
  musicVolume: .7,                // 0 - 1
  bgImage: "",                    // opsional: foto latar tetap (di-blend dengan warna latar). Contoh: "assets/latar.jpg"
  cover: [],                      // URL foto latar sampul (opsional)
  couple: [
    {full:"Ramiz Qudamah", nick:"Ramiz Qudamah", parents:"Putra dari Bapak Alm.Andi Munadi & Ibu Huswatun Hasanah", photo:""},
    {full:"Denayu Tiara", nick:"Denayu", parents:"Putri dari Bapak A & Ibu B", photo:""}
  ],
  motive: "Kami percaya pernikahan adalah ibadah terpanjang: belajar saling menjaga, bertumbuh bersama, dan pulang ke tempat yang sama.",
  story: [
    {date:"Maret 2021", t:"Bertemu", d:"Pertemuan pertama di acara kampus, berawal dari obrolan tentang buku.", full:"Kami bertemu di sebuah acara kampus. Awalnya hanya saling menyapa, lalu obrolan tentang buku membuat waktu terasa singkat. Dari pertemuan sederhana itu, kami mulai saling mencari kabar."},
    {date:"Agustus 2022", t:"Saling mengenal", d:"Dari teman diskusi menjadi tempat berbagi cerita setiap hari.", full:"Jarak dan kesibukan sempat memisahkan, tetapi kami tetap berkabar. Obrolan ringan perlahan berubah menjadi tempat pulang untuk berbagi cerita, resah, dan rencana."},
    {date:"Januari 2025", t:"Lamaran", d:"Keluarga bertemu dan kami sepakat melangkah lebih serius.", full:"Dengan niat baik, keluarga kedua belah pihak bertemu. Dalam suasana hangat, kami sepakat melangkah ke jenjang yang lebih serius."},
    {date:"Desember 2026", t:"Pelaminan", d:"Dengan restu keluarga, kami memulai perjalanan baru.", full:"Setelah persiapan yang dijalani bersama, kami akan mengikat janji suci. Kami memohon doa agar perjalanan ini diberkahi dan dimudahkan."}
  ],
  /* only:"priority" = hanya tampil di tautan prioritas */
  events: [
    {name:"Akad nikah", label:"Minggu, 13 Desember 2026", time:"08.00 – 10.00 WIB", start:"2026-12-13T08:00:00+07:00", end:"2026-12-13T10:00:00+07:00", photo:""},
    {name:"Resepsi", label:"Minggu, 13 Desember 2026", time:"11.00 – 14.00 WIB", start:"2026-12-13T11:00:00+07:00", end:"2026-12-13T14:00:00+07:00", photo:""}
  ],
  venue: "Kantor Urusan Agama Kecamatan Tebet, Jakarta Selatan",
  mapQuery: "Kantor Urusan Agama Kecamatan Tebet",
  generalMax: 1,                  // jumlah tamu maksimal untuk tautan umum
  demoGuests: {DEMO123:{name:"Budi Santoso", max:3}},   // hanya mode demo; data asli ada di Sheet
  /* Tambah kartu hadiah baru cukup dengan menambah satu baris di sini; slider menyesuaikan otomatis */
  gifts: [
    {title:"Transfer bank", sub:"Bank BCA a.n. Rafi Pratama", value:"1234567890", btn:"Salin rekening", qr:"", logo:""},
    {title:"E-wallet", sub:"DANA / GoPay a.n. Nadia Safitri", value:"081234567890", btn:"Salin nomor", qr:"", logo:""},
    {title:"Alamat rumah", sub:"Untuk kado fisik", value:"Jl. Contoh No. 1, Jakarta", btn:"Salin alamat"}
  ],
  registry: [
    {n:"Air fryer", price:700000, got:0, need:1, url:"https://contoh.com/air-fryer"},
    {n:"Mesin cuci portable", price:689000, got:1, need:1, url:"https://contoh.com/mesin-cuci"},
    {n:"Set peralatan masak", price:440000, got:0, need:2, url:"https://contoh.com/set-masak"}
  ],
  gallery: []                     // daftar URL foto, mis. ["assets/foto1.jpg","assets/foto2.jpg"]
};
/* ============================== */
const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const [a,b]=C.couple, P=new URLSearchParams(location.search), KEY=P.get('k');
let guest={name:(P.get('to')||'Tamu Undangan').replace(/-/g,' ').slice(0,60),max:C.generalMax,priority:false};
/* hanya URL Web App Apps Script yang sah yang dipakai; selain itu = mode demo */
const API=/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(C.SCRIPT_URL||'')?C.SCRIPT_URL:'';
const ic=n=>`<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;
function toast(t){const x=$('#toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),t.length>40?3800:1800)}

/* tautan prioritas: kode k diverifikasi di server (Apps Script), bukan di halaman */
async function resolveGuest(){
  if(!KEY) return;
  try{
    const g=API?await (await fetch(`${API}?action=guest&k=${encodeURIComponent(KEY)}`)).json():C.demoGuests[KEY];
    if(g&&g.name){guest={name:g.name,max:g.max||1,priority:true};
      if(g.rsvp&&!localStorage.getItem('rsvp:'+KEY))localStorage.setItem('rsvp:'+KEY,JSON.stringify(g.rsvp))}
  }catch(e){}
}

function render(){
  document.title=`Undangan Pernikahan ${a.nick} & ${b.nick}`;
  $('#nick').textContent=`${a.nick} & ${b.nick}`;
  $('#guest').textContent=guest.name; $('#tag').hidden=!guest.priority;
  const evs=C.events.filter(e=>!e.only||(e.only==='priority'&&guest.priority));
  $('#opDate').textContent=evs[0].label;
  const dp=Object.fromEntries(new Intl.DateTimeFormat('id-ID',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Jakarta'}).formatToParts(new Date(evs[0].start)).map(p=>[p.type,p.value]));
  $('#evDate').innerHTML=`<span>${dp.weekday}</span><b>${dp.day}</b><span>${dp.month}</span><span>${dp.year}</span>`;
  $('#ev').innerHTML=evs.map((e,i)=>`<div class="card evc rv"><div class="evp">${e.photo?`<img src="${esc(e.photo)}" alt="Foto mempelai" loading="lazy">`:`<span>Foto mempelai</span>`}</div><div class="evb"><h3>${esc(e.name)}</h3><p>${esc(e.label)}</p><p>${esc(e.time)}</p><button class="btn ghost" data-ics="${i}">${ic('calendar')} Simpan ke kalender</button></div></div>`).join('');
  $('#ev').onclick=e=>{const i=e.target.dataset.ics;if(i!==undefined)ics(evs[i])};
  startCountdown(new Date(evs[0].start));
  $$('.rv').forEach(el=>io.observe(el));
  const n=$('#n');n.value=guest.name==='Tamu Undangan'?'':guest.name;n.readOnly=guest.priority;
  const max=guest.max;$('#j').innerHTML=Array.from({length:max},(_,i)=>`<option value="${i+1}">${i+1} orang</option>`).join('');
  $('#jl').textContent=`Jumlah tamu (maks. ${max})`;
  restoreRsvp();
}
const person=p=>`<div class="rv"><div class="ph">${p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.nick)}" loading="lazy">`:`<svg viewBox="0 0 100 130" width="80%" fill="var(--line)" aria-hidden="true"><circle cx="50" cy="48" r="22"/><path d="M6 130c0-34 20-48 44-48s44 14 44 48z"/></svg>`}</div><h3>${esc(p.full)}</h3><p>${esc(p.parents)}</p></div>`;
$('#pair').innerHTML=person(a)+'<div class="amp rv">&amp;</div>'+person(b);
$('#motive').textContent=C.motive;
/* sampul: huruf nama muncul satu per satu (animasi di CSS) */
const lt=(t,o)=>[...t].map((ch,k)=>`<span class="l" aria-hidden="true" style="--k:${k+o}">${esc(ch)}</span>`).join('');
$('#opNames').setAttribute('aria-label',`${a.nick} & ${b.nick}`);
$('#opNames').innerHTML=`<span class="nm">${lt(a.nick,0)}</span><span class="am l" aria-hidden="true" style="--k:${a.nick.length}">&amp;</span><span class="nm">${lt(b.nick,a.nick.length+1)}</span>`;
$('#opLoc span').textContent=C.venue;
[...$('#cover').children].filter(el=>el.id!=='slides').forEach((el,i)=>el.style.setProperty('--i',i));
$('#tl').innerHTML=C.story.map(s=>`<div class="rv"><small>${esc(s.date)}</small><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${s.full?`<details><summary>Baca cerita lengkap ${ic('chevron-down')}</summary><p>${esc(s.full)}</p></details>`:''}</div>`).join('');
$('#venue').textContent=C.venue;
const q=encodeURIComponent(C.mapQuery);
$('#mapBtn').href=`https://www.google.com/maps/search/?api=1&query=${q}`;

/* latar tetap: foto opsional yang di-blend dengan gradien warna */
if(C.bgImage){const ph=$('#bg .photo');ph.style.backgroundImage=`url("${C.bgImage.replace(/"/g,'%22')}")`;ph.classList.add('on')}

/* countdown & kalender */
let cdT;
function startCountdown(t){
  clearInterval(cdT);
  const tick=()=>{let s=Math.max(0,Math.floor((t-Date.now())/1000));
    if(!s&&Date.now()>t){$('#cd').innerHTML='<p>Hari bahagia telah tiba. Terima kasih atas doa Anda.</p>';return clearInterval(cdT)}
    const v=[['Hari',s/86400],['Jam',s%86400/3600],['Menit',s%3600/60],['Detik',s%60]];
    $('#cd').innerHTML=v.map(([l,x])=>`<div><b>${String(Math.floor(x)).padStart(2,'0')}</b><span>${l}</span></div>`).join('')};
  tick();cdT=setInterval(tick,1000);
}
function ics(e){
  const f=d=>new Date(d).toISOString().replace(/[-:]|\.\d{3}/g,'');
  const t=['BEGIN:VCALENDAR','VERSION:2.0','BEGIN:VEVENT',`DTSTART:${f(e.start)}`,`DTEND:${f(e.end)}`,`SUMMARY:${e.name} ${a.nick} & ${b.nick}`,`LOCATION:${C.venue}`,'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([t],{type:'text/calendar'}));l.download=`${e.name}.ics`;l.click();
}

/* ===== Slider generik: .stage > .car + tombol .nav[data-d] =====
   (default) item aktif di tengah, tombol berputar | data-loop: tak terbatas, mulai dari tengah | data-start: mulai dari kiri */
function initStage(st){
  const c=st.querySelector('.car'),cnt=st.parentElement.querySelector('.count'),[pv,nx]=st.querySelectorAll('.nav');
  const loop='loop' in st.dataset,start='start' in st.dataset,items=()=>[...c.children],total=()=>loop?items().length/3:items().length;
  const pos=el=>start?el.offsetLeft-(parseFloat(getComputedStyle(c).paddingLeft)||0):el.offsetLeft+el.offsetWidth/2-c.clientWidth/2;
  const cur=()=>{let bi=0,bd=1e9;items().forEach((el,i)=>{const d=Math.abs(pos(el)-c.scrollLeft);if(d<bd){bd=d;bi=i}});return bi};
  const to=(i,smooth=true)=>{const el=items()[i];if(el)c.scrollTo({left:pos(el),behavior:smooth?'smooth':'auto'})};
  c.go=d=>{const n=items().length,i=cur()+d;if(n>1)to(loop||start?Math.max(0,Math.min(n-1,i)):(i+n)%n)};
  let raf=0,jt,tch=0;
  c.mark=()=>{raf=0;const i=cur(),t=total();
    items().forEach((el,k)=>el.classList.toggle('act',k===i));
    if(cnt)cnt.textContent=t?`${i%t+1} / ${t}`:'';
    st.classList.toggle('single',t<2);
    if(start){pv.disabled=c.scrollLeft<4;nx.disabled=c.scrollLeft>c.scrollWidth-c.clientWidth-4}};
  /* loop: isi digandakan 3x; setelah berhenti di salinan kiri/kanan, lompat diam-diam ke salinan tengah */
  const recenter=()=>{if(!loop||tch)return;const t=total(),i=cur();if(i>=t&&i<2*t)return;
    c.style.scrollSnapType='none';c.scrollLeft=pos(items()[i%t+t]);
    requestAnimationFrame(()=>{c.style.scrollSnapType='';c.mark()})};
  c.addEventListener('scroll',()=>{raf=raf||requestAnimationFrame(c.mark);clearTimeout(jt);jt=setTimeout(recenter,160)},{passive:true});
  c.addEventListener('touchstart',()=>tch=1,{passive:true});
  c.addEventListener('touchend',()=>{tch=0;clearTimeout(jt);jt=setTimeout(recenter,250)},{passive:true});
  addEventListener('resize',c.mark);
  st.addEventListener('click',e=>{const btn=e.target.closest('.nav');if(btn)c.go(+btn.dataset.d)});
  c.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')c.go(-1);if(e.key==='ArrowRight')c.go(1)});
  if(loop)to(total(),false);else c.scrollLeft=0;
  c.mark();
  /* geser otomatis (data-auto = jeda ms); tombol .pp untuk jeda/putar */
  const pp=st.querySelector('.pp'),ms=+st.dataset.auto;
  if(ms){let paused=false,vis=true;
    new IntersectionObserver(es=>vis=es[0].isIntersecting).observe(st);
    if(pp)pp.onclick=()=>{paused=!paused;pp.innerHTML=ic(paused?'play':'pause');pp.setAttribute('aria-pressed',paused);pp.setAttribute('aria-label',paused?'Putar geser otomatis':'Jeda geser otomatis')};
    setInterval(()=>{if(paused||!vis||document.hidden||tch||c.matches(':hover,:focus-within'))return;c.go(1)},ms)}
}

/* hadiah & daftar barang */
$('#giftBox').innerHTML=C.gifts.map((g,i)=>`<div class="card gift">${g.logo?`<img class="glogo" src="${esc(g.logo)}" alt="${esc(g.title)}">`:''}<b>${esc(g.title)}</b><p>${esc(g.sub)}</p>${g.qr?`<img src="${esc(g.qr)}" alt="QRIS ${esc(g.title)}">`:''}<div class="no">${esc(g.value)}</div><button class="btn ghost" data-c="${i}">${ic('copy')} ${esc(g.btn)}</button></div>`).join('');
document.addEventListener('click',e=>{const el=e.target.closest('[data-c]');if(!el)return;navigator.clipboard.writeText(C.gifts[el.dataset.c].value).then(()=>toast('Tersalin'),()=>toast('Gagal menyalin, salin manual'))});
if(C.registry.length){$('#reg').hidden=false;
  $('#regList').innerHTML=C.registry.map(r=>{const d=r.got>=r.need,ok=/^https?:\/\//.test(r.url||'');
    return `<div class="card ri${d?' done':''}"><b>${esc(r.n)}</b><div class="price">Rp ${r.price.toLocaleString('id-ID')}</div><div class="bar"><i style="width:${Math.min(100,r.got/r.need*100)}%"></i></div><small>${d?'Sudah terpenuhi':`${r.got} / ${r.need} terpenuhi`}</small>${!d&&ok?`<a class="btn ghost" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${ic('cart')} Beli</a>`:''}</div>`}).join('')}
$('#reg').addEventListener('toggle',()=>{const l=$('#regList');l.mark&&l.mark()});
/* galeri + lightbox */
const N=C.gallery.length||5;
$('#gal').innerHTML=Array.from({length:N*3},(_,k)=>{const i=k%N;return `<div class="slide" data-i="${i}">${C.gallery[i]?`<img src="${esc(C.gallery[i])}" alt="Foto ${i+1}" loading="lazy">`:`Foto ${i+1}`}</div>`}).join('');
let li=0;const lb=$('#lb');
function showLb(i){if(!C.gallery.length)return;li=(i+N)%N;lb.querySelector('img').src=C.gallery[li];lb.classList.add('show')}
$('#gal').onclick=e=>{const s=e.target.closest('.slide');if(s)showLb(+s.dataset.i)};
$('#lbx').onclick=()=>lb.classList.remove('show');$('#lbp').onclick=()=>showLb(li-1);$('#lbn').onclick=()=>showLb(li+1);
addEventListener('keydown',e=>{if(!lb.classList.contains('show'))return;if(e.key==='Escape')lb.classList.remove('show');if(e.key==='ArrowLeft')showLb(li-1);if(e.key==='ArrowRight')showLb(li+1)});

/* ucapan & RSVP */
const wishCard=w=>`<div class="card wish"><b>${esc(w.nama)}</b><p style="margin-top:.4rem">${esc(w.ucapan)}</p></div>`;
const demo=[{nama:"Keluarga Besar",hadir:"Hadir",ucapan:"Barakallahu lakuma wa baraka alaikuma wa jama'a bainakuma fii khair."},{nama:"Sahabat Kampus",hadir:"Hadir",ucapan:"Selamat menempuh hidup baru, semoga sakinah, mawaddah, warahmah."}];
let wishes=[];
const none=[{nama:"Belum ada ucapan",hadir:"",ucapan:"Jadilah yang pertama mengirim doa dan ucapan."}];
const drawWishes=()=>{$('#wishes').innerHTML=(API?(wishes.length?wishes:none):[...wishes,...demo]).map(wishCard).join('');$('#wishes').mark()};
async function loadWishes(){
  if(API){try{wishes=(await (await fetch(API)).json()).filter(w=>w.ucapan)}catch(e){}}
  drawWishes();
}

/* aktifkan semua slider (setelah isinya dibuat) */
$$('.stage').forEach(initStage);
/* ucapan bergeser otomatis, berhenti saat disentuh/diarahkan kursor */

/* RSVP & ucapan: satu per tamu/perangkat. Setelah terkirim hanya bisa diedit; server menimpa baris dengan id yang sama */
const RK='rsvp:'+(KEY||'umum');
const DID=(()=>{try{let d=localStorage.getItem('did');if(!d){d=crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem('did',d)}return d}catch(e){return 'x'+Math.random().toString(36).slice(2)}})();
let myW=null;
const saved=()=>{try{return JSON.parse(localStorage.getItem(RK))}catch(e){return null}};
function restoreRsvp(){const r=saved();
  $('#sum').hidden=!r;$('#rsvpOpen').hidden=!!r;$('#rsvpForm').hidden=true;
  if(r)$('#sumTxt').textContent=r.hadir==='Hadir'?`Terima kasih, ${r.nama}. Anda mengonfirmasi hadir (${r.jumlah} orang).`:`Terima kasih atas kabarnya, ${r.nama}.`}
$('#rsvpOpen').onclick=()=>{$('#rsvpOpen').hidden=true;$('#rsvpForm').hidden=false;$('#n').focus()};
$('#edit').onclick=()=>{const r=saved()||{};
  $('#n').value=r.nama||$('#n').value;$('#k').value=r.hadir||'Hadir';$('#u').value=r.ucapan||'';
  if(r.jumlah)$('#j').value=r.jumlah;$('#j').disabled=$('#k').value!=='Hadir';
  $('#sbtn').innerHTML=ic('check')+' Simpan perubahan';$('#sum').hidden=true;$('#rsvpForm').hidden=false};
$('#k').onchange=e=>{$('#j').disabled=e.target.value!=='Hadir'};
$('#rsvpForm').addEventListener('submit',async e=>{
  e.preventDefault();
  const d={nama:$('#n').value.trim(),hadir:$('#k').value,jumlah:$('#k').value==='Hadir'?+$('#j').value:0,ucapan:$('#u').value.trim(),k:KEY||'',d:DID};
  const btn=e.submitter;btn.disabled=true;$('#msg').textContent='Mengirim…';
  try{
    if(API) await fetch(API,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(d)});
    wishes=wishes.filter(w=>w!==myW);myW=d.ucapan?d:null;if(myW)wishes.unshift(myW);drawWishes();if(API)await loadWishes();
    try{localStorage.setItem(RK,JSON.stringify(d))}catch(_){}
    $('#msg').textContent='';if(!API)toast('Mode demo: data belum tersimpan. SCRIPT_URL harus berisi URL Web App Apps Script (https://script.google.com/macros/s/.../exec)');
    restoreRsvp();
  }catch(err){$('#msg').textContent='Gagal mengirim. Periksa koneksi lalu coba lagi.'}
  btn.disabled=false;
});

/* ===== Musik latar (file MP3 lokal) =====
   - Dimulai otomatis saat "Buka undangan" ditekan. Ketukan itu adalah interaksi pengguna,
     sehingga browser mengizinkan suara (autoplay tanpa interaksi pasti diblokir).
   - Jika tetap diblokir, musik mulai pada sentuhan/klik pertama berikutnya.
   - Tombol musik di pojok kanan bawah = putar/jeda. Jeda manual dihormati. */
const bgm=$('#bgm'),ab=$('#audioBtn'),VOL=Math.min(1,Math.max(0,C.musicVolume??.7));
if(C.music)bgm.src=C.music;
bgm.loop=true;bgm.volume=0;
let wantMusic=true,resumeOnShow=false,fadeT;
const setAudioUI=p=>{ab.innerHTML=ic(p?'pause':'music');ab.classList.toggle('playing',p);ab.setAttribute('aria-pressed',String(p))};
bgm.addEventListener('play',()=>setAudioUI(true));
bgm.addEventListener('pause',()=>setAudioUI(false));
bgm.addEventListener('error',()=>toast('File musik tidak ditemukan: '+(bgm.getAttribute('src')||'')));
function fadeTo(v,ms=1500,done){clearInterval(fadeT);const s=bgm.volume,t0=performance.now();
  fadeT=setInterval(()=>{const k=Math.min(1,(performance.now()-t0)/ms);bgm.volume=s+(v-s)*k;if(k===1){clearInterval(fadeT);done&&done()}},50)}
async function playMusic(){try{await bgm.play();fadeTo(VOL);return true}catch(e){return false}}
function unlockOnGesture(){
  const ev=['pointerdown','touchend','keydown'];
  const h=()=>{ev.forEach(x=>removeEventListener(x,h));if(wantMusic&&bgm.paused)playMusic()};
  ev.forEach(x=>addEventListener(x,h,{passive:true}));
}
function startMusic(){
  if(!wantMusic||!bgm.paused)return;
  playMusic().then(ok=>{if(!ok){toast('Ketuk layar untuk memutar musik');unlockOnGesture()}});
}
ab.onclick=()=>{
  if(bgm.paused){wantMusic=true;playMusic().then(ok=>ok||toast('Musik tidak dapat diputar'))}
  else{wantMusic=false;fadeTo(0,400,()=>bgm.pause())}
};
/* hemat baterai: jeda saat tab disembunyikan, lanjut saat kembali */
document.addEventListener('visibilitychange',()=>{
  if(document.hidden){if(!bgm.paused){resumeOnShow=true;bgm.pause()}}
  else if(resumeOnShow){resumeOnShow=false;if(wantMusic)bgm.play().catch(()=>{})}
});

/* sampul, navigasi, tema */
if(C.cover.length){$('#slides').innerHTML=C.cover.map((u,i)=>`<img src="${esc(u)}" alt=""${i?'':' class="on"'}>`).join('');
  let ci=0;setInterval(()=>{const im=$$('#slides img');im[ci].classList.remove('on');ci=(ci+1)%im.length;im[ci].classList.add('on')},5000)}
let coverT,outT,topSince=0,pull=0,pullT,ty=null;
const isOpen=()=>document.body.classList.contains('open');
$('#openBtn').onclick=()=>{
  document.body.classList.remove('locked');document.body.classList.add('open');
  const cv=$('#cover');cv.classList.add('leave');clearTimeout(coverT);clearTimeout(outT);outT=setTimeout(()=>cv.classList.add('out'),650);coverT=setTimeout(()=>cv.style.display='none',1900);
  startMusic();                              /* lagu otomatis berputar saat masuk ke halaman utama */
  scrollTo(0,0);topSince=Date.now();pull=0;
  requestAnimationFrame(()=>$$('.car').forEach(c=>c.mark&&c.mark()));
};
function showCover(){
  const cv=$('#cover');clearTimeout(coverT);clearTimeout(outT);cv.style.display='flex';void cv.offsetWidth;cv.classList.remove('out','leave');
  document.body.classList.add('locked');document.body.classList.remove('open');pull=0;ty=null;
}
/* terus menarik/scroll ke atas saat sudah di puncak halaman = kembali ke sampul */
document.documentElement.style.overscrollBehaviorY='contain';
addEventListener('scroll',()=>{if(scrollY<=0){if(!topSince)topSince=Date.now()}else{topSince=0;pull=0}},{passive:true});
addEventListener('wheel',e=>{
  if(!isOpen()||scrollY>0||!topSince||Date.now()-topSince<1000)return;   /* abaikan momentum scroll yang baru sampai di atas */
  if(e.deltaY<0){pull-=e.deltaY;clearTimeout(pullT);pullT=setTimeout(()=>pull=0,700);if(pull>400)showCover()}else pull=0;
},{passive:true});
addEventListener('touchstart',e=>{ty=isOpen()&&scrollY<=0?e.touches[0].clientY:null},{passive:true});
addEventListener('touchmove',e=>{if(ty!==null&&e.touches[0].clientY-ty>150)showCover()},{passive:true});
$('#pillBtn').onclick=()=>$('#pill').classList.toggle('min');
document.addEventListener('click',e=>{const p=$('#pill');if(!p.contains(e.target)||e.target.closest('a'))p.classList.add('min')});
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.15});
const nav=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting)$$('#pill a').forEach(l=>l.classList.toggle('on',l.hash==='#'+x.target.id))}),{threshold:.5});
$$('main section').forEach(s=>nav.observe(s));

resolveGuest().then(()=>{render();loadWishes()});
