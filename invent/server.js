import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const app = express();
const PORT = 3000;

app.use(express.json());

const dataDir = path.join(process.cwd(), 'data');
const productsFilePath = path.join(dataDir, 'products.json');


const readProducts = async () => {
    try {
        const data = await fs.readFile(productsFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return []; 
    }
};


const writeProducts = async (data) => {
    await fs.mkdir(dataDir, { recursive: true }); 
    await fs.writeFile(productsFilePath, JSON.stringify(data, null, 2));
};

// 1. CREATE:
app.post('/products', async (req, res) => {
    const { name, price, quantity } = req.body;
    if (!name || price === undefined || quantity === undefined) {
        return res.status(400).json({ message: 'Name, price, aur quantity are mandator' });
    }
    const products = await readProducts();
    const newProduct = { 
        id: crypto.randomUUID(), 
        name, 
        price: parseFloat(price),
        quantity: parseInt(quantity, 10) 
    };
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json(newProduct);
});

// 2. READ:
app.get('/products', async (req, res) => {
    const products = await readProducts();
    res.json(products);
});

// 3. UPDATE: 
app.put('/products/:id', async (req, res) => {
    const { id } = req.params;
    const products = await readProducts();
    const productIndex = products.findIndex(p => p.id === id);

    if (productIndex === -1) {
        return res.status(404).json({ message: 'Product not found' });
    }

    products[productIndex] = { ...products[productIndex], ...req.body };
    
    if (req.body.price !== undefined) {
        products[productIndex].price = parseFloat(req.body.price);
    }
    if (req.body.quantity !== undefined) {
        products[productIndex].quantity = parseInt(req.body.quantity, 10);
    }

    await writeProducts(products);
    res.json(products[productIndex]);
});

// 4. DELETE:
app.delete('/products/:id', async (req, res) => {
    const { id } = req.params;
    const products = await readProducts();
    const updatedProducts = products.filter(p => p.id !== id);

    if (products.length === updatedProducts.length) {
        return res.status(404).json({ message: 'Product not found' });
    }

    await writeProducts(updatedProducts);
    res.status(200).json({ message: 'Product deleted' });
});


app.listen(PORT, () => {
    console.log(` serverstarted on http://localhost:${PORT}`);
});