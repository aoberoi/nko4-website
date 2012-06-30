var nko = {};
(function(nko) {
  //// Vector
  nko.Vector = function(x, y) {
    if (typeof(x) === 'undefined') return
    if (typeof(x) === 'number') {
      this.x = x || 0;
      this.y = y || 0;
    } else if (0 in x) {
      this.x = x[0];
      this.y = x[1];
    } else if ('left' in x) {
      this.x = x.left;
      this.y = x.top;
    } else {
      this.x = x.x;
      this.y = x.y;
    }
  };
  nko.Vector.prototype = {
    constructor: nko.Vector,

    plus: function(other) {
      return new this.constructor(this.x + other.x, this.y + other.y);
    },

    minus: function(other) {
      return new this.constructor(this.x - other.x, this.y - other.y);
    },

    times: function(s) {
      return new this.constructor(this.x * s, this.y * s);
    },

    length: function() {
      return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
    },

    toString: function() {
      return this.x + 'px, ' + this.y + 'px';
    },

    cardinalDirection: function() {
      if (Math.abs(this.x) > Math.abs(this.y))
        return this.x < 0 ? 'w' : 'e';
      else
        return this.y < 0 ? 'n' : 's';
    }
  };


  //// Thing
  nko.Thing = function(options) {
    if (!options) return;

    var self = this
      , options = options || {};

    this.name = options.name;
    this.pos = new nko.Vector(options.pos);
    this.size = new nko.Vector(options.size);
    this.ready = options.ready;

    this.div = $('<div class="thing">').addClass(this.name);
    this.img = $('<img>', { src: '/images/734m/' + this.name + '.png' })
      .load(function() {
        self.size = new nko.Vector(this.width, this.height);
        self.draw();
      });
  };

  nko.Thing.prototype.getPosition = function() {
    return this.pos.plus(this.origin);
  };

  nko.Thing.prototype.toJSON = function() {
    return {
      name: this.name,
      pos: this.pos,
      size: this.size,
      origin: this.origin
    };
  };

  nko.Thing.prototype.resetOrigin = function() {
    this.origin = new nko.Vector(this.div.offsetParent().offset());
  };

  nko.Thing.prototype.draw = function draw() {
    var offset = new nko.Vector(this.size.x * -0.5, -this.size.y + 20);
    this.div
      .css({
        left: this.pos.x,
        top: this.pos.y,
        width: this.size.x,
        height: this.size.y,
        'z-index': Math.floor(this.pos.y),
        transform: Modernizr.csstransforms ? 'translate(' + offset.toString() + ')' : null,
        background: 'url(' + this.img.attr('src') + ')'
      })
      .appendTo($('#page'));
    this.resetOrigin();
    if (this.ready) this.ready();

    this.animate();

    return this;
  };

  nko.Thing.prototype.animate = function() { };

  nko.Thing.prototype.remove = function() {
    this.div.fadeOut(function() { $(this).remove(); });
  };


  //// Dude
  nko.Dude = function(options) {
    nko.Thing.call(this, options);

    this.state = 'idle';
    this.frame = 0;
    this.bubbleFrame = 0;
  };
  nko.Dude.prototype = new nko.Thing();
  nko.Dude.prototype.constructor = nko.Dude;

  nko.Dude.prototype.draw = function draw() {
    this.idleFrames = (this.size.x - 640) / 80;
    this.size.x = 80;

    this.bubble = $('<div class="bubble">')
      .css('bottom', this.size.y + 10)
      .appendTo(this.div);

    return nko.Thing.prototype.draw.call(this);
  };

  nko.Dude.prototype.frameOffset = { w: 0, e: 2, s: 4, n: 6, idle: 8 };
  nko.Dude.prototype.animate = function animate(state) {
    var self = this;

    clearTimeout(this.animateTimeout);
    if (state) this.state = state;

    var frames = this.state === 'idle' ? this.idleFrames : 2;
    this.frame = ((this.frame + 1) % frames);
    this.div.css('background-position', (-(this.frameOffset[this.state]+this.frame) * this.size.x) + 'px 0px');

    if (this.bubble && this.bubble.is(':visible')) {
      this.bubbleFrame = (this.bubbleFrame + 1) % 3;
      self.bubble
        .removeClass('frame-0 frame-1 frame-2')
        .addClass('frame-' + this.bubbleFrame);
    }

    this.animateTimeout = setTimeout(function() { self.animate() }, 400);
  };

  nko.Dude.prototype.goTo = function(pos, duration) {
    pos = new nko.Vector(pos).minus(this.origin);

    var self = this
      , delta = pos.minus(this.pos)
      , duration = duration !== undefined ? duration : delta.length() / 200 * 1000;
    this.animate(delta.cardinalDirection());
    if (duration && duration > 0)
      this.div.stop();
    this.div
      .animate({
        left: pos.x,
        top: pos.y
      }, {
        duration: duration,
        easing: 'linear',
        step: function(now, fx) {
          switch (fx.prop) {
            case 'left':
              self.pos.x = now;
              break;
            case 'top':
              self.pos.y = now;
              self.div.css('z-index', Math.floor(now));
              break;
          }
        },
        complete: function() {
          self.pos = pos;
          // z-index?
          self.animate('idle');
        }
      });
  };

  nko.Dude.prototype.warp = function(pos) {
    var self = this;

    this.div
      .stop()
      .fadeToggle(function() {
        self.goTo(pos, 0);
        self.div.fadeToggle();
      });
  };

  nko.Dude.prototype.speak = function(text) {
    if (!text)
      this.bubble.fadeOut();
    else
      this.bubble
        .text(text)
        .scrollTop(this.bubble.prop("scrollHeight"))
        .fadeIn();
  };


  $(function() {
    //// a dude
    var types = [ 'suit', 'littleguy', 'beast', 'gifter' ];
    var me = nko.me = new nko.Dude({
      name: types[Math.floor(types.length * Math.random())],
      pos: new nko.Vector(-100, -100),
      ready: function() {
        this.speak('type to chat. click to move around.');
        speakTimeout = setTimeout(function() { me.speak(''); }, 5000);
      }
    });

    // random dude placement
    $(window).load(function() {
      var el = $(location.hash)
      if (el.length === 0) el = $('body');
      nko.warpTo(el);
    });


    //// networking
    var dudes = nko.dudes = {};
    var ws = nko.ws = io.connect(null, {
      'port': '#socketIoPort#'
    });
    ws.on('connect', function() {
      (function heartbeat() {
        nko.send({ obj: me }, true);
        setTimeout(heartbeat, 5000);
      })();
    });
    ws.on('message', function(data) {
      var dude = dudes[data.id];

      if (data.disconnect && dude) {
        dude.remove();
        delete dudes[data.id];
      }

      if (data.obj && !dude && data.obj.pos.x < 10000 && data.obj.pos.y < 10000)
        dude = dudes[data.id] = new nko.Dude(data.obj).draw();

      if (dude && data.method) {
        dude.origin = data.obj.origin;
        nko.Dude.prototype[data.method].apply(dude, data.arguments);
      }
    });


    //// helper methods
    function randomPositionOn(selector) {
      var page = $(selector)
        , pos = page.position()

      return new nko.Vector(pos.left + 20 + Math.random() * (page.width()-40),
                            pos.top + 20 + Math.random() * (page.height()-40));
    }

    nko.warpTo = function warpTo(selector) {
      var page = $(selector)
        , pos = page.position();

      pos = randomPositionOn(page);

      me.warp(pos);
      nko.send({
        obj: me,
        method: 'warp',
        arguments: [ pos ]
      });
    }
    nko.goTo = function goTo(selector) {
      var page = $(selector);
      if (page.length === 0) return;

      var $window = $(window)
        , pos = page.offset()
        , left = pos.left - ($window.width() - page.width()) / 2
        , top = pos.top - ($window.height() - page.height()) / 2;

      $('body')
        .stop()
        .animate({ scrollLeft: left, scrollTop: top }, 1000);

      pos = randomPositionOn(page);

      me.goTo(pos);
      nko.send({
        obj: me,
        method: 'goTo',
        arguments: [ pos ]
      });

      page.click();
    };
    nko.send = function send(data, heartbeat) {
      if (!ws) return;
      var now = Date.now();

      if (now - ws.lastSentAt < 10) return; //throw Error('throttled');
      ws.lastSentAt = now;

      if (!heartbeat || ws.lastActionAt)
        ws.json.send(data);

      // disconnect after 1 hour of idling; refresh after 2 hours
      if (now - ws.lastActionAt > 3600000) ws.disconnect();
      if (now - ws.lastActionAt > 7200000) location.reload();
      if (!heartbeat) ws.lastActionAt = now;
    };


    //// event listeners

    // enter watchmaker land
    $('.thing.streetlamp').live('click touchend', function() {
      $('#inner').fadeToggle()
    });

    // movement
    $(window)
      .resize(_.debounce(function() { me.resetOrigin(); }, 300))
      .click(function(e) { // move on click
        if (e.pageX === undefined || e.pageY === undefined) return;
        var pos = { x: e.pageX, y: e.pageY };
        me.goTo(pos);
        nko.send({
          obj: me,
          method: 'goTo',
          arguments: [ pos ]
        });
      })
      .keydown(function(e) {
        if ($(e.target).is('input')) return true;
        if (e.altKey) return true;
        var d = (function() {
          switch (e.keyCode) {
            case 37: // left
              return new nko.Vector(-5000, 0);
            case 38: // up
              return new nko.Vector(0, -5000);
            case 39: // right
              return new nko.Vector(+5000, 0);
            case 40: // down
              return new nko.Vector(0, +5000);
          }
        })();
        if (d) {
          if (me.keyNav) return false;
          var pos = me.getPosition().plus(d);
          me.goTo(pos);
          nko.send({
            obj: me,
            method: 'goTo',
            arguments: [ pos ]
          });
          me.keyNav = true;
          return false;
        }
      })
      .keyup(function(e) {
        if ($(e.target).is('input')) return true;
        if (e.altKey) return true;
        switch (e.keyCode) {
          case 37: // left
          case 38: // up
          case 39: // right
          case 40: // down
            me.goTo(me.getPosition(), 1);
            nko.send({
              obj: me,
              method: 'goTo',
              arguments: [ me.getPosition(), 1 ]
            });
            me.keyNav = false;
            return false;
        }
      });

    // ios
    var moved = false;
    $('body')
      .bind('touchmove', function(e) { moved = true; })
      .bind('touchend', function(e) { // move on touch
        if (moved) return moved = false;
        var t = e.originalEvent.changedTouches.item(0);
        me.goTo(new nko.Vector(t.pageX, t.pageY));
      })
      .on('click', '.slide', function() {
        var $this = $(this)
          , id = $(this).attr('id');
        $this.removeAttr('id');
        location.hash = '#' + id;
        $this.attr('id', id);
      });

    // chat
    var speakTimeout, $text = $('<textarea>')
      .appendTo($('<div class="textarea-container">')
      .appendTo(me.div))
      .bind('keyup', function(e) {
        var text = $text.val();
        switch (e.keyCode) {
          case 13:
            $text.val('');
            return false;
          default:
            me.speak(text);
            nko.send({
              obj: me,
              method: 'speak',
              arguments: [ text ]
            });
            clearTimeout(speakTimeout);
            speakTimeout = setTimeout(function() {
              $text.val('');
              me.speak();
              nko.send({
                obj: me,
                method: 'speak'
              });
            }, 5000);
        }
      }).focus();
    $(document).keylisten(function(e) {
      var slide = Number(location.hash.replace('#slide-', ''));
      switch (e.keyName) {
        case 'alt+right':
          return nko.goTo('#slide-' + ++slide);
        case 'alt+left':
          return nko.goTo('#slide-' + --slide);
      }

      if (e.altKey || e.ctrlKey || e.metaKey) return true;
      switch (e.keyName) {
        case 'meta':
        case 'meta+ctrl':
        case 'ctrl':
        case 'alt':
        case 'shift':
        case 'up':
        case 'down':
        case 'left':
        case 'right':
          return;
        default:
          $text.focus()
      }
    });


    //// flare
    nko.map = function map(map) {
      $.each(map, function() {
        for (var name in this)
          new nko.Thing({ name: name, pos: new nko.Vector(this[name]) });
      });
    };
    nko.map([
      { 'streetlamp': [  -10, 160  ] },
      { 'livetree':   [  -80, 120  ] },
      { 'livetree':   [  580, 80   ] },
      { 'livetree':   [ 1000, 380  ] },
      { 'deadtree':   [ 1050, 420  ] },

      //// lounge
      { 'livetree':   [  -60, 870  ] },
      { 'deadtree':   [    0, 900  ] },
      { 'portopotty': [   80, 900  ] },
      { 'livetree':   [  550, 1050 ] },
      { 'livetree':   [  500, 1250 ] },
      { 'deadtree':   [  560, 1300 ] },
      { 'desk':       [  500, 1350 ] },
      { 'livetree':   [  120, 1800 ] },
      { 'deadtree':   [   70, 1700 ] },
      { 'livetree':   [  -10, 1900 ] }
    ]);
  });
})(nko); // export nko
