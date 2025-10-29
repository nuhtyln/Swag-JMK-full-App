const API_BASE_URL = '';
let allProducts = [];


const getCartFromApi = async (username) => {
    if (!username) return [];
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart?user=${username}`);
        if (!response.ok) throw new Error('Failed to fetch cart');
        return await response.json(); 
    } catch (error) {
        console.error("Gagal mengambil keranjang:", error);
        return [];
    }
};

const saveCartToApi = async (cart, username) => { 
    if (!username) return;
    const filteredCart = cart.filter(item => item.qty > 0); 
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: username, cart: filteredCart })
        });
        if (!response.ok) throw new Error('Failed to save cart');
    } catch (error) {
        console.error("Gagal menyimpan keranjang:", error);
    }
};

const getProductsFromApi = async () => {
    if (allProducts.length > 0) return allProducts; 

    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        allProducts = await response.json();
        return allProducts;
    } catch (error) {
        console.error("Gagal mengambil produk:", error);
        return [];
    }
};

const clearCartApi = async (username) => {
     if (!username) return;
     try {
        await fetch(`${API_BASE_URL}/api/cart?user=${username}`, { method: 'DELETE' });
    } catch (error) {
        console.error("Gagal mengosongkan keranjang:", error);
    }
}

const updateCartCount = async () => {
    const cartCountElement = document.getElementById('cart-item-count');
    
    const cart = await getCartFromApi(localStorage.getItem('currentUser')); 
    const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
    
    if (cartCountElement) {
        cartCountElement.textContent = totalQty;
        cartCountElement.style.display = totalQty === 0 ? 'none' : 'block';
    }
};

const handleCartIconClick = (e) => {
    e.preventDefault(); 
    window.location.href = 'cart.html';
};

const handleCartAction = async (event) => {
    const target = event.target;
    if (!target.classList.contains('add-to-cart-btn') && !target.classList.contains('qty-btn')) return;

    const productId = parseInt(target.dataset.productId);
    const currentUser = localStorage.getItem('currentUser');
    
    let cart = await getCartFromApi(currentUser); 
    let existingItem = cart.find(item => item.id === productId);

    const isAdd = target.textContent.includes('Add');
    const isRemove = target.textContent.includes('REMOVE') || target.textContent.includes('Remove');
    const isPlus = target.textContent === '+';
    const isMinus = target.textContent === '-';

    if (isAdd) {
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ id: productId, qty: 1 });
        }
    } else if (isPlus) {
        if (existingItem) existingItem.qty++;
        
    } else if (isRemove) {
        const index = cart.findIndex(item => item.id === productId);
        if (index > -1) cart.splice(index, 1);
        
    } else if (isMinus) {
        if (existingItem && existingItem.qty > 1) {
            existingItem.qty--;
        } else if (existingItem && existingItem.qty === 1) {
            const index = cart.findIndex(item => item.id === productId);
            if (index > -1) cart.splice(index, 1);
        }
    }
    
    await saveCartToApi(cart, currentUser);

    const inventoryButton = document.querySelector(`.add-to-cart-btn[data-product-id="${productId}"]`);
    if(inventoryButton) {
        const itemIsNowInCart = cart.some(item => item.id === productId);
        inventoryButton.textContent = itemIsNowInCart ? 'Remove' : 'Add to Cart';
        inventoryButton.classList.toggle('btn-remove', itemIsNowInCart);
        inventoryButton.classList.toggle('btn-add', !itemIsNowInCart);
    }
    
    if (window.location.pathname.includes('cart.html')) {
        setupCartPage(); 
    } else {
        await updateCartCount(); 
    }
};

const setupLoginPage = () => {
    const loginButton = document.getElementById('login-button');
    const usernameInput = document.getElementById('user-name');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');

    if (!loginButton) return; 

    const handleLogin = async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;

        errorMessage.classList.add('error-hidden');
        errorMessage.textContent = '';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                errorMessage.textContent = data.message;
                errorMessage.classList.remove('error-hidden');
                return;
            }

            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('currentUser', data.user); 
            window.location.href = 'inventory.html';
            
        } catch (error) {
            errorMessage.textContent = 'Gagal terhubung ke server atau terjadi kesalahan jaringan.';
            errorMessage.classList.remove('error-hidden');
        }
    };
    
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
};

const setupInventoryPage = async () => {
    const inventoryContainer = document.getElementById('inventory-container');
    const logoutButton = document.getElementById('logout-button');

    if (!inventoryContainer) return; 

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    const PRODUCTS = await getProductsFromApi();
    const cart = await getCartFromApi(localStorage.getItem('currentUser')); 

    if (PRODUCTS.length === 0) {
        inventoryContainer.innerHTML = '<p>Gagal memuat produk dari server. Pastikan server backend berjalan.</p>';
        return;
    }
    
    let allProductsHTML = '';
    const currentUser = localStorage.getItem('currentUser');
            
    PRODUCTS.forEach(product => {
        const isInCart = cart.some(item => item.id === product.id); 
        const imagePath = (currentUser === 'problem_user') ? 
            './img/broken.jpg' : 
            `./img/product-${product.id}.jpg`;
            
        const buttonText = isInCart ? 'Remove' : 'Add to Cart';
        const buttonClass = isInCart ? 'btn-remove' : 'btn-add';

        allProductsHTML += `
            <div class="inventory-item" id="item-${product.id}">
                <img src="${imagePath}" class="item-image" alt="${product.name}">
                <div class="item-details">
                    <div class="item-name">${product.name}</div>
                    <div class="item-desc">${product.desc}</div>
                    <div class="item-price">$${product.price.toFixed(2)}</div>
                    <button 
                        class="add-to-cart-btn ${buttonClass}" 
                        data-product-id="${product.id}"
                    >${buttonText}</button>
                </div>
            </div>
        `;
    });
    inventoryContainer.innerHTML = allProductsHTML;

    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear(); 
            window.location.href = 'index.html';
        });
    }
    inventoryContainer.addEventListener('click', handleCartAction);
    await updateCartCount();
};

const setupCartPage = async () => {
    const cartListContainer = document.getElementById('cart-items-list');
    const cartSummaryContainer = document.getElementById('cart-summary');
    const checkoutBtn = document.getElementById('checkout-btn');
    const continueShoppingBtnTop = document.getElementById('continue-shopping-btn');
    const continueShoppingBtnBottom = document.getElementById('continue-shopping-btn-bottom');

    if (!cartListContainer) return;

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    const PRODUCTS = await getProductsFromApi();
    const cart = await getCartFromApi(localStorage.getItem('currentUser'));
    
    let cartHTML = '';
    let subtotal = 0;
    const TAX_RATE = 0.08;

    if (cart.length === 0) {
        cartHTML = '<p style="text-align: center; padding: 50px;">Keranjang Anda kosong.</p>';
        if (checkoutBtn) checkoutBtn.disabled = true;
    } else {
        if (checkoutBtn) checkoutBtn.disabled = false;
        
        cart.forEach(cartItem => {
            const product = PRODUCTS.find(p => p.id === cartItem.id);
            if (product) {
                const totalPrice = product.price * cartItem.qty;
                subtotal += totalPrice;
                
                const currentUser = localStorage.getItem('currentUser');
                const imagePath = (currentUser === 'problem_user') ? 
                    './img/broken.jpg' : 
                    `./img/product-${product.id}.jpg`;
                    
                cartHTML += `
                    <div class="cart-item-row item-details" id="cart-item-${product.id}">
                        <div class="cart-item-qty">
                            <button class="qty-btn" data-product-id="${product.id}">-</button>
                            <span class="qty-value">${cartItem.qty}</span>
                            <button class="qty-btn" data-product-id="${product.id}">+</button>
                        </div>
                        
                        <div class="cart-item-description">
                            <img src="${imagePath}" class="cart-item-image" alt="${product.name}">
                            <div class="cart-item-info">
                                <div class="cart-item-name">${product.name}</div>
                                <div class="cart-item-desc-text">${product.desc}</div>
                                <div class="cart-item-price">$${product.price.toFixed(2)}</div>
                                <button class="add-to-cart-btn btn-remove" data-product-id="${product.id}">REMOVE</button>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
    }

    cartListContainer.innerHTML = cartHTML;
    
    const tax = subtotal * TAX_RATE; 
    const finalTotal = subtotal + tax;
    
    cartSummaryContainer.innerHTML = `
        <p>Subtotal: $${subtotal.toFixed(2)}</p>
        <p>Tax (${TAX_RATE * 100}%): $${tax.toFixed(2)}</p>
        <p style="font-size: 1.3em;">Total: $${finalTotal.toFixed(2)}</p>
    `;
    
    cartListContainer.addEventListener('click', handleCartAction);
    
    const navigateToInventory = () => { window.location.href = 'inventory.html'; };
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length > 0) {
                window.location.href = 'checkout-step-one.html';
            } else {
                alert("Keranjang kosong! Silakan tambahkan item.");
            }
        });
    }
    
    if (continueShoppingBtnTop) continueShoppingBtnTop.addEventListener('click', navigateToInventory);
    if (continueShoppingBtnBottom) continueShoppingBtnBottom.addEventListener('click', navigateToInventory);
    
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear(); 
            window.location.href = 'index.html';
        });
    }
};

const setupCheckoutStepOnePage = () => {
    const continueBtn = document.getElementById('continue-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    const postalCodeInput = document.getElementById('postal-code');

    if (!continueBtn) return;

    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = 'index.html';
        return;
    }

    continueBtn.addEventListener('click', () => {
        if (firstNameInput.value && lastNameInput.value && postalCodeInput.value) {
            localStorage.setItem('checkoutInfo', JSON.stringify({
                first: firstNameInput.value,
                last: lastNameInput.value,
                postal: postalCodeInput.value
            }));
            window.location.href = 'checkout-complete.html'; 
        } else {
            alert("Harap lengkapi semua field.");
        }
    });

    cancelBtn.addEventListener('click', () => {
        window.location.href = 'cart.html';
    });
    
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear(); 
            window.location.href = 'index.html';
        });
    }
};

const setupCheckoutCompletePage = async () => {
    const backHomeBtn = document.getElementById('back-to-products-btn');
    if (!backHomeBtn) return;
    const currentUser = localStorage.getItem('currentUser');
    await clearCartApi(currentUser); 
    localStorage.removeItem('checkoutInfo');
    await updateCartCount(); 
    backHomeBtn.addEventListener('click', () => {
        window.location.href = 'inventory.html';
    });
    
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.clear(); 
            window.location.href = 'index.html';
        });
    }
};

const setupGlobalListeners = () => {
    const cartIconElement = document.querySelector('.shopping_cart_link');
    
    if (cartIconElement) {
        cartIconElement.addEventListener('click', handleCartIconClick);
    }
};

document.addEventListener('DOMContentLoaded', async () => { 
    setupGlobalListeners();
    
    if (!window.location.pathname.includes('index.html')) {
         await updateCartCount();
    }
    
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/') {
        setupLoginPage();
    } else if (path.includes('inventory.html')) {
        setupInventoryPage();
    } else if (path.includes('cart.html')) {
        setupCartPage();
    } else if (path.includes('checkout-step-one.html')) {
        setupCheckoutStepOnePage();
    } else if (path.includes('checkout-complete.html')) {
        setupCheckoutCompletePage();
    }
});