let produk = [];
let produkMaster = [];
let historyTransaksi = JSON.parse(localStorage.getItem("history")) || [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// NAVIGASI
function showPage(id, el){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="scanner"){startScanner();}
else{stopScanner();}

if(id==="history") tampilHistory();
}

// MODE
function setMode(mode){
modeTransaksi=mode;
document.getElementById("hasilScan").innerText="Mode: "+mode;
}

// LOAD DATA (AUTO BARCODE)
async function loadData(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv";

let res=await fetch(url);
let text=await res.text();

let rows=text.split("\n");
let header=rows[0].split(",");

let idxBarcode=header.findIndex(h=>h.toLowerCase().includes("barcode"));
let idxNama=header.findIndex(h=>h.toLowerCase().includes("nama"));

produkMaster=[];

for(let i=1;i<rows.length;i++){
let c=rows[i].split(",");
if(!c[idxBarcode]) continue;

produkMaster.push({
kode:c[idxBarcode].trim(),
nama:c[idxNama].trim(),
awal:0
});
}

hitungUlangProduk();
}

// HITUNG
function hitungUlangProduk(){
produk=[...produkMaster];

produk.forEach(p=>{
p.masuk=0;p.keluar=0;p.akhir=0;
});

historyTransaksi.forEach(h=>{
let item=produk.find(p=>p.kode==h.kode);
if(!item) return;

if(h.jenis=="masuk"){item.masuk+=h.qty;item.akhir+=h.qty;}
if(h.jenis=="keluar"){item.keluar+=h.qty;item.akhir-=h.qty;}
});

tampilProduk();
}

// TAMPIL
function tampilProduk(){
let t=document.getElementById("dataProduk");
t.innerHTML="";
produk.forEach((p,i)=>{
t.innerHTML+=`<tr>
<td>${i+1}</td>
<td>${p.kode}</td>
<td>-</td>
<td>${p.nama}</td>
<td>-</td>
<td>0</td>
<td>${p.masuk}</td>
<td>${p.keluar}</td>
<td>${p.akhir}</td>
</tr>`;
});
}

// SCANNER
function startScanner(){
if(html5QrCode) return;

html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:15,qrbox:250},

(code)=>{

if(code==lastScan) return;
lastScan=code;

let item=produkMaster.find(p=>p.kode==code);

if(!item){
document.getElementById("hasilScan").innerText="❌ Tidak ditemukan";
return;
}

lastKodeScan=item.kode;
document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;
document.getElementById("hasilScan").innerText="✅ Ditemukan";

},
(err)=>{}
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

// SIMPAN
function simpanTransaksi(){
let qty=parseInt(document.getElementById("qty").value);
if(!qty||!lastKodeScan) return;

historyTransaksi.push({
id:Date.now(),
tanggal:new Date().toLocaleString(),
jenis:modeTransaksi,
kode:lastKodeScan,
nama:document.getElementById("scanNama").innerText,
qty:qty
});

localStorage.setItem("history",JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
}

// HISTORY
function tampilHistory(){
let t=document.getElementById("dataHistory");
t.innerHTML="";
historyTransaksi.forEach((h,i)=>{
t.innerHTML+=`<tr>
<td>${i+1}</td>
<td>${h.tanggal}</td>
<td>${h.kode}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
<td>-</td>
</tr>`;
});
}

// FILTER
function filterHistory(){tampilHistory();}

// DOWNLOAD
function downloadExcel(){
let csv="Tanggal,Kode,Nama,Jenis,Qty\n";
historyTransaksi.forEach(h=>{
csv+=`${h.tanggal},${h.kode},${h.nama},${h.jenis},${h.qty}\n`;
});
let blob=new Blob([csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="data.csv";
a.click();
}

// INIT
window.onload=()=>{
loadData();
tampilHistory();
};
