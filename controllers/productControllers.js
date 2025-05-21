const db = require('../db');

// Render all products
exports.getAllProducts = (req, res) => {
    const query = 'SELECT * FROM Products';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching data from the database.');
        }
        res.render('jewelry', { products: results }); 
    });
};

// Render the rings page 
exports.getRingsPage = (req, res) => {
    const query = `
        SELECT * FROM Products 
        WHERE categoryID = (SELECT categoryID FROM Category WHERE categoryName = 'Rings')
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching rings:', err);
            return res.status(500).send('An error occurred while fetching rings.');
        }
        res.render('rings', { products: results });
    });
};

// Render the earrings page
exports.getEarringsPage = (req, res) => {
    const query = `
        SELECT * FROM Products 
        WHERE categoryID = (SELECT categoryID FROM Category WHERE categoryName = 'Earrings')
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching earrings:', err);
            return res.status(500).send('An error occurred while fetching earrings.');
        }
        res.render('earrings', { products: results });
    });
};

// Render the necklace page
exports.getNecklacesPage = (req, res) => {
    const query = `
        SELECT * FROM Products 
        WHERE categoryID = (SELECT categoryID FROM Category WHERE categoryName = 'Necklaces')
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching necklaces:', err);
            return res.status(500).send('An error occurred while fetching necklaces.');
        }
        res.render('necklace', { products: results });
    });
};

//Bracelet
exports.getBraceletsPage = (req, res) => {
    const query = `
        SELECT * FROM Products 
        WHERE categoryID = (SELECT categoryID FROM Category WHERE categoryName = 'Bracelets')
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching rings:', err);
            return res.status(500).send('An error occurred while fetching rings.');
        }
        res.render('bracelets', { products: results });
    });
};

exports.renderProductDetail = (req, res) => {
    const productId = req.params.id;
    const user = req.session.user; // Get user from session

    const productQuery = 'SELECT * FROM Products WHERE productID = ?';
    const reviewQuery = `
        SELECT Reviews.*, Users.FirstName AS userName
        FROM Reviews
        JOIN Users ON Reviews.UserID = Users.UserID
        WHERE Reviews.productID = ?
    `;

    db.query(productQuery, [productId], (err, productResults) => {
        if (err) {
            console.error("Error fetching product:", err);
            return res.status(500).send("Error fetching product");
        }

        db.query(reviewQuery, [productId], (err, reviewResults) => {
            if (err) {
                console.error("Error fetching reviews:", err);
                return res.status(500).send("Error fetching reviews");
            }

            // Pass both product and reviews to EJS
            res.render('productDetail', { 
                product: productResults[0], 
                reviews: reviewResults, 
                isLoggedIn: !!user 
            });
        });
    });
};


// For admin
// Fetch all products
exports.getManageProductsPage = (req, res) => {
    const query = `
        SELECT p.*, c.categoryName 
        FROM Products p
        JOIN Category c ON p.categoryID = c.categoryID
        ORDER BY p.productID DESC
    `;
    db.query(query, (err, products) => {
        if (err) {
            console.error('Error fetching products:', err);
            return res.status(500).send('Error fetching products from the database.');
        }

        // Convert price to a number
        products.forEach(product => {
            product.price = parseFloat(product.price); // Ensure price is a number
        });

        const categoryQuery = 'SELECT * FROM Category';
        db.query(categoryQuery, (err, categories) => {
            if (err) {
                console.error('Error fetching categories:', err);
                return res.status(500).send('Error fetching categories from the database.');
            }

            res.render('manage_products', { products, categories });
        });
    });
};


// Handle adding a new product with image upload
exports.addProduct = (req, res) => {
    const { productName, categoryID, price, material, productDescription, Stock} = req.body;
    const productImg = req.file ? req.file.filename : ''; 

    const sql = 'INSERT INTO Products (productName, categoryID, price, material, productDescription, Stock, productImg) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [productName, categoryID, price, material, productDescription, Stock, productImg], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            return res.status(500).send('Error adding product to the database.');
        }
        res.redirect('/manage-products');
    });
};

exports.getEditProductPage = (req, res) => {
    const productID = req.params.id;

    const query = "SELECT * FROM Products WHERE productID = ?";
    db.query(query, [productID], (err, results) => {
        if (err) {
            console.error("Error fetching product for edit:", err);
            return res.status(500).send("Error fetching product.");
        }
        if (results.length === 0) {
            return res.status(404).send("Product not found.");
        }

        const categoryQuery = "SELECT * FROM Category";
        db.query(categoryQuery, (err, categories) => {
            if (err) {
                console.error("Error fetching categories:", err);
                return res.status(500).send("Error fetching categories.");
            }
            res.render("edit_product", { product: results[0], categories });
        });
    });
};

exports.updateProduct = (req, res) => {
    const productID = req.params.id;
    const { productName, categoryID, price, material, productDescription, Stock} = req.body;
    const productImg = req.file ? req.file.filename : req.body.existingImage; // Keep existing image if not updated

    const sql = `
        UPDATE Products 
        SET productName = ?, categoryID = ?, price = ?, material = ?, productDescription = ?, Stock = ?, productImg = ? 
        WHERE productID = ?
    `;

    db.query(sql, [productName, categoryID, price, material, productDescription, Stock, productImg, productID], (err, result) => {
        if (err) {
            console.error("Error updating product:", err);
            return res.status(500).send("Error updating product.");
        }
        res.redirect('/manage-products');
    });
};

exports.deleteProduct = (req, res) => {
    const productID = req.params.id;

    const sql = "DELETE FROM Products WHERE productID = ?";
    db.query(sql, [productID], (err, result) => {
        if (err) {
            console.error("Error deleting product:", err);
            return res.status(500).send("Error deleting product.");
        }
        res.redirect('/manage-products');
    });
};


// Render all categories
exports.getManageCategories = (req, res) => {
    const query = 'SELECT * FROM Category';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).send('Error fetching data from the database.');
        }
        res.render('manage_categories', { categories: results }); 
    });
};

// Add a new category
exports.addCategory = (req, res) => {
    const { categoryName } = req.body;
    const categoryImg = req.file ? req.file.filename : ''; 

    const sql = 'INSERT INTO Category (categoryName, categoryImg) VALUES (?, ?)';
    db.query(sql, [categoryName, categoryImg], (err, result) => {
        if (err) {
            console.error('Error adding category:', err);
            return res.status(500).send('Error adding category to the database.');
        }
        res.redirect('/manage-categories');
    });
};

// Update a category
exports.updateCategory = (req, res) => {
    const categoryID = req.params.id;
    const { categoryName } = req.body;
    const categoryImg = req.file ? req.file.filename : req.body.existingImage; // Keep existing image if not updated

    const sql = `
        UPDATE Category 
        SET categoryName = ?, categoryImg = ? 
        WHERE categoryID = ?
    `;

    db.query(sql, [categoryName, categoryImg, categoryID], (err, result) => {
        if (err) {
            console.error("Error updating category:", err);
            return res.status(500).send("Error updating category.");
        }
        res.redirect('/manage-categories');
    });
};


// Delete a category
exports.deleteCategory = (req, res) => {
    const categoryID = req.params.id;

    const sql = "DELETE FROM Category WHERE categoryID = ?";
    db.query(sql, [categoryID], (err, result) => {
        if (err) {
            console.error("Error deleting category:", err);
            return res.status(500).send("Error deleting category");
        }
        res.redirect('/manage-categories');
    });
};

