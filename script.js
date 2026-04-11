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
let produkMaster = [];
let historyTransaksi = [];

let currentUser = null;
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
  setTimeout(()=> showPage("scanner"),500);
}

function logout(){
  localStorage.removeItem("userLogin");
  location.reload();
}

// ==========================
function toggleMenu(){
  document.querySelector(".sidebar").classList.toggle("active");
}

// ==========================
function setupRole(){
  document.getElementById("infoUser").innerText =
    currentUser.nama + " (" + currentUser.dept + ")";
}

// ==========================
function showPage(id){
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById(id).classList.add("active");

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
      kode: c[1].trim().toUpperCase(),
      nama: c[3]
    });
  }
}

// ==========================
// MODE DROPDOWN + WARNA
// ==========================
function changeMode(){
  const val = document.getElementById("modeSelect").value;
  modeTransaksi = val;

  const select = document.getElementById("modeSelect");

  if(val === "masuk"){
    select.style.background = "#1cc88a";
    select.style.color = "white";
  }
  else if(val === "keluar"){
    select.style.background = "#e74a3b";
    select.style.color = "white";
  }
  else{
    select.style.background = "#f6c23e";
    select.style.color = "black";
  }
}

// ==========================
// SCANNER FINAL + BEEP
// ==========================
function startScanner(){
  if(html5QrCode) return;

  html5QrCode = new Html5Qrcode("reader");

  html5QrCode.start(
    { facingMode:"environment"},
    { fps:10 },
    (text)=>{
      const clean = text.trim().toUpperCase();

      // 🔥 BEEP
      document.getElementById("beepSound").play();

      if(clean.startsWith("RAK")){
        currentRak = clean;
        document.getElementById("hasilScan").innerText="📍 "+clean;
        return;
      }

      const item = produkMaster.find(p=>p.kode===clean);

      if(!item){
        document.getElementById("hasilScan").innerText="❌ Tidak ditemukan";
        return;
      }

      lastKodeScan = item.kode;

      document.getElementById("scanBarcode").innerText=item.kode;
      document.getElementById("scanNama").innerText=item.nama;
      document.getElementById("qty").value=1;

      document.getElementById("hasilScan").innerText="✅ Siap input";
    }
  ).catch(err=>{
    alert("Kamera tidak bisa diakses!");
  });
}

function stopScanner(){
  if(html5QrCode){
    html5QrCode.stop().then(()=> html5QrCode=null);
  }
}

// ==========================
// SIMPAN FINAL + RESET MODE
// ==========================
async function simpanTransaksi(){
  try{
    const qty = parseInt(document.getElementById("qty").value);

    if(!lastKodeScan){
      alert("Scan dulu!");
      return;
    }

    if(!qty || qty <= 0){
      alert("Qty tidak valid!");
      return;
    }

    const payload = {
      type:"transaksi",
      tanggal:new Date().toISOString(),
      user:currentUser.nik,
      nama_user: currentUser.nama,
      dept: currentUser.dept,
      kode:lastKodeScan,
      jenis:modeTransaksi,
      qty:qty,
      rak:currentRak
    };

    const res = await fetch(URL_SCRIPT,{
      method:"POST",
      headers:{ "Content-Type":"application/json"},
      body:JSON.stringify(payload)
    });

    const text = await res.text();
    console.log("RESPON:", text);

    // FEEDBACK
    const status = document.getElementById("statusInfo");
    status.innerText = "✅ Data berhasil disimpan";
    status.style.color = "green";

    // RESET FORM
    lastKodeScan="";
    document.getElementById("scanBarcode").innerText="-";
    document.getElementById("scanNama").innerText="-";
    document.getElementById("qty").value="";

    // RESET MODE
    document.getElementById("modeSelect").value="masuk";
    changeMode();

    loadHistoryRealtime();

  }catch(err){
    console.error(err);
    document.getElementById("statusInfo").innerText="❌ Gagal simpan";
  }
}

// ==========================
async function loadHistoryRealtime(){
  const res = await fetch(URL_SCRIPT);
  const json = await res.json();

  historyTransaksi = json.data || [];

  let html="";
  historyTransaksi.forEach((h,i)=>{
    html+=`
    <tr>
      <td>${i+1}</td>
      <td>${h.tanggal}</td>
      <td>${h.user}</td>
      <td>${h.kode}</td>
      <td>${h.jenis}</td>
      <td>${h.qty}</td>
    </tr>`;
  });

  document.getElementById("dataHistory").innerHTML = html;
}

// ==========================
window.onload = async ()=>{
  const saved=localStorage.getItem("userLogin");

  if(saved){
    currentUser=JSON.parse(saved);
    document.getElementById("loginPage").style.display="none";
    document.getElementById("app").style.display="block";

    setupRole();
    setTimeout(()=> showPage("scanner"),800);
  }

  await loadData();
  loadHistoryRealtime();

  // set default mode
  setTimeout(()=> changeMode(),500);
};
