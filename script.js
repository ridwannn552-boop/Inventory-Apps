// ==========================
// NAVIGASI HALAMAN
// ==========================
function showPage(pageId,el){

let pages=document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

document.getElementById(pageId).classList.add("active");

/* menu aktif */

let menus=document.querySelectorAll(".sidebar ul li");

menus.forEach(function(m){
m.classList.remove("active-menu");
});

if(el){
el.classList.add("active-menu");
}

/* tampilkan history */

if(pageId==="history"){
tampilHistory();
}

}

// ==========================
// DATA
// ==========================

let produk=[];

let historyTransaksi = JSON.parse(localStorage.getItem("historyTransaksi")) || [];

let beep = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

let currentPage=1;
let rowsPerPage=50;

let modeTransaksi="masuk";


// ==========================
// LOAD DATA GOOGLE SHEET
// ==========================

async function loadSpreadsheet(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&single=true&output=csv";

let response = await fetch(url);
let text = await response.text();

let rows = text.split(/\r?\n/);

produk=[];

for(let i=1;i<rows.length;i++){

let row = rows[i].trim();
if(row==="") continue;

let col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

// ✅ FIX MAPPING
let kode = (col[1]||"").replace(/"/g,"").trim();
let nama = (col[3]||"").replace(/"/g,"").trim();
let uom  = (col[4]||"").replace(/"/g,"").trim();

let awal   = parseInt(col[5])||0;
let masuk  = parseInt(col[6])||0;
let keluar = parseInt(col[7])||0;

produk.push({
kode:kode,
nama:nama,
uom:uom,
awal:awal,
masuk:masuk,
keluar:keluar
});

}

tampilProduk();
}

// ==========================
// TAMPIL PRODUK
// ==========================

function tampilProduk(){

let tabel=document.getElementById("dataProduk");
if(!tabel) return;

tabel.innerHTML="";

let start=(currentPage-1)*rowsPerPage;
let end=start+rowsPerPage;

let dataPage=produk.slice(start,end);

dataPage.forEach(function(item,index){

let akhir=item.awal + item.masuk - item.keluar;

let row=`

<tr>
<td>${start+index+1}</td>
<td>${item.kode}</td>
<td>${item.nama}</td>
<td>${item.uom}</td>
<td>${item.awal}</td>
<td>${item.masuk}</td>
<td>${item.keluar}</td>
<td>${akhir}</td>
</tr>
`;

tabel.innerHTML+=row;

});

buatPagination();
updateDashboard();

}


// ==========================
// PAGINATION
// ==========================

function buatPagination(){

let pagination=document.getElementById("pagination");
if(!pagination) return;

pagination.innerHTML="";

let pageCount=Math.ceil(produk.length/rowsPerPage);

for(let i=1;i<=pageCount;i++){

let btn=document.createElement("button");
btn.innerText=i;

if(i===currentPage){
btn.style.background="#1abc9c";
}

btn.onclick=function(){
currentPage=i;
tampilProduk();
};

pagination.appendChild(btn);

}

}


// ==========================
// SEARCH
// ==========================

function searchProduk(){

let keyword=document.getElementById("searchInput").value.toLowerCase();

let filtered=produk.filter(function(item){

return item.kode.toLowerCase().includes(keyword) ||
item.nama.toLowerCase().includes(keyword);

});

let tabel=document.getElementById("dataProduk");

tabel.innerHTML="";

filtered.forEach(function(item,index){

let akhir=item.awal + item.masuk - item.keluar;

let row=`

<tr>
<td>${index+1}</td>
<td>${item.kode}</td>
<td>${item.nama}</td>
<td>${item.uom}</td>
<td>${item.awal}</td>
<td>${item.masuk}</td>
<td>${item.keluar}</td>
<td>${akhir}</td>
</tr>
`;

tabel.innerHTML+=row;

});

}


// ==========================
// DASHBOARD
// ==========================

function updateDashboard(){

document.getElementById("totalProduk").innerText=produk.length;

let totalMasuk=0;
let totalKeluar=0;

produk.forEach(function(p){

totalMasuk+=p.masuk;
totalKeluar+=p.keluar;

});

document.getElementById("totalMasuk").innerText=totalMasuk;
document.getElementById("totalKeluar").innerText=totalKeluar;

}


// ==========================
// MODE TRANSAKSI
// ==========================

function setMode(mode){

modeTransaksi=mode;
document.getElementById("hasilScan").innerText="Mode : "+mode;

}


// ==========================
// SCANNER
// ==========================

function startScanner(){

let scanner=new Html5QrcodeScanner(
"reader",
{fps:10,qrbox:250}
);

scanner.render((decodedText)=>{

beep.play();
tampilkanHasilScan(decodedText);

});

}


// ==========================
// HISTORY
// ==========================

function tampilHistory(data=historyTransaksi){

let tabel=document.getElementById("dataHistory");
if(!tabel) return;

tabel.innerHTML="";

data.forEach(function(item,index){

let tanggal=new Date(item.tanggal).toLocaleString();

let row=`

<tr>
<td>${index+1}</td>
<td>${tanggal}</td>
<td>${item.kode}</td>
<td>${item.nama}</td>
<td>${item.jenis}</td>
<td>${item.qty}</td>
</tr>
`;

tabel.innerHTML+=row;

});

}


// ==========================
// FILTER HISTORY
// ==========================

function filterHistory(){

let bulan=document.getElementById("filterBulan").value;
let jenis=document.getElementById("filterJenis").value;

let filtered=historyTransaksi.filter(function(item){

let cocok=true;

if(bulan && item.bulan!=bulan) cocok=false;
if(jenis && item.jenis!=jenis) cocok=false;

return cocok;

});

tampilHistory(filtered);

}


// ==========================
// DOWNLOAD EXCEL
// ==========================

function downloadExcel(){

let data=historyTransaksi.map(function(item){

return{
Tanggal:new Date(item.tanggal).toLocaleString(),
Barcode:item.kode,
Nama:item.nama,
Transaksi:item.jenis,
Qty:item.qty
};

});

let ws=XLSX.utils.json_to_sheet(data);

let wb=XLSX.utils.book_new();

XLSX.utils.book_append_sheet(wb,ws,"History");

XLSX.writeFile(wb,"History_Transaksi.xlsx");

}


// ==========================
// SCAN RESULT
// ==========================

let lastKodeScan="";

function tampilkanHasilScan(kode){

let item = produk.find(p=>p.kode===kode);

if(!item){
document.getElementById("hasilScan").innerText="Produk tidak ditemukan";
return;
}

lastKodeScan=kode;

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;

document.getElementById("hasilScan").innerText="Barang ditemukan, isi qty lalu simpan";

}


// ==========================
// SIMPAN TRANSAKSI
// ==========================

function simpanTransaksi(){

let qty=parseInt(document.getElementById("qty").value);

if(!lastKodeScan){
document.getElementById("hasilScan").innerText="Scan barcode terlebih dahulu";
return;
}

if(!qty){
document.getElementById("hasilScan").innerText="Isi Qty terlebih dahulu";
return;
}

let item=produk.find(p=>p.kode===lastKodeScan);

if(!item){
document.getElementById("hasilScan").innerText="Produk tidak ditemukan";
return;
}

if(modeTransaksi==="masuk") item.masuk+=qty;
if(modeTransaksi==="keluar") item.keluar+=qty;

if(modeTransaksi==="so"){
item.awal=qty;
item.masuk=0;
item.keluar=0;
}

let now=new Date();

historyTransaksi.push({

tanggal:now.toISOString(),
bulan:now.getMonth()+1,
tahun:now.getFullYear(),
jenis:modeTransaksi,
kode:item.kode,
nama:item.nama,
qty:qty

});

localStorage.setItem("historyTransaksi",JSON.stringify(historyTransaksi));

tampilProduk();
tampilHistory();

document.getElementById("qty").value="";
document.getElementById("hasilScan").innerText="Transaksi berhasil disimpan";

}


// ==========================
// LOAD
// ==========================

window.onload=function(){

loadSpreadsheet();
startScanner();
tampilHistory();

};
