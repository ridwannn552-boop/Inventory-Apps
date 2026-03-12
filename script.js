// NAVIGASI PAGE

function showPage(pageId){

let pages=document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

document.getElementById(pageId).classList.add("active");

}


// MASTER DATA PRODUK

let produk=[

{
kode:"N401-292",
nama:"3M Soft Sanding Sponge",
uom:"BOX",
awal:10,
masuk:0,
keluar:0
},

{
kode:"N826-139",
nama:"Aerox 800 T/U Sld Black",
uom:"KLG",
awal:20,
masuk:0,
keluar:0
},

{
kode:"N826-140",
nama:"Aerox 800 T/U Deep Black",
uom:"KLG",
awal:15,
masuk:0,
keluar:0
}

];


// TAMPILKAN DATA PRODUK

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


// PROSES BARCODE

function prosesBarcode(tipe){

let kode=document.getElementById("scanBarcode").value;
let qty=parseInt(document.getElementById("qty").value);

let item=produk.find(p => p.kode===kode);

if(!item){

document.getElementById("info").innerText="Produk tidak ditemukan";
return;

}

if(tipe==="masuk"){
item.masuk += qty;
}

if(tipe==="keluar"){
item.keluar += qty;
}

if(tipe==="so"){
item.awal = qty;
item.masuk = 0;
item.keluar = 0;
}

tampilProduk();

document.getElementById("info").innerText="Transaksi berhasil";

}


// DASHBOARD

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


// LOAD DATA

tampilProduk();
