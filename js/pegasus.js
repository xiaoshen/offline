(function() {
  var clear, flush, held, holdRequest, makeRequest, waitingOnConfirm;

  if (!window.Offline) {
    throw new Error("Pegasus brought in without offline.js");
  }

  held = [];

  waitingOnConfirm = false;

  holdRequest = function(req) {
    console.log('holding', req);
    if (Offline.state !== 'down') {
      waitingOnConfirm = true;
    }
    return held.push(req);
  };

  makeRequest = function(_arg) {
    var body, name, password, type, url, user, val, xhr, _ref;
    xhr = _arg.xhr, url = _arg.url, type = _arg.type, user = _arg.user, password = _arg.password, body = _arg.body;
    console.log('remaking', xhr);
    xhr.abort();
    xhr.open(type, url, true, user, password);
    _ref = xhr.headers;
    for (name in _ref) {
      val = _ref[name];
      xhr.setRequestHeader(name, val);
    }
    if (xhr.mimeType) {
      xhr.overrideMimeType(xhr.mimeType);
    }
    return xhr.send(body);
  };

  clear = function() {
    console.log('clearing');
    return held = [];
  };

  flush = function() {
    var key, request, requests, url, _i, _len;
    requests = {};
    console.log('flush');
    for (_i = 0, _len = held.length; _i < _len; _i++) {
      request = held[_i];
      url = request.url.replace(/(\?|&)_=[0-9]+/, function(match, char) {
        if (char === '?') {
          return char;
        } else {
          return '';
        }
      });
      requests["" + (request.type.toUpperCase()) + " - " + url] = request;
    }
    for (key in requests) {
      request = requests[key];
      makeRequest(request);
    }
    return clear();
  };

  Offline.on('confirmed-up', function() {
    if (waitingOnConfirm) {
      waitingOnConfirm = false;
      return clear();
    }
  });

  Offline.on('up', flush);

  Offline.on('down', function() {
    return waitingOnConfirm = false;
  });

  Offline.onXHR(function(request) {
    var async, hold, xhr, _onreadystatechange, _send;
    xhr = request.xhr, async = request.async;
    console.log('on xhr', request);
    hold = function() {
      return holdRequest(request);
    };
    _send = xhr.send;
    xhr.send = function(body) {
      console.log('sending', body);
      request.body = body;
      return _send.apply(xhr, arguments);
    };
    if (!async) {
      return;
    }
    if (xhr.onprogress === null) {
      xhr.addEventListener('error', hold, false);
      return xhr.addEventListener('timeout', hold, false);
    } else {
      _onreadystatechange = xhr.onreadystatechange;
      return xhr.onreadystatechange = function() {
        if (xhr.readyState === 0) {
          hold();
        } else if (xhr.readyState === 4 && (xhr.status === 0 || xhr.status >= 12000)) {
          hold();
        }
        return typeof _onreadystatechange === "function" ? _onreadystatechange.apply(null, arguments) : void 0;
      };
    }
  });

  Offline.requests = {
    flush: flush,
    clear: clear
  };

}).call(this);