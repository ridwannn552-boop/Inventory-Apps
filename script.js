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



.produk-table{
width:100%;
border-collapse:collapse;
background:white;
}

.produk-table th{
background:#f2f2f2;
padding:10px;
border:1px solid #ccc;
text-align:center;
}

.produk-table td{
padding:8px;
border:1px solid #ccc;
text-align:center;
}

.produk-table tr:hover{
background:#f9f9f9;
}
