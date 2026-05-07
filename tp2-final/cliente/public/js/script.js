const API_URL = 'http://localhost:3000/productos';

const STORAGE_KEY = 'pokeAestheticCart';

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  updateCartCount();

  if (page === 'catalogo') initCatalogPage();
  else if (page === 'carrito') initCartPage();
  else if (page === 'confirmacion') initConfirmationPage();
});

function getCart() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const span = document.getElementById('cart-count');
  if (!span) return;
  const total = getCart().reduce((acc, item) => acc + item.quantity, 0);
  span.textContent = total;
}
 
async function initCatalogPage() {
  const productList = document.getElementById('product-list');
  const feedback = document.getElementById('feedback');
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  const resetButton = document.getElementById('resetButton');

  if (!productList) return;

  let productosCargados = [];

  try {
    const respuesta = await fetch(API_URL);
    productosCargados = await respuesta.json();
    renderProductos(productosCargados, productList);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    if (feedback) {
      feedback.textContent = 'Error al cargar los productos. Recargá la página.';
      feedback.classList.remove('hidden');
    }
  }

  if (searchButton && searchInput) {
    searchButton.addEventListener('click', () => {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) { renderProductos(productosCargados, productList); return; }
      const filtered = productosCargados.filter(p => p.nombre.toLowerCase().includes(term));
      if (filtered.length === 0) {
        if (feedback) { feedback.textContent = 'No se encontraron Pokémon con ese nombre.'; feedback.classList.remove('hidden'); }
        productList.innerHTML = '';
      } else {
        if (feedback) feedback.classList.add('hidden');
        renderProductos(filtered, productList);
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (feedback) feedback.classList.add('hidden');
      renderProductos(productosCargados, productList);
    });
  }
}

function renderProductos(productos, container) {
  container.innerHTML = '';
  productos.forEach(producto => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = producto.imagen || '';
    img.alt = producto.nombre;

    const name = document.createElement('h3');
    name.className = 'product-name';
    name.textContent = producto.nombre;

    const tipo = document.createElement('p');
    tipo.className = 'product-type';
    tipo.textContent = 'Tipo: ' + (producto.tipo || '—');

    const price = document.createElement('p');
    price.className = 'product-price';
    price.textContent = '$ ' + Number(producto.precio || 0).toLocaleString('es-AR');

    const button = document.createElement('button');
    button.className = 'btn-primary';
    button.textContent = 'Agregar al carrito';
    button.addEventListener('click', () => addToCart(producto));

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(tipo);
    card.appendChild(price);
    card.appendChild(button);
    container.appendChild(card);
  });
}

function addToCart(producto) {
  const cart = getCart();
  const existing = cart.find(item => item.id === producto.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: producto.id, name: producto.nombre, image: producto.imagen, tipo: producto.tipo, price: producto.precio, quantity: 1 });
  }
  saveCart(cart);
}

function initCartPage() {
  const cartList = document.getElementById('cart-items');
  const cartEmpty = document.getElementById('cart-empty');
  const cartSummary = document.getElementById('cart-summary');
  const totalSpan = document.getElementById('cart-total');
  const qtySpan = document.getElementById('cart-quantity');
  const clearBtn = document.getElementById('clear-cart');
  const hiddenTotal = document.getElementById('montoTotal');

  function renderCart() {
    const cart = getCart();
    cartList.innerHTML = '';

    if (cart.length === 0) {
      cartEmpty.classList.remove('hidden');
      cartSummary.classList.add('hidden');
      if (hiddenTotal) hiddenTotal.value = 0;
      return;
    }

    cartEmpty.classList.add('hidden');
    cartSummary.classList.remove('hidden');

    let total = 0, totalQty = 0;

    cart.forEach(item => {
      const li = document.createElement('li');
      li.className = 'cart-item';

      const img = document.createElement('img');
      img.src = item.image; img.alt = item.name;

      const info = document.createElement('div');
      info.className = 'cart-item-info';
      info.innerHTML = `<p class="cart-item-title">${item.name}</p><p class="cart-item-type">Tipo: ${item.tipo || '—'}</p>`;

      const actions = document.createElement('div');
      actions.className = 'cart-item-actions';

      const subtotal = item.price * item.quantity;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'btn-secondary';
      removeBtn.textContent = 'Eliminar';
      removeBtn.addEventListener('click', () => {
        let cart = getCart();
        saveCart(cart.filter(i => i.id !== item.id));
        renderCart();
      });

      actions.innerHTML = `<span class="cart-item-qty">Cantidad: ${item.quantity}</span><span class="cart-item-price">$ ${subtotal.toLocaleString('es-AR')}</span>`;
      actions.appendChild(removeBtn);

      li.appendChild(img); li.appendChild(info); li.appendChild(actions);
      cartList.appendChild(li);

      total += subtotal; totalQty += item.quantity;
    });

    if (totalSpan) totalSpan.textContent = '$ ' + total.toLocaleString('es-AR');
    if (qtySpan) qtySpan.textContent = totalQty;
    if (hiddenTotal) hiddenTotal.value = total;
  }

  if (clearBtn) clearBtn.addEventListener('click', () => { saveCart([]); renderCart(); });

  renderCart();
}

function initConfirmationPage() {
  const box = document.getElementById('confirmation-box');
  const params = new URLSearchParams(window.location.search);
  const cart = getCart();
  saveCart([]);

  if (!box) return;

  const nombre = params.get('nombreCompleto') || 'cliente';
  const email = params.get('email') || '';
  const direccion = params.get('direccion') || '';
  const metodoPago = params.get('metodoPago') || '';
  const total = params.get('montoTotal') || '0';
  const metodoTexto = metodoPago === 'debito' ? 'Tarjeta de débito' : metodoPago === 'credito' ? 'Tarjeta de crédito' : 'Método no especificado';

  box.innerHTML = `
    <h2>¡Compra realizada con éxito!</h2>
    <p>Gracias, <strong>${nombre}</strong>. Tu pedido fue procesado correctamente.<br>
    Te enviaremos un resumen a <strong>${email}</strong> y lo recibirás en: <strong>${direccion}</strong>.</p>
    <p>Método de pago: <strong>${metodoTexto}</strong><br>
    Monto total: <strong>$ ${Number(total).toLocaleString('es-AR')}</strong></p>
  `;

  if (cart.length > 0) {
    const listTitle = document.createElement('p');
    listTitle.textContent = 'Resumen de Pokémon comprados:';
    const ul = document.createElement('ul');
    ul.className = 'confirmation-list';
    cart.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.quantity}× ${item.name}`;
      ul.appendChild(li);
    });
    box.appendChild(listTitle);
    box.appendChild(ul);
  }
}
