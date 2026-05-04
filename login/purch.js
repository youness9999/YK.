document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (!loggedInUser) {
        window.location.href = 'index.html';
        return;
    }
    
    const welcomeUserEl = document.getElementById('welcomeUser');
    if (welcomeUserEl) {
        welcomeUserEl.innerHTML = `Hello, <strong>${loggedInUser}</strong>`;
    }
    
    document.getElementById('profileName').textContent = loggedInUser;
    document.getElementById('profileAvatar').textContent = loggedInUser.charAt(0).toUpperCase();
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            window.location.href = 'index.html';
        });
    }

    loadMyOrders();
});

async function loadMyOrders() {
    const loggedInUser = localStorage.getItem('loggedInUser');
    const emptyState = document.getElementById('orderEmptyState');
    const grid = document.getElementById('productsGrid');
    
    grid.innerHTML = '';
    
    try {
        // Get orders from Firebase
        const snapshot = await db.collection('orders').get();
        const allOrders = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
        
        // Filter orders for current user and hide cancelled ones
        const userOrders = allOrders.filter(order => order.user === loggedInUser && order.status !== 'Cancelled');
    
    if (userOrders.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        userOrders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let cancelBtn = '';
            if (order.status === 'Pending') {
                cancelBtn = `
                    <button style="margin-top: 15px; width: 100%; padding: 10px; border-radius: 8px; cursor: pointer; border: none; font-weight: bold; background: rgba(239, 68, 68, 0.8); color: white; transition: 0.3s;" 
                            onmouseover="this.style.background='rgba(239, 68, 68, 1)'" 
                            onmouseout="this.style.background='rgba(239, 68, 68, 0.8)'" 
                            onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-times-circle"></i> Cancel Request
                    </button>
                `;
            }

            let statusColor = 'var(--success)';
            let statusBg = 'rgba(16,185,129,0.1)';
            
            if (order.status === 'Pending') {
                statusColor = '#f59e0b'; // warning/orange
                statusBg = 'rgba(245, 158, 11, 0.1)';
            } else if (order.status === 'Cancelled') {
                statusColor = '#ef4444'; // danger/red
                statusBg = 'rgba(239, 68, 68, 0.1)';
            }

            let extraDetails = order.paymentMethod ? `
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 10px; text-align: left; background: rgba(0,0,0,0.2); padding: 10px; border-radius: 6px;">
                    <div><i class="fas fa-map-marker-alt" style="width: 15px;"></i> ${order.address}</div>
                    <div style="margin-top: 5px;"><i class="fas fa-credit-card" style="width: 15px;"></i> ${order.paymentMethod}</div>
                </div>
            ` : '';

            card.innerHTML = `
                <div style="font-size: 40px; margin-bottom: 15px; color: var(--success);">
                    <i class="fas fa-box-open"></i>
                </div>
                <h3 class="product-title">${order.product} (x${order.quantity || 1})</h3>
                <p class="product-desc" style="margin-bottom: 8px;">Order ID: ${order.id}</p>
                <p class="product-desc">Date: ${order.date}</p>
                <div class="product-price">${order.price} TND</div>
                ${extraDetails}
                <div style="margin-top: 15px; padding: 8px; background: ${statusBg}; border: 1px solid ${statusColor}; border-radius: 8px; color: ${statusColor}; font-weight: bold;">
                    Status: ${order.status}
                </div>
                ${cancelBtn}
            `;
            grid.appendChild(card);
        });
    }
    } catch (error) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = '<p style="color: var(--danger);">Failed to load orders. Make sure the Node.js server is running.</p>';
    }
}

window.cancelOrder = async function(orderId) {
    if(confirm('Are you sure you want to cancel this pending order request?')) {
        try {
            const snapshot = await db.collection('orders').get();
            const orders = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
            
            const orderToCancel = orders.find(o => o.id === orderId);
            if (orderToCancel) {
                await db.collection('orders').doc(orderToCancel.firebaseId).update({ status: 'Cancelled' });
                loadMyOrders(); // Re-render the orders grid instantly
            }
        } catch (error) {
            alert('Failed to connect to Firebase database.');
        }
    }
};