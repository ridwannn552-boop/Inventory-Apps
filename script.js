// ==========================
// DATA GLOBAL
// ==========================

let produk = [];
let lastKodeScan = "";
let historyTransaksi = JSON.parse(localStorage.getItem("historyTransaksi")) || [];

let beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let currentPage = 1;
let rowsPerPage = 50;
let modeTransaksi = "masuk";


// ==========================
// NAVIGASI
// ==========================

function showPage(pageId, el){

document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(pageId).classList.add("active");

document.querySelectorAll(".sidebar ul li").forEach(m=>m.classList.remove("active-menu"));
if(el) el.classList.add("active-menu");

if(pageId==="history"){
tampilHistory();
}
}


// ==========================
// LOAD DATA SHEET
// ==========================

async function loadSpreadsheet(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&single=true&output=csv";

let res = await fetch(url);
let text = await res.text();

let rows = text.split(/\r?\n/);

produk = [];

for(let i=1;i<rows.length;i++){

let row = rows[i].trim();
if(row==="") continue;

let col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

let no    = col[0]?.replace(/"/g,"").trim();
let kode  = col[1]?.replace(/"/g,"").trim();
let reff  = col[2]?.replace(/"/g,"").trim();
let nama  = col[3]?.replace(/"/g,"").trim();
let uom   = col[4]?.replace(/"/g,"").trim();

let awal   = parseInt(col[5])||0;
let masuk  = parseInt(col[6])||0;
let keluar = parseInt(col[7])||0;

produk.push({no,kode,reff,nama,uom,awal,masuk,keluar});
}

tampilProduk();
updateDashboard();
}


// ==========================
// TABEL PRODUK
// ==========================

function tampilProduk(){

let tabel=document.getElementById("dataProduk");
tabel.innerHTML="";

let start=(currentPage-1)*rowsPerPage;
let data=produk.slice(start,start+rowsPerPage);

data.forEach(item=>{

let akhir=item.awal+item.masuk-item.keluar;

tabel.innerHTML+=`
<tr>
<td>${item.no}</td>
<td>${item.kode}</td>
<td>${item.reff}</td>
<td>${item.nama}</td>
<td>${item.uom}</td>
<td>${item.awal}</td>
<td>${item.masuk}</td>
<td>${item.keluar}</td>
<td>${akhir}</td>
</tr>`;
});

buatPagination();
}


// ==========================
// PAGINATION
// ==========================

function buatPagination(){

let el=document.getElementById("pagination");
el.innerHTML="";

let total=Math.ceil(produk.length/rowsPerPage);

for(let i=1;i<=total;i++){

let btn=document.createElement("button");
btn.innerText=i;

if(i===currentPage) btn.style.background="#1abc9c";

btn.onclick=()=>{
currentPage=i;
tampilProduk();
};

el.appendChild(btn);
}
}


// ==========================
// SEARCH
// ==========================

function searchProduk(){

let keyword=document.getElementById("searchInput").value.toLowerCase();

if(!keyword){
tampilProduk();
return;
}

let hasil=produk.filter(p=>
p.kode.toLowerCase().includes(keyword) ||
p.nama.toLowerCase().includes(keyword) ||
p.reff.toLowerCase().includes(keyword)
);

let tabel=document.getElementById("dataProduk");
tabel.innerHTML="";

hasil.forEach(item=>{
let akhir=item.awal+item.masuk-item.keluar;

tabel.innerHTML+=`
<tr>
<td>${item.no}</td>
<td>${item.kode}</td>
<td>${item.reff}</td>
<td>${item.nama}</td>
<td>${item.uom}</td>
<td>${item.awal}</td>
<td>${item.masuk}</td>
<td>${item.keluar}</td>
<td>${akhir}</td>
</tr>`;
});
}


// ==========================
// DASHBOARD
// ==========================

function updateDashboard(){

document.getElementById("totalProduk").innerText=produk.length;

let masuk=0, keluar=0;

produk.forEach(p=>{
masuk+=p.masuk;
keluar+=p.keluar;
});

document.getElementById("totalMasuk").innerText=masuk;
document.getElementById("totalKeluar").innerText=keluar;
}


// ==========================
// SCANNER
// ==========================

let lastScanTime=0;

function startScanner(){

let scanner=new Html5QrcodeScanner("reader",{fps:10,qrbox:250});

scanner.render(text=>{

let now=Date.now();
if(now-lastScanTime<1500) return;

lastScanTime=now;

beep.play();
tampilkanHasilScan(text);

});
}


// ==========================
// HASIL SCAN
// ==========================

function tampilkanHasilScan(kode){

kode = kode.trim();

let item = produk.find(p=>p.kode.trim() === kode);

let hasil = document.getElementById("hasilScan");

if(!item){
hasil.innerText = "❌ Produk tidak ditemukan";
return;
}

lastKodeScan = kode;

document.getElementById("scanBarcode").innerText = item.kode;
document.getElementById("scanNama").innerText = item.nama;

hasil.innerText = "✅ Barang ditemukan";

document.getElementById("qty").focus();
}

// ==========================
// SIMPAN TRANSAKSI
// ==========================

function simpanTransaksi(){

let qtyInput = document.getElementById("qty");
let hasil = document.getElementById("hasilScan");

let qtyVal = parseInt(qtyInput.value);

if(!lastKodeScan){
hasil.innerText = "❌ Scan barcode dulu";
return;
}

if(!qtyVal || qtyVal <= 0){
hasil.innerText = "❌ Qty tidak valid";
return;
}

let item = produk.find(p=>p.kode.trim() === lastKodeScan.trim());

if(!item){
hasil.innerText = "❌ Produk tidak ditemukan";
return;
}

if(modeTransaksi === "masuk") item.masuk += qtyVal;
if(modeTransaksi === "keluar") item.keluar += qtyVal;

if(modeTransaksi === "so"){
item.awal = qtyVal;
item.masuk = 0;
item.keluar = 0;
}

let now = new Date();

historyTransaksi.push({
tanggal: now.toISOString(),
bulan: now.getMonth()+1,
jenis: modeTransaksi,
kode: item.kode,
nama: item.nama,
qty: qtyVal
});

localStorage.setItem("historyTransaksi", JSON.stringify(historyTransaksi));

tampilProduk();
tampilHistory();

qtyInput.value = "";
hasil.innerText = "✅ Transaksi berhasil disimpan";
}


// ==========================
// HISTORY
// ==========================

function tampilHistory(data=historyTransaksi){

let tabel=document.getElementById("dataHistory");
tabel.innerHTML="";

data.forEach((h,i)=>{
tabel.innerHTML+=`
<tr>
<td>${i+1}</td>
<td>${new Date(h.tanggal).toLocaleString()}</td>
<td>${h.kode}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
</tr>`;
});
}


// ==========================
// LOAD
// ==========================

window.onload=()=>{
loadSpreadsheet();
startScanner();
tampilHistory();

document.getElementById("qty").addEventListener("keypress", e=>{
if(e.key==="Enter"){
simpanTransaksi();
}
});
window.onload = () => {

loadSpreadsheet();
startScanner();
tampilHistory();

document.getElementById("qty").addEventListener("keypress", e=>{
if(e.key==="Enter"){
simpanTransaksi();
}
});

};
