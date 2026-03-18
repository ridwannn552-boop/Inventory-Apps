// ==========================
// GLOBAL
// ==========================
let produk = [];
let produkMaster = [];
let historyTransaksi = [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode = null;
let lastScan = "";

// ==========================
// URL (SUDAH SESUAI)
// ==========================
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwdUWJmN6rXf2l_KJSVDSpPzE3kqZbJ9PKxEhDaG8E5OGjmidOZFX22Rrn4AifsI5fU/exec";

const URL_HISTORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=657187893&output=csv";

const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

// ==========================
// NAVIGASI
// ==========================
function showPage(id, el){

document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

// aktifkan menu sidebar
document.querySelectorAll(".sidebar li").forEach(li=>li.classList.remove("active"));
if(el) el.classList.add("active");

// scanner
if(id==="scanner") startScanner();
else stopScanner();

// close sidebar mobile
document.querySelector(".sidebar").classList.remove("active");
}

// ==========================
function toggleMenu(){
document.querySelector(".sidebar").classList.toggle("active");
}

// ==========================
function setMode(mode){
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// PARSE CSV (AMAN)
// ==========================
function parseCSV(str){
return str.split("\n").map(row=>{
let result=[], current="", inside=false;

for(let char of row){
if(char === '"') inside=!inside;
else if(char === ',' && !inside){
result.push(current); current="";
}else current+=char;
}
result.push(current);
return result;
});
}

// ==========================
// LOAD PRODUK
// ==========================
async function loadData(){

let res = await fetch(URL_PRODUK);
let text = await res.text();
let rows = parseCSV(text);

produkMaster = [];

for(let i=1;i<rows.length;i++){
let c = rows[i];
if(!c[1]) continue;

produkMaster.push({
kode: c[1].trim().toUpperCase(),
reff: c[2]?.trim(),
nama: c[3]?.trim(),
uom: c[4]?.trim(),
awal: parseInt(c[5]) || 0
});
}

hitungUlangProduk();
}

// ==========================
// LOAD HISTORY
// ==========================
async function loadHistoryFromSheet(){

let res = await fetch(URL_HISTORY_CSV);
let text = await res.text();
let rows = parseCSV(text);

historyTransaksi = [];

for(let i=1;i<rows.length;i++){
let c = rows[i];
if(!c[1]) continue;

historyTransaksi.push({
tanggal:c[0],
kode:c[1],
reff:c[2],
nama:c[3],
jenis:c[4],
qty:parseInt(c[5])||0
});
}

hitungUlangProduk();
tampilHistory();
}

// ==========================
// HITUNG STOK
// ==========================
function hitungUlangProduk(){

produk = JSON.parse(JSON.stringify(produkMaster));

let map = {};

produk.forEach(p=>{
p.masuk=0;
p.keluar=0;
p.akhir=p.awal;
map[p.kode]=p;
});

historyTransaksi.forEach(h=>{
let item = map[h.kode];
if(!item) return;

if(h.jenis==="masuk"){
item.masuk += h.qty;
item.akhir += h.qty;
}

if(h.jenis==="keluar"){
item.keluar += h.qty;
item.akhir -= h.qty;
}
});

tampilProduk();
updateDashboard();
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard(){

let totalMasuk = 0;
let totalKeluar = 0;

produk.forEach(p=>{
totalMasuk += p.masuk;
totalKeluar += p.keluar;
});

document.getElementById("totalProduk").innerText = produk.length;
document.getElementById("totalMasuk").innerText = totalMasuk;
document.getElementById("totalKeluar").innerText = totalKeluar;
}

// ==========================
// TAMPIL PRODUK
// ==========================
function tampilProduk(){

let t = document.getElementById("dataProduk");

let html = "";

produk.forEach((p,i)=>{
html += `
<tr>
<td>${i+1}</td>
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

t.innerHTML = html;
}

// ==========================
// TAMPIL HISTORY
// ==========================
function tampilHistory(){

let t = document.getElementById("dataHistory");

let html = "";

historyTransaksi.slice().reverse().forEach((h,i)=>{
html += `
<tr>
<td>${i+1}</td>
<td>${h.tanggal}</td>
<td>${h.kode}</td>
<td>${h.reff}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
<td>-</td>
</tr>`;
});

t.innerHTML = html;
}

// ==========================
// SCANNER (RINGAN + CEPAT)
// ==========================
let audioScan = new Audio("https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg");

function startScanner(){

if(html5QrCode) return;

html5QrCode = new Html5Qrcode("reader");

html5QrCode.start(
{ facingMode: "environment" },
{ fps: 10, qrbox: 250 },
(decodedText)=>{

let clean = decodedText.trim().toUpperCase();

if(clean===lastScan) return;
lastScan = clean;

let item = produkMaster.find(p=>p.kode===clean);

if(!item){
document.getElementById("hasilScan").innerText="❌ Tidak ditemukan";
return;
}

// 🔊 SOUND
audioScan.currentTime = 0;
audioScan.play();

lastKodeScan=item.kode;

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;
document.getElementById("qty").value=1;

setTimeout(()=>{lastScan="";},1000);
}
);
}

function stopScanner(){
if(html5QrCode){
html5QrCode.stop().then(()=>{
html5QrCode.clear();
html5QrCode=null;
});
}
}

// ==========================
// SIMPAN (TIDAK DIUBAH STRUKTUR)
// ==========================
async function simpanTransaksi(){

let qty=parseInt(document.getElementById("qty").value);

if(!lastKodeScan){
alert("Scan dulu!");
return;
}

if(!qty || qty<=0){
alert("Qty tidak valid!");
return;
}

let item=produkMaster.find(p=>p.kode===lastKodeScan);

// 🔥 FORMAT SESUAI APPS SCRIPT KAMU
await fetch(URL_SCRIPT,{
method:"POST",
body:JSON.stringify({
kode:item.kode,
reff:item.reff,
nama:item.nama,
jenis:modeTransaksi,
qty:qty
})
});

// reload history
await loadHistoryFromSheet();

// reset UI
lastKodeScan="";
document.getElementById("scanBarcode").innerText="-";
document.getElementById("scanNama").innerText="-";
document.getElementById("qty").value="";
document.getElementById("hasilScan").innerText="Arahkan barcode ke kamera";
}

// ==========================
window.onload=()=>{
loadData();
loadHistoryFromSheet();
};
