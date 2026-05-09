import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  
  // New Product Form
  const [newProduct, setNewProduct] = useState({ name: '', price: '', type: 'GPU', desc: '', inStock: true });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const prodsSnap = await getDocs(collection(db, 'products'));
      
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(prodsSnap.docs.map(d => ({ firebaseId: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching data: ", err);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'products'), {
        ...newProduct,
        price: parseFloat(newProduct.price),
        icon: 'fa-microchip', // Default icon
      });
      setNewProduct({ name: '', price: '', type: 'GPU', desc: '', inStock: true });
      fetchData();
      alert('Product added successfully!');
    } catch (err) {
      console.error(err);
      alert('Error adding product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id));
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Analytics Calculations
  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total) || parseFloat(order.price) || 0), 0);
  
  // Group orders by date for chart
  const chartDataMap = {};
  orders.forEach(o => {
    const d = o.date || 'Unknown';
    chartDataMap[d] = (chartDataMap[d] || 0) + (parseFloat(o.total) || parseFloat(o.price) || 0);
  });
  const chartData = Object.keys(chartDataMap).map(key => ({ date: key, revenue: chartDataMap[key] }));

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <i className="fas fa-shield-alt"></i> Admin Panel
        </div>
        <ul className="admin-menu">
          <li className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <i className="fas fa-chart-line"></i> Dashboard
          </li>
          <li className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <i className="fas fa-shopping-cart"></i> Orders
          </li>
          <li className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
            <i className="fas fa-box"></i> Inventory
          </li>
          <li onClick={() => navigate('/shop')} style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
            <i className="fas fa-arrow-left"></i> Back to Shop
          </li>
        </ul>
      </aside>

      <main className="admin-content">
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-dashboard">
            <h2>Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <i className="fas fa-money-bill-wave stat-icon text-success"></i>
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p>{totalRevenue.toFixed(2)} TND</p>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-shopping-bag stat-icon text-primary"></i>
                <div className="stat-info">
                  <h3>Total Orders</h3>
                  <p>{orders.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <i className="fas fa-boxes stat-icon text-warning"></i>
                <div className="stat-info">
                  <h3>Products Available</h3>
                  <p>{products.length}</p>
                </div>
              </div>
            </div>

            <div className="chart-container">
              <h3>Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2>Recent Orders</h2>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total (TND)</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td>{o.id}</td>
                      <td>{o.customerName || o.user}</td>
                      <td>{o.date}</td>
                      <td>{(parseFloat(o.total) || parseFloat(o.price)).toFixed(2)}</td>
                      <td><span className={`badge ${o.status?.toLowerCase() || 'pending'}`}>{o.status || 'Pending'}</span></td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No orders found.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2>Inventory Management</h2>
            </div>
            
            <div className="add-product-form">
              <h3>Add New Product</h3>
              <form onSubmit={handleAddProduct} className="add-product-form-grid">
                <input type="text" placeholder="Product Name" required value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="admin-input" />
                <input type="number" placeholder="Price (TND)" required value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="admin-input" />
                <select value={newProduct.type} onChange={e => setNewProduct({...newProduct, type: e.target.value})} className="admin-input">
                  <option value="GPU">GPU</option>
                  <option value="CPU">CPU</option>
                  <option value="RAM">RAM</option>
                  <option value="Motherboard">Motherboard</option>
                  <option value="Storage">Storage</option>
                  <option value="PSU">PSU</option>
                  <option value="Case">Case</option>
                </select>
                <input type="text" placeholder="Description" required value={newProduct.desc} onChange={e => setNewProduct({...newProduct, desc: e.target.value})} className="admin-input" />
                <button type="submit" className="admin-btn-primary" style={{ gridColumn: 'span 2' }}>Add Product</button>
              </form>
            </div>

            <div className="table-responsive" style={{ marginTop: '30px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.firebaseId}>
                      <td>{p.name}</td>
                      <td>{p.type}</td>
                      <td>{p.price} TND</td>
                      <td>
                        <button className="admin-btn-danger" onClick={() => handleDeleteProduct(p.firebaseId)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No products found.</td></tr>}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
