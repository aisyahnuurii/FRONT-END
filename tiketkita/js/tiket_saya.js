
    // Data tiket disimpan di localStorage
    let tickets = [];

    // Load data dari localStorage
    function loadTickets() {
        const stored = localStorage.getItem('userTickets');
        if (stored) {
            tickets = JSON.parse(stored);
        } else {
            // Data dummy untuk demo jika belum ada
            tickets = [];
        }
        renderTickets('all');
    }

    // Simpan data ke localStorage
    function saveTickets() {
        localStorage.setItem('userTickets', JSON.stringify(tickets));
    }

    // Render tiket berdasarkan filter
    function renderTickets(filter) {
        const grid = document.getElementById('tiketGrid');
        let filteredTickets = tickets;

        if (filter === 'paid') {
            filteredTickets = tickets.filter(t => t.status === 'paid');
        } else if (filter === 'pending') {
            filteredTickets = tickets.filter(t => t.status === 'pending');
        } else if (filter === 'expired') {
            filteredTickets = tickets.filter(t => t.status === 'expired');
        }

        if (filteredTickets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fi fi-rr-ticket"></i>
                    <h3>Belum Ada Tiket</h3>
                    <p>Anda belum memiliki tiket dalam kategori ini.</p>
                    <button class="btn-beli-sekarang" onclick="window.location.href='../pages/honepage.html'">Beli Tiket Sekarang</button>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredTickets.map(ticket => `
            <div class="tiket-card">
                <div class="tiket-header">
                    <h3>${ticket.eventName}</h3>
                    <p>${ticket.eventDate} | ${ticket.eventLocation}</p>
                </div>
                <div class="tiket-body">
                    <div class="tiket-info">
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Kode Booking</span>
                            <span class="tiket-info-value">${ticket.bookingCode}</span>
                        </div>
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Jenis Tiket</span>
                            <span class="tiket-info-value">${ticket.ticketType}</span>
                        </div>
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Jumlah</span>
                            <span class="tiket-info-value">${ticket.quantity} tiket</span>
                        </div>
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Total Bayar</span>
                            <span class="tiket-info-value">${formatRupiah(ticket.totalAmount)}</span>
                        </div>
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Status</span>
                            <span class="tiket-status ${getStatusClass(ticket.status)}">${getStatusText(ticket.status)}</span>
                        </div>
                        <div class="tiket-info-item">
                            <span class="tiket-info-label">Tanggal Pembelian</span>
                            <span class="tiket-info-value">${ticket.purchaseDate}</span>
                        </div>
                    </div>
                </div>
                <div class="tiket-footer">
                    <button class="btn-detail" onclick="showTicketDetail('${ticket.bookingCode}')">Detail Tiket</button>
                    ${ticket.status === 'paid' ? `<button class="btn-download" onclick="downloadTicket('${ticket.bookingCode}')"><i class="fi fi-rr-download"></i> Unduh E-Tiket</button>` : ''}
                </div>
            </div>
        `).join('');
    }

    function getStatusClass(status) {
        switch(status) {
            case 'paid': return 'status-paid';
            case 'pending': return 'status-pending';
            case 'expired': return 'status-expired';
            default: return 'status-pending';
        }
    }

    function getStatusText(status) {
        switch(status) {
            case 'paid': return '✓ Lunas';
            case 'pending': return '⏳ Menunggu Pembayaran';
            case 'expired': return '✗ Kadaluarsa';
            default: return 'Menunggu';
        }
    }

    function showTicketDetail(bookingCode) {
        const ticket = tickets.find(t => t.bookingCode === bookingCode);
        if (!ticket) return;

        const modalBody = document.getElementById('modalBody');
        modalBody.innerHTML = `
            <h2 style="margin-bottom: 1rem;">Detail E-Tiket</h2>
            <div class="qrcode-container">
                <div class="qrcode-placeholder">
                    <i class="fi fi-rr-qrcode" style="font-size: 100px; color: #000;"></i>
                </div>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Scan QR Code untuk masuk venue</p>
            </div>
            <div style="margin-top: 1rem;">
                <div class="tiket-info-item"><span class="tiket-info-label">Kode Booking:</span><span><strong>${ticket.bookingCode}</strong></span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Nama Event:</span><span>${ticket.eventName}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Tanggal:</span><span>${ticket.eventDate}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Lokasi:</span><span>${ticket.eventLocation}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Jenis Tiket:</span><span>${ticket.ticketType}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Jumlah Tiket:</span><span>${ticket.quantity}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Total Bayar:</span><span>${formatRupiah(ticket.totalAmount)}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Metode Pembayaran:</span><span>${ticket.paymentMethod}</span></div>
                <div class="tiket-info-item"><span class="tiket-info-label">Waktu Pembelian:</span><span>${ticket.purchaseDate} ${ticket.purchaseTime}</span></div>
            </div>
            <button class="btn-download" style="width: 100%; margin-top: 1.5rem;" onclick="downloadTicket('${ticket.bookingCode}')">Download E-Tiket (PDF)</button>
        `;
        document.getElementById('tiketModal').style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('tiketModal').style.display = 'none';
    }

    function downloadTicket(bookingCode) {
        const ticket = tickets.find(t => t.bookingCode === bookingCode);
        if (ticket && ticket.status === 'paid') {
            alert(`E-Tiket untuk ${ticket.eventName} sedang diunduh...\nKode Booking: ${ticket.bookingCode}\n\n(Demo: File PDF akan tersedia di fitur produksi)`);
            // Di production, ini akan memanggil API untuk generate PDF
        } else {
            alert('Tiket belum lunas, silakan selesaikan pembayaran terlebih dahulu.');
        }
    }

    function formatRupiah(angka) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(angka);
    }

    // Event listener untuk tab filter
    document.querySelectorAll('.tiket-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.tiket-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            renderTickets(this.getAttribute('data-filter'));
        });
    });

    // Close modal dengan klik overlay
    document.getElementById('tiketModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });

    // Load tiket saat halaman dibuka
    loadTickets();

    // Fungsi untuk menambah tiket baru (dipanggil dari pembayaran)
    window.addNewTicket = function(ticketData) {
        tickets.unshift(ticketData);
        saveTickets();
        renderTickets('all');
    }

    // Fungsi untuk update status tiket
    window.updateTicketStatus = function(bookingCode, newStatus) {
        const ticketIndex = tickets.findIndex(t => t.bookingCode === bookingCode);
        if (ticketIndex !== -1) {
            tickets[ticketIndex].status = newStatus;
            saveTickets();
            renderTickets('all');
            return true;
        }
        return false;
    }

    // Fungsi untuk mendapatkan tiket berdasarkan kode
    window.getTicketByCode = function(bookingCode) {
        return tickets.find(t => t.bookingCode === bookingCode);
    }
