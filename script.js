let produk=[], produkMaster=[], historyTransaksi=[];
let currentPageProduk=1, perPage=40;
let html5QrCode, lastScan="", lastKodeScan="", modeTransaksi="masuk";

const URL_PRODUK="PASTE LINK CSV PRODUK";
const URL_HISTORY_CSV="PASTE LINK CSV HISTORY";
const URL_SCRIPT="PASTE URL GAS";

// MENU
function toggleMenu(){
document.querySelector(".sidebar").classList.toggle("active");
}

function showPage(id,el){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");

if(id==="scanner") startScanner();
else stopScanner();

document.querySelector(".sidebar").classList.remove("active");
}

// LOAD DATA
async function loadData(){
let res=await fetch(URL_PRODUK);
let text=await res.text();
let rows=text.split("\n");

produkMaster=[];
for(let i=1;i<rows.length;i++){
let c=rows[i].split(",");
if(!c[1])continue;
produkMaster.push({kode:c[1],nama:c[3],awal:parseInt(c[5])||0});
}

produk=[...produkMaster];
tampilProduk();
}

// TAMPIL PRODUK
function tampilProduk(){
let t=document.getElementById("dataProduk");
let html="";
produk.forEach((p,i)=>{
html+=`<tr><td>${i+1}</td><td>${p.kode}</td><td>${p.nama}</td><td>${p.awal}</td></tr>`;
});
t.innerHTML=html;
}

// SCANNER
function startScanner(){
if(html5QrCode)return;

html5QrCode=new Html5Qrcode("reader");

html5QrCode.start(
{facingMode:"environment"},
{fps:10,qrbox:250},
(code)=>{
if(code===lastScan)return;
lastScan=code;

document.getElementById("scanBarcode").innerText=code;
}
);
}

function stopScanner(){
if(html5QrCode){
html5QrCode.stop();
html5QrCode=null;
}
}

window.onload=loadData;

