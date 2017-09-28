var headerEl = document.querySelector('.js-site-header');
var mobileTrigger = document.querySelector('.js-mobile-menu');

function toggleMobileMenu(e) {
  headerEl.classList.toggle('has-openMenu');
  e.target.innerHTML = (e.target.innerHTML === 'Menu') ? 'Close' : 'Menu';
}

mobileTrigger.addEventListener('click', toggleMobileMenu, false);