// =========================
// JALANKAN SAAT HALAMAN SIAP
// =========================

document.addEventListener("DOMContentLoaded", function(){

showPage("dashboard");
tampilProduk();
buatGrafik();

});


// =========================
// NAVIGASI HALAMAN
// =========================

function showPage(pageId){

let pages = document.querySelectorAll(".page");

pages.forEach(function(page){
page.classList.remove("active");
});

let target = document.getElementById(pageId);

if(target){
target.classList.add("active");
}

}


// =========================
// DATA PRODUK
// =========================

let produk = [

{
kode:"N401-292",
nama:"3M Soft Sanding Sponge",
uom:"BOX",
awal:0,
masuk:0,
keluar:0
},

{
kode:"N826-139",
nama:"Aerox 800 T/U Sld Black",
uom:"KLG",
awal:0,
masuk:0,
keluar:0
},

{
kode:"N826-140",
nama:"Aerox 800 T/U Deep Black",
uom:"KLG",
awal:0,
masuk:0,
keluar:0
},

{
kode:"N653-989",
nama:"Air Hose Kinki Special",
uom:"MTR",
awal:0,
masuk:0,
keluar:0
}

];

function tampilProduk(){

let tabel = document.getElementById("dataProduk");

if(!tabel) return;

tabel.innerHTML="";

produk.forEach(function(item,index){

let akhir = item.awal + item.masuk - item.keluar;

let row = `
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

}


// =========================
// GRAFIK DASHBOARD
// =========================

function buatGrafik(){

let hari = ["Senin","Selasa","Rabu","Kamis","Jumat","Sabtu"];

let barangMasuk = [12,19,8,15,10,7];
let barangKeluar = [10,14,6,11,9,5];

let ctx1 = document.getElementById("grafikMasuk");

if(ctx1){
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
}

let ctx2 = document.getElementById("grafikKeluar");

if(ctx2){
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
}

}
