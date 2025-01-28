// assets/js/admin.js
import { db } from '../../src/firebase.js';
import { 
    collection, getDocs, addDoc, doc, deleteDoc, updateDoc,
    serverTimestamp, onSnapshot, query, orderBy, where 
} from 'firebase/firestore';

// Global Variables
let selectedOrderId = null;
let currentOrders = [];
let currentProducts = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupRealtimeListeners();
});

// Realtime Listeners Setup
function setupRealtimeListeners() {
    // Orders listener
    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(ordersRef, orderBy('timestamp', 'desc'));
    
    onSnapshot(ordersQuery, (snapshot) => {
        currentOrders = [];
        snapshot.forEach((doc) => {
            currentOrders.push({ id: doc.id, ...doc.data() });
        });
        displayOrders(currentOrders);
    });

    // Products listener
    const productsRef = collection(db, 'products');
    const productsQuery = query(productsRef, orderBy('date', 'desc'));
    
    onSnapshot(productsQuery, (snapshot) => {
        currentProducts = [];
        snapshot.forEach((doc) => {
            currentProducts.push({ id: doc.id, ...doc.data() });
        });
        displayProducts(currentProducts);
    });
}

// Orders Management
function displayOrders(orders) {
    const container = document.getElementById('ordersList');
    container.innerHTML = '';

    orders.forEach(order => {
        const statusClass = getStatusClass(order.status);
        const orderDate = new Date(order.timestamp?.toDate()).toLocaleString();
        
        container.innerHTML += `
            <div class="order-card ${statusClass}" onclick="showOrderDetails('${order.id}')">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <div class="order-info">
                    <div>
                        <strong>Müştəri:</strong> ${order.customerName} ${order.customerSurname}
                    </div>
                    <div>
                        <strong>Telefon:</strong> ${order.phone}
                    </div>
                    <div>
                        <strong>Ünvan:</strong> ${order.address}
                    </div>
                    <div>
                        <strong>Tarix:</strong> ${orderDate}
                    </div>
                </div>
            </div>
        `;
    });
}

function getStatusClass(status) {
    switch(status) {
        case 'Sifariş Göndərildi': return 'status-new';
        case 'Sifariş Qəbul Edildi': return 'status-accepted';
        case 'Hazırlanır': return 'status-preparing';
        case 'Çatdırılmada': return 'status-delivering';
        default: return '';
    }
}

function showOrderDetails(orderId) {
    selectedOrderId = orderId;
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    const items = order.items;
    const orderDate = new Date(order.timestamp?.toDate()).toLocaleString();
    
    document.getElementById('orderDetails').innerHTML = `
        <div class="order-detail-header">
            <h3>Sifariş #${order.id}</h3>
            <p>Tarix: ${orderDate}</p>
        </div>
        <div class="customer-details">
            <h4>Müştəri Məlumatları</h4>
            <p>Ad: ${order.customerName} ${order.customerSurname}</p>
            <p>Telefon: ${order.phone}</p>
            <p>Ünvan: ${order.address}</p>
            ${order.note ? `<p>Qeyd: ${order.note}</p>` : ''}
        </div>
        <div class="order-items">
            <h4>Sifarişlər</h4>
            ${items.map(item => `
                <div class="order-item">
                    <span>${item.name}</span>
                    <span>${item.quantity} x ${item.price}₼ = ${(item.quantity * item.price).toFixed(2)}₼</span>
                </div>
            `).join('')}
            <div class="order-total">
                <strong>Ümumi:</strong> ${order.total}₼
            </div>
        </div>
    `;

    document.getElementById('statusUpdate').value = order.status;
    document.getElementById('orderModal').style.display = 'block';
}

async function updateOrderStatus(newStatus) {
    if (!selectedOrderId) return;

    try {
        const orderRef = doc(db, 'orders', selectedOrderId);
        await updateDoc(orderRef, {
            status: newStatus
        });
        showNotification('Status yeniləndi');
    } catch (error) {
        console.error("Error updating status:", error);
        showNotification('Status yeniləmə xətası');
    }
}

// Products Management
function displayProducts(products) {
    const container = document.getElementById('productsList');
    container.innerHTML = '';

    products.forEach(product => {
        container.innerHTML += `
            <div class="product-card">
                <img src="${product.imageUrl}" alt="${product.name}" class="product-image"
                     onerror="this.src='https://placehold.co/80x80/png?text=Pizza'">
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${product.price}₼</div>
                </div>
                <div class="product-controls">
                    <button class="edit-btn" onclick="editProduct('${product.id}')">✏️</button>
                    <button class="delete-btn" onclick="deleteProduct('${product.id}')">🗑️</button>
                </div>
            </div>
        `;
    });
}

function showAddProductForm() {
    document.getElementById('modalTitle').textContent = 'Yeni Məhsul';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModal').style.display = 'block';
}

function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Məhsulu Redaktə Et';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productImage').value = product.imageUrl;
    document.getElementById('productIsPopular').checked = product.isPopular;
    document.getElementById('productModal').style.display = 'block';
}

async function handleProductSubmit(event) {
    event.preventDefault();

    const productData = {
        name: document.getElementById('productName').value,
        description: document.getElementById('productDescription').value,
        price: parseFloat(document.getElementById('productPrice').value),
        imageUrl: document.getElementById('productImage').value,
        isPopular: document.getElementById('productIsPopular').checked,
        date: serverTimestamp()
    };

    const productId = document.getElementById('productId').value;

    try {
        if (productId) {
            // Update existing product
            const productRef = doc(db, 'products', productId);
            await updateDoc(productRef, productData);
            showNotification('Məhsul yeniləndi');
        } else {
            // Add new product
            await addDoc(collection(db, 'products'), productData);
            showNotification('Yeni məhsul əlavə edildi');
        }
        closeProductModal();
    } catch (error) {
        console.error("Error saving product:", error);
        showNotification('Məhsul yadda saxlama xətası');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) return;

    try {
        await deleteDoc(doc(db, 'products', productId));
        showNotification('Məhsul silindi');
    } catch (error) {
        console.error("Error deleting product:", error);
        showNotification('Məhsul silmə xətası');
    }
}

// Filter Functions
function filterOrders() {
    const statusFilter = document.getElementById('statusFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;

    let filteredOrders = [...currentOrders];

    if (statusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === statusFilter);
    }

    if (dateFilter) {
        const filterDate = new Date(dateFilter).toDateString();
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.timestamp?.toDate()).toDateString();
            return orderDate === filterDate;
        });
    }

    displayOrders(filteredOrders);
}

// Export Function
async function exportOrders() {
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

// Utility Functions
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    selectedOrderId = null;
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

// Make functions available globally
window.showOrderDetails = showOrderDetails;
window.updateOrderStatus = updateOrderStatus;
window.showAddProductForm = showAddProductForm;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.handleProductSubmit = handleProductSubmit;
window.filterOrders = filterOrders;
window.exportOrders = exportOrders;
window.closeOrderModal = closeOrderModal;
window.closeProductModal = closeProductModal;

// Close modals when clicking outside
window.onclick = function(event) {
    const orderModal = document.getElementById('orderModal');
    const productModal = document.getElementById('productModal');
    
    if (event.target === orderModal) {
        closeOrderModal();
    }
    if (event.target === productModal) {
        closeProductModal();
    }
}