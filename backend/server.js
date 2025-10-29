const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path'); 
const app = express();

const db = new sqlite3.Database('/tmp/data.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Terkoneksi ke database SQLite.');
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                password TEXT,
                status TEXT
            )`, () => {
                const initialUsers = [
                    ['standard_user', 'secret_sauce', 'active'],
                    ['locked_out_user', 'secret_sauce', 'locked'],
                    ['problem_user', 'secret_sauce', 'active'],
                    ['performance_glitch_user', 'secret_sauce', 'active']
                ];
                const stmt = db.prepare("INSERT OR IGNORE INTO users (username, password, status) VALUES (?, ?, ?)");
                initialUsers.forEach(user => stmt.run(user));
                stmt.finalize();
            });

            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                price REAL,
                desc TEXT
            )`, () => {
                const INITIAL_PRODUCTS = [
                    { name: "Sauce Labs Backpack", price: 29.99, desc: "Tas yang bagus dan serbaguna." },
                    { name: "Sauce Labs Bike Light", price: 9.99, desc: "Lampu sepeda yang sangat terang." },
                    { name: "Sauce Labs Bolt T-Shirt", price: 15.99, desc: "Kaos katun lembut, desain logo." },
                    { name: "Sauce Labs Fleece Jacket", price: 49.99, desc: "Jaket fleece hangat untuk segala cuaca." },
                    { name: "Sauce Labs Onesie", price: 7.99, desc: "Pakaian bayi lucu dan nyaman." },
                    { name: "Sauce Labs T-Shirt (Red)", price: 15.99, desc: "Kaos katun lembut, warna merah menyala." }
                ];
                const stmt = db.prepare("INSERT OR IGNORE INTO products (name, price, desc) VALUES (?, ?, ?)");
                INITIAL_PRODUCTS.forEach(p => stmt.run(p.name, p.price, p.desc));
                stmt.finalize();
            });

            db.run(`CREATE TABLE IF NOT EXISTS carts (
                user_id INTEGER,
                product_id INTEGER,
                qty INTEGER,
                FOREIGN KEY(user_id) REFERENCES users(id)
            )`);
        });
    }
});

app.use(cors()); 
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return next(); 
    }
    
    const filePath = path.join(__dirname, '..', 'frontend', req.originalUrl);
    res.sendFile(filePath, (err) => {
        if (err && req.originalUrl !== '/') {
            res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
        } else if (req.originalUrl === '/') {
            res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
        }
    });
});

const getUserIdByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
            if (err) return reject(err);
            resolve(row ? row.id : null);
        });
    });
};

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (username === 'performance_glitch_user') {
        console.log('Simulating performance delay...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
        if (err) {
            return res.status(500).json({ message: "Error server database." });
        }
        if (!row) {
            return res.status(401).json({ message: "Epic sadface: Username and password do not match any user in our database." });
        }
        if (row.status === 'locked') {
            return res.status(403).json({ message: "Epic sadface: Sorry, this user has been locked out." });
        }

        res.json({ message: "Login successful", user: row.username });
    });
});

app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Error retrieving products." });
        }
        res.json(rows);
    });
});

app.get('/api/cart', async (req, res) => {
    const username = req.query.user;
    if (!username) return res.status(400).json({ message: "Username required." });

    try {
        const user_id = await getUserIdByUsername(username);
        if (!user_id) return res.json([]); 

        db.all("SELECT product_id as id, qty FROM carts WHERE user_id = ?", [user_id], (err, rows) => {
            if (err) return res.status(500).json({ message: "Error retrieving cart." });
            res.json(rows);
        });
    } catch (error) {
        res.status(500).json({ message: "Server error getting user ID." });
    }
});

app.post('/api/cart', async (req, res) => {
    const { user: username, cart } = req.body;
    if (!username) return res.status(400).json({ message: "Username required." });

    try {
        const user_id = await getUserIdByUsername(username);
        if (!user_id) return res.status(404).json({ message: "User not found." });

        db.serialize(() => {
            db.run("DELETE FROM carts WHERE user_id = ?", [user_id], (err) => {
                if (err) {
                    console.error("Error deleting old cart:", err);
                    return res.status(500).json({ message: "Error updating cart." });
                }

                if (cart && cart.length > 0) {
                    const stmt = db.prepare("INSERT INTO carts (user_id, product_id, qty) VALUES (?, ?, ?)");
                    cart.forEach(item => stmt.run(user_id, item.id, item.qty));
                    stmt.finalize((err) => {
                        if (err) {
                             console.error("Error inserting new cart items:", err);
                             return res.status(500).json({ message: "Error updating cart." });
                        }
                        res.json({ message: "Cart saved successfully." });
                    });
                } else {
                    res.json({ message: "Cart cleared and saved successfully." });
                }
            });
        });

    } catch (error) {
        res.status(500).json({ message: "Server error during cart save." });
    }
});

app.delete('/api/cart', async (req, res) => {
    const username = req.query.user;
    if (!username) return res.status(400).json({ message: "Username required." });

    try {
        const user_id = await getUserIdByUsername(username);
        if (!user_id) return res.status(404).json({ message: "User not found." });

        db.run("DELETE FROM carts WHERE user_id = ?", [user_id], (err) => {
            if (err) return res.status(500).json({ message: "Error clearing cart." });
            res.json({ message: "Cart cleared successfully." });
        });
    } catch (error) {
        res.status(500).json({ message: "Server error during cart clear." });
    }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
