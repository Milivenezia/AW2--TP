
const POKE_API_URL = "https://pokeapi.co/api/v2/pokemon/";

const POKEMON_IDS = [1, 4, 7, 25, 35, 39, 133, 196]; 

const STORAGE_KEY = "pokeAestheticCart";


document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  updateCartCount();

  if (page === "catalogo") {
    initCatalogPage();
  } else if (page === "carrito") {
    initCartPage();
  } else if (page === "confirmacion") {
    initConfirmationPage();
  }
});


function getCart() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const span = document.getElementById("cart-count");
  if (!span) return;
  const cart = getCart();
  const totalQty = cart.reduce((acc, item) => acc + item.quantity, 0);
  span.textContent = totalQty;
}


async function initCatalogPage() {
  const productList = document.getElementById("product-list");
  const feedback = document.getElementById("feedback");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const resetButton = document.getElementById("resetButton");

  if (!productList) return;

  let loadedPokemons = [];

  try {
    feedback.classList.add("hidden");
    feedback.textContent = "";


    const promises = POKEMON_IDS.map(id => fetchPokemon(id));
    loadedPokemons = await Promise.all(promises);

    renderProducts(loadedPokemons, productList);
  } catch (error) {
    console.error("Error al cargar el catálogo:", error);
    showFeedback(
      feedback,
      "Ocurrió un error al cargar los Pokémon. Probá recargar la página.",
      "error"
    );
  }


  if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
      const term = searchInput.value.trim().toLowerCase();
      if (!term) {
        renderProducts(loadedPokemons, productList);
        return;
      }
      const filtered = loadedPokemons.filter(p =>
        p.name.toLowerCase().includes(term)
      );
      if (filtered.length === 0) {
        showFeedback(
          feedback,
          "No se encontraron Pokémon con ese nombre.",
          "info"
        );
        productList.innerHTML = "";
      } else {
        feedback.classList.add("hidden");
        renderProducts(filtered, productList);
      }
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      feedback.classList.add("hidden");
      renderProducts(loadedPokemons, productList);
    });
  }
}

async function fetchPokemon(idOrName) {
  const response = await fetch(POKE_API_URL + idOrName.toString().toLowerCase());
  if (!response.ok) {
    throw new Error("Error en fetch: " + response.status);
  }
  const data = await response.json();


  const baseExp = data.base_experience || 50;
  const price = Math.floor(baseExp * 12.5); 


  const types = data.types.map(t => t.type.name);

  return {
    id: data.id,
    name: data.name,
    image:
      data.sprites.other?.["official-artwork"]?.front_default ||
      data.sprites.front_default,
    types,
    price
  };
}

function renderProducts(pokemons, container) {
  container.innerHTML = "";
  pokemons.forEach(pokemon => {
    const card = document.createElement("article");
    card.className = "product-card";

    const img = document.createElement("img");
    img.src = pokemon.image;
    img.alt = pokemon.name;

    const name = document.createElement("h3");
    name.className = "product-name";
    name.textContent = pokemon.name;

    const type = document.createElement("p");
    type.className = "product-type";
    type.textContent = "Tipo: " + pokemon.types.join(", ");

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = "$ " + pokemon.price.toLocaleString("es-AR");

    const button = document.createElement("button");
    button.className = "btn-primary";
    button.textContent = "Agregar al carrito";
    button.addEventListener("click", () => {
      addToCart(pokemon);
    });

    card.appendChild(img);
    card.appendChild(name);
    card.appendChild(type);
    card.appendChild(price);
    card.appendChild(button);

    container.appendChild(card);
  });
}

function showFeedback(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("hidden", "error", "info");
  element.classList.add(type === "error" ? "error" : "info");
}

//CARRITO//
function addToCart(pokemon) {
  const cart = getCart();
  const existing = cart.find(item => item.id === pokemon.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: pokemon.id,
      name: pokemon.name,
      image: pokemon.image,
      types: pokemon.types,
      price: pokemon.price,
      quantity: 1
    });
  }

  saveCart(cart);
}

function initCartPage() {
  const cartList = document.getElementById("cart-items");
  const cartEmpty = document.getElementById("cart-empty");
  const cartSummary = document.getElementById("cart-summary");
  const totalSpan = document.getElementById("cart-total");
  const qtySpan = document.getElementById("cart-quantity");
  const clearBtn = document.getElementById("clear-cart");
  const hiddenTotal = document.getElementById("montoTotal");

  function renderCart() {
    const cart = getCart();
    cartList.innerHTML = "";

    if (cart.length === 0) {
      cartEmpty.classList.remove("hidden");
      cartSummary.classList.add("hidden");
      if (hiddenTotal) hiddenTotal.value = 0;
      return;
    }

    cartEmpty.classList.add("hidden");
    cartSummary.classList.remove("hidden");

    let total = 0;
    let totalQty = 0;

    cart.forEach(item => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const img = document.createElement("img");
      img.src = item.image;
      img.alt = item.name;

      const info = document.createElement("div");
      info.className = "cart-item-info";

      const title = document.createElement("p");
      title.className = "cart-item-title";
      title.textContent = item.name;

      const type = document.createElement("p");
      type.className = "cart-item-type";
      type.textContent = "Tipo: " + (item.types || []).join(", ");

      info.appendChild(title);
      info.appendChild(type);

      const actions = document.createElement("div");
      actions.className = "cart-item-actions";

      const qty = document.createElement("span");
      qty.className = "cart-item-qty";
      qty.textContent = "Cantidad: " + item.quantity;

      const price = document.createElement("span");
      price.className = "cart-item-price";
      const subtotal = item.price * item.quantity;
      price.textContent = "$ " + subtotal.toLocaleString("es-AR");

      const removeBtn = document.createElement("button");
      removeBtn.className = "btn-secondary";
      removeBtn.textContent = "Eliminar";
      removeBtn.addEventListener("click", () => {
        removeFromCart(item.id);
        renderCart();
      });

      actions.appendChild(qty);
      actions.appendChild(price);
      actions.appendChild(removeBtn);

      li.appendChild(img);
      li.appendChild(info);
      li.appendChild(actions);

      cartList.appendChild(li);

      total += subtotal;
      totalQty += item.quantity;
    });

    if (totalSpan) {
      totalSpan.textContent = "$ " + total.toLocaleString("es-AR");
    }
    if (qtySpan) {
      qtySpan.textContent = totalQty;
    }
    if (hiddenTotal) {
      hiddenTotal.value = total;
    }
  }

  function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== id);
    saveCart(cart);
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      saveCart([]);
      renderCart();
    });
  }

  renderCart();
}

function initConfirmationPage() {
  const box = document.getElementById("confirmation-box");
  const params = new URLSearchParams(window.location.search);

  const nombre = params.get("nombreCompleto") || "cliente";
  const email = params.get("email") || "";
  const direccion = params.get("direccion") || "";
  const metodoPago = params.get("metodoPago") || "";
  const total = params.get("montoTotal") || "0";

  const cart = getCart();

  // Limpiar carrito después de usarlo
  saveCart([]);

  if (!box) return;

  const title = document.createElement("h2");
  title.textContent = "¡Compra realizada con éxito!";

  const msg = document.createElement("p");
  msg.innerHTML = `
    Gracias, <strong>${nombre}</strong>. Tu pedido fue procesado correctamente.<br>
    Te enviaremos un resumen a <strong>${email}</strong> y lo enviaremos a la dirección:<br>
    <strong>${direccion}</strong>.
  `;

  const payInfo = document.createElement("p");
  let metodoTexto = "";
  if (metodoPago === "debito") metodoTexto = "Tarjeta de débito";
  else if (metodoPago === "credito") metodoTexto = "Tarjeta de crédito";
  else metodoTexto = "Método no especificado";

  payInfo.innerHTML = `
    Método de pago: <strong>${metodoTexto}</strong><br>
    Monto total: <strong>$ ${Number(total).toLocaleString("es-AR")}</strong>
  `;

  box.appendChild(title);
  box.appendChild(msg);
  box.appendChild(payInfo);

  if (cart.length > 0) {
    const listTitle = document.createElement("p");
    listTitle.textContent = "Resumen de Pokémon comprados:";

    const ul = document.createElement("ul");
    ul.className = "confirmation-list";

    cart.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.quantity}× ${item.name}`;
      ul.appendChild(li);
    });

    box.appendChild(listTitle);
    box.appendChild(ul);
  }
}
