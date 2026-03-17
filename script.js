let produk=[];
let historyTransaksi=JSON.parse(localStorage.getItem("history"))||[];
let lastKodeScan="";
let modeTransaksi="masuk";

function showPage(id,el){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="history") tampilHistory();
}

function setMode(mode){
modeTransaksi=mode;
document.getElementById("hasilScan").innerText="Mode: "+mode;
}

// LOAD DATA
async function loadData(){
let res=await fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?output=csv");
let text=await res.text();

let rows=text.split("\n");
produk=[];

for(let i=1;i<rows.length;i++){
let c=rows[i].split(",");
produk.push({
kode:c[1],
nama:c[3],
awal:parseInt(c[5])||0,
masuk:parseInt(c[6])||0,
keluar:parseInt(c[7])||0
});
}

tampilProduk();
}

// TABEL
function tampilProduk(){
let t=document.getElementById("dataProduk");
t.innerHTML="";
produk.forEach(p=>{
let akhir=p.awal+p.masuk-p.keluar;
t.innerHTML+=`<tr>
<td>-</td>
<td>${p.kode}</td>
<td>-</td>
<td>${p.nama}</td>
<td>-</td>
<td>${p.awal}</td>
<td>${p.masuk}</td>
<td>${p.keluar}</td>
<td>${akhir}</td>
</tr>`;
});
}

// SCAN
function startScanner(){
let scanner=new Html5QrcodeScanner("reader",{fps:10});

scanner.render(code=>{
let item=produk.find(p=>p.kode==code);

if(!item){
document.getElementById("hasilScan").innerText="Tidak ditemukan";
return;
}

lastKodeScan=code;
document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;
});
}

// SIMPAN
function simpanTransaksi(){
let qty=parseInt(document.getElementById("qty").value);

let item=produk.find(p=>p.kode==lastKodeScan);

if(!item) return;

if(modeTransaksi==="masuk") item.masuk+=qty;
if(modeTransaksi==="keluar") item.keluar+=qty;

let now=new Date();

historyTransaksi.push({
tanggal:now.toLocaleString(),
bulan:now.getMonth()+1,
jenis:modeTransaksi,
kode:item.kode,
nama:item.nama,
qty:qty
});

localStorage.setItem("history",JSON.stringify(historyTransaksi));

tampilHistory();
tampilProduk();

document.getElementById("qty").value="";
}

// HISTORY
function tampilHistory(data=historyTransaksi){
let t=document.getElementById("dataHistory");
t.innerHTML="";

data.slice().reverse().forEach((h,i)=>{
t.innerHTML+=`<tr>
<td>${i+1}</td>
<td>${h.tanggal}</td>
<td>${h.kode}</td>
<td>${h.nama}</td>
<td>${h.jenis}</td>
<td>${h.qty}</td>
</tr>`;
});
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
tampilHistory();
}

// LOAD
window.onload=()=>{
loadData();
tampilHistory();
startScanner();
};
