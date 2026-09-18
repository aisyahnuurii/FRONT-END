
// Reveal on scroll
function initReveal(){
  const items = document.querySelectorAll('.reveal');
  if(!('IntersectionObserver' in window)){
    items.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  items.forEach(el => io.observe(el));
}

// Navbar transparency + mobile toggle + active link highlight
function initNavbar(){
  const nav = document.querySelector('.navbar');
  if(!nav) return;
  const onScroll = () => {
    if(window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(toggle && links){
    toggle.addEventListener('click', ()=> links.classList.toggle('open'));
    links.querySelectorAll('a').forEach(a=> a.addEventListener('click', ()=> links.classList.remove('open')));
  }

  const current = document.body.getAttribute('data-page');
  if(current){
    document.querySelectorAll('.nav-links a').forEach(a=>{
      if(a.dataset.page === current) a.classList.add('active');
    });
  }
}

// Generates a flat-design SVG blob background for placeholder photos
function flatSVG(seedColor, accent){
  return `
  <svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="150" fill="${seedColor}"/>
    <circle cx="160" cy="20" r="45" fill="${accent}" opacity="0.5"/>
    <polygon points="0,150 60,90 120,150" fill="${accent}" opacity="0.35"/>
    <circle cx="30" cy="30" r="18" fill="#ffffff" opacity="0.25"/>
  </svg>`;
}

document.addEventListener('DOMContentLoaded', ()=>{
  initReveal();
  initNavbar();
});
