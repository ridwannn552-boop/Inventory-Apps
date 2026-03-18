let produk = [];
let produkMaster = [];
let historyTransaksi = [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// URL
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwdUWJmN6rXf2l_KJSVDSpPzE3kqZbJ9PKxEhDaG8E5OGjmidOZFX22Rrn4AifsI5fU/exec";
const URL_HISTORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=657187893&output=csv";
const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

// ==========================
function showPage(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="scanner") startScanner();
else stopScanner();

// 🔥 tidak reload terus
if(id==="history" && historyTransaksi.length === 0){
loadHistoryFromSheet();
}
}

// ==========================
function setMode(mode){
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// CSV PARSER
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
// LOAD PRODUK (CACHE)
// ==========================
async function loadData(){

let cache = localStorage.getItem("produkMaster");

if(cache){
produkMaster = JSON.parse(cache);
hitungUlangProduk();
return;
}

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

// simpan cache
localStorage.setItem("produkMaster", JSON.stringify(produkMaster));

hitungUlangProduk();
}

// ==========================
// LOAD HISTORY (CACHE)
// ==========================
async function loadHistoryFromSheet(){

let cache = localStorage.getItem("history");

if(cache){
historyTransaksi = JSON.parse(cache);
hitungUlangProduk();
tampilHistory();
return;
}

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

// simpan cache
localStorage.setItem("history", JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
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
// RENDER PRODUK (SUPER CEPAT)
// ==========================
function tampilProduk(){

let t = document.getElementById("dataProduk");

let html = "";

for(let i=0;i<produk.length;i++){
let p = produk[i];

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
}

t.innerHTML = html;
}

// ==========================
function updateDashboard(){

document.getElementById("totalProduk").innerText = produk.length;

let masuk = 0;
let keluar = 0;

for(let i=0;i<produk.length;i++){
masuk += produk[i].masuk;
keluar += produk[i].keluar;
}

document.getElementById("totalMasuk").innerText = masuk;
document.getElementById("totalKeluar").innerText = keluar;
}

// ==========================
// SCANNER (RINGAN)
// ==========================
function startScanner(){

if(html5QrCode) return;

html5QrCode = new Html5QrcodeScanner("reader",{
fps:5,
qrbox:{width:200,height:100}
},false);

html5QrCode.render((code)=>{

let clean = code.trim().toUpperCase();

if(clean===lastScan) return;
lastScan=clean;

let hasil = document.getElementById("hasilScan");
hasil.innerText="✅ "+clean;
hasil.style.color="green";

let item = produkMaster.find(p=>p.kode===clean);

if(!item){
hasil.innerText="❌ Tidak ditemukan";
hasil.style.color="red";
return;
}

lastKodeScan=item.kode;

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;

document.getElementById("qty").value=1;

setTimeout(()=>{lastScan="";},1500);

});
}

// ==========================
function stopScanner(){
if(html5QrCode){
html5QrCode.clear();
html5QrCode=null;
}
}

// ==========================
// SIMPAN
// ==========================
async function simpanTransaksi(){

let qty=parseInt(document.getElementById("qty").value);

if(!lastKodeScan){
alert("Scan dulu!");
return;
}

let item=produkMaster.find(p=>p.kode===lastKodeScan);

let data={
kode:item.kode,
reff:item.reff,
nama:item.nama,
jenis:modeTransaksi,
qty:qty
};

await fetch(URL_SCRIPT,{
method:"POST",
body:JSON.stringify(data)
});

// 🔥 clear cache biar fresh
localStorage.removeItem("history");

// reload
await loadHistoryFromSheet();

lastKodeScan="";
document.getElementById("scanBarcode").innerText="-";
document.getElementById("scanNama").innerText="-";
document.getElementById("qty").value="";

document.getElementById("hasilScan").innerText="✔ Tersimpan (SYNC)";
}

// ==========================
// HISTORY RENDER CEPAT
// ==========================
function tampilHistory(){

let t = document.getElementById("dataHistory");

let html = "";

let data = historyTransaksi.slice().reverse();

for(let i=0;i<data.length;i++){
let h = data[i];

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
}

t.innerHTML = html;
}

// ==========================
window.onload=()=>{
loadData();
loadHistoryFromSheet();
};
