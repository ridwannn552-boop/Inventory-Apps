// ==========================
// VARIABLE GLOBAL
// ==========================
let currentUser = null;
let currentRak = "";
let lastKodeScan = "";
let modeTransaksi = "masuk";
let html5QrCode = null;

// ==========================
// LOGIN
// ==========================
function loginUser() {
  const nik = document.getElementById("nik").value.trim();
  const password = document.getElementById("password").value.trim();

  const user = USERS.find(u => u.nik === nik && u.password === password);

  if (!user) {
    alert("NIK / Password salah!");
    return;
  }

  currentUser = user;
  localStorage.setItem("userLogin", JSON.stringify(user));

  document.getElementById("loginPage").style.display = "none";
  document.getElementById("app").style.display = "block";

  setupRole();
  loadData();
  setTimeout(() => showPage("scanner"), 500);
}

function logout() {
  localStorage.removeItem("userLogin");
  location.reload();
}

// ==========================
// MENU / ROLE
// ==========================
function toggleMenu() {
  document.querySelector(".sidebar").classList.toggle("active");
}

function setupRole() {
  if (!currentUser) return;
  document.getElementById("infoUser").innerText =
    `${currentUser.nama} (${currentUser.dept})`;
}

// ==========================
// NAVIGASI HALAMAN
// ==========================
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  if (id === "scanner") {
    startScanner();
  } else {
    stopScanner();
  }
}

// ==========================
// LOAD DATA PRODUK
// ==========================
async function loadData() {
  try {
    const res = await fetch(URL_PRODUK);
    const text = await res.text();
    const rows = text.split("\n");

    produkMaster = [];

    for (let i = 1; i < rows.length; i++) {
      const c = rows[i].split(",");
      if (!c[1]) continue;

      produkMaster.push({
        kode: c[1].trim().toUpperCase(),
        nama: (c[3] || "").trim()
      });
    }

    console.log("Data produk berhasil dimuat:", produkMaster.length);
  } catch (error) {
    console.error("Gagal load data produk:", error);
    alert("Gagal memuat data produk.");
  }
}

// ==========================
// MODE TRANSAKSI
// ==========================
function changeMode() {
  const val = document.getElementById("modeSelect").value;
  modeTransaksi = val;
}

// ==========================
// SCANNER
// ==========================
async function startScanner() {
  try {
    if (html5QrCode) return;

    html5QrCode = new Html5Qrcode("reader");

    await html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10 },
      (text) => {
        const clean = text.trim().toUpperCase();

        const beep = document.getElementById("beepSound");
        if (beep) beep.play();

        if (clean.startsWith("RAK")) {
          currentRak = clean;
          document.getElementById("hasilScan").innerText = "📍 " + clean;
          return;
        }

        const item = produkMaster.find(p => p.kode === clean);

        if (!item) {
          document.getElementById("hasilScan").innerText = "❌ Tidak ditemukan";
          return;
        }

        lastKodeScan = item.kode;
        document.getElementById("scanBarcode").innerText = item.kode;
        document.getElementById("scanNama").innerText = item.nama;
        document.getElementById("qty").value = 1;
        document.getElementById("hasilScan").innerText = "✅ Siap input";
      }
    );
  } catch (err) {
    console.error("Kamera error:", err);
    alert("Kamera error!");
  }
}

async function stopScanner() {
  try {
    if (html5QrCode) {
      await html5QrCode.stop();
      html5QrCode = null;
    }
  } catch (err) {
    console.error("Gagal menghentikan scanner:", err);
  }
}

// ==========================
// SIMPAN TRANSAKSI
// ==========================
async function simpanTransaksi() {
  try {
    if (!currentUser) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const qty = parseInt(document.getElementById("qty").value);

    if (!lastKodeScan) {
      alert("Silakan scan barang terlebih dahulu!");
      return;
    }

    if (!qty || qty <= 0) {
      alert("Qty tidak valid!");
      return;
    }

    const payload = {
      tanggal: new Date().toISOString(),
      user: currentUser.nik,
      nama_user: currentUser.nama,
      dept: currentUser.dept,
      kode: lastKodeScan,
      jenis: modeTransaksi,
      qty: qty,
      rak: currentRak
    };

    console.log("KIRIM:", payload);

    await fetch(URL_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    document.getElementById("statusInfo").innerText = "✅ Data terkirim.";
    document.getElementById("statusInfo").style.color = "green";

    lastKodeScan = "";
    document.getElementById("scanBarcode").innerText = "-";
    document.getElementById("scanNama").innerText = "-";
    document.getElementById("qty").value = "";
  } catch (err) {
    console.error("ERROR:", err);
    document.getElementById("statusInfo").innerText = "❌ Gagal kirim data.";
    document.getElementById("statusInfo").style.color = "red";
  }
}

// ==========================
// INIT
// ==========================
window.onload = async () => {
  const saved = localStorage.getItem("userLogin");

  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("app").style.display = "block";
    setupRole();
    setTimeout(() => showPage("scanner"), 800);
  }

  await loadData();
  changeMode();
};
