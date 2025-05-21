const db = require('../db');

exports.getMyReviews = (req, res) => {
    const userID = req.session.user ? req.session.user.UserID : null;

    if (!userID) {
        return res.status(401).send('You must be logged in to view your reviews.');
    }

    const sql = `
        SELECT r.ReviewID, r.Rating, r.Comment, r.Date, 
               u.FirstName, p.productName, p.productImg
        FROM Reviews r
        JOIN Users u ON r.UserID = u.UserID
        JOIN Products p ON r.productID = p.productID
        WHERE r.UserID = ?
        ORDER BY r.Date DESC
    `;
    
    db.query(sql, [userID], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving your reviews');
        }

        res.render('reviews', { review: results });
    });
};



// Fetch reviews for a specific product
exports.getProductReviews = (productID, callback) => {
    const query = `
        SELECT Reviews.*, Users.FirstName AS userName
        FROM Reviews 
        JOIN Users ON Reviews.UserID = Users.UserID 
        WHERE Reviews.productID = ?
    `;

    db.query(query, [productID], (err, reviews) => {
        if (err) {
            console.error("Error fetching reviews:", err);
            return callback(err, []);
        }
        callback(null, reviews);
    });
};

// Submit a new review
exports.submitReview = (req, res) => {
    const { productID, rating, comment } = req.body;
    const userID = req.session.user ? req.session.user.UserID : null;

    if (!userID) {
        return res.redirect('/login'); // Redirect to login if not logged in
    }

    const query = `
        INSERT INTO Reviews (UserID, productID, Rating, Comment, Date) 
        VALUES (?, ?, ?, ?, NOW())
    `;

    db.query(query, [userID, productID, rating, comment], (err) => {
        if (err) {
            console.error("Error submitting review:", err);
            return res.status(500).send("Error submitting review");
        }
        res.redirect('/product/' + productID);
    });
};

