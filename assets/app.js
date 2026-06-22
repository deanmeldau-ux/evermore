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
      db[id] = Object.assign({ id: id, rsvps: [], created: Date.now() }, data, { id: id });
      if (!db[id].rsvps) db[id].rsvps = [];
      save(db);
      return db[id];
    },
    getWedding: function (id) { return load()[id] || null; },
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

    /* ---- helpers ---- */
    qr: function (data, size) { size = size || 220; return 'https://api.qrserver.com/v1/create-qr-code/?size=' + size + 'x' + size + '&margin=8&color=3E4B3A&data=' + encodeURIComponent(data); },
    param: param,
    baseUrl: function () { return location.origin + location.pathname.replace(/[^/]*$/, ''); },
    fmtDate: function (iso) {
      if (!iso) return ''; try {
        return new Date(iso + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      } catch (e) { return iso; }
    },

    /* ---- demo seed so the dashboard looks alive ---- */
    seedDemo: function () {
      var db = load();
      if (db['demo']) return 'demo';
      var w = this.createWedding({
        id: 'demo', partnerA: 'Thandi', partnerB: 'Liam', date: '2026-11-14',
        venue: 'Boschendal Estate, Franschhoek', story: 'Two years, one unforgettable yes.', theme: 'sage'
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
