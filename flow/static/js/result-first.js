function showFeature(index, color, event) {
  var source = event && event.currentTarget;
  var container = source ? source.closest('.feature-container') : document.querySelector('.feature-container');
  if (!container) return;
  var tabs = Array.from(container.querySelectorAll('.feature-tab'));
  var panels = Array.from(container.querySelectorAll('.feature-panel'));
  tabs.forEach(function (tab) {
    tab.classList.remove('active-blue', 'active-amber', 'active-purple', 'active-teal', 'active-rose', 'active-indigo');
    tab.setAttribute('aria-selected', 'false');
  });
  panels.forEach(function (panel) { panel.classList.remove('active'); });
  if (tabs[index]) {
    tabs[index].classList.add('active-' + color);
    tabs[index].setAttribute('aria-selected', 'true');
  }
  if (panels[index]) panels[index].classList.add('active');
}
window.showFeature = showFeature;

document.addEventListener('DOMContentLoaded', function () {
  var switcher = document.querySelector('.rf-project-switcher');
  var trigger = document.querySelector('.rf-project-trigger');
  if (switcher && trigger) {
    trigger.addEventListener('click', function () {
      var open = !switcher.classList.contains('is-open');
      switcher.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (event) {
      if (!switcher.contains(event.target)) closeSwitcher();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        closeSwitcher();
        trigger.blur();
      }
    });
    function closeSwitcher() {
      switcher.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  }

  document.querySelectorAll('.feature-container').forEach(function (container) {
    var tabs = Array.from(container.querySelectorAll('.feature-tab'));
    tabs.forEach(function (tab) {
      tab.setAttribute('aria-selected', 'false');
      tab.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          tab.click();
        }
      });
    });
    if (tabs[0]) showFeature(0, tabs[0].dataset.color || 'blue', { currentTarget: tabs[0] });
  });

  if (window.GLightbox) {
    window.GLightbox({ selector: '.glightbox', touchNavigation: true, loop: true });
  }

  document.querySelectorAll('.rf-image-strip').forEach(function (strip) {
    var shell = strip.closest('.rf-image-strip-shell');
    var lazyImages = Array.from(strip.querySelectorAll('img[data-src]'));

    function loadImage(image) {
      if (!image.dataset.src) return;
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    }

    if ('IntersectionObserver' in window) {
      var imageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          loadImage(entry.target);
          observer.unobserve(entry.target);
        });
      }, { root: strip, rootMargin: '0px 96px', threshold: 0.01 });
      lazyImages.forEach(function (image) { imageObserver.observe(image); });
    } else {
      lazyImages.forEach(loadImage);
    }

    var hintFrame = 0;
    function updateScrollHint() {
      hintFrame = 0;
      var atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2;
      if (shell) shell.classList.toggle('is-at-end', atEnd);
    }
    function requestHintUpdate() {
      if (!hintFrame) hintFrame = window.requestAnimationFrame(updateScrollHint);
    }
    strip.addEventListener('scroll', requestHintUpdate, { passive: true });
    window.addEventListener('resize', requestHintUpdate, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(requestHintUpdate).observe(strip);
    requestHintUpdate();
  });

  ['t2i-table', 'edit-table'].forEach(function (tableId) {
    var table = document.getElementById(tableId);
    if (!table) return;
    var headers = Array.from(table.querySelectorAll('thead th'));
    var labels = headers.map(function (header) { return header.textContent.trim(); });
    var activeIndex = -1;
    var ascending = true;

    headers.forEach(function (header, index) {
      header.tabIndex = 0;
      header.setAttribute('role', 'button');
      header.addEventListener('click', function () { sortBy(index); });
      header.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          sortBy(index);
        }
      });
    });

    function sortBy(index) {
      var rows = Array.from(table.querySelectorAll('tbody tr'));
      var nextAscending = activeIndex === index ? !ascending : true;
      rows.sort(function (a, b) {
        var left = cellValue(a, index);
        var right = cellValue(b, index);
        var leftNumber = parseFloat(left);
        var rightNumber = parseFloat(right);
        if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
          return nextAscending ? leftNumber - rightNumber : rightNumber - leftNumber;
        }
        return nextAscending ? left.localeCompare(right) : right.localeCompare(left);
      });
      rows.forEach(function (row) { table.tBodies[0].appendChild(row); });
      headers.forEach(function (item, itemIndex) {
        item.textContent = labels[itemIndex];
        item.removeAttribute('aria-sort');
      });
      headerState(headers[index], labels[index], nextAscending);
      activeIndex = index;
      ascending = nextAscending;
    }
  });
});

function cellValue(row, index) {
  var cell = row.children[index];
  return cell ? cell.textContent.replace(/[★↑↓]/g, '').trim() : '';
}

function headerState(header, label, ascending) {
  header.textContent = label + (ascending ? ' ↑' : ' ↓');
  header.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
}
