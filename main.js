/* Support magnétique — funnel logic (pricing, validation, FormSubmit, WhatsApp, UI) */
(function () {
  'use strict';

  // ---------- Config ----------
  var CONFIG = {
    stickyCta: true,
    showWhatsApp: true,
  };

  var PRODUCT = 'Support magnétique pliable multi-appareils';
  var PRICE = 2000;
  var HOME_EXTRA = 350;
  var METHODS = { stop: 'Stop Desk', home: 'Livraison à domicile' };
  var ENDPOINT = 'https://formsubmit.co/ajax/dazaiosa2000@gmail.com';
  var SUBJECT = 'Nouvelle commande - Support Magnétique - 2000 DA';
  var WHATSAPP = '213556011290';

  // [code, wilaya, Stop Desk price in DA]
  var WILAYAS = [
    [1, 'Adrar', 1100], [2, 'Chlef', 450], [3, 'Laghouat', 700], [4, 'Oum El Bouaghi', 500],
    [5, 'Batna', 500], [6, 'Béjaïa', 500], [7, 'Biskra', 600], [8, 'Béchar', 1100],
    [9, 'Blida', 450], [10, 'Bouira', 450], [11, 'Tamanrasset', 1400], [12, 'Tébessa', 600],
    [13, 'Tlemcen', 500], [14, 'Tiaret', 500], [15, 'Tizi Ouzou', 450], [16, 'Alger', 450],
    [17, 'Djelfa', 600], [18, 'Jijel', 500], [19, 'Sétif', 400], [20, 'Saïda', 600],
    [21, 'Skikda', 500], [22, 'Sidi Bel Abbès', 500], [23, 'Annaba', 500], [24, 'Guelma', 600],
    [25, 'Constantine', 450], [26, 'Médéa', 450], [27, 'Mostaganem', 500], [28, 'M’Sila', 500],
    [29, 'Mascara', 600], [30, 'Ouargla', 800], [31, 'Oran', 450], [32, 'El Bayadh', 800],
    [33, 'Illizi', 1700], [34, 'Bordj Bou Arréridj', 450], [35, 'Boumerdès', 450], [36, 'El Tarf', 600],
    [37, 'Tindouf', 1400], [38, 'Tissemsilt', 500], [39, 'El Oued', 800], [40, 'Khenchela', 600],
    [41, 'Souk Ahras', 600], [42, 'Tipaza', 450], [43, 'Mila', 500], [44, 'Aïn Defla', 450],
    [45, 'Naâma', 800], [47, 'Ghardaïa', 800], [48, 'Relizane', 500], [49, 'Timimoun', 1100],
    [50, 'Bordj Badji Mokhtar', 1700], [51, 'Ouled Djellal', 700], [52, 'Béni Abbès', 1100],
    [53, 'In Salah', 1100], [54, 'In Guezzam', 1700], [55, 'Touggourt', 800], [56, 'Djanet', 1700],
    [57, 'El M’Ghair', 800], [58, 'El Meniaa', 1000],
  ];
  var STOP_DESK = {};
  WILAYAS.forEach(function (w) { STOP_DESK[w[1]] = w[2]; });

  var ERRORS = {
    name: 'Veuillez entrer votre nom et prénom.',
    phone: 'Veuillez entrer un numéro de téléphone valide.',
    wilaya: 'Veuillez sélectionner votre wilaya.',
    method: 'Veuillez choisir un mode de livraison.',
  };

  // ---------- Pricing ----------
  function deliveryPrice(wilaya, method) {
    var sd = STOP_DESK[wilaya];
    if (!sd || !METHODS[method]) return null;
    return method === 'home' ? sd + HOME_EXTRA : sd;
  }

  // ---------- Phone ----------
  function normPhone(p) {
    var d = String(p || '').replace(/[\s.\-()]/g, '');
    if (d.indexOf('+213') === 0) d = '0' + d.slice(4);
    else if (d.indexOf('00213') === 0) d = '0' + d.slice(5);
    else if (d.indexOf('213') === 0 && d.length === 12) d = '0' + d.slice(3);
    return d;
  }
  function phoneOk(p) {
    var d = normPhone(p);
    return /^0[567]\d{8}$/.test(d) || /^0[2-4]\d{7}$/.test(d);
  }
  function fmtPhone(p) {
    var d = normPhone(p);
    return d.length === 10 ? d.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4') : d;
  }

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // ---------- State ----------
  var state = { method: '', tried: false, sending: false, done: false };

  var form = $('#order-form');
  var fName = $('#f-name');
  var fPhone = $('#f-phone');
  var fWilaya = $('#f-wilaya');
  var fHoney = $('input[name="_honey"]', form);
  var methodBtns = $$('.method', form);
  var methodsBox = $('#methods');
  var submitBtn = $('#submit-btn');
  var sendError = $('#send-error');
  var orderSection = $('#commande');
  var hero = $('#hero');
  var sticky = $('#sticky-cta');

  // Wilaya options
  var frag = document.createDocumentFragment();
  WILAYAS.forEach(function (w) {
    var o = document.createElement('option');
    o.value = w[1];
    o.textContent = String(w[0]).padStart(2, '0') + ' – ' + w[1];
    frag.appendChild(o);
  });
  fWilaya.appendChild(frag);

  function errors() {
    return {
      name: fName.value.trim().length < 2 ? ERRORS.name : '',
      phone: !phoneOk(fPhone.value) ? ERRORS.phone : '',
      wilaya: !STOP_DESK[fWilaya.value] ? ERRORS.wilaya : '',
      method: !METHODS[state.method] ? ERRORS.method : '',
    };
  }

  function setError(key, msg, input) {
    var el = $('#e-' + key);
    el.textContent = msg;
    el.hidden = !msg;
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function render() {
    var e = state.tried ? errors() : { name: '', phone: '', wilaya: '', method: '' };
    setError('name', e.name, fName);
    setError('phone', e.phone, fPhone);
    setError('wilaya', e.wilaya, fWilaya);
    setError('method', e.method, null);
    methodsBox.classList.toggle('is-invalid', !!e.method);

    fWilaya.classList.toggle('is-empty', !fWilaya.value);

    var sd = STOP_DESK[fWilaya.value];
    $('[data-price="stop"]', form).textContent = sd ? sd + ' DA' : '—';
    $('[data-price="home"]', form).textContent = sd ? (sd + HOME_EXTRA) + ' DA' : '—';

    methodBtns.forEach(function (b) {
      var on = b.getAttribute('data-method') === state.method;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
    });
    // Roving tabindex: the checked radio (or the first one) is focusable.
    var focusIdx = Math.max(0, methodBtns.findIndex(function (b) { return b.getAttribute('data-method') === state.method; }));
    methodBtns.forEach(function (b, i) { b.tabIndex = i === focusIdx ? 0 : -1; });

    var d = deliveryPrice(fWilaya.value, state.method);
    $('#sum-delivery').textContent = d != null ? d + ' DA' : (sd ? 'Choisissez un mode' : 'Choisissez une wilaya');
    $('#sum-total').textContent = d != null ? (PRICE + d) + ' DA' : '— DA';

    submitBtn.disabled = state.sending;
    $('.spinner', submitBtn).hidden = !state.sending;
    $('.submit-label', submitBtn).textContent = state.sending ? 'ENVOI EN COURS…' : 'CONFIRMER MA COMMANDE';
  }

  function validate() {
    state.tried = true;
    render();
    var e = errors();
    var first = ['name', 'phone', 'wilaya', 'method'].filter(function (k) { return e[k]; })[0];
    if (!first) return true;
    var target = { name: fName, phone: fPhone, wilaya: fWilaya, method: methodBtns[0] }[first];
    if (target) target.focus();
    return false;
  }

  function buildOrder() {
    var d = deliveryPrice(fWilaya.value, state.method);
    return {
      name: fName.value.trim(),
      phone: fmtPhone(fPhone.value),
      wilaya: fWilaya.value,
      method: METHODS[state.method],
      delivery: d,
      total: PRICE + d,
    };
  }

  function scrollToOrder() {
    var top = orderSection.getBoundingClientRect().top + window.pageYOffset - 8;
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  // ---------- Events: form ----------
  [fName, fPhone].forEach(function (el) { el.addEventListener('input', render); });
  fWilaya.addEventListener('change', render);

  methodBtns.forEach(function (b, i) {
    b.addEventListener('click', function () {
      state.method = b.getAttribute('data-method');
      render();
    });
    b.addEventListener('keydown', function (ev) {
      var dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!dir) return;
      ev.preventDefault();
      var next = methodBtns[(i + dir + methodBtns.length) % methodBtns.length];
      state.method = next.getAttribute('data-method');
      render();
      next.focus();
    });
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (state.sending || !validate()) return;
    if (fHoney.value) return; // bot trap

    var o = buildOrder();
    var now = new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Algiers', dateStyle: 'full', timeStyle: 'short' });
    state.sending = true;
    sendError.hidden = true;
    render();

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        'Produit': PRODUCT,
        'Prix produit': PRICE + ' DA',
        'Nom et prénom': o.name,
        'Numéro de téléphone': o.phone,
        'Wilaya': o.wilaya,
        'Mode de livraison': o.method,
        'Frais de livraison': o.delivery + ' DA',
        'Total à payer': o.total + ' DA',
        'Date/heure de commande': now,
        _subject: SUBJECT,
        _template: 'table',
        _captcha: 'false',
      }),
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (j) {
          if (!res.ok || String(j.success) === 'false') throw new Error(j.message || 'error');
        });
      })
      .then(function () {
        state.sending = false;
        state.done = true;
        showConfirmation(o);
      })
      .catch(function () {
        state.sending = false;
        sendError.textContent = 'L’envoi de la commande a échoué. Vérifiez votre connexion et réessayez, ou commandez via WhatsApp.';
        sendError.hidden = false;
        render();
      });
  });

  function showConfirmation(o) {
    var done = $('#order-done');
    $('[data-recap="name"]', done).textContent = o.name;
    $('[data-recap="phone"]', done).textContent = o.phone;
    $('[data-recap="wilaya"]', done).textContent = o.wilaya;
    $('[data-recap="delivery"]', done).textContent = o.method + ' · ' + o.delivery + ' DA';
    $('[data-recap="total"]', done).textContent = o.total + ' DA';
    form.hidden = true;
    done.hidden = false;
    updateSticky();
    scrollToOrder();
    done.focus({ preventScroll: true });
  }

  // ---------- WhatsApp ----------
  var waBtn = $('#wa-btn');
  if (!CONFIG.showWhatsApp) {
    $$('[data-whatsapp-block]').forEach(function (el) { el.hidden = true; });
  }
  waBtn.addEventListener('click', function () {
    if (!validate()) return;
    var o = buildOrder();
    var msg = 'Bonjour, je souhaite commander le ' + PRODUCT + '.\n\n' +
      'Prix du produit : ' + PRICE + ' DA\n' +
      'Nom : ' + o.name + '\n' +
      'Téléphone : ' + o.phone + '\n' +
      'Wilaya : ' + o.wilaya + '\n' +
      'Livraison : ' + o.method + '\n' +
      'Frais de livraison : ' + o.delivery + ' DA\n' +
      'Total : ' + o.total + ' DA\n\nMerci.';
    var url = 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg);
    // window.open(..., 'noopener') always returns null, so detach the opener manually
    // and only fall back to same-tab navigation when a popup blocker stopped it.
    var w = window.open(url, '_blank');
    if (w) w.opener = null;
    else window.location.href = url;
  });

  // ---------- CTA links ----------
  $$('[data-go-order]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      scrollToOrder();
    });
  });

  // ---------- Gallery ----------
  var slides = $$('[data-slide]');
  var thumbs = $$('[data-thumb]');
  thumbs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      slides.forEach(function (s, j) { s.classList.toggle('is-active', i === j); });
      thumbs.forEach(function (u, j) { u.setAttribute('aria-pressed', i === j ? 'true' : 'false'); });
    });
  });

  // ---------- FAQ (one open at a time) ----------
  var faqBtns = $$('.faq-q');
  faqBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      faqBtns.forEach(function (b) {
        var on = b === btn && open;
        b.setAttribute('aria-expanded', on ? 'true' : 'false');
        document.getElementById(b.getAttribute('aria-controls')).hidden = !on;
      });
    });
  });

  // ---------- Sticky mobile CTA ----------
  var raf = 0;
  function updateSticky() {
    raf = 0;
    var vh = window.innerHeight;
    var fr = orderSection.getBoundingClientRect();
    var show = CONFIG.stickyCta && !state.done &&
      window.innerWidth < 768 &&
      hero.getBoundingClientRect().bottom < 0 &&
      !(fr.top < vh && fr.bottom > 0);
    sticky.classList.toggle('is-visible', show);
    sticky.setAttribute('aria-hidden', show ? 'false' : 'true');
    $('a', sticky).tabIndex = show ? 0 : -1;
  }
  function onScroll() { if (!raf) raf = requestAnimationFrame(updateSticky); }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  updateSticky();

  // ---------- Reveal on scroll ----------
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.remove('is-pending'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      el.classList.add('is-pending');
      io.observe(el);
    });
  }

  render();
})();
