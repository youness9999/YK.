document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Authentication/Authorization
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    // Only "admin" username has access to this page
    if (loggedInUser !== 'admin') {
        alert('Access Denied. Admin privileges required.');
        window.location.href = 'index.html'; // Redirect non-admins back to login
        return;
    }

    // 2. Load and Display Users, Orders & Products
    loadUsers();
    loadOrders();
    loadManageProducts();

    // 3. Logout handling
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('loggedInUser'); // end session
        window.location.href = 'index.html'; // go back
    });
});

function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('emptyState');
    const tableResponsive = document.querySelector('.table-responsive');
    const userCount = document.getElementById('userCount');

    // Fetch from LocalStorage
    const usersJSON = localStorage.getItem('usersDB');
    let users = [];
    
    if (usersJSON) {
        users = JSON.parse(usersJSON);
    }

    // Update count badge
    userCount.textContent = `${users.length} User${users.length !== 1 ? 's' : ''}`;

    if (users.length === 0) {
        tableResponsive.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableResponsive.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    // Populate rows
    users.forEach((user, index) => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><strong>${escapeHTML(user.username)}</strong></td>
            <td><span class="password-cell">${escapeHTML(user.password)}</span></td>
            <td>
                <button class="action-btn" onclick="deleteUser(${index})" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Gives admin the ability to remove users
function deleteUser(index) {
    if(confirm('Are you sure you want to delete this user?')) {
        const usersJSON = localStorage.getItem('usersDB');
        if (usersJSON) {
            let users = JSON.parse(usersJSON);
            users.splice(index, 1); // Remove from array
            localStorage.setItem('usersDB', JSON.stringify(users)); // Save new array
            loadUsers(); // Refresh table view immediately
        }
    }
}

// Security function to escape HTML characters in usernames and passwords
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ---------------- ORDERS LOGIC ----------------
function loadOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('orderEmptyState');
    const tableResponsive = document.querySelectorAll('.table-responsive')[1]; // second table
    const orderCount = document.getElementById('orderCount');

    // Fetch from LocalStorage
    const ordersJSON = localStorage.getItem('ordersDB');
    let orders = [];
    
    if (ordersJSON) {
        orders = JSON.parse(ordersJSON);
    }

    // Update count badge
    orderCount.textContent = `${orders.length} Order${orders.length !== 1 ? 's' : ''}`;

    if (orders.length === 0) {
        tableResponsive.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableResponsive.style.display = 'block';
    emptyState.style.display = 'none';
    tableBody.innerHTML = '';

    // Populate rows
    orders.forEach((order, index) => {
        const row = document.createElement('tr');
        
        // Determine badge style
        let badgeClass = 'pending';
        if (order.status === 'Approved') badgeClass = 'approved';
        if (order.status === 'Cancelled') badgeClass = 'cancelled';

        // Action buttons based on status
        let actionButtons = '';
        if (order.status === 'Pending') {
            actionButtons += `
                <button class="btn-approve" onclick="approveOrder(${index})" title="Approve Request">
                    <i class="fas fa-check"></i> Approve
                </button>
            `;
        }
        
        actionButtons += `
            <button class="action-btn" onclick="deleteOrder(${index})" title="Delete Order">
                <i class="fas fa-trash"></i>
            </button>
        `;

        row.innerHTML = `
            <td><strong>${escapeHTML(order.id)}</strong></td>
            <td>
                ${escapeHTML(order.user)}<br>
                <small style="color: var(--text-muted);">${escapeHTML(order.customerName || '')}</small><br>
                <small style="color: var(--text-muted);">${escapeHTML(order.phone || '')}</small>
            </td>
            <td>
                ${escapeHTML(order.product)} <strong>(x${order.quantity || 1})</strong><br>
                <small style="color: var(--text-muted);">${escapeHTML(order.paymentMethod || '')}</small>
            </td>
            <td>${order.price} TND</td>
            <td><span class="status-badge ${badgeClass}">${escapeHTML(order.status)}</span></td>
            <td>${actionButtons}</td>
        `;
        tableBody.appendChild(row);
    });
}

function approveOrder(index) {
    if(confirm('Approve this purchase request?')) {
        const ordersJSON = localStorage.getItem('ordersDB');
        if (ordersJSON) {
            let orders = JSON.parse(ordersJSON);
            orders[index].status = 'Approved';
            localStorage.setItem('ordersDB', JSON.stringify(orders));
            loadOrders(); // Refresh table view
        }
    }
}

function deleteOrder(index) {
    if(confirm('Are you sure you want to delete this order request?')) {
        const ordersJSON = localStorage.getItem('ordersDB');
        if (ordersJSON) {
            let orders = JSON.parse(ordersJSON);
            orders.splice(index, 1); 
            localStorage.setItem('ordersDB', JSON.stringify(orders));
            loadOrders(); // Refresh table view
        }
    }
}

// ---------------- PRODUCTS LOGIC ----------------
document.getElementById('addProductForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('prodName').value;
    const type = document.getElementById('prodType').value;
    const price = parseFloat(document.getElementById('prodPrice').value);
    const img = document.getElementById('prodImg').value;
    const desc = document.getElementById('prodDesc').value;
    
    // Default Icon mapping based on category type
    const iconMap = {
        'GPU': 'fa-microchip',
        'CPU': 'fa-memory',
        'RAM': 'fa-sd-card',
        'Motherboard': 'fa-server',
        'Storage': 'fa-hdd',
        'PSU': 'fa-plug',
        'Cooler': 'fa-fan',
        'Case': 'fa-box'
    };
    const icon = iconMap[type] || 'fa-box';

    // Get products from DB
    let productsJSON = localStorage.getItem('productsDB');
    let products = productsJSON ? JSON.parse(productsJSON) : [];
    
    // If shop hasn't been visited yet, DB might be empty. We should ideally have the default list.
    // Assuming shop.js initializes it, but if admin adds first:
    let maxId = 0;
    products.forEach(p => { if(p.id > maxId) maxId = p.id; });
    if(maxId === 0) maxId = 50; // Just in case, to avoid collision with defaults
    
    const newProduct = {
        id: maxId + 1,
        name, 
        type, 
        price, 
        icon, 
        img, 
        desc
    };
    
    products.push(newProduct);
    localStorage.setItem('productsDB', JSON.stringify(products));
    
    loadManageProducts(); // Refresh the table
    
    alert(`Success! "${name}" has been added to the shop.`);
    e.target.reset(); // clear form
});

// ---------------- MANAGE PRODUCTS TABLE LOGIC ----------------
function loadManageProducts() {
    const tableBody = document.getElementById('productsTableBody');
    const productCount = document.getElementById('productCount');

    let productsJSON = localStorage.getItem('productsDB');
    let products = productsJSON ? JSON.parse(productsJSON) : [];

    if (productCount) {
        productCount.textContent = `${products.length} Product${products.length !== 1 ? 's' : ''}`;
    }
    
    if (tableBody) {
        tableBody.innerHTML = '';
        products.forEach((p) => {
            const row = document.createElement('tr');
            
            // By default, if inStock isn't explicitly false, it's considered true
            let isInStock = p.inStock !== false;
            let stockBadge = isInStock ? '<span class="status-badge approved">In Stock</span>' : '<span class="status-badge cancelled">Out of Stock</span>';
            let toggleBtnText = isInStock ? '<i class="fas fa-ban"></i> Out of Stock' : '<i class="fas fa-check"></i> In Stock';

            row.innerHTML = `
                <td>${p.id}</td>
                <td><strong>${escapeHTML(p.name)}</strong></td>
                <td>${p.price} TND</td>
                <td>${stockBadge}</td>
                <td>
                    <button class="btn-logout" style="padding: 6px 10px; font-size: 12px; display: inline-block; margin-right: 8px;" onclick="toggleStock(${p.id})" title="Toggle Stock">
                        ${toggleBtnText}
                    </button>
                    <button class="action-btn" onclick="deleteShopProduct(${p.id})" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

function deleteShopProduct(id) {
    if(confirm('Are you sure you want to permanently delete this product from the shop?')) {
        let productsJSON = localStorage.getItem('productsDB');
        if (productsJSON) {
            let products = JSON.parse(productsJSON);
            products = products.filter(p => p.id !== id);
            localStorage.setItem('productsDB', JSON.stringify(products));
            loadManageProducts();
        }
    }
}

function toggleStock(id) {
    let productsJSON = localStorage.getItem('productsDB');
    if (productsJSON) {
        let products = JSON.parse(productsJSON);
        let product = products.find(p => p.id === id);
        if (product) {
            product.inStock = (product.inStock === false) ? true : false;
            localStorage.setItem('productsDB', JSON.stringify(products));
            loadManageProducts();
        }
    }
}
