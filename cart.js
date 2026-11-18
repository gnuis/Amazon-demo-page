/* Amazon — cart + responsive UI behaviour. No dependencies. */
(function () {
  "use strict";

  var CATALOG = {
    "headphones-x1": {
      title: "Wireless Noise-Cancelling Over-Ear Headphones, 40H Battery",
      price: 79.99,
      was: 129.99,
      img: "assets/p1.jpg",
      href: "product-headphones-x1.html",
    },
    "watch-s5": {
      title: "Fitness Smartwatch with Heart-Rate, Sleep & GPS Tracking",
      price: 129.0,
      was: 179.0,
      img: "assets/p2.jpg",
      href: "product-watch-s5.html",
    },
    "runner-air": {
      title: "Men's Lightweight Breathable Running Sneakers",
      price: 54.95,
      was: 74.95,
      img: "assets/p3.jpg",
      href: "product-runner-air.html",
    },
    "studio-pro": {
      title: "Studio Pro Over-Ear Headphones, Hi-Res Audio",
      price: 99.0,
      was: 149.0,
      img: "assets/p1.jpg",
      href: "product-studio-pro.html",
    },
    "watch-sport": {
      title: "Smartwatch Sport Edition, 7-Day Battery",
      price: 89.99,
      was: 119.99,
      img: "assets/p2.jpg",
      href: "product-watch-sport.html",
    },
    "runner-lite": {
      title: "Women's Everyday Cushioned Walking Shoes",
      price: 49.99,
      was: 64.99,
      img: "assets/p3.jpg",
      href: "product-runner-lite.html",
    },
  };
  var FREE_SHIPPING_AT = 100;
  var PROMOS = { SAVE10: 0.1, WELCOME5: 0.05 };
  var KEY = "azclone.cart.v1";
  var MAX_QTY = 10;

  /* ---------- storage (safe if blocked) ---------- */
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && Array.isArray(s.items)) return s;
    } catch (e) {}
    // first visit: seed with the two sample items the static page showed
    return {
      items: [
        { id: "headphones-x1", qty: 1 },
        { id: "watch-s5", qty: 1 },
      ],
      saved: [],
      promo: "",
    };
  }
  var state = load();
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {}
  }

  /* ---------- helpers ---------- */
  function $(s, r) {
    return (r || document).querySelector(s);
  }
  function $$(s, r) {
    return Array.prototype.slice.call((r || document).querySelectorAll(s));
  }
  function money(n) {
    return "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[c];
    });
  }
  function find(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function count() {
    return state.items.reduce(function (n, i) {
      return n + i.qty;
    }, 0);
  }
  function subtotal() {
    return state.items.reduce(function (n, i) {
      return n + CATALOG[i.id].price * i.qty;
    }, 0);
  }
  function discountRate() {
    return PROMOS[state.promo] || 0;
  }

  /* ---------- cart actions ---------- */
  function add(id, qty) {
    if (!CATALOG[id]) return;
    var it = find(state.items, id);
    if (it) it.qty = Math.min(MAX_QTY, it.qty + qty);
    else state.items.push({ id: id, qty: Math.min(MAX_QTY, qty) });
    save();
    refresh();
  }
  function setQty(id, qty) {
    var it = find(state.items, id);
    if (!it) return;
    if (qty < 1) return remove(id);
    it.qty = Math.min(MAX_QTY, qty);
    save();
    refresh();
  }
  var lastRemoved = null;
  function remove(id) {
    var it = find(state.items, id);
    if (!it) return;
    lastRemoved = { id: id, qty: it.qty };
    state.items = state.items.filter(function (i) {
      return i.id !== id;
    });
    save();
    refresh();
    toast(CATALOG[id].title.slice(0, 40) + "… removed", "Undo", function () {
      if (lastRemoved) {
        state.items.push(lastRemoved);
        lastRemoved = null;
        save();
        refresh();
      }
    });
  }
  function saveForLater(id) {
    var it = find(state.items, id);
    if (!it) return;
    state.items = state.items.filter(function (i) {
      return i.id !== id;
    });
    if (!find(state.saved, id)) state.saved.push({ id: id });
    save();
    refresh();
    toast("Saved for later");
  }
  function moveToCart(id) {
    state.saved = state.saved.filter(function (i) {
      return i.id !== id;
    });
    var it = find(state.items, id);
    if (it) it.qty = Math.min(MAX_QTY, it.qty + 1);
    else state.items.push({ id: id, qty: 1 });
    save();
    refresh();
  }
  function deleteSaved(id) {
    state.saved = state.saved.filter(function (i) {
      return i.id !== id;
    });
    save();
    refresh();
  }

  /* ---------- toast ---------- */
  var toastTimer;
  function toast(msg, actionLabel, action) {
    var t = $("#az-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "az-toast";
      t.setAttribute("role", "status");
      t.setAttribute("aria-live", "polite");
      document.body.appendChild(t);
    }
    t.innerHTML =
      "<span>" +
      esc(msg) +
      "</span>" +
      (actionLabel
        ? '<button type="button">' + esc(actionLabel) + "</button>"
        : "");
    if (actionLabel)
      $("button", t).onclick = function () {
        t.classList.remove("show");
        action();
      };
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      t.classList.remove("show");
    }, 5000);
  }

  /* ---------- header badge ---------- */
  function renderBadge() {
    var n = count();
    $$(".az-cart-n").forEach(function (b) {
      b.textContent = n;
      b.style.display = n ? "" : "none";
    });
  }

  /* ---------- shipping progress (shared) ---------- */
  function shippingHTML(sub) {
    var left = FREE_SHIPPING_AT - sub;
    var pct = Math.min(100, Math.round((sub / FREE_SHIPPING_AT) * 100));
    var msg =
      left > 0
        ? "Add <b>" + money(left) + "</b> more for <b>FREE shipping</b>"
        : '<i class="fa-solid fa-circle-check"></i> Your order qualifies for <b>FREE Shipping</b>';
    return (
      '<div class="az-ship"><p>' +
      msg +
      '</p><div class="az-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
      pct +
      '"><i style="width:' +
      pct +
      '%"></i></div></div>'
    );
  }

  /* ---------- cart page ---------- */
  function qtySelect(it) {
    var o = "";
    for (var q = 1; q <= MAX_QTY; q++)
      o +=
        "<option" + (q === it.qty ? " selected" : "") + ">" + q + "</option>";
    return o;
  }
  function renderCartPage() {
    var root = $("#az-cart-root");
    if (!root) return;
    var sub = subtotal(),
      disc = sub * discountRate(),
      total = sub - disc,
      n = count();
    var h =
      '<div class="az-cartpage"><section class="az-card az-cart-main"><h1>Shopping Cart</h1>';
    if (!state.items.length) {
      h +=
        '<div class="az-empty"><p class="az-empty-icon"><i class="fa-solid fa-cart-shopping"></i></p><h2>Your cart is empty</h2><p class="az-muted">Check out today\'s deals and add something you like.</p><a class="az-btn alt" href="deals.html">Shop today\'s deals</a></div>';
    } else {
      h += '<p class="az-muted az-right az-price-label">Price</p>';
      state.items.forEach(function (it) {
        var p = CATALOG[it.id];
        h +=
          '<div class="az-cart-item" data-id="' +
          it.id +
          '"><a href="' +
          p.href +
          '"><img alt="' +
          esc(p.title) +
          '" src="' +
          p.img +
          '"/></a>' +
          '<div class="az-ci-body"><a href="' +
          p.href +
          '"><h3>' +
          esc(p.title) +
          '</h3></a><p class="az-instock">In Stock</p><p class="az-prime"><i class="fa-solid fa-check"></i>prime</p>' +
          '<div class="az-qty"><label class="az-qty-sel">Qty <select data-act="qty" aria-label="Quantity">' +
          qtySelect(it) +
          "</select></label>" +
          '<span class="az-qty-step"><button type="button" data-act="dec" aria-label="Decrease quantity">&minus;</button><output>' +
          it.qty +
          '</output><button type="button" data-act="inc" aria-label="Increase quantity"' +
          (it.qty >= MAX_QTY ? " disabled" : "") +
          ">+</button></span>" +
          '<button type="button" class="az-linkbtn" data-act="del">Delete</button><button type="button" class="az-linkbtn" data-act="save">Save for later</button></div></div>' +
          '<b class="az-ci-price">' +
          money(p.price * it.qty) +
          (it.qty > 1 ? "<small>" + money(p.price) + " each</small>" : "") +
          "</b></div>";
      });
      h +=
        '<p class="az-right az-sub">Subtotal (' +
        n +
        " item" +
        (n === 1 ? "" : "s") +
        "): <b>" +
        money(sub) +
        "</b></p>";
    }
    h += "</section>";
    if (state.items.length) {
      h +=
        '<aside class="az-card az-checkout">' +
        shippingHTML(sub) +
        "<p>Subtotal (" +
        n +
        " item" +
        (n === 1 ? "" : "s") +
        "): <b>" +
        money(sub) +
        "</b></p>" +
        (disc
          ? '<p class="az-instock">Promo ' +
            esc(state.promo) +
            ": −" +
            money(disc) +
            "</p><p>Total: <b>" +
            money(total) +
            "</b></p>"
          : "") +
        '<form class="az-promo" novalidate><label for="az-promo-in">Promo code</label><div><input id="az-promo-in" placeholder="Try SAVE10" autocomplete="off" value="' +
        esc(state.promo) +
        '"/><button type="submit" class="az-btn">Apply</button></div><p class="az-promo-msg" aria-live="polite"></p></form>' +
        '<a class="az-btn" href="#" data-act="checkout">Proceed to checkout</a></aside>';
    }
    h += "</div>";
    if (state.saved.length) {
      h +=
        '<section class="az-card az-saved"><h2>Saved for later (' +
        state.saved.length +
        " item" +
        (state.saved.length === 1 ? "" : "s") +
        ')</h2><div class="az-saved-grid">';
      state.saved.forEach(function (s) {
        var p = CATALOG[s.id];
        h +=
          '<div class="az-saved-item" data-id="' +
          s.id +
          '"><a href="' +
          p.href +
          '"><img alt="' +
          esc(p.title) +
          '" src="' +
          p.img +
          '"/></a><a href="' +
          p.href +
          '"><h3>' +
          esc(p.title) +
          "</h3></a><b>" +
          money(p.price) +
          "</b>" +
          '<button type="button" class="az-btn" data-act="move">Move to cart</button><button type="button" class="az-linkbtn" data-act="delsaved">Delete</button></div>';
      });
      h += "</div></section>";
    }
    // keep focus on the control the user was using
    var active = document.activeElement,
      activeId = null,
      activeAct = null;
    if (active && root.contains(active)) {
      var row = active.closest("[data-id]");
      activeId = row && row.dataset.id;
      activeAct = active.dataset.act;
    }
    root.innerHTML = h;
    if (activeId && activeAct) {
      var el = $(
        '[data-id="' + activeId + '"] [data-act="' + activeAct + '"]',
        root,
      );
      if (el) el.focus();
    }
    renderStickyBar(root, sub, n);
  }
  function renderStickyBar(root, sub, n) {
    var bar = $("#az-sticky-checkout");
    if (!state.items.length) {
      if (bar) bar.remove();
      return;
    }
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "az-sticky-checkout";
      document.body.appendChild(bar);
    }
    bar.innerHTML =
      "<div>Subtotal (" +
      n +
      "): <b>" +
      money(sub) +
      '</b></div><a class="az-btn" href="#" data-act="checkout">Checkout</a>';
  }

  function onCartClick(e) {
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var act = btn.dataset.act,
      row = btn.closest("[data-id]"),
      id = row && row.dataset.id,
      it = id && find(state.items, id);
    if (act === "checkout") {
      e.preventDefault();
      toast("This is a demo cart");
      return;
    }
    if (act === "inc") setQty(id, it.qty + 1);
    else if (act === "dec") setQty(id, it.qty - 1);
    else if (act === "del") remove(id);
    else if (act === "save") saveForLater(id);
    else if (act === "move") moveToCart(id);
    else if (act === "delsaved") deleteSaved(id);
  }
  function onCartChange(e) {
    var s = e.target.closest('select[data-act="qty"]');
    if (!s) return;
    setQty(s.closest("[data-id]").dataset.id, parseInt(s.value, 10));
  }
  function onPromo(e) {
    var f = e.target.closest(".az-promo");
    if (!f) return;
    e.preventDefault();
    var code = $("input", f).value.trim().toUpperCase();
    if (!code) {
      state.promo = "";
      save();
      refresh();
      return;
    }
    if (PROMOS[code]) {
      state.promo = code;
      save();
      refresh();
      toast("Promo " + code + " applied");
    } else {
      $(".az-promo-msg", f).textContent = "Sorry, that code isn't valid.";
    }
  }

  /* ---------- product page ---------- */
  function initProductPage() {
    var m = location.pathname.match(/product-([\w-]+)\.html/);
    if (!m || !CATALOG[m[1]]) return;
    var id = m[1],
      box = $(".az-buybox");
    if (!box) return;
    var addBtn = $$("a.az-btn", box)[0],
      buyBtn = $$("a.az-btn", box)[1];
    var qtyWrap = document.createElement("label");
    qtyWrap.className = "az-buy-qty";
    qtyWrap.innerHTML =
      'Quantity: <select aria-label="Quantity">' +
      qtySelect({ qty: 1 }) +
      "</select>";
    addBtn.parentNode.insertBefore(qtyWrap, addBtn);
    function qty() {
      return parseInt($("select", qtyWrap).value, 10) || 1;
    }
    function asButton(a) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = a.className;
      b.textContent = a.textContent;
      a.replaceWith(b);
      return b;
    }
    addBtn = asButton(addBtn);
    buyBtn = asButton(buyBtn);
    addBtn.addEventListener("click", function () {
      add(id, qty());
      toast("Added to cart", "View cart", function () {
        location.href = "cart.html";
      });
    });
    buyBtn.addEventListener("click", function () {
      add(id, qty());
      location.href = "cart.html";
    });

    // sticky mobile buy bar
    var bar = document.createElement("div");
    bar.id = "az-sticky-buy";
    bar.innerHTML =
      "<b>" +
      money(CATALOG[id].price) +
      '</b><button type="button" class="az-btn">Add to Cart</button>';
    document.body.appendChild(bar);
    $("button", bar).addEventListener("click", function () {
      add(id, qty());
      toast("Added to cart", "View cart", function () {
        location.href = "cart.html";
      });
    });
  }

  /* ---------- mini cart drawer (non-cart pages) ---------- */
  function initDrawer() {
    var link = $("a.az-cart");
    if (!link || $("#az-cart-root")) return;
    var d = document.createElement("aside");
    d.id = "az-drawer";
    d.setAttribute("aria-label", "Cart preview");
    d.hidden = true;
    document.body.appendChild(d);
    function open() {
      renderDrawer(d);
      d.hidden = false;
      requestAnimationFrame(function () {
        d.classList.add("open");
      });
    }
    function close() {
      d.classList.remove("open");
      setTimeout(function () {
        d.hidden = true;
      }, 200);
    }
    link.addEventListener("click", function (e) {
      if (window.matchMedia("(min-width: 701px)").matches) {
        e.preventDefault();
        if (!d.hidden && d.classList.contains("open")) close();
        else open();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !d.hidden) close();
    });
    document.addEventListener("click", function (e) {
      if (!d.hidden && !d.contains(e.target) && !link.contains(e.target))
        close();
    });
    d.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) close();
      var b = e.target.closest("[data-act]");
      if (!b) return;
      var id = b.closest("[data-id]").dataset.id,
        it = find(state.items, id);
      if (b.dataset.act === "inc") setQty(id, it.qty + 1);
      else if (b.dataset.act === "dec") setQty(id, it.qty - 1);
      else if (b.dataset.act === "del") remove(id);
    });
    d.refresh = function () {
      if (!d.hidden) renderDrawer(d);
    };
    window.__azDrawer = d;
  }
  function renderDrawer(d) {
    var sub = subtotal(),
      n = count();
    var h =
      '<div class="az-drawer-h"><h2>Your cart (' +
      n +
      ')</h2><button type="button" data-close aria-label="Close cart preview"><i class="fa-solid fa-xmark"></i></button></div>';
    if (!state.items.length)
      h += '<p class="az-muted az-drawer-empty">Your cart is empty.</p>';
    else {
      h += shippingHTML(sub) + "<ul>";
      state.items.forEach(function (it) {
        var p = CATALOG[it.id];
        h +=
          '<li data-id="' +
          it.id +
          '"><img alt="" src="' +
          p.img +
          '"/><div><a href="' +
          p.href +
          '">' +
          esc(p.title) +
          "</a><b>" +
          money(p.price * it.qty) +
          "</b>" +
          '<span class="az-qty-step"><button type="button" data-act="dec" aria-label="Decrease">&minus;</button><output>' +
          it.qty +
          '</output><button type="button" data-act="inc" aria-label="Increase"' +
          (it.qty >= MAX_QTY ? " disabled" : "") +
          ">+</button></span>" +
          '<button type="button" class="az-linkbtn" data-act="del">Remove</button></div></li>';
      });
      h +=
        '</ul><div class="az-drawer-f"><p>Subtotal: <b>' +
        money(sub) +
        '</b></p><a class="az-btn alt" href="cart.html">Go to cart</a></div>';
    }
    d.innerHTML = h;
  }

  /* ---------- "All" sidebar (slides in from the left) ---------- */
  function initSidebar() {
    var top = $(".az-top"),
      nav = $(".az-nav");
    if (!top || !nav) return;
    var side = document.createElement("aside");
    side.id = "az-side";
    side.setAttribute("aria-label", "Browse menu");
    side.setAttribute("aria-hidden", "true");
    side.innerHTML =
      '<div class="az-side-h"><i class="fa-solid fa-circle-user"></i><a href="signin.html">Hello, sign in</a><button type="button" class="az-side-x" aria-label="Close menu"><i class="fa-solid fa-xmark"></i></button></div>' +
      '<div class="az-side-body">' +
      '<h3>Trending</h3><a href="deals.html">Best Sellers <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">New Releases <i class="fa-solid fa-chevron-right"></i></a>' +
      '<hr><h3>Digital Content &amp; Devices</h3><a href="deals.html">Prime Video <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Music <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Alexa <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Fire TV <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Kids <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Ring <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Blink <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">eero <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Audible Books &amp; Originals <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Photos <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Appstore <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Luna <i class="fa-solid fa-chevron-right"></i></a>' +
      '<hr><h3>Shop by Department</h3><a href="deals.html">Clothes, Shoes, Jewelry &amp; Watches <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Fresh <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Whole Foods Market <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Books<i class="fa-solid fa-chevron-right"></i> </a><a href="deals.html" class="az-side-lk">See All <i class="fa-solid fa-chevron-down"></i></a>' +
      '<hr><h3>Programs &amp; Features</h3><a href="deals.html">Medical Care &amp; Pharmacy <i class="fa-solid fa-chevron-right"></i></a><a href="deals.html">Amazon Haul </i></a><a href="customer-service.html">Amazon Business </i></a><a href="deals.html">Sell on Amazon </a><a href="deals.html" class="az-side-lk">See All <i class="fa-solid fa-chevron-down"></i></a>' +
      '<hr><h3>Help &amp; Settings</h3><a href="signin.html">Your Account</a><a href="#">Product Safety Tips</a><a href="#" class="az-side-lk2"><i class="fa-solid fa-globe"></i>English</a><a href="#" class="az-side-lk3"><i class="fa-duotone fa-solid fa-flag-usa" style="--fa-primary-color: rgb(41, 65, 200); --fa-secondary-color: rgb(255, 34, 34); --fa-secondary-opacity: 1.0;"></i>United States</a><a href="signin.html">Sign in</a>' +
      "</div>";
    document.body.appendChild(side);
    var scrim = document.createElement("div");
    scrim.className = "az-scrim";
    document.body.appendChild(scrim);

    // The nav's "☰ All" link is the only menu trigger (a second ☰ button in the
    // header showed the same icon twice on phones).
    var allLink = $("a", nav);
    allLink.setAttribute("data-open-side", "");
    allLink.setAttribute("aria-controls", "az-side");
    allLink.setAttribute("aria-expanded", "false");
    var opener = null;
    function set(open, from) {
      if (open === side.classList.contains("open")) return;
      document.body.classList.toggle("az-side-open", open);
      side.classList.toggle("open", open);
      side.setAttribute("aria-hidden", !open);
      allLink.setAttribute("aria-expanded", open);
      if (open) {
        opener = from || document.activeElement;
        setTimeout(function () {
          $(".az-side-x", side).focus();
        }, 50);
      } else if (opener && opener.focus) {
        opener.focus();
      }
    }
    allLink.addEventListener("click", function (e) {
      e.preventDefault();
      set(true, allLink);
    });
    $(".az-side-x", side).addEventListener("click", function () {
      set(false);
    });
    scrim.addEventListener("click", function () {
      set(false);
    });
    side.addEventListener("click", function (e) {
      if (e.target.closest(".az-side-body a, .az-side-h a")) set(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") set(false);
    });
  }

  /* ---------- hero carousel: sliding cards, auto-slides every 5s ---------- */
  function initCarouselRoot(root) {
    var track = root.querySelector('.cx-track');
    var prev = root.querySelector('.cx-prev');
    var next = root.querySelector('.cx-next');
    if (!track) return;

    function step() { return Math.max(track.clientWidth * 0.85, 120); }

    function update() {
      var max = track.scrollWidth - track.clientWidth;
      root.classList.toggle('is-static', max <= 2);
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    }

    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step() }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step() }); });

    /* keyboard: ← → when the track has focus */
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); track.scrollBy({ left: step() }); }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); track.scrollBy({ left: -step() }); }
    });

    /* mouse drag to slide (touch already swipes natively) */
    var down = false, startX = 0, startLeft = 0, moved = false;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; startX = e.clientX; startLeft = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; track.classList.add('is-dragging'); }
      if (moved) track.scrollLeft = startLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!down) return;
      down = false;
      if (moved) {
        track.classList.remove('is-dragging');
        var w = track.firstElementChild.getBoundingClientRect().width + 14;   /* settle on a card */
        track.scrollTo({ left: Math.round(track.scrollLeft / w) * w });
      }
    });

    /* autoplay: data-autoplay="5000" on the section (remove it for no autoplay); pause button + pauses on hover/focus */
    var ms = parseInt(root.getAttribute('data-autoplay'), 10), timer, userPaused = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var pauseBtn = root.querySelector('.cx-pause');
    function paintPause() {
      if (!pauseBtn) return;
      pauseBtn.innerHTML = '<i class="fa-solid ' + (userPaused ? 'fa-play' : 'fa-pause') + '"></i>';
      pauseBtn.setAttribute('aria-label', userPaused ? 'Play slideshow' : 'Pause slideshow');
    }
    if (pauseBtn) pauseBtn.addEventListener('click', function () { userPaused = !userPaused; paintPause(); userPaused ? stop() : play(); });
    paintPause();
    function play() {
      if (!ms || userPaused) return;
      stop();
      timer = setInterval(function () {
        var max = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft >= max - 2) track.scrollTo({ left: 0 }); else track.scrollBy({ left: step() });
      }, ms);
    }
    function stop() { clearInterval(timer); }
    root.addEventListener('mouseenter', stop); root.addEventListener('mouseleave', play);
    root.addEventListener('focusin', stop);   root.addEventListener('focusout', play);

    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update(); play();
  }

  function initCarousel() {
    Array.prototype.forEach.call(document.querySelectorAll(".cx"), initCarouselRoot);
  }

  /* ---------- theme (light / dark) ----------
     One source of truth: Theme decides, applies and announces the mode.
     - saved choice (localStorage) wins, otherwise the system setting is followed live
     - sets  html.az-dark , html[data-theme] and color-scheme  (CSS swaps colours and logos)
     - fires "azthemechange" so anything else (the toggle, future widgets) can react
     - stays in sync across tabs */
  var THEME_KEY = "azclone.theme";
  var Theme = {
    mq: window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null,
    saved: function () {
      try {
        var v = localStorage.getItem(THEME_KEY);
        return v === "dark" || v === "light" ? v : null;
      } catch (e) {
        return null;
      }
    },
    isDark: function () {
      var s = this.saved();
      return s ? s === "dark" : !!(this.mq && this.mq.matches);
    },
    apply: function () {
      var dark = this.isDark();
      var root = document.documentElement;
      root.classList.toggle("az-dark", dark);
      root.setAttribute("data-theme", dark ? "dark" : "light");
      root.style.colorScheme = dark ? "dark" : "light";
      document.dispatchEvent(
        new CustomEvent("azthemechange", { detail: { dark: dark } }),
      );
      return dark;
    },
    set: function (mode) {
      try {
        localStorage.setItem(THEME_KEY, mode);
      } catch (e) {}
      return this.apply();
    },
    toggle: function () {
      return this.set(this.isDark() ? "light" : "dark");
    },
  };
  Theme.apply(); // run immediately: no flash of the wrong theme

  function initTheme() {
    var host = $(".az-top");
    var lang = $(".az-lang");
    var b = document.createElement("button");
    b.type = "button";
    b.className = "az-theme-btn";
    function label() {
      var dark = Theme.isDark();
      b.innerHTML =
        '<i class="fa-solid ' + (dark ? "fa-sun" : "fa-moon") + '"></i>';
      b.setAttribute(
        "aria-label",
        dark ? "Switch to light mode" : "Switch to dark mode",
      );
    }
    label();
    b.addEventListener("click", function () {
      Theme.toggle();
    });
    document.addEventListener("azthemechange", label);

    // system setting changed (only matters while there is no saved choice)
    if (Theme.mq) {
      var onSystem = function () {
        if (!Theme.saved()) Theme.apply();
      };
      if (Theme.mq.addEventListener) Theme.mq.addEventListener("change", onSystem);
      else if (Theme.mq.addListener) Theme.mq.addListener(onSystem);
    }
    // another tab changed the choice
    window.addEventListener("storage", function (e) {
      if (e.key === THEME_KEY) Theme.apply();
    });

    if (host)
      host.insertBefore(b, lang ? lang.nextSibling : $(".az-cart", host));
    else {
      var auth = $(".az-auth");
      if (auth) {
        b.classList.add("floating");
        auth.appendChild(b);
      }
    }
  }

  /* ---------- sign-in form: validate the mobile number / email field ---------- */
  function initAuthForm() {
    var form = $("form.az-auth-box");
    if (!form) return;
    var input = $("input", form);
    var err = $(".az-field-error", form);
    if (!input || !err) return;
    function isValid(v) {
      var email = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      var phone = /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
      return email || phone;
    }
    function fail(msg) {
      err.textContent = msg;
      err.hidden = false;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
    function clear() {
      err.hidden = true;
      err.textContent = "";
      input.removeAttribute("aria-invalid");
    }
    input.addEventListener("input", clear);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return fail("Enter your mobile number or email");
      if (!isValid(v))
        return fail("Enter a valid mobile number or email address");
      clear();
      toast("Demo only: there is no sign-in server behind this form.");
    });
  }

  /* ---------- quick "Add to Cart" on product cards ---------- */
  function initQuickAdd() {
    $$("a.az-prod").forEach(function (a) {
      var m = (a.getAttribute("href") || "").match(/product-([\w-]+)\.html/);
      if (!m || !CATALOG[m[1]]) return;
      var w = document.createElement("div");
      w.className = "az-prodwrap";
      a.parentNode.insertBefore(w, a);
      w.appendChild(a);
      var b = document.createElement("button");
      b.type = "button";
      b.className = "az-btn az-quick";
      b.setAttribute("data-quick", m[1]);
      b.textContent = "Add to Cart";
      w.appendChild(b);
    });
    // Only the buttons created above (.az-quick) can add to the cart. A stray
    // data-quick attribute elsewhere (e.g. the Account & Lists menu) is ignored.
    document.addEventListener("click", function (e) {
      var b = e.target.closest(".az-quick[data-quick]");
      if (!b) return;
      var id = b.getAttribute("data-quick");
      if (!CATALOG[id]) return;
      add(id, 1);
      toast("Added to cart", "View cart", function () {
        location.href = "cart.html";
      });
    });
  }

  /* ---------- "Hello, sign in / Account & Lists" button -> signin.html ----------
     The hover dropdown stays pure CSS; this only handles the button's click. */
  function initAccountMenu() {
    var btn = $(".az-link2 .dropbtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      location.href = "signin.html";
    });
  }

  /* ---------- nav dropdowns: hover/focus on desktop, tap to open on small screens ---------- */
  function initNavMenus() {
    var nav = $(".az-nav");
    if (!nav) return;
    // same condition as the CSS: narrow screens and every touch device (incl. "Desktop site" on phones)
    var small = window.matchMedia("(max-width: 1199px), (hover: none)");
    var items = $$(".az-link3", nav);

    function closeAll(except) {
      items.forEach(function (item) {
        if (item === except) return;
        item.classList.remove("is-open");
        var btn = $(".dropbtn2", item);
        var panel = $(".dropdown-content2", item);
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (panel) {
          panel.style.top = "";
          panel.style.left = "";
        }
      });
    }

    // the panel is position:fixed on small screens, so place it under its button
    function place(item) {
      var btn = $(".dropbtn2", item);
      var panel = $(".dropdown-content2", item);
      if (!btn || !panel) return;
      var r = btn.getBoundingClientRect();
      var left = Math.max(8, Math.min(r.left, window.innerWidth - panel.offsetWidth - 8));
      panel.style.top = Math.round(r.bottom) + "px";
      panel.style.left = Math.round(left) + "px";
    }

    items.forEach(function (item) {
      var btn = $(".dropbtn2", item);
      if (!btn) return; // plain links (e.g. "Pet Supplies") have no menu
      btn.setAttribute("aria-haspopup", "true");
      btn.setAttribute("aria-expanded", "false");
      btn.addEventListener("click", function () {
        if (!small.matches) return; // desktop: the CSS hover/focus rules open it
        var open = !item.classList.contains("is-open");
        closeAll(item);
        item.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", String(open));
        if (open) place(item);
      });
    });

    document.addEventListener("click", function (e) {
      if (!e.target.closest(".az-link3")) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeAll();
    });
    nav.addEventListener("scroll", function () { closeAll(); }, { passive: true });
    window.addEventListener("resize", function () { closeAll(); });
    if (small.addEventListener) small.addEventListener("change", function () { closeAll(); });
  }

  /* ---------- deals page: working search, filters, sort ---------- */
  function initDeals() {
    var grid = $(".az-results-grid");
    if (!grid) return;
    var cards = $$(".az-prodwrap", grid),
      count = $(".az-results > .az-muted");
    var q = new URLSearchParams(location.search).get("q") || "";
    var searchInput = $(".az-search input");
    if (searchInput && q) searchInput.value = q;
    var filters = $(".az-filters");
    // sort control
    var sort = document.createElement("label");
    sort.className = "az-sort";
    sort.innerHTML =
      'Sort by <select><option value="">Featured</option><option value="lo">Price: Low to High</option><option value="hi">Price: High to Low</option><option value="off">Biggest discount</option></select>';
    count.parentNode.insertBefore(sort, grid);
    // mobile filter toggle
    var tog = document.createElement("button");
    tog.type = "button";
    tog.className = "az-filter-toggle";
    tog.innerHTML = '<i class="fa-solid fa-sliders"></i> Filters';
    tog.setAttribute("aria-expanded", "false");
    sort.parentNode.insertBefore(tog, sort);
    tog.addEventListener("click", function () {
      var o = filters.classList.toggle("open");
      tog.setAttribute("aria-expanded", o);
    });

    cards.forEach(function (c) {
      var m = $("a.az-prod", c)
        .getAttribute("href")
        .match(/product-([\w-]+)\.html/);
      c._p = CATALOG[m[1]];
      c._off = Math.round((1 - c._p.price / c._p.was) * 100);
      c._stars = $$("i:not(.off)", $(".az-stars", c)).length;
      c._index = cards.indexOf(c);
    });
    function apply() {
      var text = q.toLowerCase();
      var depts = $$("input[type=checkbox]", filters)
        .filter(function (i) {
          return i.checked;
        })
        .map(function (i) {
          return i.parentNode.textContent.trim();
        });
      var minOff = 0;
      $$("input[type=radio]", filters).forEach(function (r, i) {
        if (r.checked) minOff = [10, 25, 50][i];
      });
      var stars4 = $(".az-stars", filters).parentNode.classList.contains("on");
      var shown = cards.filter(function (c) {
        var t = c._p.title.toLowerCase();
        if (text && t.indexOf(text) < 0) return false;
        if (depts.length) {
          var d = /watch/.test(t)
            ? ["Electronics", "Wearables"]
            : /headphone/.test(t)
              ? ["Electronics"]
              : ["Fashion"];
          if (
            !depts.some(function (x) {
              return d.indexOf(x) >= 0;
            })
          )
            return false;
        }
        if (c._off < minOff) return false;
        if (stars4 && c._stars < 4) return false;
        return true;
      });
      var mode = $("select", sort).value;
      shown.sort(function (a, b) {
        return mode === "lo"
          ? a._p.price - b._p.price
          : mode === "hi"
            ? b._p.price - a._p.price
            : mode === "off"
              ? b._off - a._off
              : a._index - b._index;
      });
      cards.forEach(function (c) {
        c.hidden = shown.indexOf(c) < 0;
      });
      shown.forEach(function (c) {
        grid.appendChild(c);
      });
      count.textContent = shown.length
        ? "1-" +
          shown.length +
          " of " +
          cards.length +
          " results" +
          (q ? ' for "' + q + '"' : "")
        : "No results" +
          (q ? ' for "' + q + '"' : "") +
          ". Try removing a filter.";
    }
    filters.addEventListener("change", apply);
    $("select", sort).addEventListener("change", apply);
    var starRow = $(".az-stars", filters).parentNode;
    starRow.setAttribute("role", "button");
    starRow.tabIndex = 0;
    function toggleStars() {
      starRow.classList.toggle("on");
      apply();
    }
    starRow.addEventListener("click", toggleStars);
    starRow.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleStars();
      }
    });
    apply();
  }

  /* ---------- wiring ---------- */
  function refresh() {
    renderBadge();
    renderCartPage();
    if (window.__azDrawer) window.__azDrawer.refresh();
  }
  window.addEventListener("storage", function (e) {
    if (e.key === KEY) {
      state = load();
      refresh();
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    initTheme();
    initSidebar();
    initCarousel();
    initProductPage();
    initDrawer();
    initQuickAdd();
    initAccountMenu();
    initAuthForm();
    initNavMenus();
    initDeals();
    var root = $("#az-cart-root");
    if (root) {
      root.addEventListener("click", onCartClick);
      root.addEventListener("change", onCartChange);
      root.addEventListener("submit", onPromo);
    }
    document.addEventListener("click", function (e) {
      var c = e.target.closest('#az-sticky-checkout [data-act="checkout"]');
      if (c) onCartClick(e);
    });
    refresh();
  });
})();
