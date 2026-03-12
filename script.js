// =========================
// NAVIGASI PAGE
// =========================

function showPage(pageId){

let pages=document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

document.getElementById(pageId).classList.add("active");

}


// =========================
// DATA PRODUK
// =========================

let produk=[];


// =========================
// LOAD DATA SPREADSHEET
// =========================

async function loadSpreadsheet(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&single=true&output=csv";

let response = await fetch(url);
let data = await response.text();

let rows = data.split("\n");

produk = [];

for(let i=1;i<rows.length;i++){

let row = rows[i].trim();

if(row === "") continue;

let col = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

produk.push({

kode: col[1] || "",
nama: col[2] || "",
uom: col[3] || "",
awal: parseInt(col[4]) || 0,
masuk: parseInt(col[5]) || 0,
keluar: parseInt(col[6]) || 0

});

}

tampilProduk();

}

// =========================
// TAMPILKAN DATA PRODUK
// =========================

function tampilProduk(){

let tabel=document.getElementById("dataProduk");

tabel.innerHTML="";

produk.forEach(function(item,index){

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

tabel.innerHTML += row;

});

updateDashboard();

}


// =========================
// DASHBOARD
// =========================

function updateDashboard(){

document.getElementById("totalProduk").innerText=produk.length;

let totalMasuk=0;
let totalKeluar=0;

produk.forEach(p=>{
totalMasuk += p.masuk;
totalKeluar += p.keluar;
});

document.getElementById("totalMasuk").innerText=totalMasuk;
document.getElementById("totalKeluar").innerText=totalKeluar;

}


// =========================
// LOAD DATA
// =========================

loadSpreadsheet();
