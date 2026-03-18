let produk = [];
let produkMaster = [];
let historyTransaksi = [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// PAGINATION
let currentPageProduk = 1;
let currentPageHistory = 1;
const perPage = 40;

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

localStorage.setItem("produkMaster", JSON.stringify(produkMaster));
hitungUlangProduk();
}

// ==========================
// LOAD HISTORY
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

localStorage.setItem("history", JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
}

// ==========================
// HITUNG
// ==========================
function hitungUlangProduk(){

produk = JSON.parse(JSON.stringify(produkMaster));

let map = {};

for(let i=0;i<produk.length;i++){
let p = produk[i];
p.masuk=0;
p.keluar=0;
p.akhir=p.awal;
map[p.kode]=p;
}

for(let i=0;i<historyTransaksi.length;i++){
let h = historyTransaksi[i];
let item = map[h.kode];
if(!item) continue;

if(h.jenis==="masuk"){
item.masuk += h.qty;
item.akhir += h.qty;
}

if(h.jenis==="keluar"){
item.keluar += h.qty;
item.akhir -= h.qty;
}
}

currentPageProduk = 1;

tampilProduk();
updateDashboard(); // 🔥 FIX
}

// ==========================
// DASHBOARD
// ==========================
function updateDashboard(){

let totalProduk = produk.length;

let totalMasuk = 0;
let totalKeluar = 0;

for(let i=0;i<produk.length;i++){
totalMasuk += produk[i].masuk;
totalKeluar += produk[i].keluar;
}

document.getElementById("totalProduk").innerText = totalProduk;
document.getElementById("totalMasuk").innerText = totalMasuk;
document.getElementById("totalKeluar").innerText = totalKeluar;
}

// ==========================
// PRODUK PAGINATION
// ==========================
function tampilProduk(){

let t = document.getElementById("dataProduk");

let start = (currentPageProduk - 1) * perPage;
let end = start + perPage;

let data = produk.slice(start, end);

let html = "";

for(let i=0;i<data.length;i++){
let p = data[i];

html += `
<tr>
<td>${start + i + 1}</td>
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

renderPaginationProduk();
}

// ==========================
function renderPaginationProduk(){

let el = document.getElementById("paginationProduk");
if(!el) return;

let totalPage = Math.ceil(produk.length / perPage);
if(totalPage <= 1){
el.innerHTML="";
return;
}

let html = `<button onclick="changePageProduk(${currentPageProduk-1})">Prev</button>`;

for(let i=1;i<=totalPage;i++){
html += `<button class="${i===currentPageProduk?'active':''}" onclick="changePageProduk(${i})">${i}</button>`;
}

html += `<button onclick="changePageProduk(${currentPageProduk+1})">Next</button>`;

el.innerHTML = html;
}

// ==========================
function changePageProduk(p){
let total = Math.ceil(produk.length / perPage);
if(p < 1 || p > total) return;

currentPageProduk = p;
tampilProduk();
window.scrollTo({top:0, behavior:"smooth"});
}

// ==========================
// HISTORY
// ==========================
function tampilHistory(){

let t = document.getElementById("dataHistory");

let dataAll = historyTransaksi.slice().reverse();

let start = (currentPageHistory - 1) * perPage;
let end = start + perPage;

let data = dataAll.slice(start, end);

let html = "";

for(let i=0;i<data.length;i++){
let h = data[i];

html += `
<tr>
<td>${start + i + 1}</td>
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

renderPaginationHistory(dataAll.length);
}

// ==========================
function renderPaginationHistory(total){

let el = document.getElementById("paginationHistory");
if(!el) return;

let totalPage = Math.ceil(total / perPage);
if(totalPage <= 1){
el.innerHTML="";
return;
}

let html = `<button onclick="changePageHistory(${currentPageHistory-1})">Prev</button>`;

for(let i=1;i<=totalPage;i++){
html += `<button class="${i===currentPageHistory?'active':''}" onclick="changePageHistory(${i})">${i}</button>`;
}

html += `<button onclick="changePageHistory(${currentPageHistory+1})">Next</button>`;

el.innerHTML = html;
}

// ==========================
function changePageHistory(p){
let total = Math.ceil(historyTransaksi.length / perPage);
if(p < 1 || p > total) return;

currentPageHistory = p;
tampilHistory();
window.scrollTo({top:0, behavior:"smooth"});
}

// ==========================
function startScanner(){
if(html5QrCode) return;

html5QrCode = new Html5QrcodeScanner("reader",{fps:5,qrbox:{width:200,height:100}},false);

html5QrCode.render((code)=>{
let clean = code.trim().toUpperCase();
if(clean===lastScan) return;

lastScan=clean;

let item = produkMaster.find(p=>p.kode===clean);
if(!item){
document.getElementById("hasilScan").innerText="❌ Tidak ditemukan";
return;
}

lastKodeScan=item.kode;
document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;
document.getElementById("qty").value=1;

setTimeout(()=>{lastScan="";},1500);
});
}

function stopScanner(){
if(html5QrCode){
html5QrCode.clear();
html5QrCode=null;
}
}

// ==========================
async function simpanTransaksi(){

let qty=parseInt(document.getElementById("qty").value);

if(!lastKodeScan){
alert("Scan dulu!");
return;
}

let item=produkMaster.find(p=>p.kode===lastKodeScan);

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

localStorage.removeItem("history");

await loadHistoryFromSheet();

lastKodeScan="";
document.getElementById("scanBarcode").innerText="-";
document.getElementById("scanNama").innerText="-";
document.getElementById("qty").value="";
}

// ==========================
window.onload=()=>{
loadData();
loadHistoryFromSheet();
};

