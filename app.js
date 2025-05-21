const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const multer = require('multer'); 
const goldBeyondControllers = require('./controllers/goldBeyondControllers'); 
const userController = require('./controllers/userController');
const paypalController = require('./controllers/paypalController');
const orderController = require('./controllers/orderController');
const productControllers = require('./controllers/productControllers');
const reviewController = require('./controllers/reviewController');
const cartController = require('./controllers/cartController');
const netsQrController = require("./controllers/netsQrController");
const reportController = require("./controllers/reportController");

const app = express();

//variables in the .env file will be available in process.env
require('dotenv').config();

// Import middleware
const { checkAuthenticated, checkAdmin, checkUser } = require('./middleware/authentication');
const { validateRegistration, validateLogin } = require('./middleware/validation');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); 
    }
});

const upload = multer({ storage: storage });

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Enable static files
app.use(express.static('public'));

// Enable form processing
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
    secret: 'secret',         // Keep the secret key
    resave: false,            // Prevents unnecessary session resaves
    saveUninitialized: false, // Saves session only when modified
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 7  // 1 week expiration (like Booklink)
    }
}));

// Middleware to check session data
app.use((req, res, next) => {
    console.log("Session Data:", req.session);  //  Logs session data on every request
    res.locals.session = req.session;  // Pass session data to all views
    next();
});

// Use Flash Middleware
app.use(flash());

// Home page
app.get('/', goldBeyondControllers.getHomePage); 

// Contact
app.get('/contact', goldBeyondControllers.getContactPage); 

app.get('/search', goldBeyondControllers.search);

// Admin Routes
app.get('/admin_dashboard', checkAuthenticated, checkAdmin, reportController.getSalesReport); // Admin Dashboard

// manage products
app.get('/manage-products', checkAuthenticated, checkAdmin, productControllers.getManageProductsPage); // Manage Products
app.post('/add-product', upload.single('productImg'), checkAuthenticated, checkAdmin, productControllers.addProduct); // Add Product
app.get('/edit-product/:id', checkAuthenticated, checkAdmin, productControllers.getEditProductPage);
app.post('/edit-product/:id', checkAuthenticated, checkAdmin, upload.single('productImg'), productControllers.updateProduct);
app.post('/delete-product/:id', checkAuthenticated, checkAdmin, productControllers.deleteProduct);

// categories
app.get('/manage-categories', checkAuthenticated, checkAdmin, productControllers.getManageCategories); // Manage Products
app.post('/add-category', upload.single('categoryImg'), checkAuthenticated, checkAdmin, productControllers.addCategory); // Route to update a category
app.post('/edit-category/:id', upload.single('categoryImg'), productControllers.updateCategory);// Add Product
app.post('/edit-categories/:id', checkAuthenticated, checkAdmin, upload.single('categoryImg'), productControllers.updateCategory);
app.post('/delete-category/:id', checkAuthenticated, checkAdmin, productControllers.deleteCategory);

// manage users
app.get('/manage-users', checkAuthenticated, checkAdmin, userController.getManageUsers);
app.post('/edit-user/:id', checkAuthenticated, checkAdmin, userController.updateUser);
app.post('/delete-user/:id', checkAuthenticated, checkAdmin, userController.deleteUser);

//orders
app.get('/manage-orders', checkAuthenticated, checkAdmin, orderController.getManageOrders);
app.post('/update-order-status/:id', checkAuthenticated, checkAdmin, orderController.updateOrderStatus);
app.post('/delete-order/:orderItemID', checkAuthenticated, checkAdmin, orderController.deleteOrder);




//user
app.get('/login', userController.loginForm);
app.post('/submit-login', validateLogin, userController.login);
app.get('/logout', checkAuthenticated, userController.logout);

// manage own account
app.get("/manage-account", userController.getEditProfile);
app.post("/update-profile", userController.updateProfile);
app.post("/change-password", userController.changePassword);

app.get('/forgot-password', userController.getForgotPassword);
app.post('/forgot-password', userController.forgotPassword);
app.post('/reset-password', userController.resetPassword);



// Signup Routes
app.get('/signup', userController.signupForm);
app.post('/submit-signup', validateRegistration, userController.signup);

// All products
app.get('/jewelry', productControllers.getAllProducts); 
// Rings Routes
app.get('/rings', productControllers.getRingsPage);

// Earrings Routes
app.get('/earrings', productControllers.getEarringsPage);

// Necklace Routes
app.get('/necklaces', productControllers.getNecklacesPage);

//Bracelets Routes
app.get('/bracelets', productControllers.getBraceletsPage);

app.get('/services', goldBeyondControllers.renderServices);
app.get('/appointment', goldBeyondControllers.renderAppointment);
app.post('/submit-appointment', goldBeyondControllers.submitAppointment);
app.get('/my-review', reviewController.getMyReviews);

// Product Detail Route
app.get('/product/:id', productControllers.renderProductDetail);
// Reviews
// Route to submit a review
app.post('/submit-review', checkAuthenticated, reviewController.submitReview);

// Add to Cart Route
app.post('/add-to-cart', [checkAuthenticated, checkUser], cartController.addToCart);

// Remove from Cart Route
app.post('/remove-from-cart/:cartID', [checkAuthenticated, checkUser], cartController.removeFromCart);

// Cart Route
app.get('/cart', [checkAuthenticated, checkUser], cartController.renderCart);

// Update quantity cart Route
app.post('/update-cart', [checkAuthenticated, checkUser], cartController.updateCartQuantity);

// User Orders
app.get('/orders', checkAuthenticated, orderController.getMyOrders);
app.get('/purchase-history', checkAuthenticated, orderController.getPurchaseHistory);
app.post('/orders/delete/:orderID', [checkAuthenticated, checkUser], orderController.cancelOrder);


// Paypal Routes
//parse post params sent in body in json format
app.use(express.json());

app.post("/api/orders", paypalController.createOrderHandler);
app.post("/api/orders/:orderID/capture", paypalController.captureOrderHandler);
app.get("/checkout/:paymentMethod/:orderId/:transactionId", cartController.checkout);


//Nets payment
app.post('/generateNETSQR', netsQrController.generateQrCode);
app.get("/nets-qr/success", cartController.checkout, (req, res) => {
    res.render('netsTxnSuccessStatus', { message: 'Transaction Successful!' });
});
app.get("/nets-qr/fail", (req, res) => {
    res.render('netsTxnFailStatus', { message: 'Transaction Failed. Please try again.' });
})



const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Server is running on http://localhost:${PORT}`));