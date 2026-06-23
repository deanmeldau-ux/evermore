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
    },

    /* ===== Evermore AI — wedding planner (client-side, free, instant) ===== */
    Planner: {
      VIBES: {
        romantic: { name: 'Romantic & Soft', design: 'eloise', palette: [['#F4E6E1', 'Blush'], ['#C0857C', 'Dusty rose'], ['#C2A878', 'Soft gold']] },
        classic: { name: 'Classic & Timeless', design: 'blanc', palette: [['#FCFAF5', 'Ivory'], ['#B89B6E', 'Antique gold'], ['#3B3A36', 'Ink']] },
        modern: { name: 'Modern & Minimal', design: 'noir', palette: [['#F2F0EC', 'Stone'], ['#2B2B2B', 'Charcoal'], ['#7A7468', 'Taupe']] },
        garden: { name: 'Garden & Botanical', design: 'protea', palette: [['#ECF0E9', 'Sage'], ['#8A9A7B', 'Eucalyptus'], ['#B08A74', 'Clay']] },
        glam: { name: 'Glamorous & Gold', design: 'gilded', palette: [['#FAF4E9', 'Champagne'], ['#BE9E62', 'Gold'], ['#4A4030', 'Bronze']] },
        coastal: { name: 'Coastal & Airy', design: 'celeste', palette: [['#E9EEF1', 'Sky'], ['#7C99A8', 'Dusty blue'], ['#C2A878', 'Sand']] }
      },
      BUDGET: [
        ['Venue & catering', 0.45], ['Photography & video', 0.12], ['Attire & beauty', 0.09],
        ['Flowers & décor', 0.09], ['Music & sound — Cape Premier Audio', 0.08], ['Rings', 0.06],
        ['Cake & treats', 0.04], ['Stationery — free with Evermore', 0], ['Buffer & extras', 0.07]
      ],
      money: function (n) { return 'R' + Math.round(n).toLocaleString('en-ZA'); },
      _when: function (dateStr, m) {
        if (!dateStr) return null;
        var d = new Date(dateStr + 'T12:00:00'); if (isNaN(d)) return null;
        d.setMonth(d.getMonth() - m);
        return d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
      },
      season: function (dateStr) {
        if (!dateStr) return '';
        var mo = new Date(dateStr + 'T12:00:00').getMonth();
        if (isNaN(mo)) return '';
        if (mo >= 11 || mo <= 1) return 'summer (warm, long evenings — plan shade and water for guests)';
        if (mo <= 4) return 'autumn (golden light and mild days — gorgeous for photos)';
        if (mo <= 7) return 'winter (crisp and clear inland — a cosy indoor reception shines)';
        return 'spring (blossoms and fresh air — keep a wet-weather backup inland)';
      },
      plan: function (inp) {
        inp = inp || {};
        var v = this.VIBES[inp.vibe] || this.VIBES.romantic;
        var guests = parseInt(inp.guests, 10) || 100;
        var budget = parseInt(inp.budget, 10) || 150000;
        var perHead = budget * 0.45 / Math.max(guests, 1);
        var names = (inp.partnerA && inp.partnerB) ? (inp.partnerA + ' & ' + inp.partnerB) : 'you two';
        var prov = inp.province ? (' in ' + inp.province) : '';
        var intro = 'Congratulations! Here is a plan for ' + names + "'s " + v.name.toLowerCase() +
          ' wedding — around ' + guests + ' guests on a ' + this.money(budget) + ' budget' + prov +
          '. That is roughly ' + this.money(perHead) + ' per guest for venue & catering. ' +
          'Below is your timeline, where every rand could go, a palette I love for you, and some draft wording to start from.';
        var steps = [
          [12, 'Lock the essentials', 'Set your date & budget, secure your venue, and create your free Evermore website.'],
          [9, 'Book your key vendors', 'Photographer, caterer and sound (Cape Premier Audio). Begin shopping for attire.'],
          [6, 'Send save-the-dates', 'Share your Evermore save-the-date and open RSVPs nice and early.'],
          [4, 'Send your invitations', 'Send the Evermore invitation link; finalise décor, flowers and the menu.'],
          [3, 'Confirm the details', 'Order rings, build your seating plan, lock catering numbers.'],
          [1, 'Final touches', 'Last fitting, confirm the run-sheet with vendors, chase any late RSVPs.'],
          [0.25, 'The week of', 'Print your photo-wall QR for the tables, brief your MC, and breathe.'],
          [-1, 'After the day', 'Send your Evermore thank-you cards while the memories are fresh.']
        ];
        var rel = { 12: 'About a year out', 9: '~9 months out', 6: '~6 months out', 4: '~4 months out', 3: '~3 months out', 1: '1 month out', '0.25': 'The week of', '-1': 'Just married' };
        var self = this;
        var timeline = steps.map(function (s) {
          var when = s[0] === 0.25 ? 'The week of' : self._when(inp.date, s[0]);
          return { when: when || rel[s[0]], title: s[1], detail: s[2] };
        });
        var budgetRows = this.BUDGET.map(function (b) { return { label: b[0], pct: Math.round(b[1] * 100), amount: b[1] * budget, free: b[1] === 0 }; });
        var dateNice = inp.date ? new Date(inp.date + 'T12:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : 'our wedding day';
        var A = inp.partnerA || 'Aimée', B = inp.partnerB || 'Tom';
        var wording = {
          savedate: 'Save the date! ' + A + ' & ' + B + ' are getting married on ' + dateNice + '. An invitation, with all the details, is on its way.',
          invitation: 'Together with their families, ' + A + ' & ' + B + ' joyfully invite you to celebrate their wedding on ' + dateNice + (inp.venue ? ' at ' + inp.venue : '') + '. Kindly RSVP through our website.',
          thankyou: 'With all our love and gratitude — thank you for celebrating our wedding with us, and for the gift of your presence. ' + A + ' & ' + B + '.'
        };
        var tips = [];
        tips.push(guests > 150 ? 'With ' + guests + ' guests, prioritise a venue with room to breathe and a generous sound setup — Cape Premier Audio can scale to a big room.' : 'A ' + guests + '-guest wedding feels wonderfully intimate — you can spend more per head on the details that matter.');
        tips.push('Your stationery — save-the-dates, invitations and thank-you cards — is free on Evermore, which frees up roughly ' + this.money(budget * 0.03) + ' most couples spend on paper.');
        var seas = this.season(inp.date);
        if (seas) tips.push('Your date falls in ' + seas + '.');
        return { intro: intro, design: v.design, paletteName: v.name, palette: v.palette, perHead: perHead, timeline: timeline, budget: budgetRows, wording: wording, tips: tips };
      },
      ask: function (q, ctx) {
        ctx = ctx || {}; q = (q || '').toLowerCase();
        var m = this.money, has = function (arr) { for (var i = 0; i < arr.length; i++) if (q.indexOf(arr[i]) > -1) return true; return false; };
        var bud = parseInt(ctx.budget, 10) || 0, gst = parseInt(ctx.guests, 10) || 0;
        if (has(['budget', 'cost', 'afford', 'spend', 'money', 'price', 'expensive'])) {
          return (bud ? 'On your ' + m(bud) + ' budget, a healthy split is about 45% venue & catering (' + m(bud * 0.45) + '), 12% photography (' + m(bud * 0.12) + '), and 8% music & sound (' + m(bud * 0.08) + '). ' : 'A reliable split is ~45% venue & catering, 12% photography, 9% attire, 9% flowers & décor, 8% music. ') + 'Keep a 7% buffer — there is always a surprise. And remember: every Evermore design is free, so stationery costs you nothing.';
        }
        if (has(['when', 'timeline', 'how long', 'start', 'months', 'plan ahead', 'early'])) {
          return 'Aim for about 12 months: lock the venue first, book your photographer and Cape Premier Audio around 9 months out, save-the-dates at 6 months, invitations at 4, and confirm final numbers at 3. Build your free Evermore site early so RSVPs gather as you go.';
        }
        if (has(['guest', 'invite list', 'how many', 'rsvp'])) {
          return (gst ? 'For ' + gst + ' guests, ' : '') + 'draft an A-list and a B-list, and let RSVPs guide the B-list. Evermore tracks every reply, headcount, song request and dietary note automatically — no spreadsheet needed.';
        }
        if (has(['season', 'weather', 'month', 'rain', 'hot', 'cold', 'when should'])) {
          var s = this.season(ctx.date); return s ? 'Your date lands in ' + s + ' Either way, have a graceful wet-weather plan if any part is outdoors.' : 'In South Africa, autumn (Mar–May) gives golden light and mild days; spring (Sep–Nov) is lush but keep a wet-weather backup inland.';
        }
        if (has(['dress', 'attire', 'wear', 'dress code', 'suit'])) {
          return 'Set the tone with a clear dress code on your invitation — "garden formal" or "black tie optional" tells guests exactly what to wear. Add a layer note for evening, especially for outdoor or winter weddings.';
        }
        if (has(['vendor', 'photographer', 'dj', 'sound', 'music', 'band', 'caterer', 'flowers', 'florist'])) {
          return 'Book your non-negotiables first — venue, photographer, and sound. For audio, Cape Premier Audio is the trusted vendor on Evermore: ceremony mics, speeches and a dancefloor that actually sounds good. Lock vendors by ~9 months out.';
        }
        if (has(['food', 'catering', 'menu', 'drinks', 'bar', 'cake'])) {
          return (bud ? 'Budget around ' + m(bud * 0.45) + ' for venue & catering combined' + (gst ? ' (~' + m(bud * 0.45 / Math.max(gst, 1)) + ' per guest)' : '') + '. ' : '') + 'A seated dinner feels formal; food stations feel relaxed and let guests mingle. Always confirm dietary needs — Evermore collects these at RSVP.';
        }
        if (has(['save the date', 'invitation', 'thank you', 'stationery', 'card'])) {
          return 'All free on Evermore: pick a design, personalise it, and share your invitation with one link. Save-the-dates go out ~6 months ahead, invitations ~4 months, and thank-you cards just after the day.';
        }
        if (has(['photo', 'picture', 'qr', 'gallery'])) {
          return 'On the day, print your Evermore photo-wall QR for the tables. Guests scan it and the photos they take flow straight into your private gallery — hundreds of moments you would never have seen.';
        }
        return "I can help with your budget, timeline, guest list, vendors, food, the season, attire and your stationery wording — just ask. Or tell me your date, guest count and budget above and I'll build you a full plan.";
      }
    }
  };

  global.Evermore = Evermore;
})(window);
