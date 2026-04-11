// ==========================
// DATA USER (LOGIN NIK)
// ==========================
const USERS = [
  { nik: "1001", password: "admin123", role: "admin", nama: "ADMIN", dept: "ALL" },
  { nik: "2001", password: "123", role: "leader", nama: "Agus Riyadi", dept: "METAL" },
  { nik: "2002", password: "123", role: "leader", nama: "Maryanto", dept: "PLASTIK" },
  { nik: "2003", password: "123", role: "leader", nama: "Aprianto H", dept: "BUFFING" },
  { nik: "2004", password: "123", role: "leader", nama: "Nazmudin", dept: "MUFFLER" }
];

// ==========================
// GLOBAL
// ==========================
let produk = [];
let produkMaster = [];
let historyTransaksi = [];
let historyFiltered = [];
let dataPengajuan = [];

let currentUser = null;
let currentRak = "";

let lastKodeScan = "";
let modeTransaksi = "masuk";

let html5QrCode = null;

// URL
const URL_SCRIPT = "https://script.google.com/macros/s/AKfycbzEHh3in4BFoFyREjL2vzzqWGK8GEHl1kjndJ0P7b-Oawwt3we1_K4VNM3-0d-cGiVI/exec";
const URL_PRODUK = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlrUlVGMOqlghX6Om6VHO4cLyearbJSFaB804y8BJcfZUUGzecK0RpQRwnofRhGDNjHuh4SWaqkCYZ/pub?gid=0&output=csv";

// ==========================
// LOGIN
// ==========================
function loginUser(){
  const nik = document.getElementById("nik").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = USERS.find(u => u.nik === nik && u.password === password);

  if(!user){
    alert("NIK / Password salah!");
    return;
  }

  currentUser = user;
  localStorage.setItem("userLogin", JSON.stringify(user));

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").style.display = "block";

  setupRole();

  // 🔥 AUTO MASUK SCANNER
  setTimeout(()=>{
    showPage("scanner");
  },500);
}

function logout(){
  localStorage.removeItem("userLogin");
  location.reload();
}

// ==========================
// MENU MOBILE FIX
// ==========================
function toggleMenu(){
  document.querySelector(".sidebar").classList.toggle("active");
}

// ==========================
// ROLE
// ==========================
function setupRole(){
  const isAdmin = currentUser.role === "admin";

  document.querySelectorAll(".sidebar li").forEach(li=>{
    const text = li.innerText.toLowerCase();

    if(!isAdmin){
      if(!text.includes("dashboard") && !text.includes("pengajuan") && !text.includes("history")){
        li.style.display = "none";
      }
    }
  });

  // tampil nama user
  const info = document.getElementById("infoUser");
  if(info){
    info.innerText = currentUser.nama + " (" + currentUser.dept + ")";
  }
}

// ==========================
// NAVIGASI
// ==========================
function showPage(id, el){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

  if(id === "scanner") startScanner();
  else stopScanner();
}

// ==========================
// LOAD DATA
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
// REALTIME
// ==========================
async function loadHistoryRealtime(){
  const res = await fetch(URL_SCRIPT);
  const json = await res.json();

  historyTransaksi = json.data || [];

  if(currentUser.role !== "admin"){
    historyTransaksi = historyTransaksi.filter(h => h.user === currentUser.nik);
  }

  historyFiltered = [...historyTransaksi].reverse();

  hitungUlangProduk();
  tampilHistory();
}

// ==========================
// AUTO SYNC
// ==========================
setInterval(()=>{
  if(currentUser){
    loadHistoryRealtime();
    loadPengajuan();
  }
},3000);

// ==========================
// SCANNER FIX TOTAL
// ==========================
function startScanner(){
  if(html5QrCode) return;

  console.log("START SCANNER");

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode:"environment"},
    { fps:10 },
    (text)=>{
      console.log("SCAN:", text);

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
    },
    (err)=>{
      console.log("SCAN ERROR:", err);
    }
  ).catch(err=>{
    console.error("GAGAL CAMERA:", err);
    alert("Kamera tidak bisa diakses!");
  });
}

function stopScanner(){
  if(html5QrCode){
    html5QrCode.stop().then(()=>{
      html5QrCode=null;
    });
  }
}

// ==========================
// SIMPAN
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
      user:currentUser.nik,
      nama_user: currentUser.nama,
      dept: currentUser.dept,
      kode:item.kode,
      nama:item.nama,
      jenis:modeTransaksi,
      qty:qty,
      rak:currentRak
    })
  });

  alert("Tersimpan");
  loadHistoryRealtime();
}

// ==========================
// INIT
// ==========================
window.onload = async ()=>{
  const saved=localStorage.getItem("userLogin");

  if(saved){
    currentUser=JSON.parse(saved);
    document.getElementById("loginPage").style.display="none";
    document.getElementById("app").style.display="block";

    setupRole();

    // 🔥 AUTO START SCAN
    setTimeout(()=>{
      showPage("scanner");
    },800);
  }

  await loadData();
  await loadHistoryRealtime();
  loadPengajuan();
};
