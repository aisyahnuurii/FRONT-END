
// LOGIKA HALAMAN PROMO & NAVBAR

document.addEventListener("DOMContentLoaded", function () {
    // Cek Login (Navbar Setup)
    const activeUser = localStorage.getItem('activeUser');
    const displayUsername = document.getElementById('display-username');

    if (displayUsername && activeUser) {
        displayUsername.textContent = activeUser;
    }

    // Logika Dropdown Navbar
    const profileBtn = document.getElementById('userProfileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');

    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            const isHidden = dropdownMenu.style.display === 'none';
            dropdownMenu.style.display = isHidden ? 'block' : 'none';
        });

        document.addEventListener('click', function () {
            dropdownMenu.style.display = 'none';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('activeUser');
            window.location.href = '../pages/honepage.html';
        });
    }

    // Filter Interaksi Promo
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all
            filterBtns.forEach(b => b.classList.remove('active'));
            // Add active class to clicked
            this.classList.add('active');
            
            // Animasi simulasi filtering
            const cards = document.querySelectorAll('.promo-card');
            cards.forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 300);
            });
        });
    });
});

// Fungsi Salin Kode Promo
function copyCode(code, btnElement) {
    // Salin ke clipboard
    navigator.clipboard.writeText(code).then(() => {
        // Ubah text tombol sementara
        const originalText = btnElement.innerText;
        btnElement.innerText = "Disalin!";
        btnElement.style.background = "#10b981"; 
        
        setTimeout(() => {
            btnElement.innerText = originalText;
            btnElement.style.background = ""; 
        }, 2000);

        // Munculkan Toast
        const toast = document.getElementById('toast');
        const toastCode = document.getElementById('toast-code');
        toastCode.innerText = code;
        
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    });
}
