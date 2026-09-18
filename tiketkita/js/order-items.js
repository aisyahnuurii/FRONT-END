// Data Database Simulasi (Mewakili data event dari backend)
const eventsData = {
    'liga2026': {
        title: 'Piala Liga Indonesia 2026',
        category: 'Olahraga',
        icon: '⚽',
        date: '18 Januari 2026',
        location: 'Stadion GBLA, Bandung',
        description: 'Pertandingan sengit memperebutkan Piala Liga Indonesia 2026. Dukung tim kesayanganmu langsung di stadion dengan atmosfer yang luar biasa!',
        bgImage: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=1920&auto=format&fit=crop',
        tickets: [
            { id: 't1', name: 'Tribun Utara', desc: 'Akses tempat duduk tribun utara', price: 75000 },
            { id: 't2', name: 'VIP Barat', desc: 'Tempat duduk VIP dengan fasilitas eksklusif', price: 250000, isHot: true }
        ]
    },
    'soundrenaline2026': {
        title: 'Soundrenaline 2026: The Next Level',
        category: 'Konser',
        icon: '🎟️',
        date: '12 - 13 Februari 2026',
        location: 'Garuda Wisnu Kencana (GWK), Bali',
        description: 'Bersiaplah untuk festival musik terbesar tahun ini! Soundrenaline 2026 kembali hadir dengan deretan artis papan atas. Nikmati pengalaman visual dan audio yang memukau selama dua hari penuh di venue ikonik GWK Bali.',
        bgImage: 'https://images.unsplash.com/photo-1540039155732-d68a9960241b?q=80&w=1920&auto=format&fit=crop',
        tickets: [
            { id: 't3', name: 'Regular - Day 1', desc: 'Akses masuk festival hari pertama', price: 350000 },
            { id: 't4', name: 'VIP - 2 Days Pass', desc: 'Akses 2 hari + VIP Area & Fast Track', price: 800000, isHot: true }
        ]
    }
};

// Variabel Data Pesanan
let selectedPrice = 0;
let ticketQuantity = 1;
let ticketName = "";
let discountAmount = 0;
const SERVICE_FEE = 15000;
const TAX_RATE = 0.10; 

document.addEventListener("DOMContentLoaded", function () {
    
    // LOAD EVENT DINAMIS DARI URL
    const urlParams = new URLSearchParams(window.location.search);
    let eventId = urlParams.get('id');
    
    // Default ke soundrenaline jika tidak ada ID (fallback)
    if (!eventId || !eventsData[eventId]) {
        eventId = 'soundrenaline2026';
    }

    loadEventData(eventId);

    // SETUP NAVBAR & USER DATA 
    const activeUser = localStorage.getItem('activeUser') || 'Tamu';
    const displayUsername = document.getElementById('display-username');
    if (displayUsername) displayUsername.textContent = activeUser;

    // Auto-fill nama pembeli jika sudah login
    const buyerNameInput = document.getElementById('buyerName');
    if (buyerNameInput && localStorage.getItem('isLoggedIn') === 'true') {
        buyerNameInput.value = activeUser;
    }

    // Dropdown Logic
    const profileBtn = document.getElementById('userProfileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', e => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => dropdownMenu.style.display = 'none');
    }

});

// FUNGSI LOAD DATA EVENT KE HTML
function loadEventData(eventId) {
    const data = eventsData[eventId];

    // Update Banner
    document.querySelector('.hero-bg').style.backgroundImage = `url('${data.bgImage}')`;
    document.querySelector('.event-badge').innerHTML = `${data.icon} ${data.category}`;
    document.querySelector('.hero-content h1').textContent = data.title;
    
    const metaSpans = document.querySelectorAll('.event-meta span');
    metaSpans[0].innerHTML = `<i class="fi fi-rr-calendar"></i> ${data.date}`;
    metaSpans[1].innerHTML = `<i class="fi fi-rr-marker"></i> ${data.location}`;

    // Update Deskripsi
    document.querySelector('.info-card p').textContent = data.description;

    // Render Tiket Dinamis
    const ticketContainer = document.querySelector('.ticket-options');
    ticketContainer.innerHTML = ''; 

    data.tickets.forEach(ticket => {
        const hotBadge = ticket.isHot ? '<span class="badge-hot">HOT</span>' : '';
        const ticketHTML = `
            <div class="ticket-item" onclick="selectTicket(this, ${ticket.price}, '${ticket.name}')">
                <div class="ticket-info">
                    <h4>${ticket.name} ${hotBadge}</h4>
                    <p>${ticket.desc}</p>
                    <span class="price">${formatRupiah(ticket.price)}</span>
                </div>
                <div class="radio-circle"></div>
            </div>
        `;
        ticketContainer.innerHTML += ticketHTML;
    });
}

// FUNGSI PILIH TIKET (Menampilkan Order Items) 
function selectTicket(element, price, name) {
    // CEK LOGIN SAAT TIKET DIKLIK
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        alert('Silakan masuk (login) terlebih dahulu untuk memilih dan membeli tiket!');
        window.location.href = '../pages/authentication.html';
        return; 
    }
    
    
    // Reset selection UI
    document.querySelectorAll('.ticket-item').forEach(el => el.classList.remove('selected'));
    element.classList.add('selected');

    // Set Data
    selectedPrice = price;
    ticketName = name;
    ticketQuantity = 1;
    discountAmount = 0; 
    

    // Tampilkan Form Pembeli & Order Summary
    document.getElementById('buyerForm').style.display = 'block';
    document.getElementById('emptyCart').style.display = 'none';
    document.getElementById('orderItems').style.display = 'block';

    document.getElementById('summaryTicketName').textContent = name;
    
    updateDisplay();
}

// FUNGSI UPDATE JUMLAH TIKET 
function updateQty(change) {
    let newQty = ticketQuantity + change;
    if (newQty >= 1 && newQty <= 5) {
        ticketQuantity = newQty;
        updateDisplay();
    } else if (newQty > 5) {
        alert('Maksimal pembelian 5 tiket per transaksi.');
    }
}

//  FUNGSI KALKULASI & UPDATE UI 
function updateDisplay() {
    document.getElementById('ticketQty').textContent = ticketQuantity;
    
    let subtotal = selectedPrice * ticketQuantity;
    let tax = subtotal * TAX_RATE;
    let total = subtotal + tax + SERVICE_FEE - discountAmount;

    // Update DOM
    document.getElementById('summarySubtotal').textContent = formatRupiah(subtotal);
    document.getElementById('summaryTax').textContent = formatRupiah(tax);
    


    document.getElementById('summaryTotal').textContent = formatRupiah(total);
}

// FUNGSI APLIKASI PROMO CODE 
function applyPromo() {
    const code = document.getElementById('promoCode').value.toUpperCase();
    let subtotal = selectedPrice * ticketQuantity;

    if (code === 'BARU30') {
        discountAmount = subtotal * 0.30;
        alert('Promo BARU30 berhasil diterapkan! Diskon 30%');
    } else if (code === 'BCA50K') {
        discountAmount = 50000;
        alert('Promo BCA50K berhasil diterapkan! Potongan Rp 50.000');
    } else {
        discountAmount = 0;
        alert('Kode promo tidak valid atau sudah kadaluarsa.');
    }
    
    updateDisplay();
}

//  FUNGSI PROSES PEMBAYARAN 

function processPayment() {
    const name = document.getElementById('buyerName').value;
    const email = document.getElementById('buyerEmail').value;
    const phone = document.getElementById('buyerPhone').value;

    if (!name || !email || !phone) {
        alert('Mohon lengkapi Detail Pemesan terlebih dahulu!');
        return;
    }

    const btnPay = document.getElementById('btnPay');
    btnPay.innerHTML = 'Memproses...';
    btnPay.disabled = true;

    // Simpan data total sementara ke localStorage untuk ditampilkan di halaman pembayaran
    const totalPay = document.getElementById('summaryTotal').innerText;
    localStorage.setItem('pendingTotal', totalPay);

    // Alihkan ke halaman pembayaran
    setTimeout(() => {
        window.location.href = '../pages/pembayaran.html';
    }, 1000);
}

// FUNGSI BANTUAN FORMAT RUPIAH 
function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}