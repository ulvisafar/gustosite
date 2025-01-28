// assets/js/main.js
import { db } from '../../src/firebase.js';
import { 
    collection, getDocs, addDoc, doc,
    serverTimestamp, onSnapshot, query, 
    orderBy 
} from 'firebase/firestore';

// Global Variables
let cart = [];
let currentOrderId = null;
const MAX_TRACKING_TIME = 60 * 60 * 1000; // 1 hour
let trackingStartTime;
let statusCheckInterval;
const REFRESH_INTERVAL = 30000; // 30 seconds

// Menu Functions
function openMenu() {
    document.getElementById('menuPanel').classList.add('active');
    loadProducts();
}

function closeMenu() {
    document.getElementById('menuPanel').classList.remove('active');
}

function closeCart() {
    document.getElementById('cartSection').classList.remove('active');
}

// Product Loading with Firebase
async function loadProducts() {
    try {
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('date', 'desc'));
        
        // Real-time updates
        onSnapshot(q, (snapshot) => {
            const products = [];
            snapshot.forEach((doc) => {
                products.push({ id: doc.id, ...doc.data() });
            });
            displayProducts(products);
        });
    } catch (error) {
        console.error("Error loading products:", error);
        showNotification('Məhsulları yükləmək mümkün olmadı');
    }
}

function displayProducts(products) {
    const container = document.getElementById("products");
    container.innerHTML = '';
    
    products.forEach(product => {
        container.innerHTML += `
            <div class="pizza-card">
                <img src="${product.imageUrl}" alt="${product.name}" 
                     class="pizza-image" 
                     onerror="this.src='https://placehold.co/300x200/png?text=Pizza'">
                <div class="pizza-info">
                    <h3 class="pizza-name">${product.name}</h3>
                    <p class="pizza-description">${product.description}</p>
                    <div class="price-row">
                        <span class="pizza-price">${product.price} ₼</span>
                        ${product.isPopular ? '<span class="popular-tag">Popular</span>' : ''}
                    </div>
                    <button class="add-to-cart" onclick="addToCart('${product.id}', '${product.name}', ${product.price})">
                        Səbətə əlavə et
                    </button>
                </div>
            </div>
        `;
    });
}

// Cart Functions
function addToCart(productId, name, price) {
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: name,
            price: price,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showNotification('Məhsul səbətə əlavə edildi');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== productId);
        }
        updateCartDisplay();
    }
}

function calculateTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function updateCartDisplay() {
    const cartSection = document.getElementById('cartSection');
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartSection.classList.remove('active');
        return;
    }

    cartSection.classList.add('active');
    let total = calculateTotal();
    
    cartItems.innerHTML = `
        <div class="cart-header">
            <h3>Səbət</h3>
            <button class="close-menu" onclick="closeCart()">&times;</button>
        </div>
        <div class="cart-items">
            ${cart.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <span class="item-name">${item.name}</span>
                        <span class="item-price">${item.price} ₼</span>
                    </div>
                    <div class="item-quantity">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                </div>
            `).join('')}
        </div>
        <div class="cart-total">
            <span>Ümumi:</span>
            <span>${total.toFixed(2)} ₼</span>
        </div>
        <button class="checkout-btn" onclick="showCheckoutForm()">
            Sifarişi Tamamla
        </button>
    `;
}

function showCheckoutForm() {
    const total = calculateTotal();
    cartItems.innerHTML = `
        <div class="cart-header">
            <h3>Sifariş Məlumatları</h3>
            <button class="close-menu" onclick="closeCart()">&times;</button>
        </div>
        <form id="orderForm" onsubmit="submitOrder(event)">
            <div class="form-group">
                <input type="text" id="customerName" required placeholder="Adınız">
            </div>
            <div class="form-group">
                <input type="text" id="customerSurname" required placeholder="Soyadınız">
            </div>
            <div class="form-group">
                <input type="tel" id="phone" required placeholder="Telefon">
            </div>
            <div class="form-group">
                <textarea id="address" required placeholder="Çatdırılma ünvanı"></textarea>
            </div>
            <div class="form-group">
                <textarea id="note" placeholder="Əlavə qeydlər (istəyə bağlı)"></textarea>
            </div>
            <div class="cart-total">
                <span>Ümumi:</span>
                <span>${total.toFixed(2)} ₼</span>
            </div>
            <button type="submit" class="checkout-btn">Təsdiqlə</button>
        </form>
    `;
}

async function submitOrder(event) {
    event.preventDefault();
    
    const orderData = {
        items: cart,
        total: calculateTotal(),
        customerName: document.getElementById('customerName').value,
        customerSurname: document.getElementById('customerSurname').value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        note: document.getElementById('note').value || ''
    };

    const result = await processOrder(orderData);
    if (result.success) {
        showNotification('Sifarişiniz qəbul edildi!');
    }
}

// Order Processing with Firebase
async function processOrder(orderData) {
    try {
        const ordersRef = collection(db, 'orders');
        const newOrder = {
            ...orderData,
            status: 'Sifariş Göndərildi',
            timestamp: serverTimestamp()
        };

        const docRef = await addDoc(ordersRef, newOrder);
        
        // Start tracking
        currentOrderId = docRef.id;
        trackingStartTime = Date.now();
        showOrderProcess();
        startOrderStatusCheck(docRef.id);
        
        // Clear cart
        cart = [];
        updateCartDisplay();
        closeMenu();
        closeCart();
        
        // Open WhatsApp
        openWhatsApp(orderData);
        
        showNotification('Sifarişiniz uğurla qəbul edildi!');
        return { success: true, orderId: docRef.id };
    } catch (error) {
        console.error("Error processing order:", error);
        showNotification('Sifariş zamanı xəta baş verdi');
        return { success: false, error: error.message };
    }
}

function openWhatsApp(orderData) {
    const items = orderData.items.map(item => 
        `${item.name} x${item.quantity}`
    ).join('\n');

    const message = `
🍕 Yeni Sifariş!

Müştəri: ${orderData.customerName} ${orderData.customerSurname}
Telefon: ${orderData.phone}
Ünvan: ${orderData.address}

Sifarişlər:
${items}

Ümumi: ${orderData.total} ₼

${orderData.note ? `Qeyd: ${orderData.note}` : ''}
    `.trim();

    const whatsappUrl = `https://wa.me/994XXXXXXXX?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// Order Status Tracking with Firebase
function startOrderStatusCheck(orderId) {
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
    }

    const orderRef = doc(db, 'orders', orderId);
    
    // Real-time order updates
    const unsubscribe = onSnapshot(orderRef, (doc) => {
        if (doc.exists()) {
            const orderData = doc.data();
            updateOrderProcessPanel(orderData);
        }
    });

    // Cleanup after max tracking time
    setTimeout(() => {
        unsubscribe();
        cleanupOrderTracking();
    }, MAX_TRACKING_TIME);
}

function updateOrderProcessPanel(orderData) {
    const status = orderData.status;
    const phases = [
        'Sifariş Göndərildi',
        'Sifariş Qəbul Edildi',
        'Hazırlanır',
        'Çatdırılmada'
    ];
    const phaseIds = ['sent', 'accepted', 'preparation', 'delivery'];
    
    // Reset all phases
    phaseIds.forEach(id => {
        document.getElementById(`phase-${id}`).classList.remove('active');
    });
    
    // Find current phase index
    const currentPhaseIndex = phases.indexOf(status);
    if (currentPhaseIndex === -1) return;
    
    // Activate all phases up to current
    for (let i = 0; i <= currentPhaseIndex; i++) {
        document.getElementById(`phase-${phaseIds[i]}`).classList.add('active');
    }

    updateLastRefreshTime();

    // If order is delivered, cleanup after delay
    if (status === 'Çatdırılmada') {
        setTimeout(() => {
            cleanupOrderTracking();
            showNotification('Sifarişiniz çatdırıldı!');
        }, 3000);
    }
}

function showOrderProcess() {
    const panel = document.getElementById('orderProcessPanel');
    panel.style.display = 'block';
    updateLastRefreshTime();
}

function updateLastRefreshTime() {
    const refreshTimeDiv = document.getElementById('lastRefreshTime');
    if (refreshTimeDiv) {
        refreshTimeDiv.textContent = `Son yeniləmə: ${new Date().toLocaleTimeString()}`;
    }
}

function cleanupOrderTracking() {
    currentOrderId = null;
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    const panel = document.getElementById('orderProcessPanel');
    if (panel) {
        panel.style.display = 'none';
    }
}

// Utility Functions
function showNotification(message) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Make functions available globally
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.closeCart = closeCart;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.processOrder = processOrder;
window.showCheckoutForm = showCheckoutForm;
window.submitOrder = submitOrder;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    updateCartDisplay();
});

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('order-process-panel')) {
        cleanupOrderTracking();
    }
}