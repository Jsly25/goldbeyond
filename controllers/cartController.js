const db = require('../db');

// Add item to cart
exports.addToCart = (req, res) => {
    const { productID, productName, price, productImg, quantity } = req.body;
    const userID = req.session.user.UserID;

    // Check if the user is authenticated
    if (!req.session.user) {
        req.flash('err', 'Please log in to add items to your cart');
        return res.redirect('/login');
    }

    const sql = 'INSERT INTO Cart (UserID, ProductID, ProductName, Price, ProductImg, Quantity) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [userID, productID, productName, price, productImg, quantity], (err, result) => {
        if (err) {
            console.error('Error adding item to cart:', err);
            return res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
        }
        req.flash('success', 'Item added to cart.');
        res.redirect(`/product/${productID}?success=true`); // Redirect back to the product detail page with success query parameter
    });
};

// Remove item from cart
exports.removeFromCart = (req, res) => {
    const cartID = req.params.cartID;
    const userID = req.session.user.UserID;

    const sql = 'DELETE FROM Cart WHERE UserID = ? AND CartID = ?';
    db.query(sql, [userID, cartID], (err, result) => {
        if (err) {
            console.error('Error removing item from cart:', err);
            return res.status(500).json({ success: false, message: 'Failed to remove item from cart.' });
        }
        res.redirect('/cart');
    });
};

// Render the cart page
exports.renderCart = (req, res) => {
    const userID = req.session.user.UserID;

    const sql = 'SELECT * FROM Cart WHERE UserID = ?';
    db.query(sql, [userID], (err, results) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            return res.status(500).send('Error fetching cart items');
        }

        const totalPrice = results.reduce((total, item) => total + item.Price * item.Quantity, 0);
        res.render('cart', { cartItems: results, totalPrice: totalPrice });
    });
};

// Update cart item quantity
exports.updateCartQuantity = (req, res) => {
    const { productID, quantity } = req.body;
    const userID = req.session.user.UserID;

    const sql = 'UPDATE Cart SET Quantity = ? WHERE UserID = ? AND ProductID = ?';
    db.query(sql, [quantity, userID, productID], (err, result) => {
        if (err) {
            console.error('Error updating cart item quantity:', err);
            return res.status(500).json({ success: false, message: 'Failed to update cart item quantity.' });
        }
        res.redirect('/cart');
    });
};

exports.checkout = (req, res) => {
    const { paymentMethod, orderId, transactionId } = req.params;
    console.log(`Order ID: ${orderId}, Transaction ID: ${transactionId}`);
    
    if (!req.session.user || !req.session.user.UserID) {
        return res.status(401).send("User not authenticated. Please log in to continue.");
    }

    const userId = req.session.user.UserID; // Get userId from session
    console.log(`User ID: ${userId}`);

    // Fetch cart items for the logged-in user
    const sql = `
        SELECT p.productID, p.productName, p.productImg, p.price, c.Quantity, p.Stock
        FROM Products p
        JOIN Cart c ON p.productID = c.ProductID
        WHERE c.UserID = ?;
    `;

    db.query(sql, [userId], (error, cartItems) => {
        if (error) {
            console.error("Error retrieving cart items:", error);
            return res.status(500).send("Error retrieving cart items");
        }

        if (cartItems.length === 0) {
            return res.status(404).send("Your cart is empty");
        }

        let totalAmount = 0;

        // Calculate total amount
        cartItems.forEach(item => {
            totalAmount += item.Quantity * item.price;
        });

        // Insert order into Orders table
        const orderSql = `
            INSERT INTO Orders (productID, quantity, userID, orderDate, paymentMethod, orderID, transactionID)
            VALUES (?, ?, ?, NOW(), ?, ?, ?);
        `;

        cartItems.forEach(orderItem => {
            console.log(`Processing order for item: ${orderItem.productID}`);
            
            db.query(orderSql, [
                orderItem.productID, orderItem.Quantity, userId, paymentMethod, orderId, transactionId
            ], (orderError) => {
                if (orderError) {
                    console.error("Error creating order:", orderError);
                    return res.status(500).send("Error processing order");
                }
            });

            // Update stock in Products table
            const updateStockSql = `UPDATE Products SET Stock = Stock - ? WHERE productID = ?`;
            db.query(updateStockSql, [orderItem.Quantity, orderItem.productID], (updateStockError) => {
                if (updateStockError) {
                    console.error("Error updating stock:", updateStockError);
                    return res.status(500).send("Error updating stock");
                }
            });
        });

        // Clear the cart after checkout
        const clearCartSql = `DELETE FROM Cart WHERE UserID = ?`;
        db.query(clearCartSql, [userId], (clearCartError) => {
            if (clearCartError) {
                console.error("Error clearing cart:", clearCartError);
                return res.status(500).send("Error clearing cart");
            }

            // Render invoice page (or confirmation page)
            res.render("invoice", {
                cartItems: cartItems,
                totalAmount: totalAmount.toFixed(2), // Format total amount to 2 decimal places
                userId: userId,
                paymentMethod: paymentMethod,
                orderId: orderId,
                transactionId: transactionId,
                user: req.session.user
            });
        });
    });
};

