import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =========================================================
   SAFARIA FIREBASE CONFIG
========================================================= */

const firebaseConfig = {
  apiKey: "AIzaSyC7Mv67KGZFoUj3MyUHqC-rBGHQRfuY1HE",
  authDomain: "safaria10-4e96a.firebaseapp.com",
  projectId: "safaria10-4e96a",
  storageBucket: "safaria10-4e96a.firebasestorage.app",
  messagingSenderId: "184457605385",
  appId: "1:184457605385:web:4c6c6a2b7e9b6f5f9f6c0b"
};


/* =========================================================
   INITIALIZE FIREBASE
========================================================= */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


/* =========================================================
   STORE SETTINGS
========================================================= */

const STORE_NAME = "SAFARIA";
const UPI_ID = "safaria6@ybl";
const ADMIN_EMAIL = "sajidmohammad95366@gmail.com";

const CART_KEY = "safaria_cart_v2";
const LOCAL_PRODUCTS_KEY = "safaria_products_v2";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;

let products = [];

let cart = loadCart();

let currentCategory = "all";

let currentSearch = "";

let currentProduct = null;

let currentProductQuantity = 1;

let selectedSize = "";
let selectedColor = "";

let toastTimer = null;


/* =========================================================
   DEFAULT PRODUCTS
========================================================= */

const defaultProducts = [

  {
    id: "safaria-001",
    name: "Urban Classic Sneakers",
    category: "fashion",
    price: 1499,
    oldPrice: 1999,
    rating: 4.3,
    reviews: 126,
    emoji: "👟",
    image: "",
    description:
      "Comfortable everyday sneakers with a modern design. Perfect for casual outfits and daily use.",
    sizes: ["6", "7", "8", "9", "10"],
    colors: ["Black", "White", "Grey"],
    stock: 25
  },

  {
    id: "safaria-002",
    name: "Everyday Oversized Tee",
    category: "fashion",
    price: 699,
    oldPrice: 999,
    rating: 4.4,
    reviews: 94,
    emoji: "👕",
    image: "",
    description:
      "Soft oversized t-shirt designed for everyday comfort and a relaxed streetwear look.",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Black", "White", "Blue"],
    stock: 40
  },

  {
    id: "safaria-003",
    name: "Pulse Wireless Headphones",
    category: "electronics",
    price: 2299,
    oldPrice: 2999,
    rating: 4.5,
    reviews: 213,
    emoji: "🎧",
    image: "",
    description:
      "Wireless headphones with comfortable ear cushions, strong battery life and clear sound.",
    sizes: [],
    colors: ["Black", "White"],
    stock: 18
  },

  {
    id: "safaria-004",
    name: "Mini Smart Speaker",
    category: "electronics",
    price: 1799,
    oldPrice: 2299,
    rating: 4.2,
    reviews: 88,
    emoji: "🔊",
    image: "",
    description:
      "Compact smart speaker for music, podcasts and everyday entertainment.",
    sizes: [],
    colors: ["Black", "Grey"],
    stock: 20
  },

  {
    id: "safaria-005",
    name: "Aura Desk Lamp",
    category: "home",
    price: 999,
    oldPrice: 1399,
    rating: 4.4,
    reviews: 67,
    emoji: "💡",
    image: "",
    description:
      "Minimal desk lamp for study tables, workspaces and bedrooms.",
    sizes: [],
    colors: ["White", "Black"],
    stock: 30
  },

  {
    id: "safaria-006",
    name: "Minimal Ceramic Set",
    category: "home",
    price: 799,
    oldPrice: 1099,
    rating: 4.1,
    reviews: 51,
    emoji: "🍵",
    image: "",
    description:
      "Elegant ceramic set designed for modern kitchens and dining spaces.",
    sizes: [],
    colors: ["White", "Cream"],
    stock: 22
  },

  {
    id: "safaria-007",
    name: "Daily Carry Backpack",
    category: "accessories",
    price: 1299,
    oldPrice: 1799,
    rating: 4.5,
    reviews: 145,
    emoji: "🎒",
    image: "",
    description:
      "Spacious everyday backpack for college, office and travel.",
    sizes: [],
    colors: ["Black", "Grey", "Blue"],
    stock: 35
  },

  {
    id: "safaria-008",
    name: "Hydro Steel Bottle",
    category: "accessories",
    price: 599,
    oldPrice: 799,
    rating: 4.3,
    reviews: 73,
    emoji: "🥤",
    image: "",
    description:
      "Reusable steel bottle suitable for work, gym, school and travel.",
    sizes: ["500ml", "750ml", "1L"],
    colors: ["Black", "Silver", "Blue"],
    stock: 50
  }

];


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  setupEvents();

  renderCartCount();

  await loadProducts();

  hideLoading();

  showSection("home");

});


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoading() {

  const loading = $("loadingScreen");

  if (!loading) return;

  setTimeout(() => {
    loading.classList.add("hidden");
  }, 500);
}


/* =========================================================
   LOAD PRODUCTS
========================================================= */

async function loadProducts() {

  try {

    const productsSnapshot = await getDocs(
      collection(db, "products")
    );

    if (!productsSnapshot.empty) {

      products = productsSnapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));

    } else {

      products = [...defaultProducts];

    }

  } catch (error) {

    console.log("Firestore product load error:", error);

    products = getLocalProducts();

  }

  if (!products.length) {
    products = [...defaultProducts];
  }

  renderTrendingProducts();
  renderShopProducts();

}


/* =========================================================
   LOCAL PRODUCTS
========================================================= */

function getLocalProducts() {

  try {

    const saved = localStorage.getItem(
      LOCAL_PRODUCTS_KEY
    );

    if (saved) {
      return JSON.parse(saved);
    }

  } catch (error) {
    console.log(error);
  }

  return [...defaultProducts];
}


/* =========================================================
   CART
========================================================= */

function loadCart() {

  try {

    const saved = localStorage.getItem(CART_KEY);

    if (saved) {
      return JSON.parse(saved);
    }

  } catch (error) {
    console.log(error);
  }

  return [];
}


function saveCart() {

  localStorage.setItem(
    CART_KEY,
    JSON.stringify(cart)
  );

  renderCartCount();
}


function renderCartCount() {

  const count = cart.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );

  if ($("cartCount")) {
    $("cartCount").textContent = count;
  }

  if ($("bottomCartCount")) {
    $("bottomCartCount").textContent = count;
  }
}


/* =========================================================
   MONEY
========================================================= */

function money(value) {

  return "₹" + Number(value || 0).toLocaleString("en-IN");

}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function productImage(product, className = "product-image") {

  if (product.image && String(product.image).trim()) {

    return `
      <img
        class="${className}"
        src="${escapeAttribute(product.image)}"
        alt="${escapeAttribute(product.name || "Product")}"
        loading="lazy"
        onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
      >
      <div class="product-placeholder" style="display:none;">
        ${product.emoji || "🛍️"}
      </div>
    `;

  }

  return `
    <div class="product-placeholder">
      ${product.emoji || "🛍️"}
    </div>
  `;
}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


function escapeAttribute(value) {

  return escapeHTML(value)
    .replaceAll("\n", "")
    .replaceAll("\r", "");

}


/* =========================================================
   PRODUCT CARD
========================================================= */

function productCard(product) {

  const price = Number(product.price || 0);
  const oldPrice = Number(product.oldPrice || 0);

  let discount = 0;

  if (oldPrice > price) {

    discount = Math.round(
      ((oldPrice - price) / oldPrice) * 100
    );

  }

  return `
    <article class="product-card" data-product-id="${escapeAttribute(product.id)}">

      <div
        class="product-image-wrap"
        data-product-click="${escapeAttribute(product.id)}"
      >

        ${
          discount > 0
            ? `<span class="product-discount">${discount}% OFF</span>`
            : ""
        }

        <button
          class="product-wishlist"
          type="button"
          data-wishlist="${escapeAttribute(product.id)}"
          aria-label="Wishlist"
        >
          ♡
        </button>

        ${productImage(product)}

      </div>

      <div class="product-info">

        <div class="product-category">
          ${escapeHTML(product.category || "Product")}
        </div>

        <h3
          class="product-name"
          data-product-click="${escapeAttribute(product.id)}"
        >
          ${escapeHTML(product.name || "SAFARIA Product")}
        </h3>

        <div class="product-rating">
          ★ ${Number(product.rating || 4.2).toFixed(1)}
        </div>

        <span style="font-size:9px;color:#697386;">
          (${Number(product.reviews || 0)} reviews)
        </span>

        <div class="product-price-row">

          <strong class="product-price">
            ${money(price)}
          </strong>

          ${
            oldPrice > price
              ? `<span class="product-old-price">${money(oldPrice)}</span>`
              : ""
          }

        </div>

        <div class="product-actions">

          <button
            class="add-cart-btn"
            type="button"
            data-add-cart="${escapeAttribute(product.id)}"
          >
            Add to Cart
          </button>

          <button
            class="buy-now-btn"
            type="button"
            data-buy-now="${escapeAttribute(product.id)}"
          >
            Buy Now
          </button>

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   RENDER TRENDING
========================================================= */

function renderTrendingProducts() {

  const container = $("trendingProducts");

  if (!container) return;

  container.innerHTML = products
    .slice(0, 8)
    .map(productCard)
    .join("");

}


/* =========================================================
   RENDER SHOP
========================================================= */

function renderShopProducts() {

  const container = $("shopProducts");

  if (!container) return;

  let result = [...products];

  if (currentCategory !== "all") {

    result = result.filter(
      product =>
        String(product.category || "").toLowerCase() ===
        currentCategory.toLowerCase()
    );

  }

  if (currentSearch.trim()) {

    const search = currentSearch
      .toLowerCase()
      .trim();

    result = result.filter(product => {

      const text = [
        product.name,
        product.category,
        product.description
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(search);

    });

  }

  const sort = $("sortProducts")?.value || "default";

  if (sort === "low") {

    result.sort(
      (a, b) =>
        Number(a.price || 0) -
        Number(b.price || 0)
    );

  } else if (sort === "high") {

    result.sort(
      (a, b) =>
        Number(b.price || 0) -
        Number(a.price || 0)
    );

  } else if (sort === "name") {

    result.sort(
      (a, b) =>
        String(a.name || "").localeCompare(
          String(b.name || "")
        )
    );

  }

  container.innerHTML = result
    .map(productCard)
    .join("");

  const noProducts = $("noProducts");

  if (noProducts) {

    noProducts.classList.toggle(
      "hidden",
      result.length !== 0
    );

  }

  if ($("shopResultText")) {

    $("shopResultText").textContent =
      `${result.length} product${result.length === 1 ? "" : "s"} found`;

  }

}


/* =========================================================
   PRODUCT DETAILS
========================================================= */

function openProduct(productId) {

  const product = products.find(
    item => String(item.id) === String(productId)
  );

  if (!product) return;

  currentProduct = product;
  currentProductQuantity = 1;

  selectedSize =
    product.sizes && product.sizes.length
      ? product.sizes[0]
      : "";

  selectedColor =
    product.colors && product.colors.length
      ? product.colors[0]
      : "";

  renderProductDetails();

  showSection("product");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


function renderProductDetails() {

  const container = $("productDetails");

  if (!container || !currentProduct) return;

  const p = currentProduct;

  const price = Number(p.price || 0);
  const oldPrice = Number(p.oldPrice || 0);

  let sizeHTML = "";

  if (p.sizes && p.sizes.length) {

    sizeHTML = `
      <div class="detail-option">

        <div class="detail-option-title">
          Select Size
        </div>

        <div class="option-list">

          ${p.sizes.map(size => `
            <button
              class="option-btn ${size === selectedSize ? "active" : ""}"
              type="button"
              data-detail-size="${escapeAttribute(size)}"
            >
              ${escapeHTML(size)}
            </button>
          `).join("")}

        </div>

      </div>
    `;

  }

  let colorHTML = "";

  if (p.colors && p.colors.length) {

    colorHTML = `
      <div class="detail-option">

        <div class="detail-option-title">
          Select Color
        </div>

        <div class="option-list">

          ${p.colors.map(color => `
            <button
              class="option-btn ${color === selectedColor ? "active" : ""}"
              type="button"
              data-detail-color="${escapeAttribute(color)}"
            >
              ${escapeHTML(color)}
            </button>
          `).join("")}

        </div>

      </div>
    `;

  }

  container.innerHTML = `

    <div class="product-detail-card">

      <div class="detail-image">
        ${productImage(p, "detail-product-image")}
      </div>

      <div class="detail-info">

        <div class="detail-category">
          ${escapeHTML(p.category || "Product")}
        </div>

        <h1>${escapeHTML(p.name)}</h1>

        <div class="product-rating">
          ★ ${Number(p.rating || 4.2).toFixed(1)}
        </div>

        <span style="font-size:11px;color:#697386;">
          ${Number(p.reviews || 0)} ratings & reviews
        </span>

        <p class="detail-description">
          ${escapeHTML(
            p.description ||
            "Quality product from SAFARIA."
          )}
        </p>

        <div>

          <span class="detail-price">
            ${money(price)}
          </span>

          ${
            oldPrice > price
              ? `
                <span class="detail-old-price">
                  ${money(oldPrice)}
                </span>
              `
              : ""
          }

        </div>

        ${
          p.stock !== undefined
            ? `
              <p style="
                color:${Number(p.stock) > 0 ? "#16a34a" : "#e53935"};
                font-size:11px;
                font-weight:700;
                margin-top:8px;
              ">
                ${
                  Number(p.stock) > 0
                    ? `${Number(p.stock)} items available`
                    : "Out of stock"
                }
              </p>
            `
            : ""
        }

        ${sizeHTML}

        ${colorHTML}

        <div class="detail-option">

          <div class="detail-option-title">
            Quantity
          </div>

          <div class="quantity-box">

            <button
              type="button"
              id="detailQtyMinus"
            >
              −
            </button>

            <span id="detailQty">
              ${currentProductQuantity}
            </span>

            <button
              type="button"
              id="detailQtyPlus"
            >
              +
            </button>

          </div>

        </div>

        <div class="detail-actions">

          <button
            type="button"
            class="detail-add"
            id="detailAddCart"
          >
            🛒 Add to Cart
          </button>

          <button
            type="button"
            class="detail-buy"
            id="detailBuyNow"
          >
            Buy Now
          </button>

        </div>

      </div>

    </div>

  `;

}


/* =========================================================
   ADD TO CART
========================================================= */

function addToCart(product, quantity = 1, size = "", color = "") {

  if (!product) return;

  if (
    product.stock !== undefined &&
    Number(product.stock) <= 0
  ) {

    showToast(
      "Product is out of stock",
      "!"
    );

    return;

  }

  const key =
    `${product.id}__${size || ""}__${color || ""}`;

  const existing = cart.find(
    item => item.key === key
  );

  if (existing) {

    existing.quantity += Number(quantity);

  } else {

    cart.push({

      key,

      productId: product.id,

      name: product.name,

      price: Number(product.price || 0),

      image: product.image || "",

      emoji: product.emoji || "🛍️",

      size,

      color,

      quantity: Number(quantity)

    });

  }

  saveCart();

  showToast(
    "Added to cart",
    "✓"
  );

}


function buyNow(product, quantity = 1, size = "", color = "") {

  if (!product) return;

  addToCart(
    product,
    quantity,
    size,
    color
  );

  if (!currentUser) {

    openLoginRequired();

    return;

  }

  renderCheckout();

  showSection("checkout");

}


/* =========================================================
   CART RENDER
========================================================= */

function renderCart() {

  const container = $("cartItems");
  const empty = $("emptyCart");
  const summary = $("cartSummary");

  if (!container || !summary) return;

  if (!cart.length) {

    container.innerHTML = "";

    summary.innerHTML = "";

    empty?.classList.remove("hidden");

    if ($("cartItemText")) {
      $("cartItemText").textContent = "0 items";
    }

    return;

  }

  empty?.classList.add("hidden");

  container.innerHTML = cart.map(item => `

    <div class="cart-item">

      <div class="cart-item-image">

        ${
          item.image
            ? `
              <img
                src="${escapeAttribute(item.image)}"
                alt="${escapeAttribute(item.name)}"
                onerror="this.style.display='none';"
              >
            `
            : `<div class="product-placeholder">${item.emoji || "🛍️"}</div>`
        }

      </div>

      <div>

        <h3>${escapeHTML(item.name)}</h3>

        <div class="cart-item-meta">

          ${
            item.size
              ? `Size: ${escapeHTML(item.size)}`
              : ""
          }

          ${
            item.color
              ? ` ${item.size ? "• " : ""}Color: ${escapeHTML(item.color)}`
              : ""
          }

        </div>

        <div class="cart-item-price">
          ${money(item.price)}
        </div>

        <div class="cart-item-controls">

          <div class="cart-qty">

            <button
              type="button"
              data-cart-minus="${escapeAttribute(item.key)}"
            >
              −
            </button>

            <span>
              ${Number(item.quantity)}
            </span>

            <button
              type="button"
              data-cart-plus="${escapeAttribute(item.key)}"
            >
              +
            </button>

          </div>

          <button
            type="button"
            class="remove-cart"
            data-cart-remove="${escapeAttribute(item.key)}"
          >
            Remove
          </button>

        </div>

      </div>

      <div class="cart-item-total">
        ${money(Number(item.price) * Number(item.quantity))}
      </div>

    </div>

  `).join("");

  const subtotal = getCartSubtotal();

  summary.innerHTML = `

    <h2>Price Details</h2>

    <div class="summary-row">
      <span>Price (${cart.reduce((a,b) => a + Number(b.quantity), 0)} items)</span>
      <strong>${money(subtotal)}</strong>
    </div>

    <div class="summary-row">
      <span>Delivery</span>
      <strong style="color:#16a34a;">FREE</strong>
    </div>

    <div class="summary-divider"></div>

    <div class="summary-row total-row">
      <span>Total Amount</span>
      <strong>${money(subtotal)}</strong>
    </div>

    <button
      id="cartCheckoutBtn"
      class="checkout-btn"
      type="button"
    >
      Proceed to Checkout
    </button>

  `;

  if ($("cartItemText")) {

    const count = cart.reduce(
      (a, b) => a + Number(b.quantity),
      0
    );

    $("cartItemText").textContent =
      `${count} item${count === 1 ? "" : "s"}`;

  }

}


function getCartSubtotal() {

  return cart.reduce(
    (total, item) =>
      total +
      Number(item.price || 0) *
      Number(item.quantity || 0),
    0
  );

}


/* =========================================================
   CHECKOUT
========================================================= */

function renderCheckout() {

  if (!cart.length) {

    showToast(
      "Your cart is empty",
      "!"
    );

    showSection("shop");

    return;

  }

  if ($("checkoutSubtotal")) {
    $("checkoutSubtotal").textContent =
      money(getCartSubtotal());
  }

  if ($("checkoutTotal")) {
    $("checkoutTotal").textContent =
      money(getCartSubtotal());
  }

  if ($("checkoutDelivery")) {
    $("checkoutDelivery").textContent =
      "FREE";
  }

  const container = $("checkoutItems");

  if (container) {

    container.innerHTML = cart.map(item => `

      <div class="checkout-product-line">

        <span>
          ${escapeHTML(item.name)}
          × ${Number(item.quantity)}
        </span>

        <strong>
          ${money(
            Number(item.price) *
            Number(item.quantity)
          )}
        </strong>

      </div>

    `).join("");

  }

  if (currentUser) {

    const name =
      currentUser.displayName || "";

    if ($("addressName") && name) {
      $("addressName").value = name;
    }

  }

}


/* =========================================================
   PLACE ORDER
========================================================= */

async function placeOrder() {

  if (!currentUser) {

    openLoginRequired();

    return;

  }

  if (!cart.length) {

    showToast(
      "Your cart is empty",
      "!"
    );

    return;

  }

  const name =
    $("addressName")?.value.trim() || "";

  const phone =
    $("addressPhone")?.value.trim() || "";

  const address =
    $("addressLine")?.value.trim() || "";

  const city =
    $("addressCity")?.value.trim() || "";

  const pincode =
    $("addressPincode")?.value.trim() || "";

  const state =
    $("addressState")?.value.trim() || "";

  if (
    !name ||
    !phone ||
    !address ||
    !city ||
    !pincode ||
    !state
  ) {

    showToast(
      "Please complete your delivery address",
      "!"
    );

    return;

  }

  if (!/^[0-9]{10}$/.test(phone)) {

    showToast(
      "Enter a valid 10 digit mobile number",
      "!"
    );

    return;

  }

  if (!/^[0-9]{6}$/.test(pincode)) {

    showToast(
      "Enter a valid 6 digit PIN code",
      "!"
    );

    return;

  }

  const payment =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value || "upi";


  /* UPI REQUIREMENT */

  if (payment === "upi") {

    const paid =
      $("upiPaidCheckbox")?.checked;

    if (!paid) {

      showToast(
        "Complete UPI payment first",
        "!"
      );

      return;

    }

  }


  const subtotal =
    getCartSubtotal();


  const orderId =
    createOrderId();


  const orderData = {

    orderId,

    userId: currentUser.uid,

    customerName: name,

    customerEmail:
      currentUser.email || "",

    phone,

    address,

    city,

    pincode,

    state,

    items: cart.map(item => ({

      productId: item.productId,

      name: item.name,

      price: Number(item.price || 0),

      quantity: Number(item.quantity || 0),

      size: item.size || "",

      color: item.color || "",

      image: item.image || "",

      emoji: item.emoji || ""

    })),

    subtotal,

    deliveryCharge: 0,

    total: subtotal,

    paymentMethod:
      payment === "upi"
        ? "UPI"
        : "Cash on Delivery",

    paymentStatus:
      payment === "upi"
        ? "customer_marked_paid"
        : "pending",

    paymentUpiId:
      payment === "upi"
        ? UPI_ID
        : "",

    status: "Pending",

    createdAt: serverTimestamp()

  };


  const button =
    $("placeOrderBtn");

  if (button) {

    button.disabled = true;
    button.textContent =
      "Placing Order...";

  }


  try {

    const orderRef = await addDoc(
      collection(db, "orders"),
      orderData
    );


    /* Clear cart */

    cart = [];

    saveCart();


    /* Reset payment */

    if ($("upiPaidCheckbox")) {
      $("upiPaidCheckbox").checked = false;
    }


    /* Show success */

    if ($("successOrderId")) {
      $("successOrderId").textContent =
        orderId;
    }

    $("orderSuccessModal")?.classList.remove("hidden");


  } catch (error) {

    console.error(error);

    showToast(
      "Order could not be placed. Check Firebase.",
      "!"
    );

  } finally {

    if (button) {

      button.disabled = false;
      button.textContent =
        "Place Order →";

    }

  }

}


/* =========================================================
   ORDER ID
========================================================= */

function createOrderId() {

  const date =
    new Date();

  const y =
    date.getFullYear();

  const m =
    String(date.getMonth() + 1)
      .padStart(2, "0");

  const d =
    String(date.getDate())
      .padStart(2, "0");

  const random =
    Math.floor(
      1000 + Math.random() * 9000
    );

  return `SAF-${y}${m}${d}-${random}`;

}


/* =========================================================
   LOAD ORDERS
========================================================= */

async function loadOrders() {

  const list = $("ordersList");
  const noOrders = $("noOrders");
  const loginRequired = $("ordersLoginRequired");

  if (!list) return;

  if (!currentUser) {

    list.innerHTML = "";

    noOrders?.classList.add("hidden");

    loginRequired?.classList.remove("hidden");

    return;

  }

  loginRequired?.classList.add("hidden");

  list.innerHTML = `
    <div style="
      background:#fff;
      padding:25px;
      border-radius:12px;
      text-align:center;
      color:#697386;
    ">
      Loading orders...
    </div>
  `;

  try {

    const q = query(
      collection(db, "orders"),
      where(
        "userId",
        "==",
        currentUser.uid
      )
    );

    const snapshot =
      await getDocs(q);

    const orders =
      snapshot.docs
        .map(item => ({
          id: item.id,
          ...item.data()
        }))
        .sort(
          (a, b) =>
            getTimestampValue(b.createdAt) -
            getTimestampValue(a.createdAt)
        );


    if (!orders.length) {

      list.innerHTML = "";

      noOrders?.classList.remove(
        "hidden"
      );

      return;

    }

    noOrders?.classList.add("hidden");

    list.innerHTML =
      orders.map(renderOrder).join("");


  } catch (error) {

    console.error(error);

    list.innerHTML = `
      <div class="account-login-box">
        <div>⚠️</div>
        <h2>Orders could not be loaded</h2>
        <p>
          Please check your Firebase Firestore rules.
        </p>
      </div>
    `;

  }

}


/* =========================================================
   ORDER RENDER
========================================================= */

function renderOrder(order) {

  const date =
    formatDate(order.createdAt);

  const items =
    Array.isArray(order.items)
      ? order.items
      : [];

  return `

    <article class="order-card">

      <div class="order-header">

        <div>
          <div class="order-id">
            ${escapeHTML(
              order.orderId || order.id
            )}
          </div>

          <div class="order-date">
            ${date}
          </div>
        </div>

        <span class="order-status">
          ${escapeHTML(
            order.status || "Pending"
          )}
        </span>

      </div>


      <div class="order-body">

        ${items.map(item => `

          <div class="order-product">

            <div class="order-product-image">

              ${
                item.image
                  ? `
                    <img
                      src="${escapeAttribute(item.image)}"
                      alt="${escapeAttribute(item.name)}"
                    >
                  `
                  : `
                    <span>
                      ${item.emoji || "🛍️"}
                    </span>
                  `
              }

            </div>

            <div class="order-product-name">
              ${escapeHTML(item.name)}
            </div>

            <div class="order-product-qty">
              Qty: ${Number(item.quantity || 1)}
            </div>

            <div class="order-product-price">
              ${money(
                Number(item.price || 0) *
                Number(item.quantity || 1)
              )}
            </div>

          </div>

        `).join("")}

      </div>


      <div class="order-footer">

        <div class="order-payment">
          Payment:
          <strong>
            ${escapeHTML(
              order.paymentMethod || "N/A"
            )}
          </strong>
        </div>

        <div class="order-total">
          Total:
          <strong>
            ${money(order.total || 0)}
          </strong>
        </div>

      </div>

    </article>

  `;

}


/* =========================================================
   DATE
========================================================= */

function getTimestampValue(timestamp) {

  if (!timestamp) return 0;

  if (
    typeof timestamp.toMillis === "function"
  ) {
    return timestamp.toMillis();
  }

  if (timestamp.seconds) {
    return Number(timestamp.seconds) * 1000;
  }

  return 0;

}


function formatDate(timestamp) {

  const value =
    getTimestampValue(timestamp);

  if (!value) {
    return "Recently";
  }

  return new Date(value)
    .toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

}


/* =========================================================
   AUTH STATE
========================================================= */

onAuthStateChanged(
  auth,
  user => {

    currentUser = user || null;

    updateAccountUI();

    updateLoginButton();

  }
);


/* =========================================================
   UPDATE LOGIN BUTTON
========================================================= */

function updateLoginButton() {

  const button =
    $("headerLoginBtn");

  if (!button) return;

  if (currentUser) {

    button.textContent =
      currentUser.displayName
        ? `Hi, ${currentUser.displayName.split(" ")[0]}`
        : "Account";

  } else {

    button.textContent =
      "Login";

  }

}


/* =========================================================
   ACCOUNT UI
========================================================= */

function updateAccountUI() {

  const loggedOut =
    $("loggedOutAccount");

  const loggedIn =
    $("loggedInAccount");

  if (!loggedOut || !loggedIn) return;

  if (!currentUser) {

    loggedOut.classList.remove("hidden");
    loggedIn.classList.add("hidden");

    return;

  }

  loggedOut.classList.add("hidden");
  loggedIn.classList.remove("hidden");


  const name =
    currentUser.displayName ||
    "SAFARIA Customer";

  if ($("accountName")) {
    $("accountName").textContent =
      name;
  }

  if ($("accountEmail")) {
    $("accountEmail").textContent =
      currentUser.email || "";
  }

  if ($("accountGreeting")) {
    $("accountGreeting").textContent =
      `Hello, ${name}`;
  }

  if ($("accountAvatar")) {

    $("accountAvatar").textContent =
      name.charAt(0).toUpperCase();

  }

}


/* =========================================================
   LOGIN
========================================================= */

async function loginUser(event) {

  event.preventDefault();

  const email =
    $("loginEmail")
      ?.value
      .trim();

  const password =
    $("loginPassword")
      ?.value || "";

  if (!email || !password) {

    showToast(
      "Enter email and password",
      "!"
    );

    return;

  }

  const button =
    document.querySelector(
      "#loginForm .auth-submit"
    );

  if (button) {
    button.disabled = true;
    button.textContent = "Logging in...";
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    showToast(
      "Login successful",
      "✓"
    );

    showSection("account");

  } catch (error) {

    console.error(error);

    showToast(
      friendlyAuthError(error),
      "!"
    );

  } finally {

    if (button) {

      button.disabled = false;
      button.textContent = "Login";

    }

  }

}


/* =========================================================
   SIGNUP
========================================================= */

async function signupUser(event) {

  event.preventDefault();

  const name =
    $("signupName")
      ?.value
      .trim();

  const email =
    $("signupEmail")
      ?.value
      .trim();

  const password =
    $("signupPassword")
      ?.value || "";

  if (!name || !email || !password) {

    showToast(
      "Complete all fields",
      "!"
    );

    return;

  }

  if (password.length < 6) {

    showToast(
      "Password must be at least 6 characters",
      "!"
    );

    return;

  }

  const button =
    document.querySelector(
      "#signupForm .auth-submit"
    );

  if (button) {

    button.disabled = true;
    button.textContent =
      "Creating Account...";

  }

  try {

    const result =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    await updateProfile(
      result.user,
      {
        displayName: name
      }
    );

    showToast(
      "Account created successfully",
      "✓"
    );

    showSection("account");

  } catch (error) {

    console.error(error);

    showToast(
      friendlyAuthError(error),
      "!"
    );

  } finally {

    if (button) {

      button.disabled = false;
      button.textContent =
        "Create Account";

    }

  }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutUser() {

  try {

    await signOut(auth);

    showToast(
      "Logged out",
      "✓"
    );

    showSection("home");

  } catch (error) {

    showToast(
      "Logout failed",
      "!"
    );

  }

}


/* =========================================================
   AUTH ERROR
========================================================= */

function friendlyAuthError(error) {

  const code =
    error?.code || "";

  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found")
  ) {
    return "Email or password is incorrect";
  }

  if (
    code.includes("email-already-in-use")
  ) {
    return "This email is already registered";
  }

  if (
    code.includes("invalid-email")
  ) {
    return "Enter a valid email address";
  }

  if (
    code.includes("weak-password")
  ) {
    return "Password must be at least 6 characters";
  }

  if (
    code.includes("network-request-failed")
  ) {
    return "Internet connection problem";
  }

  return (
    error?.message ||
    "Something went wrong"
  );

}


/* =========================================================
   LOGIN REQUIRED
========================================================= */

function openLoginRequired() {

  $("loginRequiredModal")
    ?.classList.remove("hidden");

}


/* =========================================================
   SHOW SECTION
========================================================= */

function showSection(section) {

  const sections = [
    "home",
    "shop",
    "product",
    "cart",
    "checkout",
    "login",
    "account",
    "orders"
  ];

  sections.forEach(name => {

    const element =
      $(`${name}Section`);

    if (!element) return;

    element.classList.toggle(
      "hidden",
      name !== section
    );

  });


  if (section === "home") {
    renderTrendingProducts();
  }

  if (section === "shop") {
    renderShopProducts();
  }

  if (section === "cart") {
    renderCart();
  }

  if (section === "checkout") {
    renderCheckout();
  }

  if (section === "orders") {
    loadOrders();
  }

  if (section === "account") {
    updateAccountUI();
  }


  updateBottomNavigation(section);

}


/* =========================================================
   BOTTOM NAV
========================================================= */

function updateBottomNavigation(section) {

  document
    .querySelectorAll(".bottom-nav-item")
    .forEach(button => {

      const target =
        button.dataset.bottomSection;

      let active =
        target === section;

      if (
        target === "search" &&
        section === "shop"
      ) {
        active = true;
      }

      button.classList.toggle(
        "active",
        active
      );

    });

}


/* =========================================================
   SEARCH
========================================================= */

function performSearch(value) {

  currentSearch =
    String(value || "").trim();

  currentCategory = "all";

  document
    .querySelectorAll(".category-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category === "all"
      );

    });

  if ($("searchInput")) {
    $("searchInput").value =
      currentSearch;
  }

  if ($("mobileSearchInput")) {
    $("mobileSearchInput").value =
      currentSearch;
  }

  renderShopProducts();

  showSection("shop");

}


/* =========================================================
   CATEGORY
========================================================= */

function selectCategory(category) {

  currentCategory =
    category || "all";

  currentSearch = "";

  if ($("searchInput")) {
    $("searchInput").value = "";
  }

  if ($("mobileSearchInput")) {
    $("mobileSearchInput").value = "";
  }

  document
    .querySelectorAll(".category-item")
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.category ===
        currentCategory
      );

    });

  renderShopProducts();

  showSection("shop");

}


/* =========================================================
   UPI PAYMENT
========================================================= */

function openUPI() {

  const amount =
    getCartSubtotal();

  if (!amount) {

    showToast(
      "Your cart is empty",
      "!"
    );

    return;

  }


  /*
    UPI deep link.

    This opens a compatible UPI application.
    The website does NOT independently verify
    whether the bank transaction actually settled.
  */

  const upiURL =
    `upi://pay?pa=${encodeURIComponent(UPI_ID)}` +
    `&pn=${encodeURIComponent(STORE_NAME)}` +
    `&am=${encodeURIComponent(amount.toFixed(2))}` +
    `&cu=INR`;


  window.location.href =
    upiURL;

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, icon = "✓") {

  const toast =
    $("toast");

  const text =
    $("toastMessage");

  const iconElement =
    $("toastIcon");

  if (!toast || !text) return;

  text.textContent =
    message;

  if (iconElement) {
    iconElement.textContent =
      icon;
  }

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toast.classList.remove(
        "show"
      );

    }, 2800);

}


/* =========================================================
   EVENT SETUP
========================================================= */

function setupEvents() {


  /* -------------------------
     BRAND
  ------------------------- */

  $("brandHome")?.addEventListener(
    "click",
    event => {

      event.preventDefault();

      currentCategory = "all";
      currentSearch = "";

      showSection("home");

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

    }
  );


  /* -------------------------
     HEADER
  ------------------------- */

  $("headerLoginBtn")?.addEventListener(
    "click",
    () => {

      if (currentUser) {
        showSection("account");
      } else {
        showSection("login");
      }

    }
  );


  $("headerAccountBtn")?.addEventListener(
    "click",
    () => showSection("account")
  );


  $("headerOrdersBtn")?.addEventListener(
    "click",
    () => showSection("orders")
  );


  $("headerCartBtn")?.addEventListener(
    "click",
    () => {

      renderCart();
      showSection("cart");

    }
  );


  /* -------------------------
     SEARCH
  ------------------------- */

  $("searchForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      performSearch(
        $("searchInput")?.value
      );

    }
  );


  $("mobileSearchForm")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      performSearch(
        $("mobileSearchInput")?.value
      );

    }
  );


  /* -------------------------
     CATEGORY
  ------------------------- */

  document
    .querySelectorAll(".category-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectCategory(
            button.dataset.category
          );

        }
      );

    });


  document
    .querySelectorAll(".category-big-card")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          selectCategory(
            button.dataset.category
          );

        }
      );

    });


  /* -------------------------
     HERO
  ------------------------- */

  $("heroShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("dealShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("viewAllProductsBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("ordersShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("emptyCartShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("clearSearchBtn")?.addEventListener(
    "click",
    () => {

      currentSearch = "";
      currentCategory = "all";

      if ($("searchInput")) {
        $("searchInput").value = "";
      }

      if ($("mobileSearchInput")) {
        $("mobileSearchInput").value = "";
      }

      renderShopProducts();

    }
  );


  /* -------------------------
     SORT
  ------------------------- */

  $("sortProducts")?.addEventListener(
    "change",
    renderShopProducts
  );


  /* -------------------------
     BACK
  ------------------------- */

  $("backToShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("backToCartBtn")?.addEventListener(
    "click",
    () => {

      renderCart();
      showSection("cart");

    }
  );


  /* -------------------------
     LOGIN / SIGNUP
  ------------------------- */

  $("loginForm")?.addEventListener(
    "submit",
    loginUser
  );


  $("signupForm")?.addEventListener(
    "submit",
    signupUser
  );


  $("showSignupBtn")?.addEventListener(
    "click",
    () => {

      $("loginForm")
        ?.classList.add("hidden");

      $("signupForm")
        ?.classList.remove("hidden");

      $("showSignupBtn")
        ?.classList.add("hidden");

      $("showLoginBtn")
        ?.classList.remove("hidden");

      if ($("authTitle")) {
        $("authTitle").textContent =
          "Create Your Account";
      }

      if ($("authSubtitle")) {
        $("authSubtitle").textContent =
          "Join SAFARIA and start shopping.";
      }

    }
  );


  $("showLoginBtn")?.addEventListener(
    "click",
    () => {

      $("signupForm")
        ?.classList.add("hidden");

      $("loginForm")
        ?.classList.remove("hidden");

      $("showLoginBtn")
        ?.classList.add("hidden");

      $("showSignupBtn")
        ?.classList.remove("hidden");

      if ($("authTitle")) {
        $("authTitle").textContent =
          "Welcome Back";
      }

      if ($("authSubtitle")) {
        $("authSubtitle").textContent =
          "Login to continue shopping.";
      }

    }
  );


  $("continueGuestBtn")?.addEventListener(
    "click",
    () => showSection("home")
  );


  /* -------------------------
     PASSWORD TOGGLE
  ------------------------- */

  document
    .querySelectorAll(".password-toggle")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const target =
            $(button.dataset.target);

          if (!target) return;

          target.type =
            target.type === "password"
              ? "text"
              : "password";

        }
      );

    });


  /* -------------------------
     ACCOUNT
  ------------------------- */

  $("accountLoginBtn")?.addEventListener(
    "click",
    () => showSection("login")
  );


  $("accountOrdersBtn")?.addEventListener(
    "click",
    () => showSection("orders")
  );


  $("accountCartBtn")?.addEventListener(
    "click",
    () => {

      renderCart();
      showSection("cart");

    }
  );


  $("accountShopBtn")?.addEventListener(
    "click",
    () => showSection("shop")
  );


  $("logoutBtn")?.addEventListener(
    "click",
    logoutUser
  );


  $("ordersLoginBtn")?.addEventListener(
    "click",
    () => showSection("login")
  );


  /* -------------------------
     MOBILE MENU
  ------------------------- */

  $("mobileMenuBtn")?.addEventListener(
    "click",
    openSideMenu
  );


  $("closeSideMenu")?.addEventListener(
    "click",
    closeSideMenu
  );


  $("menuOverlay")?.addEventListener(
    "click",
    closeSideMenu
  );


  document
    .querySelectorAll(".side-link")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          closeSideMenu();

          const section =
            button.dataset.section;

          if (section === "cart") {
            renderCart();
          }

          showSection(section);

        }
      );

    });


  /* -------------------------
     CART / PRODUCT EVENTS
  ------------------------- */

  document.addEventListener(
    "click",
    handleDynamicClick
  );


  /* -------------------------
     CHECKOUT
  ------------------------- */

  $("placeOrderBtn")?.addEventListener(
    "click",
    placeOrder
  );


  $("upiPayBtn")?.addEventListener(
    "click",
    openUPI
  );


  document
    .querySelectorAll(
      'input[name="paymentMethod"]'
    )
    .forEach(input => {

      input.addEventListener(
        "change",
        updatePaymentUI
      );

    });


  /* -------------------------
     MODALS
  ------------------------- */

  document
    .querySelectorAll("[data-close-modal]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $("productModal")
            ?.classList.add("hidden");

        }
      );

    });


  document
    .querySelectorAll("[data-close-login-modal]")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          $("loginRequiredModal")
            ?.classList.add("hidden");

        }
      );

    });


  $("modalLoginBtn")?.addEventListener(
    "click",
    () => {

      $("loginRequiredModal")
        ?.classList.add("hidden");

      showSection("login");

    }
  );


  $("successOrdersBtn")?.addEventListener(
    "click",
    () => {

      $("orderSuccessModal")
        ?.classList.add("hidden");

      showSection("orders");

    }
  );


  $("successHomeBtn")?.addEventListener(
    "click",
    () => {

      $("orderSuccessModal")
        ?.classList.add("hidden");

      showSection("home");

    }
  );


  /* -------------------------
     ESCAPE KEY
  ------------------------- */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key === "Escape") {

        $("productModal")
          ?.classList.add("hidden");

        $("loginRequiredModal")
          ?.classList.add("hidden");

        closeSideMenu();

      }

    }
  );


  /* -------------------------
     BOTTOM NAV
  ------------------------- */

  document
    .querySelectorAll(".bottom-nav-item")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const target =
            button.dataset.bottomSection;

          if (target === "search") {

            const input =
              $("mobileSearchInput") ||
              $("searchInput");

            input?.focus();

            return;

          }

          if (target === "cart") {
            renderCart();
          }

          showSection(target);

        }
      );

    });

}


/* =========================================================
   DYNAMIC CLICK HANDLER
========================================================= */

function handleDynamicClick(event) {

  const target =
    event.target;


  /* PRODUCT OPEN */

  const productOpen =
    target.closest(
      "[data-product-click]"
    );

  if (
    productOpen &&
    !target.closest(
      "[data-add-cart], [data-buy-now], [data-wishlist]"
    )
  ) {

    openProduct(
      productOpen.dataset.productClick
    );

    return;

  }


  /* ADD CART */

  const addButton =
    target.closest(
      "[data-add-cart]"
    );

  if (addButton) {

    const product =
      products.find(
        p =>
          String(p.id) ===
          String(addButton.dataset.addCart)
      );

    if (product) {
      addToCart(product);
    }

    return;

  }


  /* BUY NOW */

  const buyButton =
    target.closest(
      "[data-buy-now]"
    );

  if (buyButton) {

    const product =
      products.find(
        p =>
          String(p.id) ===
          String(buyButton.dataset.buyNow)
      );

    if (product) {
      buyNow(product);
    }

    return;

  }


  /* WISHLIST */

  const wishlist =
    target.closest(
      "[data-wishlist]"
    );

  if (wishlist) {

    wishlist.textContent =
      wishlist.textContent === "♥"
        ? "♡"
        : "♥";

    showToast(
      wishlist.textContent === "♥"
        ? "Added to wishlist"
        : "Removed from wishlist",
      "♡"
    );

    return;

  }


  /* CART MINUS */

  const cartMinus =
    target.closest(
      "[data-cart-minus]"
    );

  if (cartMinus) {

    changeCartQuantity(
      cartMinus.dataset.cartMinus,
      -1
    );

    return;

  }


  /* CART PLUS */

  const cartPlus =
    target.closest(
      "[data-cart-plus]"
    );

  if (cartPlus) {

    changeCartQuantity(
      cartPlus.dataset.cartPlus,
      1
    );

    return;

  }


  /* CART REMOVE */

  const cartRemove =
    target.closest(
      "[data-cart-remove]"
    );

  if (cartRemove) {

    removeFromCart(
      cartRemove.dataset.cartRemove
    );

    return;

  }


  /* DETAIL SIZE */

  const sizeButton =
    target.closest(
      "[data-detail-size]"
    );

  if (sizeButton) {

    selectedSize =
      sizeButton.dataset.detailSize;

    renderProductDetails();

    return;

  }


  /* DETAIL COLOR */

  const colorButton =
    target.closest(
      "[data-detail-color]"
    );

  if (colorButton) {

    selectedColor =
      colorButton.dataset.detailColor;

    renderProductDetails();

    return;

  }


  /* DETAIL QUANTITY MINUS */

  if (
    target.closest("#detailQtyMinus")
  ) {

    currentProductQuantity =
      Math.max(
        1,
        currentProductQuantity - 1
      );

    renderProductDetails();

    return;

  }


  /* DETAIL QUANTITY PLUS */

  if (
    target.closest("#detailQtyPlus")
  ) {

    currentProductQuantity += 1;

    renderProductDetails();

    return;

  }


  /* DETAIL ADD */

  if (
    target.closest("#detailAddCart")
  ) {

    addToCart(
      currentProduct,
      currentProductQuantity,
      selectedSize,
      selectedColor
    );

    return;

  }


  /* DETAIL BUY */

  if (
    target.closest("#detailBuyNow")
  ) {

    buyNow(
      currentProduct,
      currentProductQuantity,
      selectedSize,
      selectedColor
    );

    return;

  }


  /* CART CHECKOUT */

  if (
    target.closest("#cartCheckoutBtn")
  ) {

    if (!currentUser) {

      openLoginRequired();

      return;

    }

    renderCheckout();

    showSection("checkout");

    return;

  }

}


/* =========================================================
   CHANGE CART QUANTITY
========================================================= */

function changeCartQuantity(key, amount) {

  const item =
    cart.find(
      product => product.key === key
    );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product =>
          product.key !== key
      );

  }

  saveCart();

  renderCart();

}


/* =========================================================
   REMOVE CART
========================================================= */

function removeFromCart(key) {

  cart =
    cart.filter(
      item => item.key !== key
    );

  saveCart();

  renderCart();

  showToast(
    "Removed from cart",
    "✓"
  );

}


/* =========================================================
   PAYMENT UI
========================================================= */

function updatePaymentUI() {

  const payment =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value;

  const box =
    $("upiPaymentBox");

  if (!box) return;

  if (payment === "upi") {

    box.classList.remove("hidden");

  } else {

    box.classList.add("hidden");

  }

}


/* =========================================================
   SIDE MENU
========================================================= */

function openSideMenu() {

  $("sideMenu")
    ?.classList.add("open");

  $("menuOverlay")
    ?.classList.add("open");

}


function closeSideMenu() {

  $("sideMenu")
    ?.classList.remove("open");

  $("menuOverlay")
    ?.classList.remove("open");

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.SAFARIA = {

  getProducts: () => products,

  getCart: () => cart,

  currentUser: () => currentUser,

  showSection,

  addToCart,

  openProduct,

  UPI_ID,

  ADMIN_EMAIL

};