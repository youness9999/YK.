document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (!loggedInUser) {
        window.location.href = 'index.html'; // Kick out if not logged in at all
        return;
    }
    
    document.getElementById('welcomeUser').innerHTML = `Hello, <strong>${loggedInUser}</strong>`;

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
            let buyBtnHTML = isInStock 
                ? `<button class="btn-buy" onclick="buyProduct('${p.name}', ${p.price})"><i class="fas fa-shopping-cart"></i> Buy Now</button>`
                : `<button class="btn-buy" disabled style="background: rgba(255,255,255,0.1); color: var(--text-muted); cursor: not-allowed;"><i class="fas fa-ban"></i> Out of Stock</button>`;

            card.innerHTML = `
                ${mediaContent}
                <h3 class="product-title">${p.name}</h3>
                <p class="product-desc">${p.desc}</p>
                <div class="product-price">${p.price} TND</div>
                ${buyBtnHTML}
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
        showToast(`Order placed for ${productName}!`);
    } catch (error) {
        alert('Failed to connect to Firebase database. Check your keys.');
    }
});

// Controls the visual popup when buying
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
    document.getElementById('purch').addEventListener('click', () => {
        window.location.href = 'purchased.html';
    })
