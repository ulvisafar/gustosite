document.addEventListener('DOMContentLoaded', () => {
    // Menu data
    const pizzaMenu = [
        {
            id: 'margherita',
            name: 'Margherita',
            description: 'Mozzarella, təzə reyhan, pomidor sousu',
            price: 11.45,
            imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca',
            isPopular: true
        },
        {
            id: 'pepperoni',
            name: 'Pepperoni',
            description: 'Mozzarella, pepperoni, reyhan',
            price: 13.45,
            imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e',
            isPopular: true
        },
        {
            id: 'funghi',
            name: 'Funghi',
            description: 'Mozzarella, göbələk, parmesan, qurud',
            price: 14.95,
            imageUrl: 'https://images.unsplash.com/photo-1571066811602-716837d681de',
            isPopular: false
        },
        {
            id: 'quattro',
            name: 'Quattro',
            description: 'Dörd pendirli pizza',
            price: 15.95,
            imageUrl: 'https://images.unsplash.com/photo-1573821663912-569905455b1c',
            isPopular: false
        },
        {
            id: 'bbq',
            name: 'BBQ Chicken',
            description: 'BBQ sousu, toyuq, qırmızı soğan',
            price: 14.95,
            imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
            isPopular: false
        },
        {
            id: 'seafood',
            name: 'Dəniz Məhsulu',
            description: 'Krevet, midiya, kalmar',
            price: 16.95,
            imageUrl: 'https://images.unsplash.com/photo-1563379926898-05f4575a45d8',
            isPopular: false
        }
    ];

    let cart = [];

    // Add event listeners for menu buttons
    const menuButtons = document.querySelectorAll('[onclick="openMenu()"]');
    menuButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openMenu();
        });
    });

    // Menu Functions
    window.openMenu = function() {
        const menuPanel = document.getElementById('menuPanel');
        if (menuPanel) {
            menuPanel.classList.add('active');
            displayProducts();
        }
    }

    window.closeMenu = function() {
        const menuPanel = document.getElementById('menuPanel');
        if (menuPanel) {
            menuPanel.classList.remove('active');
        }
    }

    window.closeCart = function() {
        const cartSection = document.getElementById('cartSection');
        if (cartSection) {
            cartSection.classList.remove('active');
        }
    }

    // Display products in menu
    function displayProducts() {
        const container = document.getElementById("products");
        if (!container) return;

        container.innerHTML = `
            <div class="pizza-grid">
                ${pizzaMenu.map(product => `
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
                            <button class="add-to-cart" onclick="addToCart('${product.id}')">
                                Səbətə əlavə et
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // Make functions globally available
    window.addToCart = function(productId) {
        const product = pizzaMenu.find(p => p.id === productId);
        if (!product) return;

        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                name: product.name,
                price: product.price,
                quantity: 1
            });
        }
        
        updateCartDisplay();
        showNotification('Məhsul səbətə əlavə edildi');
    }

    window.updateQuantity = function(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.id !== productId);
            }
            updateCartDisplay();
        }
    }

    function updateCartDisplay() {
        const cartSection = document.getElementById('cartSection');
        const cartItems = document.getElementById('cartItems');
        
        if (!cartSection || !cartItems) return;
        
        if (cart.length === 0) {
            cartSection.classList.remove('active');
            return;
        }

        cartSection.classList.add('active');
        
        cartItems.innerHTML = `
            <div class="cart-header">
                <h3>Səbət</h3>
                <button class="close-cart" onclick="closeCart()">&times;</button>
            </div>
            
            <div class="cart-items">
                ${cart.map(item => `
                    <div class="cart-item">
                        <div class="item-info">
                            <span class="item-name">${item.name}</span>
                            <div class="item-controls">
                                <button onclick="updateQuantity('${item.id}', -1)">-</button>
                                <span>${item.quantity}</span>
                                <button onclick="updateQuantity('${item.id}', 1)">+</button>
                            </div>
                        </div>
                        <span class="item-price">${(item.price * item.quantity).toFixed(2)} ₼</span>
                    </div>
                `).join('')}
            </div>

            <div class="cart-total">
                <span>Ümumi:</span>
                <span>${calculateTotal().toFixed(2)} ₼</span>
            </div>

            ${generateOrderForm()}
        `;
    }

    function calculateTotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    function generateOrderForm() {
        return `
            <div class="order-form">
                <div class="form-group">
                    <label>Ad</label>
                    <input type="text" id="nameInput" placeholder="Adınız">
                </div>
                <div class="form-group">
                    <label>Soyad</label>
                    <input type="text" id="surnameInput" placeholder="Soyadınız">
                </div>
                <div class="form-group">
                    <label>Telefon</label>
                    <input type="tel" id="phoneInput" placeholder="+994 XX XXX XX XX">
                </div>
                <div class="form-group">
                    <label>Rayon</label>
                    <select id="districtInput">
                        <option value="">Rayon seçin</option>
                        <option value="Binəqədi">Binəqədi</option>
                        <option value="Xətai">Xətai</option>
                        <option value="Nərimanov">Nərimanov</option>
                        <option value="Nəsimi">Nəsimi</option>
                        <option value="Nizami">Nizami</option>
                        <option value="Səbail">Səbail</option>
                        <option value="Yasamal">Yasamal</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Küçə və bina</label>
                    <input type="text" id="addressInput" placeholder="Küçə, bina və mənzil nömrəsi">
                </div>
                <div class="form-group">
                    <label>Qeyd (istəyə bağlı)</label>
                    <textarea id="noteInput" placeholder="Xüsusi istəklərinizi qeyd edin..."></textarea>
                </div>
                <button class="order-button" onclick="placeOrder()">Sifariş et</button>
            </div>
        `;
    }

    window.showNotification = function(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    window.placeOrder = function() {
        // Order placement logic will go here
        console.log('Order placed:', {
            items: cart,
            total: calculateTotal(),
            customerInfo: {
                name: document.getElementById('nameInput').value,
                surname: document.getElementById('surnameInput').value,
                phone: document.getElementById('phoneInput').value,
                district: document.getElementById('districtInput').value,
                address: document.getElementById('addressInput').value,
                note: document.getElementById('noteInput').value
            }
        });
    }
});