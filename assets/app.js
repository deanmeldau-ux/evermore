/* Evermore — front-end data layer (localStorage demo) + helpers.
   NOTE: This is a browser-only MVP so couples/guests can try the full flow.
   For real multi-device persistence, swap these functions for API calls (week 2). */
(function (global) {
  var KEY = 'evermore.weddings.v1';

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(db) { localStorage.setItem(KEY, JSON.stringify(db)); }
  function uid() { return Math.random().toString(36).slice(2, 8); }

  function param(name) { return new URLSearchParams(location.search).get(name); }

  var Evermore = {
    /* ---- weddings ---- */
    createWedding: function (data) {
      var db = load();
      var id = data.id || uid();
      db[id] = Object.assign({ id: id, rsvps: [], photos: [], template: 'rose', created: Date.now() }, data, { id: id });
      if (!db[id].rsvps) db[id].rsvps = [];
      if (!db[id].photos) db[id].photos = [];
      if (!db[id].template) db[id].template = 'rose';
      save(db);
      return db[id];
    },
    getWedding: function (id) {
      var w = load()[id];
      if (!w && id === 'demo') { this.seedDemo(); w = load()['demo']; } /* always have a demo to show */
      return w || null;
    },
    currentId: function () { return param('w') || localStorage.getItem('evermore.lastWedding'); },
    setCurrent: function (id) { localStorage.setItem('evermore.lastWedding', id); },
    allWeddings: function () { return Object.values(load()); },

    /* ---- rsvps ---- */
    addRSVP: function (weddingId, rsvp) {
      var db = load(); var w = db[weddingId]; if (!w) return null;
      rsvp.id = uid(); rsvp.at = Date.now();
      w.rsvps = w.rsvps || []; w.rsvps.push(rsvp);
      save(db); return rsvp;
    },
    getRSVPs: function (weddingId) { var w = this.getWedding(weddingId); return w ? (w.rsvps || []) : []; },
    stats: function (weddingId) {
      var r = this.getRSVPs(weddingId);
      var attending = r.filter(function (x) { return x.attending === 'yes'; });
      var heads = attending.reduce(function (s, x) { return s + (parseInt(x.party, 10) || 1); }, 0);
      return {
        responses: r.length,
        attending: attending.length,
        declined: r.filter(function (x) { return x.attending === 'no'; }).length,
        guests: heads
      };
    },

    /* ---- photo wall (the QR-at-the-wedding feature) ---- */
    addPhoto: function (weddingId, dataUrl, caption) {
      var db = load(); var w = db[weddingId]; if (!w) return null;
      w.photos = w.photos || [];
      var p = { id: uid(), src: dataUrl, caption: caption || '', at: Date.now() };
      w.photos.unshift(p);
      try { save(db); } catch (e) { w.photos.shift(); return null; } /* quota guard */
      return p;
    },
    getPhotos: function (weddingId) { var w = this.getWedding(weddingId); return w ? (w.photos || []) : []; },

    /* base visual themes (invite applies the tpl-<key> class) */
    templates: [
      { key: 'rose', name: 'Rosé', motif: '❀' }, { key: 'ivory', name: 'Blanc', motif: '✦' },
      { key: 'gilded', name: 'Gilded', motif: '❦' }, { key: 'botanical', name: 'Botanical', motif: '✿' },
      { key: 'blush', name: 'Blush', motif: '❀' }, { key: 'sage', name: 'Sage', motif: '❧' },
      { key: 'dusk', name: 'Dusk', motif: '✧' }, { key: 'noir', name: 'Noir', motif: '◆' },
      { key: 'coral', name: 'Coral', motif: '❦' }, { key: 'sky', name: 'Sky', motif: '❖' }
    ],
    /* named design collections shown in the gallery + create picker (theme = which tpl-* to apply) */
    designs: [
      { key: 'rose', name: 'Rosé', theme: 'rose', motif: '❀' },
      { key: 'blanc', name: 'Blanc', theme: 'ivory', motif: '✦' },
      { key: 'gilded', name: 'Gilded', theme: 'gilded', motif: '❦' },
      { key: 'botanical', name: 'Botanical', theme: 'botanical', motif: '✿' },
      { key: 'eloise', name: 'Eloise', theme: 'blush', motif: '❀' },
      { key: 'protea', name: 'Protea', theme: 'sage', motif: '✿' },
      { key: 'fynbos', name: 'Fynbos', theme: 'sage', motif: '❧' },
      { key: 'juliet', name: 'Juliet', theme: 'coral', motif: '❦' },
      { key: 'celeste', name: 'Celeste', theme: 'sky', motif: '✧' },
      { key: 'verbena', name: 'Verbena', theme: 'dusk', motif: '❀' },
      { key: 'noir', name: 'Noir', theme: 'noir', motif: '◆' },
      { key: 'amalfi', name: 'Amalfi', theme: 'sky', motif: '❖' },
      { key: 'karoo', name: 'Karoo', theme: 'gilded', motif: '❧' },
      { key: 'lumiere', name: 'Lumière', theme: 'ivory', motif: '✦' },
      { key: 'marble', name: 'Marble', theme: 'noir', motif: '◇' },
      { key: 'stellenbosch', name: 'Stellenbosch', theme: 'sage', motif: '❧' }
    ],
    getDesign: function (key) { for (var i = 0; i < this.designs.length; i++) { if (this.designs[i].key === key) return this.designs[i]; } return this.designs[0]; },
    /* stationery categories (what you can make — all free) */
    categories: [
      { key: 'website', label: 'Wedding Websites' },
      { key: 'invitation', label: 'Invitations' },
      { key: 'savedate', label: 'Save the Dates' },
      { key: 'thankyou', label: 'Thank You Cards' }
    ],

    /* ---- helpers ---- */
    qr: function (data, size) { size = size || 220; return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&margin=10&color=4A423E&data=' + encodeURIComponent(data); },
    param: param,
    baseUrl: function () { return location.origin + location.pathname.replace(/[^/]*$/, ''); },
    fmtDate: function (iso) {
      if (!iso) return ''; try {
        return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) { return iso; }
    },

    /* ---- curated photography (Unsplash CDN) ---- */
    IMG: {
      hero: '1536113906904-15bfc5b63fc9', couple: '1580824456266-c578703e13da',
      story: '1591604442449-ecc9943efabf', ceremony: '1723832347953-83c28e2d4dd2',
      reception: '1525441273400-056e9c7517b3', invitations: '1492175742197-ed20dc5a6bed',
      joy: '1571984129381-41d698ebca6b', detail: '1596457221755-b96bc3a6df18',
      ballroom: '1587271407850-8d438ca9fdf2', aisle: '1469371670807-013ccf25f16a',
      water: '1549417229-7686ac5595fd', stair: '1588436199517-f2b12041a7cc'
    },
    img: function (id, w) { return 'https://images.unsplash.com/photo-' + id + '?q=75&auto=format&fit=crop&w=' + (w || 1200); },
    photoFor: function (name, w) { return this.img(this.IMG[name] || this.IMG.couple, w); },

    /* ---- gentle motion: reveal-on-scroll ---- */
    reveal: function () {
      var els = [].slice.call(document.querySelectorAll('.reveal'));
      function show(e) { e.classList.add('in'); }
      if (!('IntersectionObserver' in window)) { els.forEach(show); return; }
      var vh = window.innerHeight || 800;
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { show(x.target); io.unobserve(x.target); } });
      }, { threshold: 0.08 });
      els.forEach(function (e) {
        if (e.getBoundingClientRect().top < vh * 0.95) { show(e); } /* above the fold: show at once */
        else { io.observe(e); }
      });
    },

    /* ---- live countdown to the wedding ---- */
    countdown: function (iso, el) {
      if (!el || !iso) { if (el) el.style.display = 'none'; return; }
      function tick() {
        var diff = new Date(iso + 'T15:00:00') - new Date();
        if (isNaN(diff)) { el.style.display = 'none'; return; }
        if (diff < 0) { el.innerHTML = '<div class="cd"><div class="n">&#10084;</div><div class="u">Married</div></div>'; return; }
        var d = Math.floor(diff / 864e5), h = Math.floor(diff % 864e5 / 36e5), m = Math.floor(diff % 36e5 / 6e4);
        el.innerHTML = [[d, 'Days'], [h, 'Hours'], [m, 'Minutes']].map(function (p) {
          return '<div class="cd"><div class="n">' + p[0] + '</div><div class="u">' + p[1] + '</div></div>';
        }).join('');
      }
      tick(); setInterval(tick, 60000);
    },

    /* ---- demo seed so the dashboard looks alive ---- */
    seedDemo: function () {
      var db = load();
      if (db['demo']) return 'demo';
      var w = this.createWedding({
        id: 'demo', partnerA: 'Thandi', partnerB: 'Liam', date: '2026-11-14',
        venue: 'Boschendal Estate, Franschhoek', story: 'Two years, one unforgettable yes.', template: 'rose'
      });
      // seed real guest photos so the wall looks alive in the demo
      var self0 = this;
      ['joy', 'detail', 'aisle', 'water', 'reception', 'ceremony', 'stair'].forEach(function (k) {
        self0.addPhoto('demo', self0.img(self0.IMG[k], 600), '');
      });
      var seed = [
        { name: 'Sarah Naidoo', attending: 'yes', party: 2, song: 'At Last — Etta James', diet: 'Vegetarian' },
        { name: 'Pieter van Wyk', attending: 'yes', party: 1, song: '', diet: '' },
        { name: 'Aunty Grace', attending: 'yes', party: 4, song: 'Burn for You', diet: 'Halaal' },
        { name: 'Mike Roberts', attending: 'no', party: 0, song: '', diet: '' },
        { name: 'Lerato M.', attending: 'yes', party: 2, song: 'Adorn — Miguel', diet: '' }
      ];
      var self = this;
      seed.forEach(function (s) { self.addRSVP('demo', s); });
      return 'demo';
    }
  };

  global.Evermore = Evermore;
})(window);
