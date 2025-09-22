// ==========================
// Data Akun Login
// ==========================
const users = {
  "admin": { password: "1234", bagian: "Manajemen" },
  "gudang": { password: "gudang123", bagian: "Gudang" },
  "produksi": { password: "prod456", bagian: "Produksi" }
};

let currentUser = null;

function login() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (users[username] && users[username].password === password) {
    currentUser = { username, bagian: users[username].bagian };
    document.getElementById("loginPage").style.display = "none";
    document.getElementById("scannerPage").style.display = "flex";
    document.getElementById("userInfo").textContent = currentUser.username + " (" + currentUser.bagian + ")";
    startScanner();
  } else {
    document.getElementById("loginError").style.display = "block";
  }
}

// ==========================
// QR Scanner
// ==========================
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const tableBody = document.querySelector("#dataTable tbody");

let scanning = false;
const SCAN_DELAY = 30000; // ms (3 detik jeda antar scan)

// Data untuk tracking scan
const scannedData = {}; 
// format: { "kodeQR": { row: <tr>, count: 1/2 } }

function startScanner() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then((stream) => {
      video.srcObject = stream;
      video.setAttribute("playsinline", true);
      video.play();
      scanning = true;
      scanLoop();
    })
    .catch(() => {
      statusEl.innerText = "❌ Kamera tidak bisa diakses";
    });
}

function scanLoop() {
  if (!scanning) return;
  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);

    if (code) {
      addData(code.data);
      statusEl.innerText = "✅ QR Terdeteksi: " + code.data;
      scanning = false;
      setTimeout(() => {
        scanning = true;
        scanLoop();
      }, SCAN_DELAY);
    }
  }
  requestAnimationFrame(scanLoop);
}

// ==========================
// Tambah Data ke Dashboard
// ==========================
function addData(qrCode) {
  const now = new Date();
  const waktu = now.toLocaleString();

  if (!scannedData[qrCode]) {
    // Scan pertama → buat baris baru
    const row = document.createElement("tr");
    const cellCode = document.createElement("td");
    const cellMasuk = document.createElement("td");
    const cellSelesai = document.createElement("td");
    const cellBagian = document.createElement("td");

    cellCode.textContent = qrCode;
    cellMasuk.textContent = waktu;
    cellSelesai.textContent = "-";
    cellBagian.textContent = currentUser.bagian;

    row.appendChild(cellCode);
    row.appendChild(cellMasuk);
    row.appendChild(cellSelesai);
    row.appendChild(cellBagian);
    tableBody.prepend(row);

    scannedData[qrCode] = { row: row, count: 1 };
  } else {
    // Scan berikutnya
    if (scannedData[qrCode].count === 1) {
      // Scan kedua → isi kolom "Waktu Selesai"
      const row = scannedData[qrCode].row;
      row.cells[2].textContent = waktu;
      row.classList.add("completed"); // beri warna hijau
      scannedData[qrCode].count = 2;
    } else {
      // Lebih dari 2 kali → abaikan
      statusEl.innerText = "⚠️ QR " + qrCode + " sudah 2x discan, diabaikan.";
    }
  }
}
