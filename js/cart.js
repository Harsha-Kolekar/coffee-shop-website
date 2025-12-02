// Cart Management System
class CartSystem {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('coffeeCart')) || [];
        this.currentProduct = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateCartUI();
        this.setupProductBoxes();
    }

    bindEvents() {
        // Cart icon click
        document.getElementById('cart-icon').addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleCart();
        });

        // Close cart
        document.querySelector('.close-cart').addEventListener('click', () => {
            this.closeCart();
        });

        // Close modal
        document.querySelector('.close-modal').addEventListener('click', () => {
            this.closeModal();
        });

        // Quantity controls in modal
        document.getElementById('decreaseQty').addEventListener('click', () => {
            this.changeQuantity(-1);
        });

        document.getElementById('increaseQty').addEventListener('click', () => {
            this.changeQuantity(1);
        });

        // Add to cart button
        document.getElementById('addToCartBtn').addEventListener('click', () => {
            this.addToCart();
        });

        // Buy now button
        document.getElementById('buyNowBtn').addEventListener('click', () => {
            this.buyNow();
        });

        // Checkout button
        document.getElementById('checkoutBtn').addEventListener('click', () => {
            this.checkout();
        });

        // Close modal when clicking outside
        document.getElementById('productModal').addEventListener('click', (e) => {
            if (e.target.id === 'productModal') {
                this.closeModal();
            }
        });

        // Close cart when clicking outside
        document.getElementById('cartSidebar').addEventListener('click', (e) => {
            if (e.target.id === 'cartSidebar') {
                this.closeCart();
            }
        });
    }

    setupProductBoxes() {
        const productBoxes = document.querySelectorAll('.menu .box');
        productBoxes.forEach(box => {
            box.style.cursor = 'pointer';
            box.addEventListener('click', (e) => {
                e.preventDefault();
                this.openProductModal(box);
            });
        });
    }

    openProductModal(box) {
        const productId = box.dataset.productId;
        const productName = box.dataset.productName;
        const productPrice = parseFloat(box.dataset.productPrice);
        const productImage = box.dataset.productImage;
        const productDescription = box.dataset.productDescription;

        this.currentProduct = {
            id: productId,
            name: productName,
            price: productPrice,
            image: productImage,
            description: productDescription
        };

        // Populate modal
        document.getElementById('modalProductName').textContent = productName;
        document.getElementById('modalProductDescription').textContent = productDescription;
        document.getElementById('modalProductPrice').textContent = `$${productPrice.toFixed(2)}`;
        document.getElementById('modalProductImage').src = productImage;
        document.getElementById('modalProductImage').alt = productName;

        // Reset form
        document.getElementById('quantity').value = 1;
        document.querySelector('input[name="size"][value="small"]').checked = true;
        document.querySelectorAll('.addon-options input[type="checkbox"]').forEach(cb => cb.checked = false);

        // Show modal
        document.getElementById('productModal').classList.add('show');
    }

    closeModal() {
        document.getElementById('productModal').classList.remove('show');
        this.currentProduct = null;
    }

    changeQuantity(delta) {
        const qtyInput = document.getElementById('quantity');
        let newQty = parseInt(qtyInput.value) + delta;
        if (newQty < 1) newQty = 1;
        if (newQty > 10) newQty = 10;
        qtyInput.value = newQty;
    }

    calculateItemPrice() {
        if (!this.currentProduct) return 0;

        let price = this.currentProduct.price;
        const quantity = parseInt(document.getElementById('quantity').value);
        const size = document.querySelector('input[name="size"]:checked').value;
        
        // Size price adjustments
        const sizeMultipliers = {
            small: 1,
            medium: 1.25,
            large: 1.5
        };
        price *= sizeMultipliers[size];

        // Add-on prices
        const addonPrices = {
            'extra-shot': 1.50,
            'vanilla': 0.75,
            'caramel': 0.75,
            'whipped': 0.50
        };

        document.querySelectorAll('.addon-options input[type="checkbox"]:checked').forEach(cb => {
            price += addonPrices[cb.value] || 0;
        });

        return price * quantity;
    }

    addToCart() {
        if (!this.currentProduct) return;

        const quantity = parseInt(document.getElementById('quantity').value);
        const size = document.querySelector('input[name="size"]:checked').value;
        const selectedAddons = [];
        
        document.querySelectorAll('.addon-options input[type="checkbox"]:checked').forEach(cb => {
            selectedAddons.push(cb.value);
        });

        const cartItem = {
            id: this.currentProduct.id,
            name: this.currentProduct.name,
            price: this.currentProduct.price,
            image: this.currentProduct.image,
            quantity: quantity,
            size: size,
            addons: selectedAddons,
            totalPrice: this.calculateItemPrice(),
            timestamp: Date.now()
        };

        // Check if similar item exists
        const existingItemIndex = this.cart.findIndex(item => 
            item.id === cartItem.id && 
            item.size === cartItem.size && 
            JSON.stringify(item.addons.sort()) === JSON.stringify(cartItem.addons.sort())
        );

        if (existingItemIndex !== -1) {
            this.cart[existingItemIndex].quantity += cartItem.quantity;
            this.cart[existingItemIndex].totalPrice = this.calculateItemPriceForExisting(
                this.cart[existingItemIndex].quantity,
                this.cart[existingItemIndex].price,
                this.cart[existingItemIndex].size,
                this.cart[existingItemIndex].addons
            );
        } else {
            this.cart.push(cartItem);
        }

        this.saveCart();
        this.updateCartUI();
        this.closeModal();
        this.showNotification('Item added to cart!');
    }

    calculateItemPriceForExisting(quantity, basePrice, size, addons) {
        let price = basePrice * quantity;
        
        const sizeMultipliers = {
            small: 1,
            medium: 1.25,
            large: 1.5
        };
        price = (basePrice * sizeMultipliers[size]) * quantity;

        const addonPrices = {
            'extra-shot': 1.50,
            'vanilla': 0.75,
            'caramel': 0.75,
            'whipped': 0.50
        };

        addons.forEach(addon => {
            price += (addonPrices[addon] || 0) * quantity;
        });

        return price;
    }

    buyNow() {
        this.addToCart();
        this.closeCart();
        this.checkout();
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cartSidebar');
        cartSidebar.classList.toggle('open');
    }

    closeCart() {
        document.getElementById('cartSidebar').classList.remove('open');
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartItems = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');

        // Update count
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;

        // Update cart items
        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; padding: 2rem; color: #999;">Your cart is empty</p>';
        } else {
            cartItems.innerHTML = this.cart.map((item, index) => `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-details">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-options">
                            ${item.size.charAt(0).toUpperCase() + item.size.slice(1)}
                            ${item.addons.length > 0 ? ' + ' + item.addons.map(a => a.replace('-', ' ')).join(', ') : ''}
                        </div>
                        <div class="cart-item-price">$${item.totalPrice.toFixed(2)}</div>
                    </div>
                    <div class="cart-item-quantity">
                        <button onclick="cartSystem.updateItemQuantity(${index}, -1)">-</button>
                        <input type="number" value="${item.quantity}" min="1" max="10" readonly>
                        <button onclick="cartSystem.updateItemQuantity(${index}, 1)">+</button>
                    </div>
                    <button onclick="cartSystem.removeItem(${index})" style="background: #ff4d4d; color: white; border: none; padding: 0.5rem; border-radius: 0.3rem; cursor: pointer; margin-left: 0.5rem;">×</button>
                </div>
            `).join('');
        }

        // Update total
        const total = this.cart.reduce((sum, item) => sum + item.totalPrice, 0);
        cartTotal.textContent = `$${total.toFixed(2)}`;
    }

    updateItemQuantity(index, delta) {
        const item = this.cart[index];
        item.quantity += delta;
        
        if (item.quantity < 1) {
            item.quantity = 1;
        } else if (item.quantity > 10) {
            item.quantity = 10;
        } else {
            item.totalPrice = this.calculateItemPriceForExisting(
                item.quantity,
                item.price,
                item.size,
                item.addons
            );
            this.saveCart();
        }
        
        this.updateCartUI();
    }

    removeItem(index) {
        this.cart.splice(index, 1);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Item removed from cart');
    }

    saveCart() {
        localStorage.setItem('coffeeCart', JSON.stringify(this.cart));
    }

    async checkout() {
        try {
            console.log('Checkout started...');
            
            if (this.cart.length === 0) {
                this.showNotification('Your cart is empty!', 'error');
                return;
            }

            // Allow guest checkout without requiring authentication
            console.log('Proceeding with guest checkout...');
            this.showNotification('Proceeding to checkout...', 'info');

            // Get or create user data (guest mode)
            let userData = null;
            try {
                // First try to get from localStorage
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        userData = JSON.parse(storedUser);
                        console.log('User data from localStorage:', userData);
                    } catch (e) {
                        console.error('Error parsing user data from localStorage:', e);
                        localStorage.removeItem('user');
                    }
                }

                // If no valid user data, try to get authenticated user data
                if (!userData || !userData.id) {
                    const token = localStorage.getItem('token');
                    if (token) {
                        console.log('Trying to get authenticated user data...');
                        const response = await fetch('/api/auth/me', {
                            headers: {
                                'Authorization': `Bearer ${token}`
                            }
                        });
                        
                        if (response.ok) {
                            userData = await response.json();
                            console.log('Fetched authenticated user data:', userData);
                            // Save to localStorage for future use
                            if (userData && userData.id) {
                                localStorage.setItem('user', JSON.stringify(userData));
                            }
                        }
                    }
                }

                // If still no valid user data, use guest checkout
                if (!userData || !userData.id) {
                    console.log('Using guest checkout');
                    userData = { id: 'guest_' + Date.now(), name: 'Guest User' };
                }
            } catch (error) {
                console.error('Error getting user data, using guest checkout:', error);
                userData = { id: 'guest_' + Date.now(), name: 'Guest User' };
            }

            // Create order
            const order = {
                id: 'ord_' + Date.now().toString(),
                userId: userData.id,
                items: this.cart,
                total: this.cart.reduce((sum, item) => sum + item.totalPrice, 0),
                status: 'pending',
                createdAt: new Date().toISOString(),
                paymentStatus: 'pending'
            };

            console.log('Creating order:', order);

            // Save order to backend server
            try {
                console.log('Sending order to server...');
                
                const orderData = {
                    userId: userData.id,
                    userName: userData.name || 'Guest User',
                    userEmail: userData.email || '',
                    userPhone: userData.phone || '',
                    deliveryAddress: userData.address || '',
                    items: this.cart.map(item => ({
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                        size: item.size,
                        addons: item.addons,
                        image: item.image,
                        totalPrice: item.totalPrice
                    })),
                    subtotal: this.cart.reduce((sum, item) => sum + item.totalPrice, 0),
                    tax: 0, // You can calculate tax based on your requirements
                    deliveryFee: 0, // You can add delivery fee logic
                    notes: '', // Optional order notes
                    paymentMethod: 'cash' // Default payment method
                };

                const response = await fetch('http://localhost:3000/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData)
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const savedOrder = await response.json();
                console.log('Order saved to server:', savedOrder);
                
                // Update order object with server response
                order.id = savedOrder.data.orderId;
                
                // Also save to localStorage as backup
                const localOrders = JSON.parse(localStorage.getItem('orders') || '[]');
                localOrders.push(order);
                localStorage.setItem('orders', JSON.stringify(localOrders));
                
            } catch (error) {
                console.error('Error saving order to server, falling back to localStorage:', error);
                
                // Fallback to localStorage if server fails
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
                console.log('Order saved to localStorage as fallback');
            }

            // Clear cart
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.closeCart();

            // Redirect to payment page
            this.showNotification('Order placed successfully! Redirecting to payment...', 'success');
            setTimeout(() => {
                window.location.href = `payment.html?orderId=${order.id}`;
            }, 1500);
            
        } catch (error) {
            console.error('Error during checkout process:', error);
            this.showNotification('An error occurred during checkout. Please try again.', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 10001;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize cart system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.cartSystem = new CartSystem();
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);
