
// LOGIKA PEMBAYARAN, TIMER & PROMO NOMINAL
// let baseTotal = 895000;
let isPromoApplied = false;
let countdownInterval = null;

// Data tiket yang akan disimpan
let currentTicketData = {
    bookingCode: '',
    eventName: 'Soundrenaline 2026',
    eventDate: '12-13 Feb 2026',
    eventLocation: 'GWK, Bali',
    ticketType: 'VIP - 2 Days',
    quantity: 1,
    originalPrice: 800000,
    serviceFee: 15000,
    tax: 80000,
    totalAmount: 895000,
    paymentMethod: 'Transfer Bank',
    paymentChannel: 'BCA',
    status: 'pending',
    purchaseDate: '',
    purchaseTime: '',
    promoCode: null,
    discountAmount: 0
};

document.addEventListener("DOMContentLoaded", function () {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const paymentGroups = document.querySelectorAll('.payment-group');
    const instructionBox = document.getElementById('instructionBox');
    
    // Ambil data dari URL parameter jika ada (dari order-items)
    const urlParams = new URLSearchParams(window.location.search);
    const eventId = urlParams.get('id');
    if (eventId) {
        loadEventData(eventId);
    }
    
    // Generate kode booking unik
    generateBookingCode();
    
    // Set tanggal pembelian
    const now = new Date();
    currentTicketData.purchaseDate = now.toLocaleDateString('id-ID');
    currentTicketData.purchaseTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    currentTicketData.totalAmount = baseTotal;
    
    // Database lengkap instruksi
    const instructions = {
        // Transfer Bank
        'BCA': `<h4><i class="fi fi-rr-info"></i> Cara Transfer BCA</h4>
                <ol>
                    <li>Login ke BCA Mobile / myBCA.</li>
                    <li>Pilih menu <strong>Transfer > ke BCA</strong>.</li>
                    <li>Masukkan nomor rekening: <strong>1234-5678-910</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                    <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong> (unik, jangan dibulatkan).</li>
                    <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                </ol>`,
        'BNI': `<h4><i class="fi fi-rr-info"></i> Cara Transfer BNI</h4>
                <ol>
                    <li>Login ke BNI Mobile Banking.</li>
                    <li>Pilih menu <strong>Transfer > ke Rekening BNI</strong>.</li>
                    <li>Masukkan nomor rekening: <strong>8888-7777-6666</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                    <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong>.</li>
                    <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                </ol>`,
        'Mandiri': `<h4><i class="fi fi-rr-info"></i> Cara Transfer Mandiri</h4>
                    <ol>
                        <li>Login ke Livin' by Mandiri.</li>
                        <li>Pilih menu <strong>Transfer > ke Mandiri</strong>.</li>
                        <li>Masukkan nomor rekening: <strong>5555-4444-3333</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                        <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong>.</li>
                        <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                    </ol>`,
        
        // E-Wallet
        'GoPay': `<h4><i class="fi fi-rr-info"></i> Cara Bayar GoPay</h4>
                  <ol>
                      <li>Buka aplikasi Gojek.</li>
                      <li>Klik <strong>Bayar</strong> dan scan QR atau pilih dari galeri.</li>
                      <li>Konfirmasi nominal dan masukkan PIN GoPay.</li>
                      <li>Simpan bukti pembayaran, lalu klik "Konfirmasi Pembayaran".</li>
                  </ol>`,
        'OVO': `<h4><i class="fi fi-rr-info"></i> Cara Bayar OVO</h4>
                <ol>
                    <li>Buka aplikasi OVO.</li>
                    <li>Pilih menu <strong>Bayar</strong>.</li>
                    <li>Scan QR Code yang ditampilkan.</li>
                    <li>Masukkan PIN OVO untuk konfirmasi.</li>
                </ol>`,
        'DANA': `<h4><i class="fi fi-rr-info"></i> Cara Bayar DANA</h4>
                 <ol>
                     <li>Buka aplikasi DANA.</li>
                     <li>Pilih <strong>Bayar</strong> dan scan QR Code.</li>
                     <li>Konfirmasi pembayaran dengan PIN DANA.</li>
                 </ol>`,
        'ShopeePay': `<h4><i class="fi fi-rr-info"></i> Cara Bayar ShopeePay</h4>
                      <ol>
                          <li>Buka aplikasi Shopee.</li>
                          <li>Pilih menu <strong>ShopeePay > Bayar</strong>.</li>
                          <li>Scan QR Code.</li>
                          <li>Masukkan PIN ShopeePay.</li>
                      </ol>`,
        
        // Kartu Kredit
        'Visa': `<h4><i class="fi fi-rr-info"></i> Cara Transfer Visa</h4>
                 <ol>
                     <li>Login ke Visa.</li>
                     <li>Pilih menu <strong>Transfer > ke Visa</strong>.</li>
                     <li>Masukkan nomor rekening: <strong>1234-5678-910</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                     <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong> (unik, jangan dibulatkan).</li>
                     <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                 </ol>`,
        'Mastercard': `<h4><i class="fi fi-rr-info"></i> Kartu Kredit Mastercard</h4>
                       <p style="color: var(--text-muted); font-size: 0.95rem;">Anda akan diarahkan ke halaman pembayaran aman (3D Secure) setelah mengklik tombol Bayar Sekarang.</p>`,
        'JCB': `<h4><i class="fi fi-rr-info"></i> Kartu Kredit JCB</h4>
                <p style="color: var(--text-muted); font-size: 0.95rem;">Anda akan diarahkan ke halaman pembayaran aman (3D Secure) setelah mengklik tombol Bayar Sekarang.</p>`,
        
        // Virtual Account
        'BCA VA': `<h4><i class="fi fi-rr-info"></i> Virtual Account BCA</h4>
                   <ol>
                       <li>Login ke m-banking BCA Anda.</li>
                       <li>Pilih menu <strong>Transfer > Virtual Account</strong>.</li>
                       <li>Masukkan nomor VA: <strong>88000-123456789</strong>.</li>
                       <li>Tagihan otomatis terverifikasi dalam 5 menit.</li>
                   </ol>`,
        'BRIVA': `<h4><i class="fi fi-rr-info"></i> Virtual Account BRI</h4>
                  <ol>
                      <li>Login ke BRImo.</li>
                      <li>Pilih menu <strong>Pembayaran > Virtual Account</strong>.</li>
                      <li>Masukkan nomor VA: <strong>88888-987654321</strong>.</li>
                      <li>Konfirmasi pembayaran.</li>
                  </ol>`,
        'Mandiri VA': `<h4><i class="fi fi-rr-info"></i> Virtual Account Mandiri</h4>
                       <ol>
                           <li>Login ke Livin' by Mandiri.</li>
                           <li>Pilih menu <strong>Bayar > Virtual Account</strong>.</li>
                           <li>Masukkan nomor VA: <strong>77777-555544433</strong>.</li>
                           <li>Selesaikan pembayaran.</li>
                       </ol>`,
        
        // QRIS
        'QRIS Standard': `<h4><i class="fi fi-rr-info"></i> Bayar Pakai QRIS</h4>
                          <ol>
                              <li>Buka aplikasi pendukung pembayaran QRIS Anda (seperti m-banking, Flip, atau e-wallet lainnya).</li>
                              <li>Pilih fitur <strong>Scan QR</strong>.</li>
                              <li>Pindai QR Code yang akan ditampilkan di halaman berikutnya.</li>
                              <li>Masukkan PIN rahasia Anda untuk mengonfirmasi transaksi.</li>
                          </ol>`
    };

    // Fungsi 1: Saat Kategori Utama Diklik
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            paymentGroups.forEach(group => group.style.display = 'none');
            
            const targetId = 'opt-' + this.getAttribute('data-target');
            document.getElementById(targetId).style.display = 'grid';

            document.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('active'));
            instructionBox.innerHTML = `<h4><i class="fi fi-rr-info"></i> Menunggu Pilihan</h4>
                                        <p style="color: var(--text-muted); font-size: 0.95rem;">Pilih salah satu metode di atas.</p>`;
            
            // Simpan metode pembayaran utama
            currentTicketData.paymentMethod = this.textContent.trim();
        });
    });

    // Saat Opsi Pembayaran Diklik
    const bankBtns = document.querySelectorAll('.bank-btn');
    bankBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const parentGroup = this.closest('.payment-group');
            parentGroup.querySelectorAll('.bank-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const paymentName = this.textContent.trim();
            
            // Simpan channel pembayaran
            currentTicketData.paymentChannel = paymentName;
            
            // Tampilkan instruksi
            if(instructions[paymentName]) {
                instructionBox.innerHTML = instructions[paymentName];
            } else {
                instructionBox.innerHTML = `<h4><i class="fi fi-rr-info"></i> Pembayaran via ${paymentName}</h4>
                <p style="color: var(--text-muted); font-size: 0.95rem;">Selesaikan pembayaran melalui aplikasi ${paymentName} Anda dan pastikan nominalnya sesuai dengan tagihan.</p>`;
            }
        });
    });
    
    // Set default BCA
    const defaultBankBtn = document.querySelector('#opt-transfer .bank-btn');
    if(defaultBankBtn) {
        defaultBankBtn.click();
        currentTicketData.paymentMethod = 'Transfer Bank';
        currentTicketData.paymentChannel = 'BCA';
    }

    // Jalankan Timer
    startCountdown(15 * 60);
    
    // Tentukan Waktu Kadaluarsa
    setExpirationTime();
});

// Load data event dari URL parameter
function loadEventData(eventId) {
    const eventData = {
        'soundrenaline2026': {
            name: 'Soundrenaline 2026: The Next Level',
            date: '12-13 Feb 2026',
            location: 'GWK, Bali',
            ticketType: 'VIP - 2 Days',
            price: 800000
        },
        'liga2026': {
            name: 'Piala Liga Indonesia 2026',
            date: '18 Jan 2026',
            location: 'Stadion GBLA, Bandung',
            ticketType: 'VIP',
            price: 75000
        }
    };
    
    if (eventData[eventId]) {
        const data = eventData[eventId];
        currentTicketData.eventName = data.name;
        currentTicketData.eventDate = data.date;
        currentTicketData.eventLocation = data.location;
        currentTicketData.ticketType = data.ticketType;
        currentTicketData.originalPrice = data.price;
        
        // Update UI
        document.getElementById('eventName').textContent = data.name;
        document.getElementById('eventDetail').innerHTML = `${data.date}<br>${data.location}`;
        document.getElementById('ticketPrice').textContent = formatRupiah(data.price);
        
        // Recalculate total
        const serviceFee = Math.round(data.price * 0.01875);
        const tax = Math.round(data.price * 0.1);
        currentTicketData.serviceFee = serviceFee;
        currentTicketData.tax = tax;
        baseTotal = data.price + serviceFee + tax;
        currentTicketData.totalAmount = baseTotal;
        
        document.getElementById('serviceFee').textContent = formatRupiah(serviceFee);
        document.getElementById('tax').textContent = formatRupiah(tax);
        document.getElementById('finalTotal').textContent = formatRupiah(baseTotal);
    }
}

// Generate kode booking unik
function generateBookingCode() {
    const prefix = 'TKT';
    const date = new Date();
    const timestamp = date.getTime().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    currentTicketData.bookingCode = `${prefix}${timestamp}${random}`;
}

// Timer countdown
function startCountdown(durationInSeconds) {
    let timer = durationInSeconds;
    const display = document.getElementById('countdownDisplay');

    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(function () {
        let minutes = parseInt(timer / 60, 10);
        let seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(countdownInterval);
            display.textContent = "00:00";
            
            // Update status tiket menjadi expired
            if (currentTicketData.status === 'pending') {
                currentTicketData.status = 'expired';
                saveTicketToLocalStorage();
            }
            
            alert("Waktu pembayaran telah habis. Pesanan dibatalkan otomatis.");
            window.location.href = "../pages/honepage.html";
        }
    }, 1000);
}

function setExpirationTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 15);
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    const expireElement = document.getElementById('expireTime');
    if(expireElement) {
        expireElement.textContent = `${hours}:${minutes}`;
    }
}

// Simpan tiket ke localStorage
function saveTicketToLocalStorage() {
    let existingTickets = localStorage.getItem('userTickets');
    let tickets = existingTickets ? JSON.parse(existingTickets) : [];
    
    // Update purchase time
    const now = new Date();
    currentTicketData.purchaseTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Cek apakah tiket dengan kode yang sama sudah ada
    const existingIndex = tickets.findIndex(t => t.bookingCode === currentTicketData.bookingCode);
    if (existingIndex !== -1) {
        tickets[existingIndex] = { ...currentTicketData };
    } else {
        tickets.unshift({ ...currentTicketData });
    }
    
    localStorage.setItem('userTickets', JSON.stringify(tickets));
    
    // Trigger event untuk halaman lain yang mendengarkan
    window.dispatchEvent(new CustomEvent('ticketSaved', { detail: currentTicketData }));
}

// Fungsi promo nominal
function applyNominalPromo() {
    const codeInput = document.getElementById('promoCodeInput').value.trim().toUpperCase();
    
    if (isPromoApplied) {
        alert("Anda sudah menggunakan kode promo.");
        return;
    }

    let discountAmount = 0;

    if (codeInput === 'BCA50K') {
        discountAmount = 50000;
    } else if (codeInput === 'POTONG100') {
        discountAmount = 100000;
    } else {
        alert("Kode promo tidak valid atau sudah kadaluarsa.");
        return;
    }

    isPromoApplied = true;
    let newTotal = baseTotal - discountAmount;
    currentTicketData.totalAmount = newTotal;
    currentTicketData.promoCode = codeInput;
    currentTicketData.discountAmount = discountAmount;

    const promoRow = document.getElementById('promoRow');
    if(promoRow) promoRow.style.display = 'flex';
    const promoAmount = document.getElementById('promoAmount');
    if(promoAmount) promoAmount.textContent = '- ' + formatRupiah(discountAmount);
    const finalTotal = document.getElementById('finalTotal');
    if(finalTotal) {
        finalTotal.textContent = formatRupiah(newTotal);
        finalTotal.style.color = '#10b981';
    }
    
    // Update instruksi dengan nominal baru jika perlu
    updateInstructionsWithNewTotal();
    
    alert(`Berhasil! Anda mendapat potongan harga sebesar ${formatRupiah(discountAmount)}.`);
}

// Update instruksi dengan total baru
function updateInstructionsWithNewTotal() {
    const activeBankBtn = document.querySelector('.bank-btn.active');
    if (activeBankBtn) {
        const paymentName = activeBankBtn.textContent.trim();
        const instructionBox = document.getElementById('instructionBox');
        
        const instructions = {
            'BCA': `<h4><i class="fi fi-rr-info"></i> Cara Transfer BCA</h4>
                    <ol>
                        <li>Login ke BCA Mobile / myBCA.</li>
                        <li>Pilih menu <strong>Transfer > ke BCA</strong>.</li>
                        <li>Masukkan nomor rekening: <strong>1234-5678-910</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                        <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong> (unik, jangan dibulatkan).</li>
                        <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                    </ol>`,
            'Visa': `<h4><i class="fi fi-rr-info"></i> Cara Transfer Visa</h4>
                     <ol>
                         <li>Login ke Visa.</li>
                         <li>Pilih menu <strong>Transfer > ke Visa</strong>.</li>
                         <li>Masukkan nomor rekening: <strong>1234-5678-910</strong> a.n. <strong>Tiket Kita Indonesia</strong>.</li>
                         <li>Nominal tepat: <strong class="highlight-text">${formatRupiah(currentTicketData.totalAmount)}</strong> (unik, jangan dibulatkan).</li>
                         <li>Simpan bukti transfer, lalu klik "Konfirmasi Pembayaran".</li>
                     </ol>`
        };
        
        if (instructions[paymentName]) {
            instructionBox.innerHTML = instructions[paymentName];
        }
    }
}

// Konfirmasi pembayaran
function confirmPayment() {
    const btn = document.querySelector('.btn-pay-now');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fi fi-rr-loading"></i> Memverifikasi...';
    btn.disabled = true;

    // Update status tiket menjadi paid
    currentTicketData.status = 'paid';
    
    // Update waktu pembayaran
    const now = new Date();
    currentTicketData.paymentTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    // Simpan tiket ke localStorage
    saveTicketToLocalStorage();
    
    // Hentikan timer
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }

    setTimeout(() => {
        alert(`Pembayaran Berhasil Dikonfirmasi!\n\nKode Booking: ${currentTicketData.bookingCode}\nEvent: ${currentTicketData.eventName}\nTotal: ${formatRupiah(currentTicketData.totalAmount)}\n\nE-tiket telah dikirim ke email Anda dan dapat dilihat di menu "Tiket Saya".`);
        window.location.href = "../pages/tiket_saya.html";
    }, 2000);
}

// Format Rupiah
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// Format Rupiah tanpa simbol (angka saja)
function formatRupiahNumber(angka) {
    return new Intl.NumberFormat('id-ID').format(angka);
}