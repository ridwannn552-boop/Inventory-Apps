// =========================
// NAVIGASI HALAMAN
// =========================

function showPage(pageId){

let pages=document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

document.getElementById(pageId).classList.add("active");

}

document.getElementById("dashboard").classList.add("active");



// =========================
// DATA GRAFIK DASHBOARD
// =========================

let hari = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

let barangMasuk = [12,19,8,15,10,7];
let barangKeluar = [10,14,6,11,9,5];


// GRAFIK BARANG MASUK

let ctx1 = document.getElementById('grafikMasuk');

new Chart(ctx1,{
type:'bar',
data:{
labels:hari,
datasets:[{
label:'Barang Masuk',
data:barangMasuk
}]
}
});


// GRAFIK BARANG KELUAR

let ctx2 = document.getElementById('grafikKeluar');

new Chart(ctx2,{
type:'line',
data:{
labels:hari,
datasets:[{
label:'Barang Keluar',
data:barangKeluar
}]
}
});



// =========================
// DATABASE PRODUK
// =========================

let produk = [

{
kode:"N401-292",
nama:"3M Soft Sanding Sponge",
uom:"BOX",
stok:0
},

{
kode:"N826-139",
nama:"Aerox 800 T/U Sld Black",
uom:"KLG",
stok:0
},

{
kode:"N826-140",
nama:"Aerox 800 T/U Deep Black",
uom:"KLG",
stok:0
},

{
kode:"N653-989",
nama:"Air Hose Kinki Special",
uom:"MTR",
stok:0
}

];



// =========================
// TAMPILKAN DATA PRODUK
// =========================

function tampilProduk(){

let table = document.getElementById("produkTable");

if(!table) return;

table.innerHTML="";

produk.forEach(function(item){

table.innerHTML += `
<tr>
<td>${item.kode}</td>
<td>${item.nama}</td>
<td>${item.uom}</td>
<td>${item.stok}</td>
</tr>
`;

});

}



// =========================
// JALANKAN SAAT SISTEM DIBUKA
// =========================

window.onload=function(){

tampilProduk();

};
