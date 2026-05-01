document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (!loggedInUser) {
        window.location.href = 'index.html'; // Kick out if not logged in at all
        return;
    }
    
    document.getElementById('welcomeUser').innerHTML = `Hello, <strong>${loggedInUser}</strong>`;

    // 2. Products Data
    const defaultProducts = [
        // GPU
        { id: 1, name: 'NVIDIA RTX 4090 GPU', type: 'GPU', price: 1599, icon: 'fa-microchip', img: '', desc: 'The ultimate GPU for 4K gaming and 3D rendering.' },
        { id: 2, name: 'RTX 5090 TUF gaming OC', type: 'GPU', price: 2000, icon: 'fa-microchip', img: '', desc: 'The best gameplay in ultra graphics with this GPU.' },
        { id: 3, name: 'AMD Radeon RX 7900 XTX', type: 'GPU', price: 999, icon: 'fa-microchip', img: '', desc: 'Flagship AMD performance with 24GB VRAM.' },
        { id: 4, name: 'NVIDIA RTX 4080 Super', type: 'GPU', price: 999, icon: 'fa-microchip', img: '', desc: 'Incredible 4K performance and ray tracing capabilities.' },
        { id: 5, name: 'NVIDIA RTX 4070 Ti Super', type: 'GPU', price: 799, icon: 'fa-microchip', img: '', desc: 'The perfect sweet spot for 1440p high-refresh gaming.' },
        { id: 6, name: 'AMD Radeon RX 7800 XT', type: 'GPU', price: 499, icon: 'fa-microchip', img: '', desc: 'Exceptional value and 1440p performance.' },
        { id: 7, name: 'NVIDIA RTX 4060 Ti', type: 'GPU', price: 399, icon: 'fa-microchip', img: '', desc: 'Great entry to the 40-series ecosystem.' },
        
        // CPU
        { id: 8, name: 'AMD Ryzen 9 7950X CPU', type: 'CPU', price: 599, icon: 'fa-memory', img: '', desc: '16 cores of pure processing power for enthusiasts.' },
        { id: 9, name: 'Intel Core i9-14900K', type: 'CPU', price: 650, icon: 'fa-memory', img: '', desc: 'Next-gen processing power for intensive tasks.' },
        { id: 10, name: 'AMD Ryzen 7 7800X3D', type: 'CPU', price: 399, icon: 'fa-memory', img: '', desc: 'The absolute best gaming CPU on the market.' },
        { id: 11, name: 'Intel Core i7-14700K', type: 'CPU', price: 399, icon: 'fa-memory', img: '', desc: 'Incredible multi-core performance for creators.' },
        { id: 12, name: 'AMD Ryzen 5 7600X', type: 'CPU', price: 229, icon: 'fa-memory', img: '', desc: 'Excellent mid-range CPU for gaming builds.' },
        { id: 13, name: 'Intel Core i5-13600K', type: 'CPU', price: 289, icon: 'fa-memory', img: '', desc: 'The perfect balance of price and performance.' },

        // RAM
        { id: 14, name: 'Corsair Vengeance 32GB RAM', type: 'RAM', price: 149, icon: 'fa-sd-card', img: '', desc: 'Blazing fast DDR5 memory kit.' },
        { id: 15, name: 'G.Skill Trident Z5 64GB', type: 'RAM', price: 229, icon: 'fa-sd-card', img: '', desc: 'High-capacity DDR5 kit for heavy workloads.' },
        { id: 16, name: 'Kingston Fury Beast 32GB DDR5', type: 'RAM', price: 129, icon: 'fa-sd-card', img: '', desc: 'Reliable and low-profile performance memory.' },
        { id: 17, name: 'TeamGroup T-Force Delta RGB 32GB', type: 'RAM', price: 119, icon: 'fa-sd-card', img: '', desc: 'Stunning RGB implementation with tight timings.' },
        { id: 18, name: 'Crucial Pro 64GB DDR5', type: 'RAM', price: 189, icon: 'fa-sd-card', img: '', desc: 'No-nonsense stability for professional rigs.' },
        { id: 19, name: 'ADATA XPG Lancer RGB 32GB', type: 'RAM', price: 139, icon: 'fa-sd-card', img: '', desc: 'High frequency DDR5 reaching up to 7200MHz.' },

        // Motherboard
        { id: 20, name: 'ASUS ROG Z790 Motherboard', type: 'Motherboard', price: 499, icon: 'fa-server', img: '', desc: 'Premium motherboard for extreme overclocking.' },
        { id: 21, name: 'MSI MAG B650 TOMAHAWK WIFI', type: 'Motherboard', price: 219, icon: 'fa-server', img: '', desc: 'Excellent VRMs and features for AM5 builds.' },
        { id: 22, name: 'Gigabyte X670E AORUS MASTER', type: 'Motherboard', price: 489, icon: 'fa-server', img: '', desc: 'E-ATX board built for the most demanding Ryzen 9 CPUs.' },
        { id: 23, name: 'ASRock B650E Taichi', type: 'Motherboard', price: 369, icon: 'fa-server', img: '', desc: 'Stunning steampunk aesthetics and PCIe 5.0.' },
        { id: 24, name: 'ASUS TUF Gaming B760-PLUS', type: 'Motherboard', price: 199, icon: 'fa-server', img: '', desc: 'Durable military-grade components for Intel CPUs.' },
        { id: 25, name: 'MSI PRO Z790-A MAX WIFI', type: 'Motherboard', price: 239, icon: 'fa-server', img: '', desc: 'Professional level stability and connectivity.' },

        // Storage
        { id: 26, name: 'Samsung 990 PRO 2TB NVMe', type: 'Storage', price: 169, icon: 'fa-hdd', img: '', desc: 'PCIe 4.0 NVMe SSD for lightning fast load times.' },
        { id: 27, name: 'WD Black SN850X 1TB', type: 'Storage', price: 99, icon: 'fa-hdd', img: '', desc: 'High-performance storage for gamers and creators.' },
        { id: 28, name: 'Crucial T700 2TB Gen5 NVMe', type: 'Storage', price: 299, icon: 'fa-hdd', img: '', desc: 'Insane PCIe 5.0 speeds up to 12,400 MB/s.' },
        { id: 29, name: 'Seagate FireCuda 530 2TB', type: 'Storage', price: 189, icon: 'fa-hdd', img: '', desc: 'Built for sustained heavy workloads and PS5 compatible.' },
        { id: 30, name: 'Kingston KC3000 1TB', type: 'Storage', price: 94, icon: 'fa-hdd', img: '', desc: 'Excellent value to performance ratio for Gen4 drives.' },
        { id: 31, name: 'SK hynix Platinum P41 2TB', type: 'Storage', price: 159, icon: 'fa-hdd', img: '', desc: 'Top tier efficiency and sequential speeds.' },

        // PSU
        { id: 32, name: 'EVGA SuperNOVA 1000G T2', type: 'PSU', price: 249, icon: 'fa-plug', img: '', desc: 'Titanium certified power supply for stable performance.' },
        { id: 33, name: 'Corsair RM850x', type: 'PSU', price: 149, icon: 'fa-plug', img: '', desc: 'Reliable Gold certified fully modular PSU.' },
        { id: 34, name: 'Seasonic Vertex GX-1000', type: 'PSU', price: 229, icon: 'fa-plug', img: '', desc: 'ATX 3.0 and PCIe 5.0 ready PSU from the master of power.' },
        { id: 35, name: 'Be Quiet! Dark Power 13 850W', type: 'PSU', price: 249, icon: 'fa-plug', img: '', desc: 'Virtually inaudible operation with Titanium efficiency.' },
        { id: 36, name: 'MSI MPG A1000G PCIE5', type: 'PSU', price: 199, icon: 'fa-plug', img: '', desc: 'Compact 1000W unit ready for the newest GPUs.' },
        { id: 37, name: 'ASUS ROG Thor 1000W Platinum II', type: 'PSU', price: 349, icon: 'fa-plug', img: '', desc: 'Features an OLED power display and massive heatsinks.' },

        // Cooler
        { id: 38, name: 'NZXT Kraken Elite 360', type: 'Cooler', price: 279, icon: 'fa-fan', img: '', desc: 'AIO Liquid Cooler with customizable LCD screen.' },
        { id: 39, name: 'Noctua NH-D15', type: 'Cooler', price: 119, icon: 'fa-fan', img: '', desc: 'Premium dual-tower CPU cooler for ultimate silence.' },
        { id: 40, name: 'Corsair iCUE H150i Elite', type: 'Cooler', price: 229, icon: 'fa-fan', img: '', desc: 'Excellent cooling performance with bright Capellix LEDs.' },
        { id: 41, name: 'Arctic Liquid Freezer III 360', type: 'Cooler', price: 129, icon: 'fa-fan', img: '', desc: 'Thick radiator and VRM fan for exceptional thermals.' },
        { id: 42, name: 'Thermalright Peerless Assassin 120', type: 'Cooler', price: 39, icon: 'fa-fan', img: '', desc: 'The undisputed king of budget air cooling.' },
        { id: 43, name: 'DeepCool LT720 360mm', type: 'Cooler', price: 139, icon: 'fa-fan', img: '', desc: 'Unique infinity mirror pump block and great fans.' },

        // Case
        { id: 44, name: 'Lian Li O11 Dynamic EVO', type: 'Case', price: 159, icon: 'fa-box', img: '', desc: 'Stunning tempered glass mid-tower chassis.' },
        { id: 45, name: 'Fractal Design North', type: 'Case', price: 139, icon: 'fa-box', img: '', desc: 'Elegant PC case featuring natural wood accents.' },
        { id: 46, name: 'Corsair 4000D Airflow', type: 'Case', price: 104, icon: 'fa-box', img: '', desc: 'Excellent airflow and cable management for builders.' },
        { id: 47, name: 'NZXT H9 Flow', type: 'Case', price: 159, icon: 'fa-box', img: '', desc: 'Dual-chamber design with massive cooling potential.' },
        { id: 48, name: 'Hyte Y60', type: 'Case', price: 199, icon: 'fa-box', img: '', desc: 'Panoramic glass case designed for vertical GPU mounting.' },
        { id: 49, name: 'Phanteks NV7', type: 'Case', price: 219, icon: 'fa-box', img: '', desc: 'Showcase chassis with hidden cable routing.' },
        { id: 50, name: 'Be Quiet! Pure Base 500DX', type: 'Case', price: 109, icon: 'fa-box', img: '', desc: 'High airflow with subtle ARGB lighting strips.' }
    ];

    let productsJSON = localStorage.getItem('productsDB');
    let products = [];
    if (!productsJSON) {
        products = defaultProducts;
        localStorage.setItem('productsDB', JSON.stringify(products));
    } else {
        products = JSON.parse(productsJSON);
        let changed = false;
        products.forEach(p => {
            if (p.img !== '') {
                p.img = '';
                changed = true;
            }
        });
        if (changed) {
            localStorage.setItem('productsDB', JSON.stringify(products));
        }
    }

    // 3. Render Products
    const grid = document.getElementById('productsGrid');
    
    let currentCategory = 'all';
    let currentPriceRange = 'all';
    let currentSort = 'default';

    function renderProducts() {
        grid.innerHTML = '';
        
        // We use spread syntax to create a copy of the array so we don't mutate the original
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
            // default sorting by id
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
    renderProducts();

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

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
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

    // Save to Orders database in local storage
    const ordersJSON = localStorage.getItem('ordersDB') || '[]';
    const orders = JSON.parse(ordersJSON);
    
    orders.push(newOrder);
    localStorage.setItem('ordersDB', JSON.stringify(orders));

    // Hide Modal and reset
    document.getElementById('checkoutModal').style.display = 'none';
    e.target.reset();

    // Show Success notification visually
    showToast(`Order placed for ${productName}!`);
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
