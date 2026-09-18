/* gallery.js — Inisialisasi InfiniteMenu + data items */

(function() {
  // Cek apakah gl-matrix sudah load
  if (typeof mat4 === 'undefined' || typeof vec2 === 'undefined') {
    console.error('gl-matrix tidak ditemukan! Menunggu...');
    setTimeout(arguments.callee, 500);
    return;
  }

  console.log('gl-matrix terdeteksi!');

  const galleryItems = [
    {
      image: '../foto/7.jpg',
      link: 'https://drive.google.com/drive/folders/1DfhLQgRav2-KX8aqg2PYdyeifYbXJTZ8?usp=drive_link',
      title: 'PAK MUNIP ERA',
      description: 'masih jaim jaimnya'
    },
    { 
      image: '../foto/8.jpg',
      link: 'https://drive.google.com/drive/folders/1t3Ez7szNNENN88ick7EFqLgzxC2pltFa?usp=drive_link',
      title: 'IBU UTAMI ERA',
      description: 'cuma 5 bulan akrab'
    },
    {
      image: '../foto/11.jpg',
      link: 'https://drive.google.com/drive/folders/1D_J0J0NCLkyJqn1ULILQ0SO2w-HZI5se?usp=drive_link',
      title: 'BALI',
      description: 'makrab pertama'
    },
    {
      image: '../foto/12.jpg',
      link: 'https://drive.google.com/drive/folders/18ns9xSIldOTzxy51UbeZG6tlOexqjDbq?usp=drive_link',
      title: 'MALANG',
      description: 'makrab kedua'
    }
  ];

  const canvas = document.getElementById('infinite-grid-menu-canvas');
  const titleEl = document.getElementById('face-title');
  const descEl = document.getElementById('face-description');
  const btnEl = document.getElementById('face-action');
  let activeItem = null;

  function onActiveItemChange(index) {
    activeItem = galleryItems[index % galleryItems.length];
    if (titleEl) titleEl.textContent = activeItem.title;
    if (descEl) descEl.textContent = activeItem.description;
  }

  function onMovementChange(isMoving) {
    const state = isMoving ? 'inactive' : 'active';
    [titleEl, descEl, btnEl].forEach(el => {
      if (!el) return;
      el.classList.remove('active', 'inactive');
      el.classList.add(state);
    });
  }

  if (btnEl) {
    btnEl.addEventListener('click', () => {
      if (!activeItem?.link) return;
      if (activeItem.link.startsWith('http')) {
        window.open(activeItem.link, '_blank', 'noopener,noreferrer');
      } else {
        const target = document.querySelector(activeItem.link);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  if (canvas && typeof InfiniteGridMenu !== 'undefined') {
    try {
      console.log(' Menginisialisasi InfiniteGridMenu...');
      const menu = new InfiniteGridMenu(
        canvas,
        galleryItems,
        onActiveItemChange,
        onMovementChange,
        (sketch) => {
          console.log('Sketch dimulai!');
          sketch.run();
        },
        1.2
      );

      onActiveItemChange(0);
      onMovementChange(false);

      window.addEventListener('resize', () => {
        if (menu && typeof menu.resize === 'function') {
          menu.resize();
        }
      });
      
      console.log('Gallery berhasil diinisialisasi!');
    } catch (error) {
      console.error('Error inisialisasi gallery:', error);
      // Tampilkan error di canvas
      if (canvas) {
        canvas.style.display = 'flex';
        canvas.style.alignItems = 'center';
        canvas.style.justifyContent = 'center';
        canvas.innerHTML = `
          <div style="color: white; text-align: center; padding: 40px; background: rgba(0,0,0,0.7); border-radius: 12px;">
            <h3 style="color: #ff6b6b;">Error</h3>
            <p style="margin-top: 10px; color: #ccc;">${error.message}</p>
          </div>
        `;
      }
    }
  } else {
    console.error('Canvas atau InfiniteGridMenu tidak ditemukan!');
  }
})();