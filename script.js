let produk = [];
let produkMaster = [];
let historyTransaksi = [];

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode;
let lastScan = "";

// 🔥 GANTI INI
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbwdUWJmN6rXf2l_KJSVDSpPzE3kqZbJ9PKxEhDaG8E5OGjmidOZFX22Rrn4AifsI5fU/exec";
const URL_HISTORY_CSV = "https://docs.google.com/spreadsheets/d/e/2PACX1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZpub?gid=657187893&single=true&output=csv";

// ==========================
function showPage(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="scanner") startScanner();
else stopScanner();

if(id==="history") loadHistoryFromSheet();
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
// LOAD PRODUK
// ==========================
async function loadData(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv";

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
// LOAD HISTORY DARI SHEET
// ==========================
async function loadHistoryFromSheet(){

let res = await fetch(URL_HISTORY_CSV);
let text = await res.text();

let rows = parseCSV(text);

historyTransaksi=[];

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
document.getElementById("totalProduk").innerText = produk.length;

let masuk = produk.reduce((a,b)=>a+b.masuk,0);
let keluar = produk.reduce((a,b)=>a+b.keluar,0);

document.getElementById("totalMasuk").innerText = masuk;
document.getElementById("totalKeluar").innerText = keluar;
}

// ==========================
// SCANNER
// ==========================
function startScanner(){

if(html5QrCode) return;

html5QrCode = new Html5QrcodeScanner("reader",{
fps:10,
qrbox:{width:250,height:120}
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

setTimeout(()=>{lastScan="";},1000);

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
// SIMPAN KE GOOGLE SHEET
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

// 🔥 reload dari cloud
await loadHistoryFromSheet();

// reset
lastKodeScan="";
document.getElementById("scanBarcode").innerText="-";
document.getElementById("scanNama").innerText="-";
document.getElementById("qty").value="";

document.getElementById("hasilScan").innerText="✔ Tersimpan (SYNC)";
}

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
window.onload=()=>{
loadData();
loadHistoryFromSheet();
};
