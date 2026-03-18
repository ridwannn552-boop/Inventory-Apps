let produk = [];
let produkMaster = [];
let historyTransaksi = JSON.parse(localStorage.getItem("history")) || [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// ==========================
// NAVIGASI
// ==========================
function showPage(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="scanner") startScanner();
else stopScanner();

if(id==="history") tampilHistory();
}

// ==========================
// MODE
// ==========================
function setMode(mode){
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// PARSER CSV AMAN
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
// LOAD DATA
// ==========================
async function loadData(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv&t="+Date.now();

let res=await fetch(url);
let text=await res.text();

let rows=parseCSV(text);

produkMaster=[];

for(let i=1;i<rows.length;i++){
let c=rows[i];
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
// HITUNG
// ==========================
function hitungUlangProduk(){

produk = JSON.parse(JSON.stringify(produkMaster));

produk.forEach(p=>{
p.masuk=0;
p.keluar=0;
p.akhir=p.awal;
});

historyTransaksi.forEach(h=>{
let item = produk.find(p=>p.kode === h.kode);
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
// TAMPIL PRODUK
// ==========================
function tampilProduk(){

let t=document.getElementById("dataProduk");
t.innerHTML="";

produk.forEach((p,i)=>{
t.innerHTML+=`
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
}

// ==========================
// SEARCH
// ==========================
function searchProduk(){

let keyword=document.getElementById("searchInput").value.toLowerCase();

let filtered=produk.filter(p =>
p.kode.toLowerCase().includes(keyword) ||
p.nama.toLowerCase().includes(keyword)
);

let t=document.getElementById("dataProduk");
t.innerHTML="";

filtered.forEach((p,i)=>{
t.innerHTML+=`
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
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard(){

document.getElementById("totalProduk").innerText = produk.length;

let masuk = produk.reduce((a,b)=>a+b.masuk,0);
let keluar = produk.reduce((a,b)=>a+b.keluar,0);

document.getElementById("totalMasuk").innerText = masuk;
document.getElementById("totalKeluar").innerText = keluar;
}

// ==========================
// SCANNER (UPGRADE UX)
// ==========================
function startScanner(){

if(html5QrCode) return;

html5QrCode = new Html5QrcodeScanner(
"reader",
{
fps: 10,
qrbox: { width: 250, height: 120 },
aspectRatio: 1.5,
rememberLastUsedCamera: true,
showTorchButtonIfSupported: true
},
false
);

html5QrCode.render((code)=>{

let clean = code.trim().toUpperCase();

// anti double
if(clean === lastScan) return;
lastScan = clean;

// 🔥 FEEDBACK VISUAL
let hasil = document.getElementById("hasilScan");
hasil.innerText = "✅ TERBACA: " + clean;
hasil.style.color = "green";

// 🔊 BEEP
new Audio("https://www.soundjay.com/button/sounds/beep-07.mp3").play();

let item = produkMaster.find(p => p.kode === clean);

if(!item){
hasil.innerText = "❌ Tidak ditemukan";
hasil.style.color = "red";
return;
}

lastKodeScan = item.kode;

document.getElementById("scanBarcode").innerText = item.kode;
document.getElementById("scanNama").innerText = item.nama;

// 🔥 AUTO ISI QTY
document.getElementById("qty").value = 1;
document.getElementById("qty").focus();

setTimeout(()=>{ lastScan=""; },1000);

});
}

// ==========================
// STOP SCANNER
// ==========================
function stopScanner(){
if(html5QrCode){
html5QrCode.clear();
html5QrCode = null;
}
}

// ==========================
// SIMPAN (FIX TOTAL)
// ==========================
function simpanTransaksi(){

let qty = parseInt(document.getElementById("qty").value);

if(!lastKodeScan){
alert("Scan dulu barang!");
return;
}

if(!qty || qty <= 0){
alert("Qty tidak valid!");
return;
}

let item = produkMaster.find(p=>p.kode===lastKodeScan);

historyTransaksi.push({
id:Date.now(),
tanggal:new Date().toLocaleString(),
bulan:new Date().getMonth()+1,
jenis:modeTransaksi,
kode:item.kode,
reff:item.reff,
nama:item.nama,
qty:qty
});

localStorage.setItem("history",JSON.stringify(historyTransaksi));

// update
hitungUlangProduk();
tampilHistory();

// 🔥 RESET OTOMATIS
lastKodeScan = "";
lastScan = "";

document.getElementById("scanBarcode").innerText = "-";
document.getElementById("scanNama").innerText = "-";
document.getElementById("qty").value = "";

document.getElementById("hasilScan").innerText = "✔ Tersimpan, scan lagi...";
document.getElementById("hasilScan").style.color = "blue";
}

// ==========================
// HISTORY
// ==========================
function tampilHistory(){

let t=document.getElementById("dataHistory");
t.innerHTML="";

historyTransaksi.slice().reverse().forEach((h,i)=>{
t.innerHTML+=`
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
}

// ==========================
// DOWNLOAD
// ==========================
function downloadExcel(){

let csv="Tanggal,Kode,Reff,Nama,Jenis,Qty\n";

historyTransaksi.forEach(h=>{
csv+=`${h.tanggal},${h.kode},${h.reff},${h.nama},${h.jenis},${h.qty}\n`;
});

let blob=new Blob([csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="history.csv";
a.click();
}

// ==========================
window.onload=()=>{
loadData();
tampilHistory();
};
