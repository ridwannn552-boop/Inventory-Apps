let produk = [];
let produkMaster = [];
let historyTransaksi = JSON.parse(localStorage.getItem("history")) || [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// ==========================
function showPage(id, el) {

document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(el){
document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
el.classList.add("active");
}

if(id === "scanner"){
startScanner();
}else{
stopScanner();
}

if(id === "history") tampilHistory();
}

// ==========================
function setMode(mode){
modeTransaksi = mode;
document.getElementById("hasilScan").innerText = "Mode: " + mode;
}

// ==========================
// 🔥 LOAD DATA FIX BARCODE
// ==========================
async function loadData(){

let url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv&t="+Date.now();

let res = await fetch(url);
let text = await res.text();

let rows = text.split("\n");

// 🔥 HEADER
let header = rows[0].replace("\r","").split(",");

// 🔥 DETEKSI KOLOM
let idxBarcode = header.findIndex(h => h.toLowerCase().includes("barcode"));
let idxReff = header.findIndex(h => h.toLowerCase().includes("reff"));
let idxNama = header.findIndex(h => h.toLowerCase().includes("nama"));
let idxUom = header.findIndex(h => h.toLowerCase().includes("uom"));
let idxAwal = header.findIndex(h => h.toLowerCase().includes("awal"));

produkMaster = [];

for(let i=1;i<rows.length;i++){

let c = rows[i].replace("\r","").split(",");

if(!c[idxBarcode]) continue;

produkMaster.push({
kode: c[idxBarcode]?.trim().replace(/\s/g,''),
reff: c[idxReff]?.trim(),
nama: c[idxNama]?.trim(),
uom: c[idxUom]?.trim(),
awal: parseInt(c[idxAwal]) || 0
});
}

console.log("DATA PRODUK:", produkMaster);

hitungUlangProduk();
}

// ==========================
function hitungUlangProduk(){

produk = JSON.parse(JSON.stringify(produkMaster));

produk.forEach(p=>{
p.masuk=0;
p.keluar=0;
p.akhir=p.awal;
});

historyTransaksi.forEach(h=>{
let item=produk.find(p=>p.kode==h.kode);
if(!item) return;

if(h.jenis==="masuk"){
item.masuk+=h.qty;
item.akhir+=h.qty;
}

if(h.jenis==="keluar"){
item.keluar+=h.qty;
item.akhir-=h.qty;
}

if(h.jenis==="so"){
item.akhir=h.qty;
}
});

tampilProduk();
updateDashboard();
}

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
function updateDashboard(){

document.getElementById("totalProduk").innerText=produk.length;

let masuk=produk.reduce((a,b)=>a+b.masuk,0);
let keluar=produk.reduce((a,b)=>a+b.keluar,0);

document.getElementById("totalMasuk").innerText=masuk;
document.getElementById("totalKeluar").innerText=keluar;
}

// ==========================
// 🔥 SCANNER FIX TOTAL
// ==========================
function startScanner(){

if(html5QrCode) return;

html5QrCode = new Html5Qrcode("reader");

html5QrCode.start(

{ facingMode: { ideal: "environment" } },

{
fps: 20,
qrbox: { width: 320, height: 200 },
aspectRatio: 1.5,
formatsToSupport: [
Html5QrcodeSupportedFormats.CODE_128,
Html5QrcodeSupportedFormats.EAN_13,
Html5QrcodeSupportedFormats.CODE_39,
Html5QrcodeSupportedFormats.QR_CODE
]
},

(code)=>{

let clean = code.trim().replace(/\s/g,'');

console.log("SCAN:", clean);

document.getElementById("hasilScan").innerText = "SCAN: " + clean;

if(clean === lastScan) return;
lastScan = clean;

new Audio("https://www.soundjay.com/button/sounds/beep-07.mp3").play();

let item = produkMaster.find(p => p.kode === clean);

if(!item){
document.getElementById("hasilScan").innerText = "❌ Tidak ditemukan: "+clean;
return;
}

lastKodeScan=item.kode;

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;
document.getElementById("hasilScan").innerText="✅ Ditemukan";

setTimeout(()=>{ lastScan=""; },1000);

},
(err)=>{ console.log(err); }

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
function simpanTransaksi(){

let qty=parseInt(document.getElementById("qty").value);
if(!qty || !lastKodeScan) return;

let item=produkMaster.find(p=>p.kode==lastKodeScan);
if(!item) return;

let now=new Date();

historyTransaksi.push({
id:Date.now(),
tanggal:now.toLocaleString(),
bulan:now.getMonth()+1,
jenis:modeTransaksi,
kode:item.kode,
reff:item.reff,
nama:item.nama,
qty:qty
});

localStorage.setItem("history",JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();

document.getElementById("qty").value="";
}

// ==========================
function tampilHistory(data=historyTransaksi){

let t=document.getElementById("dataHistory");
t.innerHTML="";

data.slice().reverse().forEach((h,i)=>{
t.innerHTML+=`
<tr>
<td>${i+1}</td>
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
function editHistory(id){

let h=historyTransaksi.find(x=>x.id===id);
if(!h) return;

let qty=prompt("Edit Qty:",h.qty);
if(qty===null) return;

h.qty=parseInt(qty)||h.qty;

localStorage.setItem("history",JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
}

// ==========================
function hapusHistory(id){

if(!confirm("Hapus data?")) return;

historyTransaksi=historyTransaksi.filter(h=>h.id!==id);

localStorage.setItem("history",JSON.stringify(historyTransaksi));

hitungUlangProduk();
tampilHistory();
}

// ==========================
function filterHistory(){

let b=document.getElementById("filterBulan").value;
let j=document.getElementById("filterJenis").value;

let hasil=historyTransaksi.filter(h=>{
return (!b || h.bulan==b) && (!j || h.jenis==j);
});

tampilHistory(hasil);
}

// ==========================
function downloadExcel(){

let csv = "Tanggal,Kode,Reff,Nama,Jenis,Qty\n";

historyTransaksi.forEach(h=>{
csv += `${h.tanggal},${h.kode},${h.reff},${h.nama},${h.jenis},${h.qty}\n`;
});

let blob = new Blob([csv], { type: 'text/csv' });
let url = URL.createObjectURL(blob);

let a = document.createElement("a");
a.href = url;
a.download = "history.csv";
a.click();
}

// ==========================
window.onload=()=>{
loadData();
tampilHistory();
};
