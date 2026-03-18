let produk = [];
let produkMaster = [];
let historyTransaksi = [];
let historyFiltered = [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode = null;
let lastScan = "";

let currentPageProduk = 1;
let currentPageHistory = 1;
const perPage = 40;

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbxLKNwjNCrQ_HhsJYQDh9xD7m3jA3WyFBPASrmIk1sFTRPBCsHz9xyYEpyKzLvxKBRh/exec";
const URL_HISTORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=657187893&output=csv";
const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

const audioScan = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

// ==========================
// NAVIGASI
// ==========================
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if(page) page.classList.add("active");

  document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
  if(el) el.classList.add("active");

  if(id === "scanner"){
    startScanner();
  }else{
    stopScanner();
  }

  const sidebar = document.querySelector(".sidebar");
  if(sidebar) sidebar.classList.remove("active");
}

function toggleMenu(){
  const sidebar = document.querySelector(".sidebar");
  if(sidebar) sidebar.classList.toggle("active");
}

// ==========================
// MODE
// ==========================
function setMode(mode){
  modeTransaksi = mode;
  const hasil = document.getElementById("hasilScan");
  if(hasil) hasil.innerText = "Mode: " + mode;
}

// ==========================
// CSV PARSER
// ==========================
function parseCSV(str){
  const rows = [];
  let row = [];
  let current = "";
  let insideQuotes = false;

  for(let i = 0; i < str.length; i++){
    const char = str[i];
    const next = str[i + 1];

    if(char === '"'){
      if(insideQuotes && next === '"'){
        current += '"';
        i++;
      }else{
        insideQuotes = !insideQuotes;
      }
    }else if(char === "," && !insideQuotes){
      row.push(current);
      current = "";
    }else if((char === "\n" || char === "\r") && !insideQuotes){
      if(char === "\r" && next === "\n"){
        i++;
      }
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
    }else{
      current += char;
    }
  }

  if(current.length > 0 || row.length > 0){
    row.push(current);
    rows.push(row);
  }

  return rows;
}

// ==========================
// LOAD MASTER
// ==========================
async function loadData(useCache = true){
  try{
    if(useCache){
      const cache = localStorage.getItem("produkMaster");
      if(cache){
        produkMaster = JSON.parse(cache);
        hitungUlangProduk();
        return;
      }
    }

    const res = await fetch(URL_PRODUK, { cache: "no-store" });
    const text = await res.text();
    const rows = parseCSV(text);

    produkMaster = [];

    for(let i = 1; i < rows.length; i++){
      const c = rows[i];
      if(!c || !c[1]) continue;

      const kode = (c[1] || "").trim().toUpperCase();
      if(!kode || kode === "KODE") continue;

      produkMaster.push({
        kode: kode,
        reff: (c[2] || "").trim(),
        nama: (c[3] || "").trim(),
        uom: (c[4] || "").trim(),
        awal: parseInt(c[5], 10) || 0
      });
    }

    localStorage.setItem("produkMaster", JSON.stringify(produkMaster));
    hitungUlangProduk();
  }catch(err){
    console.error("Gagal load master:", err);
    alert("Gagal memuat data master.");
  }
}

// ==========================
// LOAD HISTORY
// ==========================
async function loadHistoryFromSheet(useCache = true){
  try{
    if(useCache){
      const cache = localStorage.getItem("history");
      if(cache){
        historyTransaksi = JSON.parse(cache);
        historyFiltered = [...historyTransaksi].reverse();
        hitungUlangProduk();
        tampilHistory();
        return;
      }
    }

    const res = await fetch(URL_HISTORY_CSV, { cache: "no-store" });
    const text = await res.text();
    const rows = parseCSV(text);

    historyTransaksi = [];

    if(rows.length < 2){
      historyFiltered = [];
      tampilHistory();
      return;
    }

    const header = rows[0].map(h => String(h || "").trim().toUpperCase());

    const idxTanggal = header.indexOf("TANGGAL");
    const idxKode = header.indexOf("BARCODE") !== -1 ? header.indexOf("BARCODE") : header.indexOf("KODE");
    const idxReff = header.indexOf("REF") !== -1 ? header.indexOf("REF") : header.indexOf("REFF");
    const idxNama = header.indexOf("NAMA BARANG") !== -1 ? header.indexOf("NAMA BARANG") : header.indexOf("NAMA");
    const idxJenis = header.indexOf("JENIS");
    const idxQty = header.indexOf("QTY");

    console.log("HEADER HISTORY:", header);
    console.log("INDEX HISTORY:", {
      idxTanggal,
      idxKode,
      idxReff,
      idxNama,
      idxJenis,
      idxQty
    });

    for(let i = 1; i < rows.length; i++){
      const c = rows[i];
      if(!c || !c.length) continue;

      const tanggal = idxTanggal >= 0 ? (c[idxTanggal] || "").trim() : "";
      const kode = idxKode >= 0 ? (c[idxKode] || "").trim().toUpperCase() : "";
      const reff = idxReff >= 0 ? (c[idxReff] || "").trim() : "";
      const nama = idxNama >= 0 ? (c[idxNama] || "").trim() : "";
      const jenis = idxJenis >= 0 ? (c[idxJenis] || "").trim().toLowerCase() : "";
      const qty = idxQty >= 0 ? parseInt(c[idxQty], 10) || 0 : 0;

      if(!kode) continue;
      if(kode === "BARCODE" || kode === "KODE") continue;
      if(tanggal === "TANGGAL") continue;

      historyTransaksi.push({
        tanggal,
        kode,
        reff,
        nama,
        jenis,
        qty
      });
    }

    localStorage.setItem("history", JSON.stringify(historyTransaksi));
    historyFiltered = [...historyTransaksi].reverse();

    hitungUlangProduk();
    tampilHistory();
  }catch(err){
    console.error("Gagal load history:", err);
    alert("Gagal memuat data history.");
  }
}

// ==========================
// REFRESH
// ==========================
function refreshMasterData(){
  localStorage.removeItem("produkMaster");
  loadData(false);
}

function refreshHistoryData(){
  localStorage.removeItem("history");
  loadHistoryFromSheet(false);
}

// ==========================
// HITUNG ULANG STOK
// ==========================
function hitungUlangProduk(){
  produk = JSON.parse(JSON.stringify(produkMaster));
  const map = {};

  for(let i = 0; i < produk.length; i++){
    const p = produk[i];
    p.masuk = 0;
    p.keluar = 0;
    p.akhir = p.awal;
    map[p.kode] = p;
  }

  for(let i = 0; i < historyTransaksi.length; i++){
    const h = historyTransaksi[i];
    const item = map[h.kode];
    if(!item) continue;

    if(h.jenis === "masuk"){
      item.masuk += h.qty;
      item.akhir += h.qty;
    }else if(h.jenis === "keluar"){
      item.keluar += h.qty;
      item.akhir -= h.qty;
    }else if(h.jenis === "so"){
      item.akhir = h.qty;
    }
  }

  currentPageProduk = 1;
  tampilProduk();
  updateDashboard();
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard(){
  let totalMasuk = 0;
  let totalKeluar = 0;

  for(let i = 0; i < produk.length; i++){
    totalMasuk += produk[i].masuk;
    totalKeluar += produk[i].keluar;
  }

  const totalProdukEl = document.getElementById("totalProduk");
  const totalMasukEl = document.getElementById("totalMasuk");
  const totalKeluarEl = document.getElementById("totalKeluar");

  if(totalProdukEl) totalProdukEl.innerText = produk.length;
  if(totalMasukEl) totalMasukEl.innerText = totalMasuk;
  if(totalKeluarEl) totalKeluarEl.innerText = totalKeluar;
}

// ==========================
// SEARCH PRODUK
// ==========================
function searchProduk(){
  const input = document.getElementById("searchInput");
  const keyword = input ? input.value.trim().toLowerCase() : "";

  if(!keyword){
    hitungUlangProduk();
    return;
  }

  const base = JSON.parse(JSON.stringify(produkMaster));
  const map = {};

  for(let i = 0; i < base.length; i++){
    base[i].masuk = 0;
    base[i].keluar = 0;
    base[i].akhir = base[i].awal;
    map[base[i].kode] = base[i];
  }

  for(let i = 0; i < historyTransaksi.length; i++){
    const h = historyTransaksi[i];
    const item = map[h.kode];
    if(!item) continue;

    if(h.jenis === "masuk"){
      item.masuk += h.qty;
      item.akhir += h.qty;
    }else if(h.jenis === "keluar"){
      item.keluar += h.qty;
      item.akhir -= h.qty;
    }else if(h.jenis === "so"){
      item.akhir = h.qty;
    }
  }

  produk = base.filter(p =>
    p.kode.toLowerCase().includes(keyword) ||
    p.nama.toLowerCase().includes(keyword) ||
    p.reff.toLowerCase().includes(keyword)
  );

  currentPageProduk = 1;
  tampilProduk();
  updateDashboard();
}

// ==========================
// TAMPIL PRODUK
// ==========================
function tampilProduk(){
  const t = document.getElementById("dataProduk");
  if(!t) return;

  const start = (currentPageProduk - 1) * perPage;
  const data = produk.slice(start, start + perPage);

  let html = "";

  for(let i = 0; i < data.length; i++){
    const p = data[i];
    html += `
      <tr>
        <td>${start + i + 1}</td>
        <td>${escapeHtml(p.kode)}</td>
        <td>${escapeHtml(p.reff)}</td>
        <td>${escapeHtml(p.nama)}</td>
        <td>${escapeHtml(p.uom)}</td>
        <td>${p.awal}</td>
        <td>${p.masuk}</td>
        <td>${p.keluar}</td>
        <td>${p.akhir}</td>
      </tr>
    `;
  }

  if(!html){
    html = `<tr><td colspan="9" style="text-align:center;">Data tidak ditemukan</td></tr>`;
  }

  t.innerHTML = html;
  renderPaginationProduk();
}

function renderPaginationProduk(){
  const el = document.getElementById("paginationProduk");
  if(!el) return;

  const totalPage = Math.ceil(produk.length / perPage);
  if(totalPage <= 1){
    el.innerHTML = "";
    return;
  }

  let html = `<button onclick="changePageProduk(${currentPageProduk - 1})">Prev</button>`;

  for(let i = 1; i <= totalPage; i++){
    html += `<button class="${i === currentPageProduk ? "active" : ""}" onclick="changePageProduk(${i})">${i}</button>`;
  }

  html += `<button onclick="changePageProduk(${currentPageProduk + 1})">Next</button>`;
  el.innerHTML = html;
}

function changePageProduk(page){
  const total = Math.ceil(produk.length / perPage);
  if(page < 1 || page > total) return;

  currentPageProduk = page;
  tampilProduk();

  const content = document.querySelector(".content");
  if(content) content.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================
// FILTER HISTORY
// ==========================
function filterHistory(){
  const bulanEl = document.getElementById("filterBulan");
  const jenisEl = document.getElementById("filterJenis");
  const keywordEl = document.getElementById("filterKeyword");

  const bulan = bulanEl ? bulanEl.value : "";
  const jenis = jenisEl ? jenisEl.value.trim().toLowerCase() : "";
  const keyword = keywordEl ? keywordEl.value.trim().toLowerCase() : "";

  historyFiltered = [...historyTransaksi].reverse().filter(item => {
    let cocokBulan = true;
    let cocokJenis = true;
    let cocokKeyword = true;

    if(bulan){
      const tanggal = item.tanggal || "";
      const match = tanggal.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if(match){
        const bulanData = String(parseInt(match[2], 10));
        cocokBulan = bulanData === bulan;
      }
    }

    if(jenis){
      cocokJenis = item.jenis === jenis;
    }

    if(keyword){
      cocokKeyword =
        item.kode.toLowerCase().includes(keyword) ||
        item.nama.toLowerCase().includes(keyword) ||
        item.reff.toLowerCase().includes(keyword);
    }

    return cocokBulan && cocokJenis && cocokKeyword;
  });

  currentPageHistory = 1;
  tampilHistory();
}

function resetFilterHistory(){
  const bulanEl = document.getElementById("filterBulan");
  const jenisEl = document.getElementById("filterJenis");
  const keywordEl = document.getElementById("filterKeyword");

  if(bulanEl) bulanEl.value = "";
  if(jenisEl) jenisEl.value = "";
  if(keywordEl) keywordEl.value = "";

  historyFiltered = [...historyTransaksi].reverse();
  currentPageHistory = 1;
  tampilHistory();
}

// ==========================
// TAMPIL HISTORY
// ==========================
function tampilHistory(){
  const t = document.getElementById("dataHistory");
  if(!t) return;

  const source = historyFiltered;
  const start = (currentPageHistory - 1) * perPage;
  const data = source.slice(start, start + perPage);

  let html = "";

  for(let i = 0; i < data.length; i++){
    const h = data[i];
    html += `
      <tr>
        <td>${start + i + 1}</td>
        <td>${escapeHtml(h.tanggal)}</td>
        <td>${escapeHtml(h.kode)}</td>
        <td>${escapeHtml(h.reff)}</td>
        <td>${escapeHtml(h.nama)}</td>
        <td>${escapeHtml(h.jenis)}</td>
        <td>${h.qty}</td>
      </tr>
    `;
  }

  if(!html){
    html = `<tr><td colspan="7" style="text-align:center;">History tidak ditemukan</td></tr>`;
  }

  t.innerHTML = html;
  renderPaginationHistory(source.length);
}

function renderPaginationHistory(total){
  const el = document.getElementById("paginationHistory");
  if(!el) return;

  const totalPage = Math.ceil(total / perPage);
  if(totalPage <= 1){
    el.innerHTML = "";
    return;
  }

  let html = `<button onclick="changePageHistory(${currentPageHistory - 1})">Prev</button>`;

  for(let i = 1; i <= totalPage; i++){
    html += `<button class="${i === currentPageHistory ? "active" : ""}" onclick="changePageHistory(${i})">${i}</button>`;
  }

  html += `<button onclick="changePageHistory(${currentPageHistory + 1})">Next</button>`;
  el.innerHTML = html;
}

function changePageHistory(page){
  const total = Math.ceil(historyFiltered.length / perPage);
  if(page < 1 || page > total) return;

  currentPageHistory = page;
  tampilHistory();

  const content = document.querySelector(".content");
  if(content) content.scrollTo({ top: 0, behavior: "smooth" });
}

// ==========================
// DOWNLOAD CSV
// ==========================
function downloadExcel(){
  const data = historyFiltered;
  let csv = "Tanggal,Barcode,Ref,Nama Barang,Jenis,Qty\n";

  for(let i = 0; i < data.length; i++){
    const item = data[i];
    csv += `"${safeCsv(item.tanggal)}","${safeCsv(item.kode)}","${safeCsv(item.reff)}","${safeCsv(item.nama)}","${safeCsv(item.jenis)}","${item.qty}"\n`;
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "history_transaksi.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

// ==========================
// SCANNER
// ==========================
function startScanner(){
  if(html5QrCode) return;

  const reader = document.getElementById("reader");
  if(!reader) return;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: 250 },
    (decodedText) => {
      const clean = decodedText.trim().toUpperCase();

      if(clean === lastScan) return;
      lastScan = clean;

      const item = produkMaster.find(p => p.kode === clean);

      if(!item){
        const hasil = document.getElementById("hasilScan");
        if(hasil) hasil.innerText = "❌ Tidak ditemukan";
        setTimeout(() => {
          lastScan = "";
        }, 1000);
        return;
      }

      audioScan.currentTime = 0;
      audioScan.play().catch(() => {});

      lastKodeScan = item.kode;

      const barcodeEl = document.getElementById("scanBarcode");
      const namaEl = document.getElementById("scanNama");
      const qtyEl = document.getElementById("qty");
      const hasilEl = document.getElementById("hasilScan");

      if(barcodeEl) barcodeEl.innerText = item.kode;
      if(namaEl) namaEl.innerText = item.nama;
      if(qtyEl) qtyEl.value = 1;
      if(hasilEl) hasilEl.innerText = "✅ Barcode terbaca";

      setTimeout(() => {
        lastScan = "";
      }, 1000);
    },
    () => {}
  ).catch(err => {
    console.error("Scanner error:", err);
    const hasil = document.getElementById("hasilScan");
    if(hasil) hasil.innerText = "Kamera tidak bisa dibuka";
  });
}

function stopScanner(){
  if(html5QrCode){
    html5QrCode.stop()
      .then(() => {
        html5QrCode.clear();
        html5QrCode = null;
      })
      .catch(() => {
        html5QrCode = null;
      });
  }
}

// ==========================
// SIMPAN TRANSAKSI
// ==========================
async function simpanTransaksi(){
  try{
    const qtyEl = document.getElementById("qty");
    const qty = parseInt(qtyEl ? qtyEl.value : "", 10);

    if(!lastKodeScan){
      alert("Scan dulu!");
      return;
    }

    if(!qty || qty <= 0){
      alert("Qty tidak valid!");
      return;
    }

    const item = produkMaster.find(p => p.kode === lastKodeScan);
    if(!item){
      alert("Data produk tidak ditemukan.");
      return;
    }

    const payload = {
      kode: item.kode,
      reff: item.reff,
      nama: item.nama,
      jenis: modeTransaksi,
      qty: qty
    };

    console.log("KIRIM DATA:", payload);
    console.log("URL_SCRIPT:", URL_SCRIPT);

    const response = await fetch(URL_SCRIPT, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const resultText = await response.text();
    console.log("RESPON APPS SCRIPT:", resultText);

    if(!response.ok){
      throw new Error("HTTP error " + response.status + " | " + resultText);
    }

    localStorage.removeItem("history");
    await loadHistoryFromSheet(false);

    lastKodeScan = "";

    const barcodeEl = document.getElementById("scanBarcode");
    const namaEl = document.getElementById("scanNama");
    const hasilEl = document.getElementById("hasilScan");

    if(barcodeEl) barcodeEl.innerText = "-";
    if(namaEl) namaEl.innerText = "-";
    if(qtyEl) qtyEl.value = "";
    if(hasilEl) hasilEl.innerText = "Arahkan barcode ke kamera";

    alert("Transaksi berhasil disimpan");
  }catch(err){
    console.error("Gagal simpan:", err);
    alert("Gagal menyimpan transaksi:\n" + err.message + "\n\nCek deploy Google Apps Script.");
  }
}

// ==========================
// UTIL
// ==========================
function escapeHtml(value){
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function safeCsv(value){
  return String(value ?? "").replaceAll('"', '""');
}

// ==========================
// INIT
// ==========================
window.onload = async () => {
  historyFiltered = [];
  await loadData(true);
  await loadHistoryFromSheet(true);
};
