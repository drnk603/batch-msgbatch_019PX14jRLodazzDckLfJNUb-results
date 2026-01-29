(function () {
  var header = document.querySelector('.dr-header-inner');
  if (!header) return;

  var toggle = header.querySelector('.dr-nav-toggle');
  var nav = header.querySelector('.dr-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var isExpanded = toggle.getAttribute('aria-expanded') === 'true';
    var nextState = !isExpanded;
    toggle.setAttribute('aria-expanded', nextState ? 'true' : 'false');

    if (nextState) {
      header.classList.add('dr-nav-open');
    } else {
      header.classList.remove('dr-nav-open');
    }
  });
})();
