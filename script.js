// ==========================
// GLOBAL
// ==========================
let produk = [];
let produkMaster = [];
let historyTransaksi = [];
let historyFiltered = [];
let dataPengajuan = [];

let currentUser = "";
let currentRak = "";

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode = null;

const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzEHh3in4BFoFyREjL2vzzqWGK8GEHl1kjndJ0P7b-Oawwt3we1_K4VNM3-0d-cGiVI/exec";
const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

// ==========================
// LOGIN
// ==========================
function loginUser(){
  const nama = document.getElementById("loginNama").value.trim();
  if(!nama) return alert("Isi nama!");

  currentUser = nama;
  localStorage.setItem("userLogin", nama);

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").style.display = "block";
}

function logout(){
  localStorage.removeItem("userLogin");
  location.reload();
}

// ==========================
// NAVIGASI
// ==========================
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  document.querySelectorAll(".sidebar li").forEach(li => li.classList.remove("active"));
  if(el) el.classList.add("active");

  if(id === "scanner") startScanner();
  else stopScanner();
}

// ==========================
// LOAD MASTER
// ==========================
async function loadData(){
  const res = await fetch(URL_PRODUK);
  const text = await res.text();
  const rows = text.split("\n");

  produkMaster = [];

  for(let i=1;i<rows.length;i++){
    const c = rows[i].split(",");
    if(!c[1]) continue;

    produkMaster.push({
      kode: c[1],
      nama: c[3],
      awal: parseInt(c[5])||0
    });
  }

  hitungUlangProduk();
}

// ==========================
// REALTIME LOAD
// ==========================
async function loadHistoryRealtime(){
  const res = await fetch(URL_SCRIPT);
  const json = await res.json();

  historyTransaksi = json.data || [];
  historyFiltered = [...historyTransaksi].reverse();

  hitungUlangProduk();
  tampilHistory();
}

// ==========================
// AUTO SYNC
// ==========================
setInterval(()=>{
  loadHistoryRealtime();
  loadPengajuan();
},3000);

// ==========================
// HITUNG STOK
// ==========================
function hitungUlangProduk(){
  produk = JSON.parse(JSON.stringify(produkMaster));

  produk.forEach(p=>{
    p.masuk=0; p.keluar=0; p.akhir=p.awal;
  });

  historyTransaksi.forEach(h=>{
    const item = produk.find(p=>p.kode===h.kode);
    if(!item) return;

    if(h.jenis==="masuk"){ item.masuk+=h.qty; item.akhir+=h.qty;}
    if(h.jenis==="keluar"){ item.keluar+=h.qty; item.akhir-=h.qty;}
    if(h.jenis==="so"){ item.akhir=h.qty;}
  });

  tampilProduk();
}

// ==========================
// TAMPIL PRODUK
// ==========================
function tampilProduk(){
  const t = document.getElementById("dataProduk");
  let html="";

  produk.forEach((p,i)=>{
    const warna = p.akhir < 5 ? "style='color:red;font-weight:bold'" : "";

    html+=`
    <tr>
      <td>${i+1}</td>
      <td>${p.kode}</td>
      <td>${p.nama}</td>
      <td>${p.awal}</td>
      <td>${p.masuk}</td>
      <td>${p.keluar}</td>
      <td ${warna}>${p.akhir}</td>
    </tr>`;
  });

  t.innerHTML=html;
}

// ==========================
// SCANNER
// ==========================
function startScanner(){
  if(html5QrCode) return;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode:"environment"},
    { fps:10 },
    (text)=>{
      const clean = text.trim().toUpperCase();

      if(clean.startsWith("RAK")){
        currentRak = clean;
        document.getElementById("hasilScan").innerText="Rak: "+clean;
        return;
      }

      const item = produkMaster.find(p=>p.kode===clean);
      if(!item) return;

      lastKodeScan = item.kode;

      document.getElementById("scanBarcode").innerText=item.kode;
      document.getElementById("scanNama").innerText=item.nama;
      document.getElementById("qty").value=1;
    }
  );
}

function stopScanner(){
  if(html5QrCode){
    html5QrCode.stop();
    html5QrCode=null;
  }
}

// ==========================
// SIMPAN TRANSAKSI
// ==========================
async function simpanTransaksi(){
  const qty = parseInt(document.getElementById("qty").value);

  const item = produkMaster.find(p=>p.kode===lastKodeScan);
  if(!item) return alert("Scan dulu");

  await fetch(URL_SCRIPT,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify({
      type:"transaksi",
      tanggal:new Date().toISOString(),
      user:currentUser,
      kode:item.kode,
      nama:item.nama,
      jenis:modeTransaksi,
      qty:qty,
      rak:currentRak
    })
  });

  loadHistoryRealtime();
  alert("Tersimpan");
}

// ==========================
// MODE
// ==========================
function setMode(mode){
  modeTransaksi=mode;
}

// ==========================
// HISTORY
// ==========================
function tampilHistory(){
  const t = document.getElementById("dataHistory");
  let html="";

  historyFiltered.forEach((h,i)=>{
    html+=`
    <tr>
      <td>${i+1}</td>
      <td>${h.tanggal}</td>
      <td>${h.user||"-"}</td>
      <td>${h.kode}</td>
      <td>${h.nama}</td>
      <td>${h.jenis}</td>
      <td>${h.qty}</td>
    </tr>`;
  });

  t.innerHTML=html;
}

// ==========================
// PENGAJUAN
// ==========================
async function kirimPengajuan(){
  const kode=document.getElementById("pengajuanKode").value;
  const qty=parseInt(document.getElementById("pengajuanQty").value);

  await fetch(URL_SCRIPT,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify({
      type:"pengajuan",
      tanggal:new Date().toISOString(),
      user:currentUser,
      kode:kode,
      qty:qty,
      status:"pending"
    })
  });

  loadPengajuan();
}

async function loadPengajuan(){
  const res = await fetch(URL_SCRIPT+"?type=pengajuan");
  const json = await res.json();

  dataPengajuan = json.data||[];
  tampilPengajuan();
}

function tampilPengajuan(){
  const t = document.getElementById("dataPengajuan");
  let html="";

  dataPengajuan.forEach((p,i)=>{
    html+=`
    <tr>
      <td>${i+1}</td>
      <td>${p.user}</td>
      <td>${p.kode}</td>
      <td>${p.qty}</td>
      <td>${p.status}</td>
      <td>
        <button onclick="approvePengajuan(${i})">✔</button>
        <button onclick="rejectPengajuan(${i})">✖</button>
      </td>
    </tr>`;
  });

  t.innerHTML=html;
}

async function approvePengajuan(i){
  const p=dataPengajuan[i];

  await fetch(URL_SCRIPT,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify({ type:"approve", ...p })
  });

  loadPengajuan();
  loadHistoryRealtime();
}

async function rejectPengajuan(i){
  const p=dataPengajuan[i];

  await fetch(URL_SCRIPT,{
    method:"POST",
    headers:{ "Content-Type":"application/json"},
    body:JSON.stringify({ type:"reject", ...p })
  });

  loadPengajuan();
}

// ==========================
// DOWNLOAD
// ==========================
function downloadMingguan(){
  const last7=new Date();
  last7.setDate(last7.getDate()-7);

  const data=historyTransaksi.filter(x=>new Date(x.tanggal)>=last7);
  exportCSV(data,"mingguan.csv");
}

function downloadBulanan(){
  const now=new Date();

  const data=historyTransaksi.filter(x=>{
    const t=new Date(x.tanggal);
    return t.getMonth()==now.getMonth();
  });

  exportCSV(data,"bulanan.csv");
}

function exportCSV(data,name){
  let csv="Tanggal,User,Kode,Nama,Jenis,Qty\n";

  data.forEach(d=>{
    csv+=`${d.tanggal},${d.user},${d.kode},${d.nama},${d.jenis},${d.qty}\n`;
  });

  const blob=new Blob([csv]);
  const url=URL.createObjectURL(blob);

  const a=document.createElement("a");
  a.href=url;
  a.download=name;
  a.click();
}

// ==========================
// INIT
// ==========================
window.onload = async ()=>{
  const saved=localStorage.getItem("userLogin");

  if(saved){
    currentUser=saved;
    document.getElementById("loginPage").style.display="none";
    document.getElementById("app").style.display="block";
  }

  await loadData();
  await loadHistoryRealtime();
  loadPengajuan();
};
