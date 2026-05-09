import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import './Profile.css';
import { motion } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedInUser');
    if (!loggedIn) {
      navigate('/');
    } else {
      setUser(loggedIn);
      fetchUserOrders(loggedIn);
    }
  }, [navigate]);

  const fetchUserOrders = async (username) => {
    try {
      const q = query(collection(db, 'orders'), where('user', '==', username));
      const snapshot = await getDocs(q);
      const userOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort by date or id to get latest first
      userOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setOrders(userOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/');
  };

  return (
    <div className="profile-container">
      <nav className="profile-nav">
        <div className="logo" onClick={() => navigate('/shop')} style={{cursor: 'pointer'}}>
          <i className="fas fa-microchip"></i> YK Tech Shop
        </div>
        <div className="nav-actions">
          <button className="btn-shop" onClick={() => navigate('/shop')}>
            <i className="fas fa-arrow-left"></i> Back to Shop
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </nav>

      <main className="profile-content">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="profile-header-card"
        >
          <div className="avatar-circle">
            <i className="fas fa-user"></i>
          </div>
          <div className="profile-info">
            <h2>{user}</h2>
            <p>Member Since 2026</p>
          </div>
        </motion.div>

        <div className="orders-section">
          <h3><i className="fas fa-box-open"></i> Your Purchase History</h3>
          
          {loading ? (
            <p className="loading-text">Loading your orders...</p>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-shopping-basket"></i>
              <p>You haven't purchased anything yet.</p>
              <button className="btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
            </div>
          ) : (
            <div className="orders-grid">
              {orders.map((order, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  key={order.id} 
                  className="order-card"
                >
                  <div className="order-header">
                    <span className="order-id">#{order.id.substring(0, 8)}</span>
                    <span className={`order-status ${order.status?.toLowerCase() || 'pending'}`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div className="order-body">
                    <div className="order-detail"><i className="fas fa-calendar"></i> Date: {order.date}</div>
                    <div className="order-detail"><i className="fas fa-truck"></i> Address: {order.address}</div>
                    
                    <div className="order-items">
                      <h4>Items:</h4>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, i) => (
                          <div key={i} className="item-row">
                            <span>{item.quantity}x {item.name}</span>
                            <span>{parseFloat(item.price).toFixed(2)} TND</span>
                          </div>
                        ))
                      ) : (
                        <div className="item-row">
                          <span>1x {order.product}</span>
                          <span>{parseFloat(order.price).toFixed(2)} TND</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="order-footer">
                    <span>Total:</span>
                    <span className="order-total">{(parseFloat(order.total) || parseFloat(order.price)).toFixed(2)} TND</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
