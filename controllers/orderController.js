const db = require('../db');

// Get orders for the logged-in user
exports.getMyOrders = (req, res) => {
    if (!req.session.user || !req.session.user.UserID) {
        res.redirect('/login');
        return;
    }

    const userId = req.session.user.UserID;
    console.log("User ID:", userId);

    const sql = `
        SELECT 
            o.orderID,
            o.orderDate,
            o.paymentMethod,
            o.transactionID,
            o.trackingStatus, 
            p.productID,
            p.productName,
            p.productDescription,
            p.productImg,
            o.quantity AS orderProductQuantity,
            p.price AS productPrice
        FROM 
            Orders o
        JOIN 
            Products p ON p.productID = o.productID
        WHERE 
            o.userID = ? 
            AND o.trackingStatus = 'Processing';
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            console.error("Error retrieving orders:", error);
            return res.status(500).send('Error retrieving orders');
        }
    
        let totalAmount = 0;
    
        results.forEach(item => {
            item.productPrice = parseFloat(item.productPrice);
            totalAmount += item.orderProductQuantity * item.productPrice;
        });

        console.log("Orders Retrieved:", results);

        res.render('order', { 
            orders: results, 
            totalAmount: totalAmount.toFixed(2), 
            msg: results.length > 0 ? "" : "No orders found." 
        });
    });    
};

exports.getPurchaseHistory = (req, res) => {
    if (!req.session.user || !req.session.user.UserID) {
        res.redirect('/login');
        return;
    }

    const userId = req.session.user.UserID;
    console.log("User ID:", userId);

    const sql = `
        SELECT 
            o.orderID,
            o.orderDate,
            o.paymentMethod,
            o.transactionID,
            o.trackingStatus, 
            p.productID,
            p.productName,
            p.productDescription,
            p.productImg,
            o.quantity AS orderProductQuantity,
            p.price AS productPrice
        FROM 
            Orders o
        JOIN 
            Products p ON p.productID = o.productID
        WHERE 
            o.userID = ? 
    `;

    db.query(sql, [userId], (error, results) => {
        if (error) {
            console.error("Error retrieving orders:", error);
            return res.status(500).send('Error retrieving orders');
        }
    
        let totalAmount = 0;
    
        results.forEach(item => {
            item.productPrice = parseFloat(item.productPrice);
            totalAmount += item.orderProductQuantity * item.productPrice;
        });

        console.log("Orders Retrieved:", results);

        res.render('purchaseHistory', { 
            orders: results, 
            totalAmount: totalAmount.toFixed(2), 
            msg: results.length > 0 ? "" : "No orders found." 
        });
    });    
};

// Get all orders (Admin)
exports.getOrders = (req, res) => {
    const sql = `
        SELECT 
            o.orderID,
            o.orderDate,
            o.paymentMethod,
            o.transactionID,
            o.trackingStatus, -- Ensure tracking status is retrieved
            u.UserID AS orderUserId,
            u.FirstName,
            u.LastName,
            p.productID,
            p.productName,
            p.productDescription,
            p.productImg,
            o.quantity AS orderProductQuantity,
            p.price AS productPrice
        FROM 
            Orders o
        JOIN 
            Products p ON p.productID = o.productID
        JOIN 
            Users u ON o.userID = u.UserID
        ORDER BY 
            o.orderDate DESC;
    `;

    db.query(sql, (error, results) => {
        if (error) {
            return res.status(500).send('Error retrieving orders');
        }

        if (results.length > 0) {
            console.log('All orders retrieved');

            let totalAmount = 0;
            results.forEach(item => {
                totalAmount += item.orderProductQuantity * item.productPrice;
            });

            res.render('order', { orders: results, totalAmount: totalAmount.toFixed(2), msg: "" });
        } else {
            res.render('order', { msg: "No orders" });
        }
    });
};

exports.cancelOrder = (req, res) => {
    const orderID = req.params.orderID;  
    const userID = req.session.user.UserID;  // Ensure only the user can cancel their own order

    if (!userID) {
        return res.status(401).send("Unauthorized: Please log in to cancel orders.");
    }

    // Check if the order exists and is still "Processing"
    const checkOrderSql = `
        SELECT trackingStatus FROM Orders WHERE orderID = ? AND userID = ?
    `;

    db.query(checkOrderSql, [orderID, userID], (error, results) => {
        if (error) {
            console.error("Error checking order:", error);
            return res.status(500).send("Error checking order status.");
        }

        if (results.length === 0) {
            return res.status(404).send("Order not found or does not belong to you.");
        }

        if (results[0].trackingStatus !== "Processing") {
            return res.status(400).send("Order cannot be canceled as it is already being processed or shipped.");
        }

        // Delete the order since it's still in "Processing" status
        const deleteOrderSql = `DELETE FROM Orders WHERE orderID = ? AND userID = ?`;

        db.query(deleteOrderSql, [orderID, userID], (deleteError, deleteResults) => {
            if (deleteError) {
                console.error("Error deleting order:", deleteError);
                return res.status(500).send("Error deleting order.");
            }

            if (deleteResults.affectedRows === 0) {
                return res.status(404).send("Order not found.");
            }

            console.log(`Order ${orderID} canceled successfully.`);
            res.redirect('/orders');
        });
    });
};


// Create a new order after a successful payment (PayPal or NETS)
/*exports.createOrder = (req, res) => {
    const userId = req.session.user.UserID;
    const cart = req.body.cart;
    const paymentMethod = req.body.paymentMethod;
    const transactionID = req.body.transactionID;
    
    let totalAmount = 0;
    cart.forEach(item => {
        totalAmount += item.Price * item.Quantity;
    });
    totalAmount = totalAmount.toFixed(2);

    // Insert order into Orders table with default tracking status as 'Processing'
    const insertOrderSql = `
        INSERT INTO Orders (userID, paymentMethod, totalAmount, transactionID, orderDate, trackingStatus)
        VALUES (?, ?, ?, ?, NOW(), 'Processing')
    `;

    db.query(insertOrderSql, [userId, paymentMethod, totalAmount, transactionID], (error, results) => {
        if (error) {
            console.error("Error creating order:", error);
            return res.status(500).send("Error creating order");
        }

        const orderId = results.insertId;

        // Insert cart items into OrderItems table
        const insertOrderItemsSql = `
            INSERT INTO Order (orderID, productID, quantity, price)
            VALUES (?, ?, ?, ?)
        `;

        cart.forEach(item => {
            db.query(insertOrderItemsSql, [orderId, item.ProductID, item.Quantity, item.Price], (err) => {
                if (err) {
                    console.error("Error adding order item:", err);
                    return res.status(500).send("Error adding order items");
                }
            });
        });

        res.status(200).send({
            message: "Order created successfully",
            orderId: orderId,
            totalAmount: totalAmount
        });
    });
};*/

// Admin: Get and Manage Orders
exports.getManageOrders = (req, res) => {
    const query = `
        SELECT Orders.orderItemID, Orders.productID, Orders.quantity, Orders.orderDate, 
               Orders.trackingStatus, Orders.paymentMethod, Orders.orderId, Orders.transactionID,
               Users.FirstName, Users.LastName, Users.Email,
               Products.productName, Products.price, Products.productImg
        FROM Orders
        JOIN Users ON Orders.userID = Users.UserID
        JOIN Products ON Orders.productID = Products.productID
        ORDER BY Orders.orderDate DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).send('Error fetching orders from the database.');
        }
        res.render('manage_orders', { orders: results });
    });
};

// Admin: Update Order Status
exports.updateOrderStatus = (req, res) => {
    const orderItemID = req.params.id;
    const { trackingStatus } = req.body;

    const sql = `
        UPDATE Orders 
        SET trackingStatus = ? 
        WHERE orderItemID = ?
    `;

    db.query(sql, [trackingStatus, orderItemID], (err, result) => {
        if (err) {
            console.error("Error updating order status:", err);
            return res.status(500).send("Error updating order status.");
        }
        res.redirect('/manage-orders');
    });
};

// Admin: Delete Order
exports.deleteOrder = (req, res) => {
    const orderItemID= req.params.orderItemID;

    const deleteOrderSql = `DELETE FROM Orders WHERE orderItemID = ?`;

    db.query(deleteOrderSql, [orderItemID], (error, results) => {
        if (error) {
            console.error("Error deleting order:", error);
            return res.status(500).send("Error deleting order.");
        }

        if (results.affectedRows === 0) {
            return res.status(404).send("Order not found.");
        }

        res.redirect('/manage-orders');
    });
};
