// admin.js

// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    addDoc,
    serverTimestamp, 
    onSnapshot, 
    query, 
    orderBy 
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';

// Firebase konfiqurasiyası
const firebaseConfig = {
    apiKey: "AIzaSyB0qxCmRiw6eGIxPGE0o8oU_s5jpFrqLGk",
    authDomain: "gustopizza-75df6.firebaseapp.com",
    projectId: "gustopizza-75df6",
    storageBucket: "gustopizza-75df6.firebasestorage.app",
    messagingSenderId: "79957512960",
    appId: "1:79957512960:web:922878a84a9b43d07099e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

// Global Variables
let selectedProductId = null;
let currentOrders = [];
let currentProducts = [];
let currentCustomers = [];

// Initialize when DOM is ready
function initializeAdmin() {
    setupRealtimeListeners();
    setupEventListeners();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.getElementById('showOrders')?.addEventListener('click', () => {
        document.getElementById('ordersSection').style.display = 'block';
        document.getElementById('productsSection').style.display = 'none';
    });

    document.getElementById('showProducts')?.addEventListener('click', () => {
        document.getElementById('ordersSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'block';
    });

    document.getElementById('showCustomers')?.addEventListener('click', () => {
        console.log('Showing customers section'); // Debug üçün
        document.getElementById('ordersSection').style.display = 'none';
        document.getElementById('productsSection').style.display = 'none';
        document.getElementById('customersSection').style.display = 'block';
    });

    // Filters
    document.getElementById('filterAll')?.addEventListener('click', () => filterOrders('all'));
    document.getElementById('filterNew')?.addEventListener('click', () => filterOrders('Yeni'));
    document.getElementById('filterPreparing')?.addEventListener('click', () => filterOrders('Hazırlanır'));
    document.getElementById('filterDelivering')?.addEventListener('click', () => filterOrders('Çatdırılır'));
    document.getElementById('filterCompleted')?.addEventListener('click', () => filterOrders('Tamamlandı'));
    document.getElementById('filterCancelled')?.addEventListener('click', () => filterOrders('Ləğv edildi'));

    // Products
    document.getElementById('addProductBtn')?.addEventListener('click', showAddProductForm);
    document.getElementById('productForm')?.addEventListener('submit', handleProductSubmit);
    document.getElementById('cancelBtn')?.addEventListener('click', () => {
        document.getElementById('productModal').style.display = 'none';
    });

    // Export
    document.getElementById('exportBtn')?.addEventListener('click', exportOrders);
    document.getElementById('exportCustomersBtn')?.addEventListener('click', exportCustomers);
}

// Realtime Listeners Setup
function setupRealtimeListeners() {
    try {
        // Orders listener
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, orderBy('timestamp', 'desc'));
        
        onSnapshot(ordersQuery, (snapshot) => {
            currentOrders = [];
            snapshot.forEach((doc) => {
                currentOrders.push({ id: doc.id, ...doc.data() });
            });
            displayOrders(currentOrders);
        }, (error) => {
            console.error("Orders listener error:", error);
        });

        // Products listener
        const productsRef = collection(db, 'products');
        
        onSnapshot(productsRef, (snapshot) => {
            currentProducts = [];
            snapshot.forEach((doc) => {
                currentProducts.push({ id: doc.id, ...doc.data() });
            });
            displayProducts(currentProducts);
        }, (error) => {
            console.error("Products listener error:", error);
        });

        // Customers listener - yenilənmiş versiya
        const customersRef = collection(db, 'customers');
        
        onSnapshot(customersRef, (snapshot) => {
            console.log('Customers data received:', snapshot.size); // Debug üçün
            currentCustomers = [];
            snapshot.forEach((doc) => {
                const customerData = doc.data();
                console.log('Customer data:', customerData); // Debug üçün
                currentCustomers.push(customerData);
            });
            displayCustomers(currentCustomers);
        }, (error) => {
            console.error("Customers listener error:", error);
        });

    } catch (error) {
        console.error("Setup listeners error:", error);
    }
}

// Display Functions
function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    if (!container) return;

    container.innerHTML = '';
    orders.forEach(order => {
        let dateStr = '';
        try {
            dateStr = order.timestamp?.toDate ? 
                     new Date(order.timestamp.toDate()).toLocaleString() : 
                     new Date(order.timestamp).toLocaleString();
        } catch (e) {
            dateStr = 'Tarix məlum deyil';
        }
        
        container.innerHTML += `
            <div class="order-card ${getStatusClass(order.status)}">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-status">${order.status}</span>
                </div>
                <div class="order-info">
                    <p><strong>Müştəri:</strong> ${order.customerName} ${order.customerSurname}</p>
                    <p><strong>Telefon:</strong> ${order.phone}</p>
                    <p><strong>Ünvan:</strong> ${order.address}</p>
                    <p><strong>Tarix:</strong> ${dateStr}</p>
                    <p><strong>Məbləğ:</strong> ${order.total} ₼</p>
                </div>
                <div class="order-actions">
                    <select data-order-id="${order.id}" class="status-select">
                        <option value="Yeni" ${order.status === 'Yeni' ? 'selected' : ''}>Yeni</option>
                        <option value="Hazırlanır" ${order.status === 'Hazırlanır' ? 'selected' : ''}>Hazırlanır</option>
                        <option value="Çatdırılır" ${order.status === 'Çatdırılır' ? 'selected' : ''}>Çatdırılır</option>
                        <option value="Tamamlandı" ${order.status === 'Tamamlandı' ? 'selected' : ''}>Tamamlandı</option>
                        <option value="Ləğv edildi" ${order.status === 'Ləğv edildi' ? 'selected' : ''}>Ləğv edildi</option>
                    </select>
                </div>
            </div>
        `;
    });

    // Add event listeners to all status selects
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
            const orderId = this.getAttribute('data-order-id');
            updateOrderStatus(orderId, this.value);
        });
    });
}

function displayProducts(products) {
    const container = document.getElementById('productsList');
    if (!container) return;

    container.innerHTML = '';
    products.forEach(product => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p>${product.description}</p>
                    <p class="price">${product.price} ₼</p>
                    ${product.isPopular ? '<span class="popular-tag">Popular</span>' : ''}
                </div>
                <div class="product-actions">
                    <button onclick="editProduct('${product.id}')">Redaktə et</button>
                    <button onclick="deleteProduct('${product.id}')">Sil</button>
                </div>
            </div>
        `;
    });
}

function displayCustomers(customers) {
    const container = document.getElementById('customersList');
    if (!container) {
        console.error('customersList container not found!');
        return;
    }

    console.log('Displaying customers:', customers); // Debug üçün

    container.innerHTML = '';
    customers.forEach(customer => {
        let lastOrderDate = '';
        try {
            if (customer.lastOrderDate) {
                lastOrderDate = customer.lastOrderDate.toDate().toLocaleString();
            }
        } catch (e) {
            console.error('Error formatting date:', e);
            lastOrderDate = 'Tarix məlum deyil';
        }

        container.innerHTML += `
            <div class="customer-card">
                <div class="customer-info">
                    <h3>${customer.name} ${customer.surname}</h3>
                    <p><strong>Müştəri ID:</strong> ${customer.id}</p>
                    <p><strong>Telefon:</strong> ${customer.phone}</p>
                    <p><strong>Son sifariş tarixi:</strong> ${lastOrderDate}</p>
                    <p><strong>Ümumi sifariş sayı:</strong> ${customer.orderCount || 0}</p>
                    <p><strong>Ümumi məbləğ:</strong> ${customer.totalAmount || 0} ₼</p>
                </div>
            </div>
        `;
    });
}

// Filter Orders
function filterOrders(status) {
    let filteredOrders;
    if (status === 'all') {
        filteredOrders = currentOrders;
    } else {
        filteredOrders = currentOrders.filter(order => order.status === status);
    }
    displayOrders(filteredOrders);
}

// Product Form Functions
function showAddProductForm() {
    document.getElementById('productModal').style.display = 'block';
    document.getElementById('productForm').reset();
    selectedProductId = null;
}

export function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (product) {
        document.getElementById('productModal').style.display = 'block';
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description;
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productImage').value = product.imageUrl;
        document.getElementById('productIsPopular').checked = product.isPopular;
        selectedProductId = productId;
    }
}

export async function handleProductSubmit(event) {
    event.preventDefault();
    
    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value,
        isPopular: document.getElementById('productIsPopular').checked,
        date: serverTimestamp()
    };

    try {
        if (selectedProductId) {
            // Update existing product
            const productRef = doc(db, 'products', selectedProductId);
            await updateDoc(productRef, productData);
        } else {
            // Add new product
            await addDoc(collection(db, 'products'), productData);
        }
        
        document.getElementById('productModal').style.display = 'none';
        showNotification('Məhsul uğurla yadda saxlanıldı');
    } catch (error) {
        console.error("Error saving product:", error);
        showNotification('Xəta baş verdi');
    }
}

export async function deleteProduct(productId) {
    if (confirm('Məhsulu silmək istədiyinizə əminsiniz?')) {
        try {
            await deleteDoc(doc(db, 'products', productId));
            showNotification('Məhsul silindi');
        } catch (error) {
            console.error("Error deleting product:", error);
            showNotification('Xəta baş verdi');
        }
    }
}

// Order Status Management
export async function updateOrderStatus(orderId, newStatus) {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, {
            status: newStatus
        });
        showNotification('Status yeniləndi');
    } catch (error) {
        console.error("Error updating status:", error);
        showNotification('Xəta baş verdi');
    }
}

// Utility Functions
function getStatusClass(status) {
    const statusClasses = {
        'Yeni': 'new',
        'Hazırlanır': 'preparing',
        'Çatdırılır': 'delivering',
        'Tamamlandı': 'completed',
        'Ləğv edildi': 'cancelled'
    };
    return statusClasses[status] || '';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export Orders to CSV
export function exportOrders() {
    let csv = 'Sifariş ID,Müştəri,Telefon,Ünvan,Status,Məbləğ,Tarix\n';
    
    currentOrders.forEach(order => {
        const date = new Date(order.timestamp?.toDate()).toLocaleString();
        csv += `${order.id},${order.customerName} ${order.customerSurname},${order.phone},"${order.address}",${order.status},${order.total},${date}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'orders.csv';
    link.click();
}

export function exportCustomers() {
    let csv = 'Müştəri ID,Ad,Soyad,Telefon,Son sifariş tarixi,Ümumi sifariş sayı,Ümumi məbləğ\n';
    
    currentCustomers.forEach(customer => {
        let lastOrderDate = '';
        try {
            lastOrderDate = customer.lastOrderDate?.toDate ? 
                           new Date(customer.lastOrderDate.toDate()).toLocaleString() : 
                           new Date(customer.lastOrderDate).toLocaleString();
        } catch (e) {
            lastOrderDate = '';
        }

        csv += `${customer.id},${customer.name},${customer.surname},${customer.phone},"${lastOrderDate}",${customer.orderCount || 0},${customer.totalAmount || 0}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'customers.csv';
    link.click();
}

// Funksiyaları export etmək əvəzinə birbaşa window obyektinə əlavə edək
window.filterOrders = filterOrders;
window.showAddProductForm = showAddProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleProductSubmit = handleProductSubmit;
window.updateOrderStatus = updateOrderStatus;
window.exportOrders = exportOrders;
window.exportCustomers = exportCustomers;

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeAdmin);