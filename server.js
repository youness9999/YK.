const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());
// Serve static files so you can just run the server and access the HTML
app.use(express.static(__dirname));

// Default data structure
const defaultData = {
    users: [],
    orders: [],
    products: [
        { id: 1, name: 'NVIDIA RTX 4090 GPU', type: 'GPU', price: 1599, icon: 'fa-microchip', img: '', desc: 'The ultimate GPU for 4K gaming and 3D rendering.', inStock: true },
        { id: 2, name: 'RTX 5090 TUF gaming OC', type: 'GPU', price: 2000, icon: 'fa-microchip', img: '', desc: 'The best gameplay in ultra graphics with this GPU.', inStock: true },
        { id: 8, name: 'AMD Ryzen 9 7950X CPU', type: 'CPU', price: 599, icon: 'fa-memory', img: '', desc: '16 cores of pure processing power for enthusiasts.', inStock: true },
        { id: 14, name: 'Corsair Vengeance 32GB RAM', type: 'RAM', price: 149, icon: 'fa-sd-card', img: '', desc: 'Blazing fast DDR5 memory kit.', inStock: true },
        { id: 20, name: 'ASUS ROG Z790 Motherboard', type: 'Motherboard', price: 499, icon: 'fa-server', img: '', desc: 'Premium motherboard for extreme overclocking.', inStock: true },
        { id: 26, name: 'Samsung 990 PRO 2TB NVMe', type: 'Storage', price: 169, icon: 'fa-hdd', img: '', desc: 'PCIe 4.0 NVMe SSD for lightning fast load times.', inStock: true },
        { id: 32, name: 'EVGA SuperNOVA 1000G T2', type: 'PSU', price: 249, icon: 'fa-plug', img: '', desc: 'Titanium certified power supply for stable performance.', inStock: true },
        { id: 38, name: 'NZXT Kraken Elite 360', type: 'Cooler', price: 279, icon: 'fa-fan', img: '', desc: 'AIO Liquid Cooler with customizable LCD screen.', inStock: true },
        { id: 44, name: 'Lian Li O11 Dynamic EVO', type: 'Case', price: 159, icon: 'fa-box', img: '', desc: 'Stunning tempered glass mid-tower chassis.', inStock: true }
    ]
};

// Helper to read database
function readDB() {
    if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 4));
        return defaultData;
    }
    const data = fs.readFileSync(DB_FILE);
    return JSON.parse(data);
}

// Helper to write database
function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 4));
}

// --- USERS API ---
app.get('/api/users', (req, res) => {
    const db = readDB();
    res.json(db.users);
});

app.post('/api/users', (req, res) => {
    const db = readDB();
    const newUser = req.body;
    
    const userExists = db.users.some(u => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (userExists) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    db.users.push(newUser);
    writeDB(db);
    res.json(newUser);
});

app.delete('/api/users/:index', (req, res) => {
    const db = readDB();
    db.users.splice(req.params.index, 1);
    writeDB(db);
    res.json({ success: true });
});

// --- PRODUCTS API ---
app.get('/api/products', (req, res) => {
    const db = readDB();
    res.json(db.products);
});

app.post('/api/products', (req, res) => {
    const db = readDB();
    const newProduct = req.body;
    db.products.push(newProduct);
    writeDB(db);
    res.json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    const updates = req.body;
    
    let productIndex = db.products.findIndex(p => p.id === id);
    if (productIndex !== -1) {
        db.products[productIndex] = { ...db.products[productIndex], ...updates };
        writeDB(db);
        res.json(db.products[productIndex]);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

app.delete('/api/products/:id', (req, res) => {
    const db = readDB();
    const id = parseInt(req.params.id);
    db.products = db.products.filter(p => p.id !== id);
    writeDB(db);
    res.json({ success: true });
});

// --- ORDERS API ---
app.get('/api/orders', (req, res) => {
    const db = readDB();
    res.json(db.orders);
});

app.post('/api/orders', (req, res) => {
    const db = readDB();
    const newOrder = req.body;
    db.orders.push(newOrder);
    writeDB(db);
    res.json(newOrder);
});

app.put('/api/orders/:index', (req, res) => {
    const db = readDB();
    const index = parseInt(req.params.index);
    if (db.orders[index]) {
        db.orders[index] = { ...db.orders[index], ...req.body };
        writeDB(db);
        res.json(db.orders[index]);
    } else {
        res.status(404).json({ error: 'Order not found' });
    }
});

app.delete('/api/orders/:index', (req, res) => {
    const db = readDB();
    db.orders.splice(req.params.index, 1);
    writeDB(db);
    res.json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Self-made database server running on http://localhost:${PORT}`);
    console.log(`Access your shop at http://localhost:${PORT}/index.html`);
});
