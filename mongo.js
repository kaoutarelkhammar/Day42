const express = require('express');
const { MongoClient } = require('mongodb');

const app = express();
const port = 3000;

// Custom logging middleware
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toLocaleString();
  const method = req.method;
  const url = req.url;
  const logMessage = `[${timestamp}] ${method} ${url}`;
  console.log(logMessage);
  next();
};

app.use(express.json());
app.use(express.static('public'));

// MongoDB connection setup
const url = 'mongodb://localhost:27017'; 
const dbName = 'dbtest'; 

const client = new MongoClient(url, { useUnifiedTopology: true });

client.connect().then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

const db = client.db(dbName);
const productsCollection = db.collection('products');
productsCollection.createIndex({ price: 1 }); // 1 indicates ascending order
// Add more index definitions as needed


// Migrate existing data to MongoDB (assuming you have 'products' array)
productsCollection.insertMany(products, (err, result) => {
  if (err) {
    console.error('Error inserting data into MongoDB:', err);
  } else {
    console.log(`Inserted ${result.insertedCount} products into MongoDB`);
  }
  // Remove the in-memory 'products' array
  products = [];
});

// Get all products from MongoDB
app.get('/products', (req, res) => {
  productsCollection.find({}).toArray((err, data) => {
    if (err) {
      console.error('Error fetching products from MongoDB:', err);
      res.status(500).json({ error: 'Failed to retrieve products' });
    } else {
      res.json(data);
    }
  });
});
 
//POST /products 
  app.post('/products', (req, res) => {
    const { name, price } = req.body;
  
    // Validate input
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }
  
    // Generate a unique ID for the new product
    const newProductId = products.length + 1;
  
    // Create the new product object
    const newProduct = {
      id: newProductId,
      name,
      price: parseFloat(price),
    };
  
    // Add the new product to the array
    products.push(newProduct);
  
    // Return the newly created product
    res.status(201).json(newProduct);
  });

  //PUT /products
  app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { name, price } = req.body;
  
    // Find the product to update
    const productIndex = products.findIndex((p) => p.id === productId);
  
    if (productIndex === -1) {
      // If the product is not found, return an error response
      res.status(404).json({ error: 'Product not found' });
    } else {
      // Update the product details
      products[productIndex].name = name || products[productIndex].name;
      products[productIndex].price = parseFloat(price) || products[productIndex].price;
  
      // Return the updated product
      res.json(products[productIndex]);
    }
  });
  
  //DELETE /products
  app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
  
    // Find the index of the product to delete
    const productIndex = products.findIndex((p) => p.id === productId);
  
    if (productIndex === -1) {
      // If the product is not found, return an error response
      res.status(404).json({ error: 'Product not found' });
    } else {
      // Remove the product from the array
      products.splice(productIndex, 1);
  
      // Return a success message
      res.json({ message: 'Product deleted successfully' });
    }
  });


// Error handling middleware
const errorHandlingMiddleware = (err, req, res, next) => {
  console.error(err);
  res.status(500).send('Sorry, something went wrong on our end.');
};

app.use(loggingMiddleware);
app.get('/error', (req, res, next) => {
  const err = new Error('This is a simulated error.');
  next(err);
});
app.use(errorHandlingMiddleware);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
