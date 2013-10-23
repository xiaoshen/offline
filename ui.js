(function() {
  var TEMPLATE, addClass, createFromHTML, el, removeClass, render;

  if (!window.Offline) {
    throw new Error("Offline UI brought in without offline.js");
  }

  TEMPLATE = '<div class="offline-ui"></div>';

  createFromHTML = function(html) {
    var el;
    el = document.createElement('div');
    el.innerHTML = html;
    return el.children[0];
  };

  addClass = function(el, name) {
    return el.className += " " + name;
  };

  removeClass = function(el, name) {
    return el.className = el.className.replace(new RegExp(name.split(' ').join('|'), 'gi'), '');
  };

  el = null;

  (render = function() {
    if (el == null) {
      el = createFromHTML(TEMPLATE);
      document.body.appendChild(el);
    }
    if (Offline.state === 'up') {
      removeClass(el, 'offline-ui-down');
      return addClass(el, 'offline-ui-up');
    } else {
      removeClass(el, 'offline-ui-up');
      return addClass(el, 'offline-ui-down');
    }
  })();

  Offline.on('reconnect:connecting', function() {
    addClass(el, 'offline-ui-connecting');
    return removeClass(el, 'offline-ui-waiting');
  });

  Offline.on('reconnect:tick', function() {
    addClass(el, 'offline-ui-waiting');
    removeClass(el, 'offline-ui-connecting');
    return el.setAttribute('data-retry-in', Offline.reconnect.remaining);
  });

  Offline.on('reconnect:stopped', function() {
    removeClass(el, 'offline-ui-connecting offline-ui-waiting offline-ui-reconnecting');
    return el.setAttribute('data-retry-in', null);
  });

  Offline.on('reconnect:started', function() {
    return addClass(el, 'offline-ui-reconnecting');
  });

  Offline.on('up down', render);

}).call(this);