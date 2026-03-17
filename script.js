const WEB_APP_URL="PASTE_URL_GOOGLE_SCRIPT";

let produk=[];
let historyTransaksi=[];
let currentUser="";
let role="";
let modeTransaksi="masuk";

let beep=new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

// LOGIN
function login(){
currentUser=document.getElementById("username").value;
role=document.getElementById("role").value;

if(!currentUser) return alert("Isi username");

document.getElementById("loginPage").style.display="none";
document.getElementById("mainApp").style.display="block";

loadData();
startScanner();
loadHistory();
}

function logout(){
location.reload();
}

// NAVIGASI
function showPage(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");
}

// MODE
function setMode(mode){
modeTransaksi=mode;
}

// LOAD PRODUK (dummy / bisa diganti)
function loadData(){
produk=[
{kode:"A001",nama:"Item A",stok:10},
{kode:"A002",nama:"Item B",stok:5}
];
tampilProduk();
updateChart();
}

// TAMPIL PRODUK
function tampilProduk(){
let t=document.getElementById("dataProduk");
t.innerHTML="";
produk.forEach(p=>{
t.innerHTML+=`<tr>
<td>${p.kode}</td>
<td>${p.nama}</td>
<td>${p.stok}</td>
</tr>`;
});
}

// SCANNER
function startScanner(){
let scanner=new Html5QrcodeScanner("reader",{fps:10});

scanner.render(code=>{

beep.play();

let item=produk.find(p=>p.kode==code);

if(!item){
document.getElementById("hasilScan").innerText="Tidak ditemukan";
return;
}

document.getElementById("scanBarcode").innerText=item.kode;
document.getElementById("scanNama").innerText=item.nama;

simpanCloud(item,1);
});
}

// SIMPAN CLOUD
function simpanCloud(item,qty){

if(modeTransaksi==="masuk") item.stok+=qty;
if(modeTransaksi==="keluar") item.stok-=qty;

let data={
user:currentUser,
jenis:modeTransaksi,
kode:item.kode,
nama:item.nama,
qty:qty
};

fetch(WEB_APP_URL,{
method:"POST",
body:JSON.stringify(data)
});

historyTransaksi.push({
tanggal:new Date().toLocaleString(),
...data
});

tampilHistory();
tampilProduk();
updateChart();
}

// HISTORY
function tampilHistory(){
let t=document.getElementById("dataHistory");
t.innerHTML="";

let total=0;

historyTransaksi.forEach(h=>{
total+=h.qty;

t.innerHTML+=`<tr class="${h.jenis}">
<td>${h.tanggal}</td>
<td>${h.user}</td>
<td>${h.jenis}</td>
<td>${h.kode}</td>
<td>${h.nama}</td>
<td>${h.qty}</td>
</tr>`;
});

document.getElementById("totalHistory").innerText="Total: "+total;
}

// LOAD HISTORY DARI SHEET
async function loadHistory(){
let res=await fetch("LINK_CSV_GOOGLE_SHEET");
let text=await res.text();

let rows=text.split("\n");

for(let i=1;i<rows.length;i++){
let c=rows[i].split(",");

historyTransaksi.push({
tanggal:c[0],
user:c[1],
jenis:c[2],
kode:c[3],
nama:c[4],
qty:c[5]
});
}

tampilHistory();
}

// CHART
function updateChart(){
let masuk=0, keluar=0;

historyTransaksi.forEach(h=>{
if(h.jenis==="masuk") masuk+=parseInt(h.qty);
if(h.jenis==="keluar") keluar+=parseInt(h.qty);
});

new Chart(document.getElementById("chart"),{
type:"bar",
data:{
labels:["Masuk","Keluar"],
datasets:[{data:[masuk,keluar]}]
}
});
}

// EXPORT
function downloadExcel(){
let csv="Tanggal,User,Jenis,Kode,Nama,Qty\n";

historyTransaksi.forEach(h=>{
csv+=`${h.tanggal},${h.user},${h.jenis},${h.kode},${h.nama},${h.qty}\n`;
});

let blob=new Blob([csv]);
let a=document.createElement("a");
a.href=URL.createObjectURL(blob);
a.download="data.csv";
a.click();
}
