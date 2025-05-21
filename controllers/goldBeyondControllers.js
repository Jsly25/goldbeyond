const db = require('../db');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/images/'); 
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// Session Middleware
exports.sessionMiddleware = (req, res, next) => {
    req.session.user = req.session.user || null; 
    next();
};

// Flash Middleware
exports.flashMiddleware = (req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
};


// Get Admin page
exports.getAdminHomePage = (req, res) => {
    // Ensures user has admin role before rendering the page
    res.render('admin_home'); // Render admin home page if authenticated and authorized
};


// Render home page for visitors
exports.getHomePage = (req, res) => {
    const query = 'SELECT * FROM Category';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching categories:', err);
            return res.status(500).send('Error fetching data from the database.');
        }
        res.render('index', { categories: results }); 
    });
};

// Render the contact page
exports.getContactPage = (req, res) => {
    res.render('contact'); 
};

// Render services page
exports.renderServices = (req, res) => {
    res.render('services');
};

// Render appointment page
exports.renderAppointment = (req, res) => {
    res.render('appointment');
};

exports.submitAppointment = (req, res) => {
    const { date, time, message } = req.body;
    const user = req.session.user; // Get user from the session

    if (!user) {
        return res.json({ success: false, message: "You must be logged in to book an appointment." });
    }

    if (!date || !time || !message) {  // Check if fields are missing
        return res.json({ success: false, message: "All fields are required!" });
    }

    const userId = user.UserID;

    const sql = 'INSERT INTO Appointments (UserID, Date, Time, Message) VALUES (?, ?, ?, ?)';

    db.query(sql, [userId, date, time, message], (err, result) => {
        if (err) {
            console.error('Error submitting appointment:', err);
            return res.json({ success: false, message: "Something went wrong! Please try again." });
        }

        res.json({ success: true, message: "Appointment request sent successfully!" });
    });
};


exports.search = (req, res) => {
    let searchQuery = req.query.q;
    if (!searchQuery) {
        req.flash("error", "Search query cannot be empty.");
        return res.redirect("/");
    }

    searchQuery = `%${searchQuery}%`; // Allow partial matching in SQL LIKE
    const priceQuery = parseFloat(req.query.q); // Convert query to number 

    let sql = `
        SELECT * FROM Products 
        WHERE productName LIKE ? 
        OR productDescription LIKE ? 
        ${!isNaN(priceQuery) ? "OR price = ?" : ""}
    `;

    let queryParams = [searchQuery, searchQuery];
    if (!isNaN(priceQuery)) {
        queryParams.push(priceQuery);
    }

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            console.error("Database search error:", err);
            req.flash("error", "An error occurred while searching.");
            return res.redirect("/");
        }

        if (results.length === 0) {
            req.flash("error", "No results found.");
            return res.redirect("/");
        }

        // Ensure price is converted to a number
        results = results.map(product => ({
            ...product,
            price: Number(product.price) || 0 // Convert to number, default to 0 if null
        }));

        res.render("searchResults", { 
            products: results, 
            query: req.query.q, 
            messages: req.flash('success'), 
            errors: req.flash('error') 
        });
    });
};


