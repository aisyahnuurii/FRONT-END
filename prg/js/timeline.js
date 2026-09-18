/* timeline.js — Orbit Images Full Responsive */

document.addEventListener('DOMContentLoaded', function() {
  const container = document.getElementById('orbit-container');
  if (!container) {
    console.error('❌ Container #orbit-container tidak ditemukan!');
    return;
  }

  console.log('✅ Timeline: Memulai inisialisasi...');

  // DATA GAMBAR 
const imageData = [
{ src: '../foto/13.jpg', title: '2021 - masih smp/sma?' },
{ src: '../foto/14.jpg', title: '2022 - p munip era' },
{ src: '../foto/15.jpg', title: '2023 - b srut era' },
{ src: '../foto/16.jpg', title: '2024 - selesai?' },
{ src: '../foto/17.jpg', title: '2025 - jadi mahasiswa gaul' }
];

  const totalItems = imageData.length;
  let currentIndex = 0;
  let animationId = null;
  let angle = 0;
  let radius = 0;
  let itemSize = 80;
  let isPaused = false;
  let containerSize = 0;

  //  BUILD DOM 
  container.innerHTML = '';

  //  SVG Path
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 800 800');
  svg.classList.add('orbit-path-svg');
  
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.classList.add('orbit-path');
  svg.appendChild(path);
  container.appendChild(svg);

  // Center Content
  const centerContent = document.createElement('div');
  centerContent.className = 'orbit-center-content';
  centerContent.innerHTML = `
    <span class="eyebrow">✨ Timeline</span>
    <h3>PRG<br>Journey</h3>
  `;
  container.appendChild(centerContent);

  // Items
  const items = [];
  imageData.forEach((data, index) => {
    const item = document.createElement('div');
    item.className = 'orbit-item';
    item.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = data.src;
    img.alt = data.title;
    img.draggable = false;
    img.title = data.title;
    img.loading = 'lazy';
    
    // Error handling untuk gambar gagal load
    img.onerror = function() {
      this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23EF4444" width="300" height="300"/%3E%3Ctext x="150" y="150" text-anchor="middle" dy=".3em" fill="white" font-size="40" font-family="sans-serif"%3E📸%3C/text%3E%3C/svg%3E';
    };
    
    item.appendChild(img);
    container.appendChild(item);
    items.push(item);

    // Click event
    item.addEventListener('click', function(e) {
      e.stopPropagation();
      setActiveItem(index);
    });
  });

  // FUNGSI UPDATE UKURAN 
  function calculateSizes() {
    const rect = container.getBoundingClientRect();
    containerSize = Math.min(rect.width, rect.height);
    
    // Tentukan ukuran item berdasarkan container
    if (containerSize < 350) {
      itemSize = 44; // HP sangat kecil
    } else if (containerSize < 500) {
      itemSize = 56; // HP normal
    } else if (containerSize < 700) {
      itemSize = 70; // Tablet kecil
    } else if (containerSize < 900) {
      itemSize = 80; // Tablet besar / laptop kecil
    } else {
      itemSize = 90; // Desktop
    }
    
    // Hitung radius (80% dari setengah container - padding)
    const padding = itemSize / 2 + 20;
    radius = (containerSize / 2) - padding;
    
    // Pastikan radius tidak negatif
    if (radius < 20) radius = 20;
    
    return { containerSize, itemSize, radius };
  }

  // UPDATE POSISI 
  function updatePositions(angleDeg) {
    const sizes = calculateSizes();
    const cx = containerSize / 2;
    const cy = containerSize / 2;
    
    // Update SVG path
    const pathD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy}`;
    path.setAttribute('d', pathD);
    
    // Update ukuran item
    items.forEach((item) => {
      item.style.width = itemSize + 'px';
      item.style.height = itemSize + 'px';
    });
    
    // Update center content
    const isMobile = containerSize < 500;
    centerContent.style.padding = isMobile ? '8px 14px' : '20px 30px';
    centerContent.style.minWidth = isMobile ? '60px' : '120px';
    
    const titleEl = centerContent.querySelector('h3');
    if (titleEl) {
      titleEl.style.fontSize = isMobile ? 'clamp(0.7rem, 2vw, 1rem)' : 'clamp(1.2rem, 3vw, 2rem)';
    }
    
    // Update posisi setiap item
    const angleRad = angleDeg * Math.PI / 180;
    const step = (2 * Math.PI) / totalItems;
    
    items.forEach((item, index) => {
      const itemAngle = angleRad + (index * step);
      const x = cx + radius * Math.cos(itemAngle) - itemSize / 2;
      const y = cy + radius * Math.sin(itemAngle) - itemSize / 2;
      
      item.style.left = x + 'px';
      item.style.top = y + 'px';
      item.style.transform = `rotate(${-angleDeg}deg)`;
    });
  }

  // SET ACTIVE ITEM 
  function setActiveItem(index) {
    currentIndex = index;
    
    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
    
    // Update center content dengan data
    const data = imageData[index % imageData.length];
    const year = data.title.split(' - ')[0] || data.title;
    const title = data.title.split(' - ')[1] || data.title;
    
    centerContent.innerHTML = `
      <span class="eyebrow"> ${year}</span>
      <h3>${title}</h3>
    `;
    
    // Update status
    const statusEl = document.getElementById('orbit-status');
    if (statusEl) {
      statusEl.textContent = ` ${year} - ${title}`;
      statusEl.style.color = 'var(--red)';
    }
    
    console.log(` Timeline: ${data.title}`);
  }

  // ANIMASI LOOP 
  function animate() {
    if (!isPaused) {
      angle = (angle + 0.15) % 360;
      updatePositions(angle);
    }
    animationId = requestAnimationFrame(animate);
  }

  // RESIZE HANDLER 
  let resizeTimeout;
  let resizeObserver = null;

  function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const sizes = calculateSizes();
      console.log(` Resize: ${sizes.containerSize}px, item: ${sizes.itemSize}px, radius: ${sizes.radius}px`);
      updatePositions(angle);
    }, 100);
  }

  // INISIALISASI 
  function init() {
    // Hitung ukuran awal
    calculateSizes();
    
    // Set active pertama
    setActiveItem(0);
    
    // Update posisi awal
    updatePositions(0);
    
    // Mulai animasi
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
    animate();
    
    // Setup ResizeObserver untuk mendeteksi perubahan ukuran
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => handleResize());
      resizeObserver.observe(container);
    }
    
    // Juga listen window resize
    window.addEventListener('resize', handleResize);
    
    // Listen orientation change (khusus mobile)
    window.addEventListener('orientationchange', function() {
      setTimeout(handleResize, 300);
    });
    
    console.log('✅ OrbitImages berhasil diinisialisasi!');
    console.log(` ${totalItems} gambar dalam orbit`);
    console.log(` Ukuran: ${containerSize}px, item: ${itemSize}px, radius: ${radius}px`);
  }

  // PAUSE/PLAY 
  function togglePause() {
    isPaused = !isPaused;
    const statusEl = document.getElementById('orbit-status');
    if (statusEl) {
      statusEl.textContent = isPaused ? '⏸Di-pause' : ' Berputar...';
    }
    if (!isPaused && !animationId) {
      animate();
    }
  }

  //  DESTROY 
  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  }

  // Export methods ke global
  window.timelineOrbit = {
    setActiveItem,
    togglePause,
    destroy,
    getCurrentIndex: () => currentIndex,
    getItems: () => items,
    getSize: () => ({ containerSize, itemSize, radius })
  };

  // Jalankan!
  init();

  // Auto-pause when tab is hidden
  document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
      isPaused = true;
    } else {
      isPaused = false;
      if (!animationId) {
        animate();
      }
    }
  });

  // Click pada container untuk pause/play (opsional)
  container.addEventListener('dblclick', function() {
    togglePause();
  });
});