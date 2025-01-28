// assets/js/main.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    query,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase konfiqurasiyası
const firebaseConfig = {
    apiKey: "AIzaSyDy_z5TxiI0CxoaEnwvGQfM-KhYmaGb1RQ",
    authDomain: "gustopizza-75df6.firebaseapp.com",
    projectId: "gustopizza-75df6",
    storageBucket: "gustopizza-75df6.firebasestorage.app",
    messagingSenderId: "79957512960",
    appId: "1:79957512960:web:922878a84a9b43d07099e5"
};



// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global variables
let cart = [];
let currentOrderId = null;
const MAX_TRACKING_TIME = 60 * 60 * 1000; // 1 hour
let trackingStartTime;
let statusCheckInterval;
const REFRESH_INTERVAL = 30000; // 30 seconds
let products = [];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    const menuBtn = document.getElementById('menuBtn');
    const cartBtn = document.getElementById('cartBtn');
    
    if (menuBtn) menuBtn.addEventListener('click', openMenu);
    if (cartBtn) cartBtn.addEventListener('click', openCart);
}

// Menu Functions
async function loadProducts() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('name'));
        const querySnapshot = await getDocs(q);
        
        products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        displayProducts();
    } catch (error) {
        console.error("Error loading products:", error);
    }
}

function displayProducts() {
    const container = document.getElementById('products');
    if (!container) return;

    container.innerHTML = '';
    products.forEach(product => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-footer">
                    <span class="price">${product.price} ₼</span>
                    <button onclick="addToCart('${product.id}')">Səbətə əlavə et</button>
                </div>
            </div>
        `;
    });
}

// Cart Functions
function openCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'block';
        updateCart();
    }
}

function openMenu() {
    const productsSection = document.getElementById('products');
    if (productsSection) {
        productsSection.style.display = 'grid';
    }
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        updateCartCount();
        updateCart();
    }
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        cartCount.textContent = count;
    }
}

function updateCart() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;

    let total = 0;
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Səbət</h2>
            <div class="cart-items">
                ${cart.map(item => {
                    const itemTotal = item.price * item.quantity;
                    total += itemTotal;
                    return `
                        <div class="cart-item">
                            <img src="${item.imageUrl}" alt="${item.name}">
                            <div class="item-details">
                                <h3>${item.name}</h3>
                                <p>${item.price} ₼ x ${item.quantity}</p>
                            </div>
                            <div class="item-actions">
                                <button onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="cart-footer">
                <h3>Ümumi: ${total.toFixed(2)} ₼</h3>
                <button onclick="checkout()">Sifariş et</button>
            </div>
            <button class="close-btn" onclick="closeCart()">×</button>
        </div>
    `;
}

function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        cart = cart.filter(item => item.id !== productId);
    } else {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity = newQuantity;
        }
    }
    updateCartCount();
    updateCart();
}

function closeCart() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function checkout() {
    window.location.href = 'checkout.html';
}

// Make functions available globally
window.openMenu = openMenu;
window.openCart = openCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.closeCart = closeCart;
window.checkout = checkout;