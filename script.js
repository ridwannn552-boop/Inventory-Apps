// ==========================
// NAVIGASI HALAMAN
// ==========================

function showPage(pageId){

let pages = document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

document.getElementById(pageId).classList.add("active");

}

// ==========================
// DATA
// ==========================

let produk=[];
let historyTransaksi=[];

let currentPage=1;
let rowsPerPage=50;

let modeTransaksi="masuk";

// ==========================
// LOAD DATA GOOGLE SHEET
// ==========================

async function loadSpreadsheet(){

let url="https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&single=true&output=csv";

let response=await fetch(url);
let data=await response.text();

let rows=data.split("\n");

produk=[];

for(let i=1;i<rows.length;i++){

let row=rows[i].trim();
if(row==="") continue;

let col=row.split(",");

produk.push({

kode:col||"",
nama:col||"",
uom:col||"",
awal:parseInt(col[3])||0,
masuk:parseInt(col[4])||0,
keluar:parseInt(col[5])||0

});

}

tampilProduk();

}

// ==========================
// TAMPILKAN DATA PRODUK
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
// SEARCH PRODUK
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

document.getElementById("t
