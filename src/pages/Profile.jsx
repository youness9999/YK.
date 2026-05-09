import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './Profile.css';
import { motion, AnimatePresence } from 'framer-motion';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'wishlist'

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedInUser');
    if (!loggedIn) {
      navigate('/');
    } else {
      setUser(loggedIn);
      fetchData(loggedIn);
    }
  }, [navigate]);

  const fetchData = async (username) => {
    setLoading(true);
    try {
      // Fetch Orders
      const qOrders = query(collection(db, 'orders'), where('user', '==', username));
      const snapOrders = await getDocs(qOrders);
      const userOrders = snapOrders.docs.map(d => ({ id: d.id, ...d.data() }));
      userOrders.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setOrders(userOrders);

      // Fetch Wishlist
      const qWishlist = query(collection(db, 'wishlists'), where('user', '==', username));
      const snapWishlist = await getDocs(qWishlist);
      setWishlist(snapWishlist.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      await deleteDoc(doc(db, 'wishlists', id));
      setWishlist(wishlist.filter(w => w.id !== id));
    } catch (err) {
      console.error(err);
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

        <div className="profile-tabs">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} 
            onClick={() => setActiveTab('orders')}
          >
            <i className="fas fa-box-open"></i> Order History
          </button>
          <button 
            className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`} 
            onClick={() => setActiveTab('wishlist')}
          >
            <i className="fas fa-heart"></i> My Wishlist
          </button>
        </div>

        <div className="tab-content">
          {loading ? (
            <p className="loading-text" style={{ textAlign: 'center', marginTop: '40px' }}>Loading your data...</p>
          ) : activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-shopping-basket"></i>
                <p>You haven't purchased anything yet.</p>
                <button className="btn-primary" onClick={() => navigate('/shop')}>Start Shopping</button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="orders-grid">
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
              </motion.div>
            )
          ) : (
            wishlist.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-heart-broken"></i>
                <p>Your wishlist is currently empty.</p>
                <button className="btn-primary" onClick={() => navigate('/shop')}>Explore Products</button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="wishlist-grid">
                <AnimatePresence>
                  {wishlist.map((item, idx) => {
                    const p = item.product || {};
                    return (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        key={item.id} 
                        className="wishlist-card"
                      >
                        <div className="wishlist-image-container">
                          {p.img ? (
                            <img src={p.img} alt={p.name} />
                          ) : (
                            <i className={`fas ${p.icon || 'fa-box'} fa-3x`}></i>
                          )}
                        </div>
                        <div className="wishlist-details">
                          <h4>{p.name || 'Unknown Product'}</h4>
                          <p className="wishlist-price">{p.price || 0} TND</p>
                        </div>
                        <div className="wishlist-actions">
                          <button className="btn-shop" style={{ flex: 1, justifyContent: 'center' }} onClick={() => navigate('/shop')}>
                            <i className="fas fa-eye"></i> View
                          </button>
                          <button className="btn-logout" style={{ padding: '8px 12px' }} onClick={() => removeFromWishlist(item.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )
          )}
        </div>
      </main>
    </div>
  );
}
