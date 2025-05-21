// Middleware for form validation
const validateRegistration = (req, res, next) => {
    const { firstName, lastName, email, password, gender, dob, contactNumber, country } = req.body;

    if (!firstName || !lastName || !email || !password || !gender || !dob || !contactNumber || !country) {
        req.flash('error', 'All fields are required.');
        req.flash('formData', req.body);
        return res.redirect('/signup');
    }

    if (password.length < 6) {
        req.flash('error', 'Password should be at least 6 characters long.');
        req.flash('formData', req.body);
        return res.redirect('/signup');
    }
    next();
};

const validateLogin = (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/login');
    }
    next();
};

module.exports = {
    validateRegistration,
    validateLogin
};
