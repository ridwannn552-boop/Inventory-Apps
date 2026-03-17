let produk = [];
let historyTransaksi = JSON.parse(localStorage.getItem("history")) || [];
let lastKodeScan = "";
let modeTransaksi = "masuk";

function showPage(id, el) {
document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if (id === "history") tampilHistory();
}

function setMode(mode) {
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// LOAD DATA (FIX SINKRON)
// ==========================
async function loadData() {

let url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv&t=" + Date.now();

let res = await fetch(url);
let text = await res.text();

let rows = text.split("\n");

produk = [];

for (let i = 1; i < rows.length; i++) {

// parsing aman (anti geser karena koma)
let c = rows[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);

if (!c || !c[1]) continue;

produk.push({
kode: c[1]?.replace(/"/g, "").trim(),   // BARCODE
reff: c[2]?.replace(/"/g, "").trim(),   // REFF
nama: c[3]?.replace(/"/g, "").trim(),   // NAMA
uom: c[4]?.replace(/"/g, "").trim(),    // UOM
awal: parseInt(c[5]) || 0,
masuk: parseInt(c[6]) || 0,
keluar: parseInt(c[7]) || 0,
akhir: parseInt(c[8]) || 0
});
}

tampilProduk();
updateDashboard();
}

// ==========================
// TAMPIL PRODUK (SINKRON)
// ==========================
function tampilProduk() {

let t = document.getElementById("dataProduk");
t.innerHTML = "";

produk.forEach((p, i) => {

t.innerHTML += `
<tr>
<td>${i + 1}</td>
<td>${p.kode}</td>
<td>${p.reff}</td>
<td>${p.nama}</td>
<td>${p.uom}</td>
<td>${p.awal}</td>
<td>${p.masuk}</td>
<td>${p.keluar}</td>
<td>${p.akhir}</td>
</tr>`;
});
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard() {

document.getElementById("totalProduk").innerText = produk.length;

let totalMasuk = produk.reduce((a, b) => a + b.masuk, 0);
let totalKeluar = produk.reduce((a, b) => a + b.keluar, 0);

document.getElementById("totalMasuk").innerText = totalMasuk;
document.getElementById("totalKeluar").innerText = totalKeluar;
}

// ==========================
// SCANNER (FIX SINKRON)
// ==========================
function startScanner() {

let scanner = new Html5QrcodeScanner("reader", { fps: 10 });

scanner.render(code => {

let item = produk.find(p =>
p.kode?.toLowerCase().trim() === code.toLowerCase().trim()
);

if (!item) {
document.getElementById("hasilScan").innerText = "❌ Tidak ditemukan";
return;
}

lastKodeScan = code;

document.getElementById("scanBarcode").innerText = item.kode;
document.getElementById("scanNama").innerText = item.nama;

document.getElementById("hasilScan").innerText = "✅ Ditemukan";
});
}

// ==========================
// SIMPAN TRANSAKSI
// ==========================
function simpanTransaksi() {

let qty = parseInt(document.getElementById("qty").value);
if (!qty || qty <= 0) return;

let item = produk.find(p => p.kode == lastKodeScan);
if (!item) return;

if (modeTransaksi === "masuk") {
item.masuk += qty;
item.akhir += qty;
}

if (modeTransaksi === "keluar") {
item.keluar += qty;
item.akhir -= qty;
}

if (modeTransaksi === "so") {
item.akhir = qty;
}

// simpan history
let now = new Date();

historyTransaksi.push({
tanggal: now.toLocaleString(),
bulan: now.getMonth() + 1,
jenis: modeTransaksi,
kode: item.kode,
nama: item.nama,
qty: qty
});

localStorage.setItem("history", JSON.stringify(historyTransaksi));

// update tampilan
tampilProduk();
tampilHistory();
updateDashboard();

document.getElementById("qty").value = "";
}

// ==========================
// HISTORY
// ==========================
function tampilHistory(data = historyTransaksi) {

let t = document.getElementById("dataHistory");
t.innerHTML = "";

data.slice().reverse().forEach((h, i) => {

t.innerHTML += `
<tr>
<td>${i + 1}</td>
<td>${h.tanggal}</td>
<td>${h.kode}</td>
<td>-</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
</tr>`;
});
}

// ==========================
// FILTER
// ==========================
function filterHistory() {

let b = document.getElementById("filterBulan").value;
let j = document.getElementById("filterJenis").value;

let hasil = historyTransaksi.filter(h => {
return (!b || h.bulan == b) && (!j || h.jenis == j);
});

tampilHistory(hasil);
}

// ==========================
// INIT
// ==========================
window.onload = () => {
loadData();
tampilHistory();
startScanner();
};
