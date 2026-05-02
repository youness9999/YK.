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

async function loadUsers() {
    const tableBody = document.getElementById('usersTableBody');
    const emptyState = document.getElementById('emptyState');
    const tableResponsive = document.querySelector('.table-responsive');
    const userCount = document.getElementById('userCount');

    // Fetch from Firebase
    let users = [];
    try {
        const snapshot = await db.collection('users').get();
        users = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('Error fetching users:', e);
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
                <button class="action-btn" onclick="deleteUser('${user.firebaseId}')" title="Delete User">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Gives admin the ability to remove users
window.deleteUser = async function(firebaseId) {
    if(confirm('Are you sure you want to delete this user?')) {
        try {
            await db.collection('users').doc(firebaseId).delete();
            loadUsers(); // Refresh table view immediately
        } catch (e) {
            alert('Failed to delete user.');
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
async function loadOrders() {
    const tableBody = document.getElementById('ordersTableBody');
    const emptyState = document.getElementById('orderEmptyState');
    const tableResponsive = document.querySelectorAll('.table-responsive')[1]; // second table
    const orderCount = document.getElementById('orderCount');

    // Fetch from Firebase
    let orders = [];
    try {
        const snapshot = await db.collection('orders').get();
        orders = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('Error fetching orders:', e);
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
                <button class="btn-approve" onclick="approveOrder('${order.firebaseId}')" title="Approve Request">
                    <i class="fas fa-check"></i> Approve
                </button>
            `;
        }
        
        actionButtons += `
            <button class="action-btn" onclick="deleteOrder('${order.firebaseId}')" title="Delete Order">
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

window.approveOrder = async function(firebaseId) {
    if(confirm('Approve this purchase request?')) {
        try {
            await db.collection('orders').doc(firebaseId).update({ status: 'Approved' });
            loadOrders(); // Refresh table view
        } catch (e) {
            alert('Failed to approve order.');
        }
    }
}

window.deleteOrder = async function(firebaseId) {
    if(confirm('Are you sure you want to delete this order request?')) {
        try {
            await db.collection('orders').doc(firebaseId).delete();
            loadOrders(); // Refresh table view
        } catch (e) {
            alert('Failed to delete order.');
        }
    }
}

// ---------------- PRODUCTS LOGIC ----------------
document.getElementById('addProductForm').addEventListener('submit', async (e) => {
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

    try {
        const snapshot = await db.collection('products').get();
        let products = snapshot.docs.map(doc => doc.data());
        
        let maxId = 0;
        products.forEach(p => { if(p.id > maxId) maxId = p.id; });
        if(maxId === 0) maxId = 50; 
        
        const newProduct = {
            id: maxId + 1,
            name, 
            type, 
            price, 
            icon, 
            img, 
            desc,
            inStock: true
        };
        
        await db.collection('products').add(newProduct);
        
        loadManageProducts(); // Refresh the table
        
        alert(`Success! "${name}" has been added to the shop.`);
        e.target.reset(); // clear form
    } catch (error) {
        alert('Failed to connect to Firebase database.');
    }
});

// ---------------- MANAGE PRODUCTS TABLE LOGIC ----------------
async function loadManageProducts() {
    const tableBody = document.getElementById('productsTableBody');
    const productCount = document.getElementById('productCount');

    let products = [];
    try {
        const snapshot = await db.collection('products').get();
        products = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
    } catch (e) {
        console.error('Failed to load products.');
    }

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
                    <button class="btn-logout" style="padding: 6px 10px; font-size: 12px; display: inline-block; margin-right: 8px;" onclick="toggleStock('${p.firebaseId}')" title="Toggle Stock">
                        ${toggleBtnText}
                    </button>
                    <button class="action-btn" onclick="deleteShopProduct('${p.firebaseId}')" title="Delete Product">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
}

window.deleteShopProduct = async function(firebaseId) {
    if(confirm('Are you sure you want to permanently delete this product from the shop?')) {
        try {
            await db.collection('products').doc(firebaseId).delete();
            loadManageProducts();
        } catch (error) {
            alert('Failed to connect to Firebase database.');
        }
    }
}

window.toggleStock = async function(firebaseId) {
    try {
        // Fetch current product state
        const docRef = db.collection('products').doc(firebaseId);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
            const product = docSnap.data();
            const newStockState = (product.inStock === false) ? true : false;
            
            await docRef.update({ inStock: newStockState });
            loadManageProducts();
        }
    } catch (error) {
        alert('Failed to connect to Firebase database.');
    }
}
