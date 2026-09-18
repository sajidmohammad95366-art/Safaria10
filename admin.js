import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


/* =====================================================
   SAFARIA FIREBASE
===================================================== */

const firebaseConfig = {
  apiKey: "AIzaSyC7Mv67KGZFoUj3MyUHqC-rBGHQRfuY1HE",
  authDomain: "safaria10-4e96a.firebaseapp.com",
  projectId: "safaria10-4e96a",
  storageBucket: "safaria10-4e96a.firebasestorage.app",
  messagingSenderId: "184457605385",
  appId: "1:184457605385:web:4c6c6a2b7e9b6f5f9f6c0b"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


/* =====================================================
   ADMIN SETTINGS
===================================================== */

const ADMIN_EMAIL =
  "sajidmohammad95366@gmail.com";

const UPI_ID =
  "safaria6@ybl";


/* =====================================================
   STATE
===================================================== */

let currentAdmin = null;

let adminProducts = [];

let adminOrders = [];

let toastTimer;


/* =====================================================
   DOM
===================================================== */

function $(id) {
  return document.getElementById(id);
}


/* =====================================================
   START
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    setupAdminEvents();

    showAdminLogin();

  }
);


/* =====================================================
   AUTH STATE
===================================================== */

onAuthStateChanged(
  auth,
  async user => {

    if (!user) {

      currentAdmin = null;

      showAdminLogin();

      return;

    }


    /*
      Only the specified admin email
      can enter this panel.
    */

    if (
      String(user.email || "")
        .toLowerCase() !==
      ADMIN_EMAIL.toLowerCase()
    ) {

      await signOut(auth);

      showAdminError(
        "This account is not authorized for SAFARIA Admin Panel."
      );

      return;

    }


    currentAdmin = user;

    showAdminApp();

    await loadEverything();

  }
);


/* =====================================================
   SHOW LOGIN
===================================================== */

function showAdminLogin() {

  $("adminLoginPage")
    ?.classList.remove("hidden");

  $("adminApp")
    ?.classList.add("hidden");

}


/* =====================================================
   SHOW ADMIN APP
===================================================== */

function showAdminApp() {

  $("adminLoginPage")
    ?.classList.add("hidden");

  $("adminApp")
    ?.classList.remove("hidden");


  if ($("adminUserEmail")) {

    $("adminUserEmail").textContent =
      currentAdmin?.email || "";

  }

  if ($("settingsAdminEmail")) {

    $("settingsAdminEmail").textContent =
      ADMIN_EMAIL;

  }

}


/* =====================================================
   LOGIN
===================================================== */

async function adminLogin(event) {

  event.preventDefault();

  const email =
    $("adminEmail")
      ?.value
      .trim();

  const password =
    $("adminPassword")
      ?.value || "";


  if (!email || !password) {

    showAdminError(
      "Enter email and password."
    );

    return;

  }


  if (
    email.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {

    showAdminError(
      "Only the SAFARIA admin account can login here."
    );

    return;

  }


  const button =
    $("adminLoginBtn");

  if (button) {

    button.disabled = true;

    button.textContent =
      "Logging in...";

  }


  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    clearAdminError();

  } catch (error) {

    console.error(error);

    showAdminError(
      authErrorMessage(error)
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Login to Admin Panel";

    }

  }

}


/* =====================================================
   LOGOUT
===================================================== */

async function adminLogout() {

  try {

    await signOut(auth);

  } catch (error) {

    console.error(error);

    showToast(
      "Logout failed"
    );

  }

}


/* =====================================================
   LOAD EVERYTHING
===================================================== */

async function loadEverything() {

  await loadProducts();

  await loadOrders();

  updateDashboard();

}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

  const table =
    $("productsTableBody");

  if (table) {

    table.innerHTML = `
      <tr>
        <td colspan="5" class="admin-loading">
          Loading products...
        </td>
      </tr>
    `;

  }


  try {

    const snapshot =
      await getDocs(
        collection(db, "products")
      );


    adminProducts =
      snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));


    /*
      If Firestore has no products,
      create SAFARIA starter products.
    */

    if (!adminProducts.length) {

      await seedStarterProducts();

    }


    renderProducts();

    updateDashboard();

  } catch (error) {

    console.error(error);

    if (table) {

      table.innerHTML = `
        <tr>
          <td colspan="5" class="admin-empty">
            Products could not be loaded.
            Check Firestore rules.
          </td>
        </tr>
      `;

    }

  }

}


/* =====================================================
   STARTER PRODUCTS
===================================================== */

async function seedStarterProducts() {

  const starterProducts = [

    {
      name: "Urban Classic Sneakers",
      category: "fashion",
      price: 1499,
      oldPrice: 1999,
      rating: 4.3,
      reviews: 126,
      stock: 25,
      emoji: "👟",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80",
      sizes: ["6", "7", "8", "9", "10"],
      colors: ["Black", "White", "Grey"],
      description:
        "Comfortable everyday sneakers with a modern design."
    },

    {
      name: "Everyday Oversized Tee",
      category: "fashion",
      price: 699,
      oldPrice: 999,
      rating: 4.4,
      reviews: 94,
      stock: 40,
      emoji: "👕",
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80",
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "White", "Blue"],
      description:
        "Soft oversized t-shirt designed for everyday comfort."
    },

    {
      name: "Pulse Wireless Headphones",
      category: "electronics",
      price: 2299,
      oldPrice: 2999,
      rating: 4.5,
      reviews: 213,
      stock: 18,
      emoji: "🎧",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80",
      sizes: [],
      colors: ["Black", "White"],
      description:
        "Wireless headphones with clear sound and comfortable ear cushions."
    },

    {
      name: "Mini Smart Speaker",
      category: "electronics",
      price: 1799,
      oldPrice: 2299,
      rating: 4.2,
      reviews: 88,
      stock: 20,
      emoji: "🔊",
      image:
        "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80",
      sizes: [],
      colors: ["Black", "Grey"],
      description:
        "Compact smart speaker for music and everyday entertainment."
    },

    {
      name: "Aura Desk Lamp",
      category: "home",
      price: 999,
      oldPrice: 1399,
      rating: 4.4,
      reviews: 67,
      stock: 30,
      emoji: "💡",
      image:
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80",
      sizes: [],
      colors: ["White", "Black"],
      description:
        "Minimal desk lamp for study tables and workspaces."
    },

    {
      name: "Daily Carry Backpack",
      category: "accessories",
      price: 1299,
      oldPrice: 1799,
      rating: 4.5,
      reviews: 145,
      stock: 35,
      emoji: "🎒",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
      sizes: [],
      colors: ["Black", "Grey", "Blue"],
      description:
        "Spacious everyday backpack for college, office and travel."
    },

    {
      name: "Hydro Steel Bottle",
      category: "accessories",
      price: 599,
      oldPrice: 799,
      rating: 4.3,
      reviews: 73,
      stock: 50,
      emoji: "🥤",
      image:
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=80",
      sizes: ["500ml", "750ml", "1L"],
      colors: ["Black", "Silver", "Blue"],
      description:
        "Reusable steel bottle for work, gym, school and travel."
    }

  ];


  for (
    const product of starterProducts
  ) {

    try {

      const ref =
        await addDoc(
          collection(db, "products"),
          {
            ...product,
            createdAt: serverTimestamp()
          }
        );

      adminProducts.push({
        id: ref.id,
        ...product
      });

    } catch (error) {

      console.error(
        "Starter product error:",
        error
      );

    }

  }

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts() {

  const body =
    $("productsTableBody");

  if (!body) return;


  if (!adminProducts.length) {

    body.innerHTML = `
      <tr>
        <td colspan="5" class="admin-empty">
          No products found.
        </td>
      </tr>
    `;

    return;

  }


  body.innerHTML =
    adminProducts.map(product => {

      const price =
        Number(product.price || 0);

      const stock =
        Number(product.stock || 0);


      const image =
        product.image
          ? `
            <img
              src="${escapeAttribute(product.image)}"
              alt=""
              onerror="this.style.display='none'"
            >
          `
          : (
            product.emoji ||
            "🛍️"
          );


      return `

        <tr>

          <td>

            <div class="table-product">

              <div class="table-product-img">
                ${image}
              </div>

              <div>

                <div class="table-product-name">
                  ${escapeHTML(product.name || "Product")}
                </div>

                <div class="table-product-category">
                  ${escapeHTML(product.category || "")}
                </div>

              </div>

            </div>

          </td>


          <td>
            <strong>
              ₹${price.toLocaleString("en-IN")}
            </strong>
          </td>


          <td>
            ${stock}
          </td>


          <td>
            ★ ${Number(product.rating || 0).toFixed(1)}
          </td>


          <td>

            <button
              class="secondary-btn"
              type="button"
              data-edit-product="${escapeAttribute(product.id)}"
              style="margin-right:5px;"
            >
              Edit
            </button>

            <button
              class="danger-btn"
              type="button"
              data-delete-product="${escapeAttribute(product.id)}"
            >
              Delete
            </button>

          </td>

        </tr>

      `;

    }).join("");

}


/* =====================================================
   ADD / EDIT PRODUCT FORM
===================================================== */

function openProductForm(product = null) {

  const card =
    $("productFormCard");

  if (!card) return;

  card.classList.remove("hidden");


  if (!product) {

    clearProductForm();

    if ($("productFormTitle")) {

      $("productFormTitle").textContent =
        "Add New Product";

    }

    return;

  }


  if ($("productFormTitle")) {

    $("productFormTitle").textContent =
      "Edit Product";

  }


  $("editProductId").value =
    product.id || "";

  $("productName").value =
    product.name || "";

  $("productCategory").value =
    product.category || "";

  $("productPrice").value =
    product.price || "";

  $("productOldPrice").value =
    product.oldPrice || "";

  $("productStock").value =
    product.stock ?? 0;

  $("productRating").value =
    product.rating ?? 4.5;

  $("productReviews").value =
    product.reviews ?? 0;

  $("productEmoji").value =
    product.emoji || "🛍️";

  $("productImage").value =
    product.image || "";

  $("productSizes").value =
    Array.isArray(product.sizes)
      ? product.sizes.join(", ")
      : "";

  $("productColors").value =
    Array.isArray(product.colors)
      ? product.colors.join(", ")
      : "";

  $("productDescription").value =
    product.description || "";


  updateImagePreview();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =====================================================
   CLEAR PRODUCT FORM
===================================================== */

function clearProductForm() {

  $("productForm")?.reset();

  if ($("editProductId")) {
    $("editProductId").value = "";
  }

  if ($("productStock")) {
    $("productStock").value = 10;
  }

  if ($("productRating")) {
    $("productRating").value = 4.5;
  }

  if ($("productReviews")) {
    $("productReviews").value = 0;
  }

  if ($("productEmoji")) {
    $("productEmoji").value = "🛍️";
  }

  if ($("productPreview")) {
    $("productPreview").style.display =
      "none";
  }

}


/* =====================================================
   SAVE PRODUCT
===================================================== */

async function saveProduct(event) {

  event.preventDefault();


  const editId =
    $("editProductId")?.value.trim();


  const name =
    $("productName")?.value.trim();

  const category =
    $("productCategory")?.value;

  const price =
    Number(
      $("productPrice")?.value || 0
    );

  const oldPrice =
    Number(
      $("productOldPrice")?.value || 0
    );

  const stock =
    Number(
      $("productStock")?.value || 0
    );

  const rating =
    Number(
      $("productRating")?.value || 0
    );

  const reviews =
    Number(
      $("productReviews")?.value || 0
    );

  const emoji =
    $("productEmoji")?.value.trim() ||
    "🛍️";

  const image =
    $("productImage")?.value.trim() ||
    "";

  const description =
    $("productDescription")
      ?.value
      .trim() || "";


  const sizes =
    $("productSizes")
      ?.value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean) || [];


  const colors =
    $("productColors")
      ?.value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean) || [];


  if (!name || !category || price <= 0) {

    showToast(
      "Product name, category and price are required."
    );

    return;

  }


  const productData = {

    name,

    category,

    price,

    oldPrice,

    stock,

    rating,

    reviews,

    emoji,

    image,

    sizes,

    colors,

    description

  };


  const button =
    $("saveProductBtn");


  if (button) {

    button.disabled = true;

    button.textContent =
      "Saving...";

  }


  try {

    if (editId) {

      await updateDoc(
        doc(
          db,
          "products",
          editId
        ),
        productData
      );


      const index =
        adminProducts.findIndex(
          p => p.id === editId
        );


      if (index !== -1) {

        adminProducts[index] = {
          ...adminProducts[index],
          ...productData
        };

      }


      showToast(
        "Product updated successfully"
      );

    } else {

      const ref =
        await addDoc(
          collection(db, "products"),
          {
            ...productData,
            createdAt:
              serverTimestamp()
          }
        );


      adminProducts.push({
        id: ref.id,
        ...productData
      });


      showToast(
        "Product added successfully"
      );

    }


    renderProducts();

    updateDashboard();

    clearProductForm();

    $("productFormCard")
      ?.classList.add("hidden");


  } catch (error) {

    console.error(error);

    showToast(
      "Product could not be saved. Check Firestore rules."
    );

  } finally {

    if (button) {

      button.disabled = false;

      button.textContent =
        "Save Product";

    }

  }

}


/* =====================================================
   EDIT PRODUCT
===================================================== */

function editProduct(id) {

  const product =
    adminProducts.find(
      p => String(p.id) === String(id)
    );

  if (!product) return;

  openProductForm(product);

}


/* =====================================================
   DELETE PRODUCT
===================================================== */

async function deleteProduct(id) {

  const product =
    adminProducts.find(
      p => String(p.id) === String(id)
    );

  if (!product) return;


  const confirmed =
    confirm(
      `Delete "${product.name}"?`
    );


  if (!confirmed) return;


  try {

    await deleteDoc(
      doc(
        db,
        "products",
        id
      )
    );


    adminProducts =
      adminProducts.filter(
        p =>
          String(p.id) !==
          String(id)
      );


    renderProducts();

    updateDashboard();

    showToast(
      "Product deleted"
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Product could not be deleted."
    );

  }

}


/* =====================================================
   LOAD ORDERS
===================================================== */

async function loadOrders() {

  const container =
    $("adminOrdersList");

  if (!container) return;


  container.innerHTML = `
    <div class="admin-loading">
      Loading orders...
    </div>
  `;


  try {

    const snapshot =
      await getDocs(
        collection(db, "orders")
      );


    adminOrders =
      snapshot.docs.map(item => ({
        id: item.id,
        ...item.data()
      }));


    adminOrders.sort(
      (a, b) =>
        timestampValue(b.createdAt) -
        timestampValue(a.createdAt)
    );


    renderOrders();

    updateDashboard();


  } catch (error) {

    console.error(error);

    container.innerHTML = `
      <div class="admin-empty">
        Orders could not be loaded.
        Check Firestore rules.
      </div>
    `;

  }

}


/* =====================================================
   RENDER ORDERS
===================================================== */

function renderOrders() {

  const container =
    $("adminOrdersList");

  if (!container) return;


  if (!adminOrders.length) {

    container.innerHTML = `
      <div class="admin-empty">
        No orders found.
      </div>
    `;

    return;

  }


  container.innerHTML =
    adminOrders.map(order => {

      const items =
        Array.isArray(order.items)
          ? order.items
          : [];


      return `

        <article class="order-admin-card">


          <div class="order-admin-header">

            <div>

              <div class="order-admin-id">
                ${escapeHTML(
                  order.orderId ||
                  order.id
                )}
              </div>

              <div class="order-admin-date">
                ${formatDate(order.createdAt)}
              </div>

            </div>


            <select
              class="status-select"
              data-order-status="${escapeAttribute(order.id)}"
            >

              ${statusOptions(order.status)}

            </select>

          </div>


          <div class="order-admin-body">


            <div class="order-customer">

              <strong>
                ${escapeHTML(
                  order.customerName ||
                  "Customer"
                )}
              </strong>

              <div>
                Email:
                ${escapeHTML(
                  order.customerEmail ||
                  ""
                )}
              </div>

              <div>
                Mobile:
                ${escapeHTML(
                  order.phone ||
                  ""
                )}
              </div>

              <div>
                Address:
                ${escapeHTML(
                  [
                    order.address,
                    order.city,
                    order.state,
                    order.pincode
                  ]
                    .filter(Boolean)
                    .join(", ")
                )}
              </div>

            </div>


            <div>

              ${items.map(item => `

                <div class="order-admin-item">

                  <div class="order-admin-item-img">

                    ${
                      item.image
                        ? `
                          <img
                            src="${escapeAttribute(item.image)}"
                            alt=""
                          >
                        `
                        : `
                          ${item.emoji || "🛍️"}
                        `
                    }

                  </div>


                  <div class="order-admin-item-info">

                    <div class="order-admin-item-name">
                      ${escapeHTML(
                        item.name ||
                        "Product"
                      )}
                    </div>

                    <div class="order-admin-item-meta">

                      Qty:
                      ${Number(item.quantity || 1)}

                      ${
                        item.size
                          ? ` • Size: ${escapeHTML(item.size)}`
                          : ""
                      }

                      ${
                        item.color
                          ? ` • Color: ${escapeHTML(item.color)}`
                          : ""
                      }

                    </div>

                  </div>


                  <div class="order-admin-item-price">

                    ₹${(
                      Number(item.price || 0) *
                      Number(item.quantity || 1)
                    ).toLocaleString("en-IN")}

                  </div>

                </div>

              `).join("")}

            </div>


          </div>


          <div class="order-admin-footer">

            <div class="order-payment">

              Payment:

              <strong>
                ${escapeHTML(
                  order.paymentMethod ||
                  "N/A"
                )}
              </strong>

              ${
                order.paymentStatus
                  ? `
                    <span>
                      (${escapeHTML(
                        order.paymentStatus
                      )})
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="order-total">

              Total:
              ₹${Number(
                order.total || 0
              ).toLocaleString("en-IN")}

            </div>

          </div>


        </article>

      `;

    }).join("");

}


/* =====================================================
   STATUS OPTIONS
===================================================== */

function statusOptions(current) {

  const statuses = [
    "Pending",
    "Confirmed",
    "Shipped",
    "Delivered",
    "Cancelled"
  ];


  return statuses.map(
    status => `

      <option
        value="${status}"
        ${String(current || "Pending") === status ? "selected" : ""}
      >
        ${status}
      </option>

    `
  ).join("");

}


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

async function updateOrderStatus(
  orderId,
  status
) {

  if (!orderId || !status) return;


  try {

    await updateDoc(
      doc(
        db,
        "orders",
        orderId
      ),
      {
        status
      }
    );


    const order =
      adminOrders.find(
        item =>
          item.id === orderId
      );


    if (order) {
      order.status = status;
    }


    updateDashboard();

    showToast(
      `Order status changed to ${status}`
    );


  } catch (error) {

    console.error(error);

    showToast(
      "Order status could not be updated."
    );

    await loadOrders();

  }

}


/* =====================================================
   DASHBOARD
===================================================== */

function updateDashboard() {

  if ($("dashboardProducts")) {

    $("dashboardProducts").textContent =
      adminProducts.length;

  }


  if ($("dashboardOrders")) {

    $("dashboardOrders").textContent =
      adminOrders.length;

  }


  const pending =
    adminOrders.filter(
      order =>
        String(
          order.status || "Pending"
        ).toLowerCase() ===
        "pending"
    ).length;


  if ($("dashboardPending")) {

    $("dashboardPending").textContent =
      pending;

  }


  const revenue =
    adminOrders.reduce(
      (total, order) =>
        total +
        Number(order.total || 0),
      0
    );


  if ($("dashboardRevenue")) {

    $("dashboardRevenue").textContent =
      "₹" +
      revenue.toLocaleString("en-IN");

  }


  renderRecentOrders();

}


/* =====================================================
   RECENT ORDERS
===================================================== */

function renderRecentOrders() {

  const container =
    $("recentOrders");

  if (!container) return;


  const recent =
    adminOrders.slice(0, 5);


  if (!recent.length) {

    container.innerHTML = `
      <div class="admin-empty">
        No orders yet.
      </div>
    `;

    return;

  }


  container.innerHTML = `

    <div class="table-wrap">

      <table>

        <thead>

          <tr>

            <th>
              Order
            </th>

            <th>
              Customer
            </th>

            <th>
              Amount
            </th>

            <th>
              Status
            </th>

          </tr>

        </thead>


        <tbody>

          ${recent.map(order => `

            <tr>

              <td>
                <strong>
                  ${escapeHTML(
                    order.orderId ||
                    order.id
                  )}
                </strong>
              </td>

              <td>
                ${escapeHTML(
                  order.customerName ||
                  "Customer"
                )}
              </td>

              <td>
                ₹${Number(
                  order.total || 0
                ).toLocaleString("en-IN")}
              </td>

              <td>
                ${escapeHTML(
                  order.status ||
                  "Pending"
                )}
              </td>

            </tr>

          `).join("")}

        </tbody>

      </table>

    </div>

  `;

}


/* =====================================================
   ADMIN SECTION
===================================================== */

function showAdminSection(section) {

  const sections = [
    "dashboard",
    "products",
    "orders",
    "settings"
  ];


  sections.forEach(
    name => {

      const element =
        $(`${name}Section`);

      if (!element) return;

      element.classList.toggle(
        "active",
        name === section
      );

    }
  );


  document
    .querySelectorAll(
      "[data-admin-section]"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.adminSection ===
        section
      );

    });


  if (section === "products") {
    renderProducts();
  }

  if (section === "orders") {
    renderOrders();
  }

}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

function updateImagePreview() {

  const url =
    $("productImage")
      ?.value
      .trim();


  const preview =
    $("productPreview");

  const image =
    $("productPreviewImage");


  if (!preview || !image) return;


  if (!url) {

    preview.style.display =
      "none";

    return;

  }


  image.src = url;

  preview.style.display =
    "block";

}


/* =====================================================
   PASSWORD RESET
===================================================== */

async function resetAdminPassword() {

  try {

    await sendPasswordResetEmail(
      auth,
      ADMIN_EMAIL
    );


    showToast(
      "Password reset email sent to admin email."
    );


  } catch (error) {

    console.error(error);

    showToast(
      authErrorMessage(error)
    );

  }

}


/* =====================================================
   EVENTS
===================================================== */

function setupAdminEvents() {


  /* LOGIN */

  $("adminLoginForm")
    ?.addEventListener(
      "submit",
      adminLogin
    );


  /* LOGOUT */

  $("adminLogoutBtn")
    ?.addEventListener(
      "click",
      adminLogout
    );


  /* SIDEBAR */

  document
    .querySelectorAll(
      "[data-admin-section]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          showAdminSection(
            button.dataset.adminSection
          );

        }
      );

    });


  /* ADD PRODUCT */

  $("showAddProductBtn")
    ?.addEventListener(
      "click",
      () => {

        openProductForm();

      }
    );


  /* CANCEL PRODUCT */

  $("cancelProductBtn")
    ?.addEventListener(
      "click",
      () => {

        clearProductForm();

        $("productFormCard")
          ?.classList.add("hidden");

      }
    );


  /* PRODUCT FORM */

  $("productForm")
    ?.addEventListener(
      "submit",
      saveProduct
    );


  /* IMAGE PREVIEW */

  $("productImage")
    ?.addEventListener(
      "input",
      updateImagePreview
    );


  /* REFRESH PRODUCTS */

  $("refreshProductsBtn")
    ?.addEventListener(
      "click",
      loadProducts
    );


  /* REFRESH ORDERS */

  $("refreshOrdersBtn")
    ?.addEventListener(
      "click",
      loadOrders
    );


  /* PASSWORD RESET */

  $("resetAdminPasswordBtn")
    ?.addEventListener(
      "click",
      resetAdminPassword
    );


  /* DYNAMIC */

  document.addEventListener(
    "click",
    event => {

      const edit =
        event.target.closest(
          "[data-edit-product]"
        );


      if (edit) {

        editProduct(
          edit.dataset.editProduct
        );

        return;

      }


      const remove =
        event.target.closest(
          "[data-delete-product]"
        );


      if (remove) {

        deleteProduct(
          remove.dataset.deleteProduct
        );

        return;

      }

    }
  );


  /* ORDER STATUS */

  document.addEventListener(
    "change",
    event => {

      const select =
        event.target.closest(
          "[data-order-status]"
        );


      if (!select) return;


      updateOrderStatus(
        select.dataset.orderStatus,
        select.value
      );

    }
  );

}


/* =====================================================
   ERROR MESSAGE
===================================================== */

function showAdminError(message) {

  const box =
    $("adminLoginMessage");

  if (!box) return;

  box.textContent =
    message;

  box.classList.add("show");

}


function clearAdminError() {

  const box =
    $("adminLoginMessage");

  if (!box) return;

  box.textContent = "";

  box.classList.remove("show");

}


/* =====================================================
   AUTH ERROR TEXT
===================================================== */

function authErrorMessage(error) {

  const code =
    error?.code || "";


  if (
    code.includes(
      "invalid-credential"
    )
  ) {

    return "Incorrect admin email or password.";

  }


  if (
    code.includes(
      "wrong-password"
    )
  ) {

    return "Incorrect password.";

  }


  if (
    code.includes(
      "user-not-found"
    )
  ) {

    return "Admin account was not found in Firebase Authentication.";

  }


  if (
    code.includes(
      "too-many-requests"
    )
  ) {

    return "Too many attempts. Try again later.";

  }


  if (
    code.includes(
      "network-request-failed"
    )
  ) {

    return "Internet connection problem.";

  }


  return (
    error?.message ||
    "Something went wrong."
  );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(message) {

  const toast =
    $("adminToast");

  if (!toast) return;


  toast.textContent =
    message;

  toast.classList.add("show");


  clearTimeout(toastTimer);


  toastTimer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}


/* =====================================================
   HELPERS
===================================================== */

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


function timestampValue(timestamp) {

  if (!timestamp) return 0;


  if (
    typeof timestamp.toMillis ===
    "function"
  ) {

    return timestamp.toMillis();

  }


  if (timestamp.seconds) {

    return Number(
      timestamp.seconds
    ) * 1000;

  }


  return 0;

}


function formatDate(timestamp) {

  const value =
    timestampValue(timestamp);


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