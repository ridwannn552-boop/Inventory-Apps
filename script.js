let produk=[];
let historyTransaksi=JSON.parse(localStorage.getItem("historyTransaksi"))||[];

let lastKodeScan="";
let modeTransaksi="masuk";
let lastScanTime=0;

let beep=new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// NAVIGASI
function showPage(id,el){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

document.querySelectorAll(".sidebar ul li").forEach(m=>m.classList.remove("active-menu"));
if(el) el.classList.add("active-menu");

if(id==="history") resetFilter();
}

// MODE
function setMode(mode){
modeTransaksi=mode;
document.getElementById("hasilScan").innerHTML="<b>Mode: "+mode.toUpperCase()+"</b>";
}

// LOAD DATA
async function loadSpreadsheet(){
let res=await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv");
let text=await res.text();

let rows=text.split("\n");
produk=[];

for(let i=1;i<rows.length;i++){
let c=rows[i].split(",");
produk.push({
no:c[0],
kode:c[1],
reff:c[2],
nama:c[3],
uom:c[4],
awal:parseInt(c[5])||0,
masuk:parseInt(c[6])||0,
keluar:parseInt(c[7])||0
});
}

tampilProduk();
updateDashboard();
}

// TABEL
function tampilProduk(){
let t=document.getElementById("dataProduk");
t.innerHTML="";

produk.forEach(p=>{
let akhir=p.awal+p.masuk-p.keluar;
let minus=akhir<0?"minus":"";

t.innerHTML+=`<tr>
<td>${p.no}</td>
<td>${p.kode}</td>
<td>${p.reff}</td>
<td>${p.nama}</td>
<td>${p.uom}</td>
<td>${p.awal}</td>
<td>${p.masuk}</td>
<td>${p.keluar}</td>
<td class="${minus}">${akhir}</td>
</tr>`;
});
}

// DASHBOARD
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

// SCANNER AUTO
function startScanner(){
let scanner=new Html5QrcodeScanner("reader",{fps:10});

scanner.render(code=>{

let now=Date.now();
if(now-lastScanTime<1500) return;
lastScanTime=now;

beep.play();

let item=produk.find(p=>p.kode==code);

if(!item){
document.getElementById("hasilScan").innerText="❌ Tidak ditemukan";
return;
}

lastKodeScan=code;

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;

simpanTransaksiAuto(1);
});
}

// AUTO SAVE
function simpanTransaksiAuto(qty){
let item=produk.find(p=>p.kode==lastKodeScan);
if(!item) return;

if(modeTransaksi==="masuk") item.masuk+=qty;
if(modeTransaksi==="keluar") item.keluar+=qty;
if(modeTransaksi==="so"){
item.awal=qty;
item.masuk=0;
item.keluar=0;
}

let now=new Date();

historyTransaksi.push({
tanggal:now.toLocaleString(),
bulan:now.getMonth()+1,
jenis:modeTransaksi,
kode:item.kode,
reff:item.reff,
nama:item.nama,
qty:qty
});

localStorage.setItem("historyTransaksi",JSON.stringify(historyTransaksi));

tampilProduk();
tampilHistory();

document.getElementById("hasilScan").innerText="✅ Auto tersimpan";
}

// MANUAL
function simpanTransaksi(){
let qty=parseInt(document.getElementById("qty").value);
if(!qty) return;

lastKodeScan=document.getElementById("scanBarcode").innerText;
simpanTransaksiAuto(qty);

document.getElementById("qty").value="";
}

// HISTORY
function tampilHistory(data=historyTransaksi){
let t=document.getElementById("dataHistory");
t.innerHTML="";

let total=0;

data.slice().reverse().forEach((h,i)=>{
total+=h.qty;

t.innerHTML+=`<tr class="${h.jenis}">
<td>${i+1}</td>
<td>${h.tanggal}</td>
<td>${h.kode}</td>
<td>${h.reff||"-"}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
</tr>`;
});

document.getElementById("totalHistory").innerText="Total Qty: "+total;
}

// FILTER
function filterHistory(){
let b=document.getElementById("filterBulan").value;
let j=document.getElementById("filterJenis").value;

let hasil=historyTransaksi.filter(h=>{
return (!b||h.bulan==b)&&(!j||h.jenis==j);
});

tampilHistory(hasil);
}

function resetFilter(){
document.getElementById("filterBulan").value="";
document.getElementById("filterJenis").value="";
tampilHistory();
}

// EXPORT
function downloadExcel(){
let csv="Tanggal,Kode,Reff,Nama,Jenis,Qty\n";

historyTransaksi.forEach(h=>{
csv+=`${h.tanggal},${h.kode},${h.reff},${h.nama},${h.jenis},${h.qty}\n`;
});

let blob=new Blob([csv],{type:"text/csv"});
let url=URL.createObjectURL(blob);

let a=document.createElement("a");
a.href=url;
a.download="history.csv";
a.click();
}

// LOAD
window.onload=()=>{
loadSpreadsheet();
tampilHistory();
startScanner();
};
