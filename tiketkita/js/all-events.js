document.addEventListener("DOMContentLoaded", function () {
    // SETUP NAVBAR (Cek Login) 
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const activeUser = localStorage.getItem('activeUser');
    
    if (isLoggedIn === 'true' && activeUser) {
        document.getElementById('guest-menu').style.display = 'none';
        document.getElementById('logged-in-menu').style.display = 'block';
        document.getElementById('display-username').textContent = activeUser;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', e => {
            e.preventDefault();
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('activeUser');
            window.location.reload();
        });
    }

    // Cek Navbar Promo Auth
    const navPromo = document.getElementById('navPromo');
    if (navPromo) {
        navPromo.addEventListener('click', function(e) {
            e.preventDefault();
            if (isLoggedIn === 'true') { window.location.href = '../pages/promo.html'; } 
            else { alert('Silakan login terlebih dahulu!'); window.location.href = 'authentication.html'; }
        });
    }

    // LOGIKA FILTERING 
    const catFilter = document.getElementById('filterCategory');
    const locFilter = document.getElementById('filterLocation');
    const sortFilter = document.getElementById('filterSort');
    const eventsContainer = document.getElementById('eventsContainer');
    const emptyState = document.getElementById('emptyState');

    
    const urlParams = new URLSearchParams(window.location.search);
    const passedCategory = urlParams.get('category');
    
    if (passedCategory) {
        // Set dropdown value sesuai yang dilempar dari homepage
        catFilter.value = passedCategory;
    }

    function renderEvents() {
        const catValue = catFilter.value;
        const locValue = locFilter.value;
        const sortValue = sortFilter.value;

        // Proses Filter
        let filteredEvents = allEventsDatabase.filter(event => {
            const matchCategory = catValue === 'all' || event.category === catValue;
            const matchLocation = locValue === 'all' || event.location === locValue;
            return matchCategory && matchLocation;
        });

        // Proses Sorting
        if (sortValue === 'termurah') {
            filteredEvents.sort((a, b) => a.price - b.price);
        } else if (sortValue === 'termahal') {
            filteredEvents.sort((a, b) => b.price - a.price);
        }
        

        // Render HTML
        eventsContainer.innerHTML = '';
        
        if (filteredEvents.length === 0) {
            eventsContainer.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            eventsContainer.style.display = 'grid';
            emptyState.style.display = 'none';

            filteredEvents.forEach(evt => {
                const dateParts = evt.date.split(' ');
                
                const cardHTML = `
                <a href="../pages/order-items.html?id=${evt.id}" style="text-decoration: none; color: inherit;">
                    <div class="event-card">
                        <div class="event-image" style="background: linear-gradient(180deg, rgba(21, 24, 33, 0) 0%, rgba(12, 14, 20, 0.9) 100%), url('${evt.image}') center/cover;">
                            <div class="date-badge">
                                <span class="month">${dateParts[1]}</span>
                                <span class="day">${dateParts[0]}</span>
                            </div>
                            <div class="cat-tag">${evt.categoryName}</div>
                        </div>
                        <div class="event-info">
                            <h3>${evt.title}</h3>
                            <p class="location"><i class="fi fi-rr-map-marker-home"></i> ${evt.locationName}</p>
                            <div class="event-footer">
                                <div class="price">
                                    <span>Mulai dari</span>
                                    <strong>${evt.priceText}</strong>
                                </div>
                                <div class="progress-section">
                                    <span class="progress-text">Tersisa ${evt.progress}</span>
                                    <div class="progress-bar">
                                        <div class="fill" style="width:${evt.progress}; background-color: var(--primary-color);"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </a>`;
                eventsContainer.innerHTML += cardHTML;
            });
        }
    }

    // Event Listener Filter Berubah
    catFilter.addEventListener('change', renderEvents);
    locFilter.addEventListener('change', renderEvents);
    sortFilter.addEventListener('change', renderEvents);

    // Initial Render
    renderEvents();


});

const keyword =
    localStorage.getItem("searchKeyword") || "";

const lokasi =
    localStorage.getItem("searchLokasi") || "";

const tanggal =
    localStorage.getItem("searchTanggal") || "";

console.log(keyword);
console.log(lokasi);
console.log(tanggal);

