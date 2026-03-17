let produk = [];
let produkMaster = []; // data asli dari spreadsheet
let historyTransaksi = JSON.parse(localStorage.getItem("history")) || [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

// ==========================
// NAVIGASI
// ==========================
function showPage(id) {
document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if (id === "history") tampilHistory();
}

function setMode(mode) {
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// LOAD DATA DARI SHEET (FIX TOTAL)
// ==========================
async function loadData() {

let url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv&t=" + Date.now();

let res = await fetch(url);
let text = await res.text();

let rows = text.split("\n");

produkMaster = [];

for (let i = 1; i < rows.length; i++) {

// 🔥 FIX: parsing stabil (tidak potong nama)
let c = rows[i].replace("\r","").split(",");

if (!c || !c[1]) continue;

produkMaster.push({
kode: c[1]?.trim(),
reff: c[2]?.trim(),
nama: c[3]?.trim(),
uom: c[4]?.trim(),
awal: parseInt(c[5]) || 0
});
}

// 🔥 hitung ulang dari history
hitungUlangProduk();
}

// ==========================
// HITUNG ULANG MASTER (DARI HISTORY)
// ==========================
function hitungUlangProduk() {

produk = JSON.parse(JSON.stringify(produkMaster));

// reset
produk.forEach(p => {
p.masuk = 0;
p.keluar = 0;
p.akhir = p.awal;
});

// hitung dari history
historyTransaksi.forEach(h => {

let item = produk.find(p => p.kode == h.kode);
if (!item) return;

if (h.jenis === "masuk") {
item.masuk += h.qty;
item.akhir += h.qty;
}

if (h.jenis === "keluar") {
item.keluar += h.qty;
item.akhir -= h.qty;
}

if (h.jenis === "so") {
item.akhir = h.qty;
}
});

tampilProduk();
updateDashboard();
}

// ==========================
// TABEL PRODUK
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
// SCANNER
// ==========================
function startScanner() {

let scanner = new Html5QrcodeScanner("reader", { fps: 10 });

scanner.render(code => {

let item = produkMaster.find(p =>
p.kode?.toLowerCase().trim() === code.toLowerCase().trim()
);

if (!item) {
document.getElementById("hasilScan").innerText = "❌ Tidak ditemukan";
return;
}

lastKodeScan = item.kode;

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
if (!qty || !lastKodeScan) return;

let item = produkMaster.find(p => p.kode == lastKodeScan);
if (!item) return;

let now = new Date();

historyTransaksi.push({
id: Date.now(),
tanggal: now.toLocaleString(),
bulan: now.getMonth() + 1,
jenis: modeTransaksi,
kode: item.kode,
reff: item.reff,
nama: item.nama,
uom: item.uom,
qty: qty
});

localStorage.setItem("history", JSON.stringify(historyTransaksi));

// 🔥 AUTO SINKRON
hitungUlangProduk();
tampilHistory();

document.getElementById("qty").value = "";
}

// ==========================
// HISTORY + EDIT + HAPUS
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
<td>${h.reff}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
<td>
<button onclick="editHistory(${h.id})">Edit</button>
<button onclick="hapusHistory(${h.id})">Hapus</button>
</td>
</tr>`;
});
}

// ==========================
// EDIT
// ==========================
function editHistory(id) {

let h = historyTransaksi.find(x => x.id === id);
if (!h) return;

let qtyBaru = prompt("Edit Qty:", h.qty);
if (qtyBaru === null) return;

h.qty = parseInt(qtyBaru) || h.qty;

localStorage.setItem("history", JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
}

// ==========================
// HAPUS
// ==========================
function hapusHistory(id) {

if (!confirm("Hapus data ini?")) return;

historyTransaksi = historyTransaksi.filter(h => h.id !== id);

localStorage.setItem("history", JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
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
