document.addEventListener('DOMContentLoaded', function() {
    
    // LOGIKA HALAMAN UTAMA (HOMEPAGE)
    
    //  Input & Select Animation Logic 
    document.querySelectorAll(".input-group").forEach(group => {
        const input = group.querySelector("input");
        const select = group.querySelector("select");

        if (input) {
            input.addEventListener("input", function () {
                this.value.trim() !== "" ? group.classList.add("filled") : group.classList.remove("filled");
            });
        }
        if (select) {
            select.addEventListener("change", function () {
                this.value !== "" ? group.classList.add("filled") : group.classList.remove("filled");
            });
        }
    });

    //  Event Slider Logic 
    const slider = document.querySelector(".event-grid");
    const cards = document.querySelectorAll(".event-card");
    let index = 0;

    if (slider && cards.length > 0) {
        const moveSlider = () => {
            slider.style.transform = `translateX(-${index * 370}px)`;
        };

        document.getElementById("nextBtn")?.addEventListener("click", () => {
            index++;
            if (index > cards.length - 3) index = 0;
            moveSlider();
        });

        document.getElementById("prevBtn")?.addEventListener("click", () => {
            index--;
            if (index < 0) index = Math.max(cards.length - 3, 0);
            moveSlider();
        });

        setInterval(() => {
            index++;
            if (index > cards.length - 3) index = 0;
            moveSlider();
        }, 4000);
    }

    //  Wishlist / Favorite Button 
    const favButtons = document.querySelectorAll(".btn-fav");
    favButtons.forEach(button => {
        const eventName = button.dataset.event;
        let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];

        if (wishlist.includes(eventName)) {
            button.classList.add("active");
            button.innerHTML = "♥";
        }

        button.addEventListener("click", () => {
            let wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
            if (wishlist.includes(eventName)) {
                wishlist = wishlist.filter(item => item !== eventName);
                button.classList.remove("active");
                button.innerHTML = "♡";
            } else {
                wishlist.push(eventName);
                button.classList.add("active");
                button.innerHTML = "♥";
            }
            localStorage.setItem("wishlist", JSON.stringify(wishlist));
        });
    });

    //  Search Event Logic 
    const btnSearch = document.querySelector(".btn-search");
    if (btnSearch) {
        btnSearch.addEventListener("click", () => {
            const keyword = document.querySelector('input[type="text"]')?.value.toLowerCase().trim() || "";
            const lokasi = document.getElementById("lokasi")?.value || "";
            const tanggal = document.getElementById("tanggal")?.value || "";

            localStorage.setItem("searchKeyword", keyword);
            localStorage.setItem("searchLokasi", lokasi);
            localStorage.setItem("searchTanggal", tanggal);
            
            window.location.href = "../pages/all-events.html";
        });
    }

    //  Navbar & Auth State Logic 
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const activeUser = localStorage.getItem('activeUser');
    
    const guestMenu = document.getElementById('guest-menu');
    const loggedInMenu = document.getElementById('logged-in-menu');
    const displayUsername = document.getElementById('display-username');
    const profileBtn = document.getElementById('userProfileBtn');
    const dropdownMenu = document.getElementById('dropdownMenu');
    const logoutBtn = document.getElementById('logoutBtn');
    const navPromo = document.getElementById('navPromo');

    // Tampilkan Menu Sesuai Status Login
    if (guestMenu && loggedInMenu) {
        if (isLoggedIn === 'true' && activeUser) {
            guestMenu.style.display = 'none';
            loggedInMenu.style.display = 'block';
            if (displayUsername) displayUsername.textContent = activeUser;
        } else {
            guestMenu.style.display = 'block';
            loggedInMenu.style.display = 'none';
        }
    }

    // Dropdown Profil
    if (profileBtn && dropdownMenu) {
        profileBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => dropdownMenu.style.display = 'none');
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('activeUser');
            window.location.reload(); 
        });
    }

    // Promo Link Protection
    if (navPromo) {
        navPromo.addEventListener('click', function(e) {
            e.preventDefault();
            if (isLoggedIn === 'true') {
                window.location.href = '../pages/promo.html';
            } else {
                alert('Silakan masuk (login) terlebih dahulu untuk mengakses halaman Promo!');
                window.location.href = 'authentication.html';
            }
        });
    }


    
    // LOGIN/REGISTER
  

    const container = document.getElementById('container');
    
    // authentication.html
    if (container) {
        
        //  Toggle Password Visibility 
        window.togglePassword = function(inputId) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const icon = input.nextElementSibling;
            if (input.type === "password") {
                input.type = "text";
                icon.classList.replace("fi-rr-eye", "fi-rr-eye-crossed");
            } else {
                input.type = "password";
                icon.classList.replace("fi-rr-eye-crossed", "fi-rr-eye");
            }
        };

        //  Password Strength Checker (Universal) 
        document.querySelectorAll('.password-input').forEach(input => {
            const parentGroup = input.closest('.input-group');
            const strengthBar = parentGroup.querySelector('.strength-bar');
            const strengthText = parentGroup.querySelector('.strength-text');

            if (strengthBar && strengthText) {
                input.addEventListener('input', function() {
                    const val = this.value;
                    let strength = 0;
                    if (val.length >= 8) strength += 25;
                    if (val.match(/[a-z]+/)) strength += 25;
                    if (val.match(/[A-Z]+/)) strength += 25;
                    if (val.match(/[0-9]+/) || val.match(/[$@#&!]+/)) strength += 25;

                    strengthBar.style.width = strength + '%';

                    if (val.length === 0) {
                        strengthBar.style.backgroundColor = 'transparent';
                        strengthText.textContent = 'Kekuatan Sandi';
                        strengthText.style.color = 'var(--text-muted)';
                    } else if (strength <= 25) {
                        strengthBar.style.backgroundColor = '#ff4d4d'; strengthText.textContent = 'Sangat Lemah'; strengthText.style.color = '#ff4d4d';
                    } else if (strength <= 50) {
                        strengthBar.style.backgroundColor = '#ffd166'; strengthText.textContent = 'Lemah'; strengthText.style.color = '#ffd166';
                    } else if (strength <= 75) {
                        strengthBar.style.backgroundColor = '#00d4b1'; strengthText.textContent = 'Sedang'; strengthText.style.color = '#00d4b1';
                    } else {
                        strengthBar.style.backgroundColor = '#10b981'; strengthText.textContent = 'Kuat'; strengthText.style.color = '#10b981';
                    }
                });
            }
        });

        //  Form Switching Logic (Desktop Sliding & Mobile Tab) 
        const registerBtnPanel = document.querySelector('.register-btn');
        const loginBtnPanel = document.querySelector('.login-btn');

        // Fungsi Global untuk Tombol Teks di Dalam Form
        window.switchToRegister = function() {
            if (window.innerWidth <= 768) {
                document.querySelector('.form-box.login')?.classList.remove('active-mobile');
                document.querySelector('.form-box.register')?.classList.add('active-mobile');
            } else {
                container.classList.add('active'); 
            }
        };

        window.switchToLogin = function() {
            if (window.innerWidth <= 768) {
                document.querySelector('.form-box.register')?.classList.remove('active-mobile');
                document.querySelector('.form-box.login')?.classList.add('active-mobile');
            } else {
                container.classList.remove('active'); 
            }
        };

        // Event Listener untuk Tombol Panel Samping (Desktop)
        if (registerBtnPanel) registerBtnPanel.addEventListener('click', () => container.classList.add('active'));
        if (loginBtnPanel) loginBtnPanel.addEventListener('click', () => container.classList.remove('active'));

        // Inisialisasi Awal Mobile
        if (window.innerWidth <= 768) {
            document.querySelector('.form-box.login')?.classList.add('active-mobile');
        }

        //  Form Submit Handling 
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        if (loginForm) {
            loginForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const emailInput = document.getElementById('email');
                if (emailInput) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('activeUser', emailInput.value.split('@')[0]);
                }
                window.location.href = 'honepage.html'; 
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const fullnameInput = document.getElementById('fullname');
                if (fullnameInput) {
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('activeUser', fullnameInput.value);
                }
                window.location.href = 'honepage.html'; 
            });
        }
    }
});
