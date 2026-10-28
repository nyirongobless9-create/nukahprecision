
'use strict';

const $ = id => document.getElementById(id);

const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

let products = [];
let cart = {};
let config = { methods: [], contact: {} };
let filter = 'All';
let currentSection = '';

// RESTORE CART
try {
  cart = JSON.parse(localStorage.getItem('npw_cart_v2') || '{}');

  if (!cart || typeof cart !== 'object' || Array.isArray(cart)) {
    cart = {};
  }
} catch {
  cart = {};
}

const money = n =>
  'MWK ' + Number(n || 0).toLocaleString('en-MW');

const api = async (url, options = {}) => {
  const r = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  const j = await r.json();

  if (!r.ok) {
    throw Error(j.error || 'Request failed');
  }

  return j;
};

// PRODUCT IMAGE ASSIGNMENTS
const shopImageOverrides = {
  plaques: 'service-7.png',
  trophies: 'service-10.png',
  signage: 'service-9.png',
  gifts: 'service-8.png',
  staffids: 'service-4.png',
  studentids: 'service-5.png',
  badges: 'service-6.png',
  remote: 'service-12.png',
  replacement: 'service-13.png'
};

const shopImage = p => shopImageOverrides[p.id] || p.image || '';

// SECTION NAVIGATION
const pageSections = [
  ...document.querySelectorAll('main > section[id]')
];

function showSection(id, options = {}) {
  let section = pageSections.find(item => item.id === id);

  if (!section) {
    id = 'home';
    section = pageSections.find(item => item.id === id);
  }

  if (!section) return;

  currentSection = id;

  // IMPORTANT: Remove the HTML hidden attribute from
  // the selected section and hide all the other sections.
  pageSections.forEach(item => {
    const isActive = item === section;

    item.hidden = !isActive;
    item.classList.toggle('active-section', isActive);
    item.setAttribute('aria-hidden', String(!isActive));
    item.inert = !isActive;
  });

  // Highlight the selected navigation link.
  document.querySelectorAll('#links a[href^="#"]').forEach(link => {
    const isActive = link.getAttribute('href') === '#' + id;

    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // Close the mobile menu after navigation.
  const links = $('links');

  if (links) {
    links.classList.remove('open');
  }

  document.body.style.overflow = '';

  // Update the address bar for browser navigation.
  if (options.updateHistory !== false) {
    const newHash = '#' + id;

    if (location.hash !== newHash) {
      history.pushState({ section: id }, '', newHash);
    }
  }

  window.scrollTo({ top: 0, behavior: 'auto' });
}

// HANDLE BROWSER BACK AND FORWARD
window.addEventListener('popstate', () => {
  const id = location.hash.slice(1);

  showSection(
    pageSections.some(item => item.id === id) ? id : 'home',
    { updateHistory: false }
  );
});

// HANDLE INTERNAL NAVIGATION LINKS
document.addEventListener('click', e => {
  const link = e.target.closest('a[href^="#"]');

  if (!link) return;

  const id = link.getAttribute('href').slice(1);

  if (!pageSections.some(item => item.id === id)) return;

  e.preventDefault();
  showSection(id);
});

// MOBILE MENU
if ($('menu') && $('links')) {
  $('menu').onclick = () => {
    $('links').classList.toggle('open');
  };
}

// CART STORAGE
function save() {
  try {
    localStorage.setItem('npw_cart_v2', JSON.stringify(cart));
  } catch (err) {
    console.error('Cart could not be saved:', err);
  }

  renderCart();
}

function lineItems() {
  return Object.entries(cart)
    .map(([id, quantity]) => ({
      p: products.find(item => item.id === id),
      quantity: Number(quantity)
    }))
    .filter(item =>
      item.p &&
      Number(item.p.price) > 0 &&
      Number.isInteger(item.quantity) &&
      item.quantity > 0
    );
}

// RENDER CART
function renderCart() {
  const lines = lineItems();

  if (!$('cartCount')) return;

  $('cartCount').textContent = lines.reduce(
    (total, item) => total + item.quantity,
    0
  );

  if ($('cartLines')) {
    $('cartLines').innerHTML = lines.length
      ? lines.map(({ p, quantity }) => `
          <div class="cartItem">
            <img
              src="/assets/${escapeHtml(shopImage(p))}"
              alt="${escapeHtml(p.name)}"
            >
            <div>
              <strong>${escapeHtml(p.name)}</strong>
              <small>${money(p.price)} each</small>
              <div class="quantity">
                <button
                  type="button"
                  data-change="${escapeHtml(p.id)}"
                  data-delta="-1"
                  aria-label="Remove one"
                >−</button>

                <span>${quantity}</span>

                <button
                  type="button"
                  data-change="${escapeHtml(p.id)}"
                  data-delta="1"
                  aria-label="Add one"
                >+</button>
              </div>
            </div>
          </div>
        `).join('')
      : '<p>Your cart is empty.</p>';
  }

  const subtotal = lines.reduce(
    (total, item) => total + item.quantity * Number(item.p.price),
    0
  );

  if ($('subtotal')) {
    $('subtotal').textContent = money(subtotal);
  }

  if ($('checkoutTotal')) {
    $('checkoutTotal').textContent = money(subtotal);
  }

  if ($('goCheckout')) {
    $('goCheckout').disabled = lines.length === 0;
  }
}

// OVERLAY CONTROLS
function show(id) {
  const element = $(id);

  if (!element) return;

  element.hidden = false;
  document.body.style.overflow = 'hidden';
}

function hide(id) {
  const element = $(id);

  if (!element) return;

  element.hidden = true;

  const cartOpen = $('overlay') && !$('overlay').hidden;
  const checkoutOpen =
    $('checkoutOverlay') && !$('checkoutOverlay').hidden;

  if (!cartOpen && !checkoutOpen) {
    document.body.style.overflow = '';
  }
}

// SHOP FILTERS AND PRODUCTS
function renderProducts() {
  if (!$('products')) return;

  const categories = [
    'All',
    ...new Set(products.map(p => p.category).filter(Boolean))
  ];

  if ($('filters')) {
    $('filters').innerHTML = categories.map(category => `
      <button
        type="button"
        class="filter ${filter === category ? 'active' : ''}"
        data-cat="${escapeHtml(category)}"
      >${escapeHtml(category)}</button>
    `).join('');
  }

  const q = $('search')
    ? $('search').value.trim().toLowerCase()
    : '';

  const items = products.filter(p =>
    (filter === 'All' || p.category === filter) &&
    [p.name, p.description, p.category]
      .join(' ')
      .toLowerCase()
      .includes(q)
  );

  $('products').innerHTML = items.length
    ? items.map(p => `
        <article class="product">
          <img
            loading="lazy"
            src="/assets/${escapeHtml(shopImage(p))}"
            alt="${escapeHtml(p.name)} illustration"
          >

          <div>
            <span class="tag">${escapeHtml(p.category)}</span>
            <h3>${escapeHtml(p.name)}</h3>
            <p>${escapeHtml(p.description)}</p>

            <span class="price">
              ${Number(p.price) > 0
                ? money(p.price)
                : 'Price on request'}
            </span>

            ${Number(p.price) > 0
              ? `
                <button
                  type="button"
                  class="button gold"
                  data-add="${escapeHtml(p.id)}"
                  ${p.stock === 0 ? 'disabled' : ''}
                >
                  ${p.stock === 0 ? 'Out of stock' : 'Add to cart +'}
                </button>
              `
              : `
                <a class="button navy full" href="#contact">
                  Request a quote
                </a>
              `
            }
          </div>
        </article>
      `).join('')
    : '<p>No products match your search.</p>';
}

// FILTER BUTTONS
if ($('filters')) {
  $('filters').onclick = e => {
    const button = e.target.closest('[data-cat]');

    if (!button) return;

    filter = button.dataset.cat;
    renderProducts();
  };
}

// SEARCH PRODUCTS
if ($('search')) {
  $('search').oninput = renderProducts;
}

// ADD PRODUCTS TO CART
if ($('products')) {
  $('products').onclick = e => {
    const button = e.target.closest('[data-add]');

    if (!button) return;

    const p = products.find(item => item.id === button.dataset.add);

    if (!p) return;

    const quantity = Number(cart[p.id] || 0);

    if (p.stock !== null && p.stock !== undefined &&
        quantity >= Number(p.stock)) {
      alert('Available stock limit reached.');
      return;
    }

    cart[p.id] = quantity + 1;

    save();

    button.textContent = 'Added ✓';

    setTimeout(() => {
      if (button.isConnected) {
        button.textContent = 'Add to cart +';
      }
    }, 900);
  };
}

// CHANGE CART QUANTITIES
if ($('cartLines')) {
  $('cartLines').onclick = e => {
    const button = e.target.closest('[data-change]');

    if (!button) return;

    const id = button.dataset.change;
    const p = products.find(item => item.id === id);
    const next = Number(cart[id] || 0) +
      Number(button.dataset.delta);

    if (p && p.stock !== null && p.stock !== undefined &&
        next > Number(p.stock)) {
      return;
    }

    if (next <= 0) {
      delete cart[id];
    } else {
      cart[id] = next;
    }

    save();
  };
}

// CART DRAWER
if ($('openCart')) {
  $('openCart').onclick = () => {
    renderCart();
    show('overlay');
  };
}

if ($('closeCart')) {
  $('closeCart').onclick = () => hide('overlay');
}

if ($('overlay')) {
  $('overlay').onclick = e => {
    if (e.target === $('overlay')) {
      hide('overlay');
    }
  };
}

// CHECKOUT MODAL
if ($('closeCheckout')) {
  $('closeCheckout').onclick = () => hide('checkoutOverlay');
}

if ($('checkoutOverlay')) {
  $('checkoutOverlay').onclick = e => {
    if (e.target === $('checkoutOverlay')) {
      hide('checkoutOverlay');
    }
  };
}

// CLOSE OVERLAYS WITH ESCAPE
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;

  hide('overlay');
  hide('checkoutOverlay');

  if ($('links')) {
    $('links').classList.remove('open');
  }
});

// OPEN CHECKOUT
if ($('goCheckout')) {
  $('goCheckout').onclick = () => {
    if (!lineItems().length) return;

    hide('overlay');
    renderCart();
    show('checkoutOverlay');
  };
}

// DELIVERY ADDRESS
if ($('delivery')) {
  $('delivery').onchange = () => {
    const needsAddress = $('delivery').value === 'delivery';

    if ($('addressWrap')) {
      $('addressWrap').hidden = !needsAddress;

      const addressInput =
        $('addressWrap').querySelector('textarea');

      if (addressInput) {
        addressInput.required = needsAddress;
      }
    }
  };
}

// PAYMENT METHOD INFORMATION
function updatePaymentInfo() {
  if (!$('paymentMethod') || !$('paymentInfo')) return;

  const method = config.methods.find(
    item => String(item.id) === $('paymentMethod').value
  );

  $('paymentInfo').textContent = method ? method.note || '' : '';
}

if ($('paymentMethod')) {
  $('paymentMethod').onchange = updatePaymentInfo;
}

// SUBMIT ORDER
if ($('checkoutForm')) {
  $('checkoutForm').onsubmit = async e => {
    e.preventDefault();

    const button = $('placeOrder');

    if (!button) return;

    button.disabled = true;

    $('checkoutNotice').textContent = 'Submitting order…';
    $('checkoutNotice').className = 'notice';

    const fd = new FormData(e.target);
    const body = Object.fromEntries(fd.entries());

    body.items = lineItems().map(({ p, quantity }) => ({
      id: p.id,
      quantity
    }));

    if (!body.items.length) {
      $('checkoutNotice').textContent =
        'Your cart is empty. Add products before checking out.';
      button.disabled = false;
      return;
    }

    try {
      const order = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      cart = {};
      save();

      $('checkoutNotice').className = 'notice success';
      $('checkoutNotice').textContent =
        `Order placed successfully!
Reference: ${order.id}
Subtotal: ${money(order.subtotal)}
Status: Awaiting confirmation.
Save this reference to track your order.
Payment instructions depend on your selected payment method.`;

      e.target.reset();

      if ($('delivery')) {
        $('delivery').onchange();
      }

      updatePaymentInfo();
    } catch (err) {
      $('checkoutNotice').className = 'notice error';
      $('checkoutNotice').textContent = err.message;
    } finally {
      button.disabled = false;
    }
  };
}

// TRACK ORDER
if ($('trackForm')) {
  $('trackForm').onsubmit = async e => {
    e.preventDefault();

    const result = $('trackResult');

    result.className = 'notice';
    result.textContent = 'Checking order status…';

    const body = Object.fromEntries(
      new FormData(e.target).entries()
    );

    try {
      const order = await api('/api/order-status', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      result.className = 'notice success';
      result.textContent =
        `${order.id}
Status: ${String(order.status).replaceAll('_', ' ')}
Total: ${money(order.subtotal)}
Placed: ${order.created_at} UTC`;
    } catch (err) {
      result.className = 'notice error';
      result.textContent = err.message;
    }
  };
}

// LOAD PRODUCTS AND WEBSITE CONFIGURATION
(async () => {
  try {
    const [productData, websiteConfig] = await Promise.all([
      api('/api/products'),
      api('/api/config')
    ]);

    products = Array.isArray(productData.products)
      ? productData.products
      : [];

    config = websiteConfig || { methods: [], contact: {} };

    config.methods = Array.isArray(config.methods)
      ? config.methods
      : [];

    config.contact = config.contact || {};

    // Load payment methods safely.
    if ($('paymentMethod')) {
      $('paymentMethod').innerHTML = config.methods.map(method => `
        <option value="${escapeHtml(method.id)}">
          ${escapeHtml(method.label)}
        </option>
      `).join('');

      updatePaymentInfo();
    }

    // Support the optional contactDetails element if present.
    if ($('contactDetails')) {
      $('contactDetails').textContent = [
        config.contact.phone,
        config.contact.email,
        config.contact.location
      ].filter(Boolean).join(' · ');
    }

    renderProducts();
    renderCart();

  } catch (err) {
    if ($('products')) {
      $('products').textContent =
        'Store unavailable. Please try again later.';
    }

    console.error('Website data could not be loaded:', err);
  }
})();

// FOOTER YEAR
if ($('year')) {
  $('year').textContent = new Date().getFullYear();
}

// INITIAL PAGE SECTION
const initialSection = location.hash.slice(1);

showSection(
  pageSections.some(item => item.id === initialSection)
    ? initialSection
    : 'home',
  { updateHistory: false }
);

/* KEYBOARD SECTION NAVIGATION */
(() => {
  const sections = [
    ...document.querySelectorAll("main > section[id]")
  ];

  if (!sections.length) return;

  function getCurrentIndex() {
    const index = sections.findIndex(section =>
      section.classList.contains("active-section")
    );

    return index >= 0 ? index : 0;
  }

  function goToSection(index) {
    const nextIndex = Math.max(
      0,
      Math.min(index, sections.length - 1)
    );

    const target = sections[nextIndex];

    if (typeof showSection === "function") {
      showSection(target.id);
    } else {
      sections.forEach(section => {
        const active = section === target;
        section.classList.toggle("active-section", active);
        section.hidden = !active;
      });

      history.replaceState(null, "", `#${target.id}`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  document.addEventListener("keydown", event => {
    // Do not change sections while the user is typing.
    const element = event.target;
    const typing = element instanceof HTMLElement &&
      (element.isContentEditable ||
       ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName));

    if (typing || event.altKey || event.ctrlKey ||
        event.metaKey || event.shiftKey) return;

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSection(getCurrentIndex() + 1);
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSection(getCurrentIndex() - 1);
    }
  });
})();
