/* team.js — Circular Gallery dengan OGL + Logika Klik
Vanilla JS port dari React Bits CircularGallery*/
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'https://esm.sh/ogl@0.0.40';

// HELPER FUNCTIONS 
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) {
  return p1 + (p2 - p1) * t;
}

function getFontSize(font) {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 30;
}

function createTextTexture(gl, text, font, color) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(getFontSize(font) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = 'middle';
  context.textAlign = 'center';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

// TITLE CLASS 
class Title {
  constructor({ gl, plane, text, textColor, font }) {
    this.gl = gl;
    this.plane = plane;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragment: `precision highp float; uniform sampler2D tMap; varying vec2 vUv; void main() { vec4 color = texture2D(tMap, vUv); if (color.a < 0.1) discard; gl_FragColor = color; }`,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

// MEDIA CLASS 
class Media {
  constructor({ geometry, gl, image, index, length, scene, screen, text, link, viewport, bend, textColor, borderRadius, font }) {
    this.extra = 0;
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.link = link; // <-- Tambahan: Simpan link navigasi
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.createKlikIndicator(); // <-- Tambahan: Buat indikator "KLIK!"
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime; uniform float uSpeed; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        varying vec2 vUv;
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
           vec2 d = abs(p) - b;
           return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
         }
         void main() {
           vec2 ratio = vec2(
             min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
             min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
           );
           vec2 uv = vec2(
             vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
             vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
           );
           vec4 color = texture2D(tMap, uv);
           float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
           float edgeSmooth = 0.002;
           float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
           gl_FragColor = vec4(color.rgb, alpha);
         }
       `,
       uniforms: {
         tMap: { value: texture },
         uPlaneSizes: { value: [0, 0] },
         uImageSizes: { value: [0, 0] },
         uSpeed: { value: 0 },
         uTime: { value: 100 * Math.random() },
         uBorderRadius: { value: this.borderRadius }
       },
       transparent: true
     });
     const img = new Image();
     img.crossOrigin = 'anonymous';
     img.src = this.image;
     img.onload = () => {
       texture.image = img;
       this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
     };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      text: this.text,
      textColor: this.textColor,
      font: this.font
    });
  }

  // <-- TAMBAHAN: Membuat teks "KLIK!" yang tersembunyi secara default
  createKlikIndicator() {
    const { texture, width, height } = createTextTexture(this.gl, "KLIK!", this.font, "#EF4444"); // Warna merah (--red)
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragment: `precision highp float; uniform sampler2D tMap; varying vec2 vUv; void main() { vec4 color = texture2D(tMap, vUv); if (color.a < 0.1) discard; gl_FragColor = color; }`,
      uniforms: { tMap: { value: texture } },
      transparent: true
    });
    this.klikMesh = new Mesh(this.gl, { geometry, program });
    
    // Atur ukuran dan posisi di ATAS kartu
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.12;
    const textWidth = textHeight * aspect;
    this.klikMesh.scale.set(textWidth, textHeight, 1);
    this.klikMesh.position.y = this.plane.scale.y * 0.5 + textHeight * 0.6; // Posisi di atas kartu
    this.klikMesh.position.z = 0.05; // Sedikit maju agar tidak tembus kartu
    this.klikMesh.setParent(this.plane);
    this.klikMesh.visible = false; // Sembunyikan default
  }

  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    
    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }

    // <-- TAMBAHAN: Logika menampilkan "KLIK!" jika berada di dekat tengah (x ≈ 0)
    const isCentered = Math.abs(this.plane.position.x) < 1.2; // Threshold jarak tengah
    if (isCentered && this.link) {
      this.klikMesh.visible = true;
    } else {
      this.klikMesh.visible = false;
    }
  }

  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) this.viewport = viewport;
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

// APP CLASS 
class App {
  constructor(container, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase }) {
    this.container = container;
    this.scrollSpeed = scrollSpeed || 2;
    this.scroll = { ease: scrollEase || 0.05, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.update();
    this.addEventListeners();
    this.addClickNavigation(); // <-- TAMBAHAN: Listener untuk klik navigasi
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2)
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.gl.canvas);
    this.gl.canvas.style.width = '100%';
    this.gl.canvas.style.height = '100%';
    this.gl.canvas.style.display = 'block';
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 });
  }

  createMedias(items, bend, textColor, borderRadius, font) {
    const defaultItems = [
      { image: 'https://picsum.photos/seed/ceo/800/600', text: 'CEO & Founder', link: 'nsh/hbd/pinn.html' },
      { image: 'https://picsum.photos/seed/dev/800/600', text: 'Lead Developer', link: 'nsh/hbd/pinn.html' },
      { image: 'https://picsum.photos/seed/design/800/600', text: 'UI/UX Designer', link: 'nsh/hbd/pinn.html' },
      { image: 'https://picsum.photos/seed/marketing/800/600', text: 'Marketing Head', link: 'nsh/hbd/pinn.html' }
    ];
    
    const galleryItems = items && items.length ? items : defaultItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        link: data.link, // <-- Teruskan link
        viewport: this.viewport,
        bend: bend || 2.5,
        textColor: textColor || '#111827',
        borderRadius: borderRadius || 0.05,
        font: font || "bold 28px 'Slackey', cursive"
      });
    });
  }

  // <-- TAMBAHAN: Logika Klik Navigasi
  addClickNavigation() {
    this.container.addEventListener('click', () => {
      // Cari item yang sedang berada di tengah (posisi x mendekati 0)
      // Dan pastikan galeri tidak sedang bergerak cepat (scroll speed rendah)
      const isSettled = Math.abs(this.scroll.current - this.scroll.target) < 0.5;
      
      if (isSettled) {
        const activeMedia = this.medias.find(m => Math.abs(m.plane.position.x) < 1.5 && m.link);
        if (activeMedia) {
          // Opsional: Tambahkan efek visual kecil sebelum pindah (misal: console log)
          console.log(`Navigasi ke: ${activeMedia.link}`);
          window.location.href = activeMedia.link;
        }
      }
    });
  }

  onTouchDown(e) {
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = e.touches ? e.touches[0].clientX : e.clientX;
  }

  onTouchMove(e) {
    if (!this.isDown) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = this.scroll.position + distance;
  }

  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY || e.wheelDelta || e.detail;
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2;
    this.onCheckDebounce();
  }

  onKeyDown(e) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        this.scroll.target += this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        this.scroll.target -= this.scrollSpeed * 5;
        this.onCheckDebounce();
        break;
      case 'Home':
        e.preventDefault();
        this.scroll.target = 0;
        this.onCheckDebounce();
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight
    };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) {
      this.medias.forEach(media => media.onResize({ screen: this.screen, viewport: this.viewport }));
    }
  }

  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left';
    if (this.medias) {
      this.medias.forEach(media => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener('resize', this.boundOnResize);
    window.addEventListener('wheel', this.boundOnWheel, { passive: false });
    window.addEventListener('mousedown', this.boundOnTouchDown);
    window.addEventListener('mousemove', this.boundOnTouchMove);
    window.addEventListener('mouseup', this.boundOnTouchUp);
    window.addEventListener('touchstart', this.boundOnTouchDown, { passive: true });
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true });
    window.addEventListener('touchend', this.boundOnTouchUp, { passive: true });
    this.container.addEventListener('keydown', this.boundOnKeyDown);
  }

  destroy() {
    if (this.raf) window.cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.boundOnResize);
    window.removeEventListener('wheel', this.boundOnWheel);
    window.removeEventListener('mousedown', this.boundOnTouchDown);
    window.removeEventListener('mousemove', this.boundOnTouchMove);
    window.removeEventListener('mouseup', this.boundOnTouchUp);
    window.removeEventListener('touchstart', this.boundOnTouchDown);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('touchend', this.boundOnTouchUp);
    this.container.removeEventListener('keydown', this.boundOnKeyDown);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

// INISIALISASI 
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('circular-gallery');
  if (!container) return;


  const teamItems = [
    { image: '../foto/1.png', text: 'DH', link: '../dh/pin.html' },
    { image: '../foto/2.png', text: 'ND', link: '../nd/pin.html' },
    { image: '../foto/3.png', text: 'KY', link: '../ky/pin.html' },
    { image: '../foto/4.png', text: 'NSH', link: '../nsh/pin.html' },
    { image: '../foto/6.png', text: 'RR', link: '../rr/pin.html' }
  ];

  const gallery = new App(container, {
    items: teamItems,
    bend: 2.5,
    textColor: '#111827',
    borderRadius: 0.05,
    font: "bold 28px 'Slackey', cursive",
    scrollSpeed: 2,
    scrollEase: 0.05
  });

  window._circularGallery = gallery;
});

window.addEventListener('beforeunload', function() {
  if (window._circularGallery) {
    window._circularGallery.destroy();
    window._circularGallery = null;
  }
});