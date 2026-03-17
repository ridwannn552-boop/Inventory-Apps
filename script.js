const WEB_APP_URL="PASTE_URL_GOOGLE_SCRIPT";
const SHEET_URL="PASTE_LINK_CSV_GOOGLE_SHEET";

let historyTransaksi=[];
let currentUser="";
let modeTransaksi="masuk";

let produk=[
{kode:"A001",nama:"Item A"},
{kode:"A002",nama:"Item B"}
];

// LOGIN FIX
function login(){
let nik=document.getElementById("nik").value;
let pass=document.getElementById("password").value;

if(nik==="31332" && pass==="31332"){
currentUser=nik;
document.getElementById("loginPage").style.display="none";
document.getElementById("mainApp").style.display="block";

startScanner();
loadHistory();
}else{
alert("Login salah");
}
}

function logout(){
location.reload();
}

function showPage(id){
document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
document.getElementById(id).classList.add("active");
}

function setMode(m){
modeTransaksi=m;
}

// SCANNER
function startScanner(){
let scanner=new Html5QrcodeScanner("reader",{fps:10});

scanner.render(code=>{
let item=produk.find(p=>p.kode==code);

if(!item){
document.getElementById("hasilScan").innerText="Tidak ditemukan";
return;
}

document.getElementById("scanNama").innerText=item.nama;

simpan(item,1);
});
}

// SIMPAN CLOUD
function simpan(item,qty){

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
updateChart();
}

// LOAD HISTORY
async function loadHistory(){
let res=await fetch(SHEET_URL);
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
updateChart();
}

// TAMPIL
function tampilHistory(){
let t=document.getElementById("dataHistory");
t.innerHTML="";

let total=0;

historyTransaksi.forEach(h=>{
total+=parseInt(h.qty||0);

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

// CHART
function updateChart(){
let masuk=0, keluar=0;

historyTransaksi.forEach(h=>{
if(h.jenis==="masuk") masuk+=parseInt(h.qty||0);
if(h.jenis==="keluar") keluar+=parseInt(h.qty||0);
});

new Chart(document.getElementById("chart"),{
type:"bar",
data:{
labels:["Masuk","Keluar"],
datasets:[{data:[masuk,keluar]}]
}
});
}
