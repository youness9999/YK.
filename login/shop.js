document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (!loggedInUser) {
        window.location.href = 'index.html'; // Kick out if not logged in at all
        return;
    }
    
    document.getElementById('welcomeUser').innerHTML = `Hello, <strong>${loggedInUser}</strong>`;

    // Theme Toggle
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const body = document.body;
    
    if (localStorage.getItem('theme') === 'light') {
        body.classList.add('light-mode');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        if (body.classList.contains('light-mode')) {
            localStorage.setItem('theme', 'light');
            themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        }
    });

    // 2. Products Data
    let products = [];
    
    // 3. Render Products Setup
    const grid = document.getElementById('productsGrid');
    
    let currentCategory = 'all';
    let currentPriceRange = 'all';
    let currentSort = 'default';

    // Fetch Products from Firebase
    async function initProducts() {
        try {
            const snapshot = await db.collection('products').get();
            products = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
            renderProducts();
        } catch (error) {
            console.error('Error fetching products from database:', error);
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--danger);">Failed to load products from Firebase. Check your config keys.</div>';
        }
    }

    function renderProducts() {
        grid.innerHTML = '';
        
        let filteredProducts = [...products];
        
        // Filter by category
        if (currentCategory !== 'all') {
            filteredProducts = filteredProducts.filter(p => p.type === currentCategory);
        }
        
        // Filter by price
        if (currentPriceRange === 'under100') {
            filteredProducts = filteredProducts.filter(p => p.price < 100);
        } else if (currentPriceRange === '100to300') {
            filteredProducts = filteredProducts.filter(p => p.price >= 100 && p.price <= 300);
        } else if (currentPriceRange === '300to600') {
            filteredProducts = filteredProducts.filter(p => p.price > 300 && p.price <= 600);
        } else if (currentPriceRange === 'over600') {
            filteredProducts = filteredProducts.filter(p => p.price > 600);
        }
        
        // Sorting logic
        if (currentSort === 'priceLowHigh') {
            filteredProducts.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'priceHighLow') {
            filteredProducts.sort((a, b) => b.price - a.price);
        } else {
            filteredProducts.sort((a, b) => a.id - b.id);
        }
            
        filteredProducts.forEach(p => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let mediaContent = p.img 
                ? `<div class="product-image-container"><img src="${p.img}" alt="${p.name}" class="product-image"></div>`
                : `<i class="fas ${p.icon} product-icon"></i>`;
                
            let isInStock = p.inStock !== false;
            let buttonsHTML = isInStock 
                ? `<div style="display: flex; gap: 10px; margin-top: auto;">
                    <button class="btn-buy" style="flex: 1; background: rgba(128,128,128,0.2); color: var(--text-color);" onclick="viewProductDetails('${p.firebaseId}')"><i class="fas fa-info-circle"></i> Details</button>
                    <button class="btn-buy" style="flex: 1;" onclick="buyProduct('${p.name}', ${p.price})"><i class="fas fa-shopping-cart"></i> Buy</button>
                   </div>`
                : `<button class="btn-buy" disabled style="background: rgba(255,255,255,0.1); color: var(--text-muted); cursor: not-allowed; width: 100%; margin-top: auto;"><i class="fas fa-ban"></i> Out of Stock</button>`;

            card.innerHTML = `
                ${mediaContent}
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.desc}</p>
                <div class="product-price">${p.price} TND</div>
                ${buttonsHTML}
            `;
            grid.appendChild(card);
        });
    }

    // Initial render
    initProducts();

    // Category Filter Logic
    const filterButtons = document.querySelectorAll('.btn-filter');
    if (filterButtons) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategory = e.target.getAttribute('data-type');
                renderProducts();
            });
        });
    }

    // Price Filter Logic
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
        priceFilter.addEventListener('change', (e) => {
            currentPriceRange = e.target.value;
            renderProducts();
        });
    }
    
    // Sort Filter Logic
    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderProducts();
        });
    }

    // 4. Logout handling
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    });
});

// Function to handle opening the checkout modal
window.buyProduct = function(productName, price) {
    document.getElementById('checkoutProductName').value = productName;
    document.getElementById('checkoutProductPrice').value = price;
    document.getElementById('checkoutModal').style.display = 'flex';
};

// Function to handle viewing product details
window.viewProductDetails = async function(firebaseId) {
    try {
        const doc = await db.collection('products').doc(firebaseId).get();
        if (doc.exists) {
            const p = doc.data();
            document.getElementById('detailsTitle').textContent = p.name;
            
            let mediaContent = p.img 
                ? `<img src="${p.img}" alt="${p.name}" style="width: 100%; max-height: 250px; object-fit: contain; border-radius: 8px; background: rgba(0,0,0,0.1); padding: 10px;">`
                : `<div style="text-align: center; padding: 40px; background: rgba(0,0,0,0.1); border-radius: 8px;"><i class="fas ${p.icon}" style="font-size: 80px; color: var(--primary);"></i></div>`;
                
            document.getElementById('detailsBody').innerHTML = `
                ${mediaContent}
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span style="font-size: 18px; color: var(--text-muted);"><i class="fas fa-tag"></i> Category: ${p.type}</span>
                    <span style="font-size: 24px; font-weight: bold; color: var(--success);">${p.price} TND</span>
                </div>
                <p style="margin-top: 15px; line-height: 1.6; font-size: 16px;">${p.desc}</p>
            `;
            
            const buyBtn = document.getElementById('buyFromDetailsBtn');
            buyBtn.onclick = () => {
                document.getElementById('detailsModal').style.display = 'none';
                buyProduct(p.name, p.price);
            };
            
            document.getElementById('detailsModal').style.display = 'flex';
        }
    } catch (e) {
        showToast('Error loading details', 'error');
    }
};

document.getElementById('closeDetailsBtn').addEventListener('click', () => {
    document.getElementById('detailsModal').style.display = 'none';
});

// Checkout Form Logic
document.getElementById('closeModalBtn').addEventListener('click', () => {
    document.getElementById('checkoutModal').style.display = 'none';
});

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loggedInUser = localStorage.getItem('loggedInUser');
    const productName = document.getElementById('checkoutProductName').value;
    const price = document.getElementById('checkoutProductPrice').value;
    
    const fullName = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const address = document.getElementById('checkoutAddress').value;
    const payment = document.getElementById('checkoutPayment').value;
    const quantity = parseInt(document.getElementById('checkoutQuantity').value) || 1;
    
    // Validate phone number: Must have at least 8 digits
    const digitsOnly = phone.replace(/[^0-9]/g, '');
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
    
    if (!phoneRegex.test(phone) || digitsOnly.length < 8) {
        alert("Please enter a valid, real phone number (minimum 8 digits).");
        return; // Prevent form submission
    }
    
    // Calculate total price
    const totalPrice = parseFloat(price) * quantity;
    
    // Create an order object with new details
    const newOrder = {
        id: 'ORD-' + Math.floor(Math.random() * 1000000),
        user: loggedInUser,
        product: productName,
        quantity: quantity,
        price: totalPrice,
        status: 'Pending',
        date: new Date().toLocaleDateString(),
        customerName: fullName,
        phone: phone,
        address: address,
        paymentMethod: payment
    };

    try {
        // Save to Firebase
        await db.collection('orders').add(newOrder);

        // Hide Modal and reset
        document.getElementById('checkoutModal').style.display = 'none';
        e.target.reset();

        // Show Success notification visually
        showToast(`Order placed for ${productName}!`, 'success');
    } catch (error) {
        showToast('Failed to connect to Firebase database.', 'error');
    }
});

// Controls the visual popup when buying
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    
    // reset classes
    toast.className = 'toast';
    toast.classList.add(type);
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
    document.getElementById('purch').addEventListener('click', () => {
        window.location.href = 'purchased.html';
    })

