import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import './Shop.css';

export default function Shop() {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState('');
  const [isLightMode, setIsLightMode] = useState(false);
  
  // Products & Filters
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortOrder, setSortOrder] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart & Wishlist
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [wishlist, setWishlist] = useState([]);
  
  // Toast
  const [toast, setToast] = useState({ message: '', type: '', visible: false });

  // Modals
  const [detailsModal, setDetailsModal] = useState({ visible: false, product: null });
  const [checkoutModal, setCheckoutModal] = useState({ visible: false, product: null });
  
  // Checkout Form
  const [formData, setFormData] = useState({ name: '', phone: '', address: '', quantity: 1, payment: 'Credit Card' });

  useEffect(() => {
    const user = localStorage.getItem('loggedInUser');
    if (!user) {
      navigate('/');
    } else {
      setLoggedInUser(user);
    }

    if (localStorage.getItem('theme') === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-mode');
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) setCart(JSON.parse(savedCart));

    fetchProducts();
    if (user) {
      fetchWishlist(user);
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const fetchWishlist = async (username) => {
    try {
      const q = query(collection(db, 'wishlists'), where('user', '==', username));
      const snap = await getDocs(q);
      setWishlist(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(err) {
      console.error("Failed to load wishlist", err);
    }
  };

  const toggleWishlist = async (product) => {
    const existing = wishlist.find(w => w.productId === product.firebaseId);
    if (existing) {
      try {
        await deleteDoc(doc(db, 'wishlists', existing.id));
        setWishlist(wishlist.filter(w => w.id !== existing.id));
        showToast('Removed from wishlist');
      } catch(e) { console.error(e); }
    } else {
      try {
        const docRef = await addDoc(collection(db, 'wishlists'), {
          user: loggedInUser,
          productId: product.firebaseId,
          product: product
        });
        setWishlist([...wishlist, { id: docRef.id, user: loggedInUser, productId: product.firebaseId, product }]);
        showToast('Added to wishlist', 'success');
      } catch(e) { console.error(e); }
    }
  };

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.firebaseId === product.firebaseId);
      if (existing) {
        return prev.map(item => item.firebaseId === product.firebaseId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} added to cart!`, 'success');
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.firebaseId !== id));
  };

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
    setIsLightMode(!isLightMode);
  };

  const handleLogout = () => {
    localStorage.removeItem('loggedInUser');
    navigate('/');
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const prods = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      setProducts(prods);
    } catch (err) {
      console.error(err);
      showToast('Failed to load products', 'error');
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast({ message: '', type: '', visible: false }), 3000);
  };

  // Filter & Sort Logic
  let filtered = [...products];
  
  if (searchQuery) {
    filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.desc && p.desc.toLowerCase().includes(searchQuery.toLowerCase())));
  }

  if (category !== 'all') filtered = filtered.filter(p => p.type === category);
  
  if (priceRange === 'under100') filtered = filtered.filter(p => p.price < 100);
  else if (priceRange === '100to300') filtered = filtered.filter(p => p.price >= 100 && p.price <= 300);
  else if (priceRange === '300to600') filtered = filtered.filter(p => p.price > 300 && p.price <= 600);
  else if (priceRange === 'over600') filtered = filtered.filter(p => p.price > 600);

  if (sortOrder === 'priceLowHigh') filtered.sort((a, b) => a.price - b.price);
  else if (sortOrder === 'priceHighLow') filtered.sort((a, b) => b.price - a.price);

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    const digitsOnly = formData.phone.replace(/[^0-9]/g, '');
    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
    
    if (!phoneRegex.test(formData.phone) || digitsOnly.length < 8) {
      alert("Please enter a valid phone number (minimum 8 digits).");
      return;
    }

    // Calculate total from cart or direct checkout
    const items = isCartOpen ? cart : [{ ...checkoutModal.product, quantity: formData.quantity }];
    const total = items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

    const newOrder = {
      id: 'ORD-' + Math.floor(Math.random() * 1000000),
      user: loggedInUser,
      items: items.map(item => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: total,
      status: 'Pending',
      date: new Date().toLocaleDateString(),
      customerName: formData.name,
      phone: formData.phone,
      address: formData.address,
      paymentMethod: formData.payment
    };

    try {
      await addDoc(collection(db, 'orders'), newOrder);
      setCheckoutModal({ visible: false, product: null });
      setIsCartOpen(false);
      if (isCartOpen) setCart([]);
      setFormData({ name: '', phone: '', address: '', quantity: 1, payment: 'Credit Card' });
      showToast(`Order placed successfully!`, 'success');
    } catch (err) {
      showToast('Failed to connect to Firebase database.', 'error');
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-content">
          <div className="logo"><i className="fas fa-microchip"></i> YK Tech Shop</div>
          <div className="nav-right">
            <button className="btn-logout" title="Toggle Theme" onClick={toggleTheme}>
              <i className={`fas ${isLightMode ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <span className="nav-user">Hello, <strong>{loggedInUser}</strong></span>
            <button className="btn-logout" onClick={handleLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
            <button className="btn-purchases" onClick={() => navigate('/profile')}><i className="fas fa-user-circle"></i> Profile</button>
            <button className="btn-purchases" style={{ background: 'var(--success)' }} onClick={() => setIsCartOpen(true)}>
              <i className="fas fa-shopping-cart"></i> Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
          </div>
        </div>
      </nav>

      <main className="shop-container">
        <header className="shop-header">
          <h1>Premium PC Components</h1>
          <p>Upgrade your battle station with our top-tier hardware.</p>
        </header>

        <div className="filters-container">
          <div className="search-bar-container" style={{ width: '100%', maxWidth: '600px', marginBottom: '20px', position: 'relative' }}>
            <input 
              type="text" 
              className="price-select" 
              style={{ width: '100%', padding: '12px 20px', paddingLeft: '45px', fontSize: '16px' }}
              placeholder="Search components..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <i className="fas fa-search" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          </div>

          <div className="category-filters">
            {['all', 'GPU', 'CPU', 'RAM', 'Motherboard', 'Storage', 'PSU', 'Cooler', 'Case'].map(cat => (
              <button 
                key={cat} 
                className={`btn-filter ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          <div className="price-filter-container">
            <select className="price-select" value={priceRange} onChange={e => setPriceRange(e.target.value)}>
              <option value="all">All Prices</option>
              <option value="under100">Under 100 TND</option>
              <option value="100to300">100 TND - 300 TND</option>
              <option value="300to600">300 TND - 600 TND</option>
              <option value="over600">Over 600 TND</option>
            </select>
            <select className="price-select" style={{ marginLeft: '12px' }} value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="default">Default Sort</option>
              <option value="priceLowHigh">Price: Low to High</option>
              <option value="priceHighLow">Price: High to Low</option>
            </select>
          </div>
        </div>

        <motion.div layout className="products-grid">
          <AnimatePresence>
          {filtered.map((p, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.5)", borderColor: "rgba(99, 102, 241, 0.5)" }}
              key={p.firebaseId || idx} 
              className="product-card"
            >
              <button 
                onClick={() => toggleWishlist(p)}
                style={{ 
                  position: 'absolute', top: '15px', right: '15px', 
                  background: 'rgba(0,0,0,0.5)', border: 'none', 
                  color: wishlist.some(w => w.productId === p.firebaseId) ? '#ef4444' : 'rgba(255,255,255,0.5)', 
                  fontSize: '20px', cursor: 'pointer', zIndex: 10,
                  width: '36px', height: '36px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: '0.3s'
                }}
              >
                <i className="fas fa-heart"></i>
              </button>
              {p.img ? (
                <div className="product-image-container">
                  <img src={p.img} alt={p.name} className="product-image" />
                </div>
              ) : (
                <i className={`fas ${p.icon} product-icon`}></i>
              )}
              <h3 className="product-title">{p.name}</h3>
              <p className="product-desc" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.desc}</p>
              <div className="product-price">{p.price} TND</div>
              
              {p.inStock !== false ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                  <button className="btn-buy" style={{ flex: 1, background: 'rgba(128,128,128,0.2)', color: 'var(--text-color)' }} onClick={() => setDetailsModal({ visible: true, product: p })}>
                    <i className="fas fa-info-circle"></i> Details
                  </button>
                  <button className="btn-buy" style={{ flex: 1 }} onClick={() => addToCart(p)}>
                    <i className="fas fa-plus"></i> Cart
                  </button>
                </div>
              ) : (
                <button className="btn-buy" disabled style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-muted)', cursor: 'not-allowed', width: '100%', marginTop: 'auto' }}>
                  <i className="fas fa-ban"></i> Out of Stock
                </button>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      </main>

      {/* Slide-out Cart */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="modal-overlay" 
              onClick={() => setIsCartOpen(false)}
              style={{ zIndex: 1000 }}
            ></motion.div>
            
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="cart-drawer"
            >
              <div className="cart-header">
                <h2>Your Cart</h2>
                <button className="action-btn" onClick={() => setIsCartOpen(false)}><i className="fas fa-times"></i></button>
              </div>
              
              <div className="cart-items">
                {cart.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '40px' }}>Your cart is empty.</p>
                ) : (
                  cart.map(item => (
                    <div key={item.firebaseId} className="cart-item">
                      <div className="cart-item-info">
                        <h4>{item.name}</h4>
                        <p>{item.price} TND x {item.quantity}</p>
                      </div>
                      <div className="cart-item-actions">
                        <button className="btn-filter" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => removeFromCart(item.firebaseId)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {cart.length > 0 && (
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span>{cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2)} TND</span>
                  </div>
                  <button className="btn-buy" style={{ width: '100%' }} onClick={() => {
                    setCheckoutModal({ visible: true, product: { name: 'Cart Order' } });
                  }}>
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      {detailsModal.visible && detailsModal.product && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setDetailsModal({ visible: false, product: null })}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{detailsModal.product.name}</h2>
              <button className="action-btn" onClick={() => setDetailsModal({ visible: false, product: null })}><i className="fas fa-times"></i></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {detailsModal.product.img ? (
                <img src={detailsModal.product.img} alt={detailsModal.product.name} style={{ width: '100%', maxHeight: '250px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(0,0,0,0.1)', padding: '10px' }} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                  <i className={`fas ${detailsModal.product.icon}`} style={{ fontSize: '80px', color: 'var(--primary)' }}></i>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}><i className="fas fa-tag"></i> Category: {detailsModal.product.type}</span>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--success)' }}>{detailsModal.product.price} TND</span>
              </div>
              <p style={{ marginTop: '15px', lineHeight: '1.6', fontSize: '16px' }}>{detailsModal.product.desc}</p>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn-buy" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => {
                setCheckoutModal({ visible: true, product: detailsModal.product });
                setDetailsModal({ visible: false, product: null });
              }}>
                <i className="fas fa-shopping-cart"></i> Buy Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutModal.visible && checkoutModal.product && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && setCheckoutModal({ visible: false, product: null })}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Complete Your Order</h2>
              <button className="action-btn" onClick={() => setCheckoutModal({ visible: false, product: null })}><i className="fas fa-times"></i></button>
            </div>
            <form onSubmit={handleCheckoutSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" required placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="tel" required placeholder="+1 234 567 8900" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Shipping Address</label>
                <textarea required placeholder="123 Main St, City, Country" rows="3" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
              </div>
              <div className="form-group" style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1fr' : '1fr 1fr', gap: '15px' }}>
                {!isCartOpen && (
                  <div>
                    <label>Quantity</label>
                    <input type="number" min="1" max="99" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} />
                  </div>
                )}
                <div>
                  <label>Payment Method</label>
                  <select required value={formData.payment} onChange={e => setFormData({...formData, payment: e.target.value})}>
                    <option value="Credit Card">Credit Card</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Cash on Delivery">Cash on Delivery</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-buy" style={{ width: '100%', marginTop: '10px' }}>
                Confirm Purchase ({isCartOpen 
                  ? cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0).toFixed(2) 
                  : (parseFloat(checkoutModal.product.price) * formData.quantity).toFixed(2)} TND)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      <div className={`toast ${toast.type} ${toast.visible ? 'show' : ''}`}>
        {toast.message}
      </div>
    </>
  );
}
