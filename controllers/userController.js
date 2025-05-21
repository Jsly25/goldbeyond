const db = require('../db');

exports.loginForm = (req, res) => {
    res.render('login', { messages: req.flash('success'), errors: req.flash('error') });
};

exports.login = (req, res) => {
    const { email, password } = req.body;

    const sql = 'SELECT * FROM Users WHERE Email = ? AND Password = SHA1(?)';
    db.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error("Database query error:", err);
            return res.status(500).send('Database error');
        }

        if (results.length > 0) {
            req.session.user = results[0]; // Store user in session
            req.flash('success', 'Login successful!'); // Set success message

            if (req.session.user.usertypeId === 1) {
                res.redirect('/'); // Redirect users to cart
            } else if (req.session.user.usertypeId === 2) {
                res.redirect('/admin_dashboard'); // Redirect admins to admin panel
            } else {
                res.redirect('/'); // Default to homepage
            }
        } else {
            req.flash('error', 'Incorrect email or password.'); // Set error message
            res.redirect('/login');
        }
    });
};

exports.signupForm = (req, res) => {
    res.render('signup', { messages: req.flash('error'), formData: req.flash('formData')[0] });
};

// Signup logic
exports.signup = (req, res) => {
    const { firstName, lastName, email, password, gender, dob, contactNumber, country } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !gender || !dob || !contactNumber || !country) {
        req.flash('error', 'All fields are required.');
        req.flash('formData', req.body);
        return res.redirect('/signup');
    }

    const sql = `
        INSERT INTO Users (FirstName, LastName, Email, Password, Gender, DateOfBirth, ContactNumber, Country, usertypeId)
        VALUES (?, ?, ?, SHA1(?), ?, ?, ?, ?, 1)
    `;

    db.query(sql, [firstName, lastName, email, password, gender, dob, contactNumber, country], (err) => {
        if (err) {
            console.error('Database error:', err);
            req.flash('error', 'Database error. Could not insert user.');
            return res.redirect('/signup');
        }
        req.flash('success', 'Signup successful! Please log in.');
        res.redirect('/login');
    });
};


exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error destroying session:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect('/login'); // Redirect to login after logout
    });
};

exports.getEditProfile = (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const userID = req.session.user.UserID;

    const sql = `SELECT UserID, FirstName, LastName, Email, ContactNumber, Country FROM Users WHERE UserID = ?`;

    db.query(sql, [userID], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            req.flash('error_msg', 'Failed to retrieve account details.');
            return res.redirect('/');
        }

        if (results.length === 0) {
            req.flash('error_msg', 'User not found.');
            return res.redirect('/');
        }

        res.render('editProfile', { 
            user: results[0], 
            success_msg: req.flash('success_msg'), 
            error_msg: req.flash('error_msg') 
        });
    });
};



// **Manage User - Update Profile**

exports.updateProfile = (req, res) => {
    const { firstName, lastName, email, contactNumber, country } = req.body;
    const userID = req.session.user.UserID;

    const sql = `
        UPDATE Users 
        SET FirstName = ?, LastName = ?, Email = ?, ContactNumber = ?, Country = ? 
        WHERE UserID = ?
    `;

    db.query(sql, [firstName, lastName, email, contactNumber, country, userID], (err, results) => {
        if (err) {
            console.error("Error updating profile:", err);
            req.flash('error_msg', 'Failed to update profile.');
            return res.redirect('/manage-account'); 
        }

        // Update session data
        req.session.user.FirstName = firstName;
        req.session.user.LastName = lastName;
        req.session.user.Email = email;
        req.session.user.ContactNumber = contactNumber;
        req.session.user.Country = country;

        req.flash('success_msg', 'Profile updated successfully.'); 
        res.redirect('/manage-account'); 
    });
};

exports.changePassword = (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userID = req.session.user.UserID;

    if (!oldPassword || !newPassword || !confirmPassword) {
        req.flash('error_msg', 'All fields are required.');
        return res.redirect('/manage-account');
    }

    if (newPassword !== confirmPassword) {
        req.flash('error_msg', 'New passwords do not match.'); 
        return res.redirect('/manage-account');
    }

    // Check if old password is correct
    const checkPasswordSQL = `SELECT Password FROM Users WHERE UserID = ? AND Password = SHA1(?)`;
    db.query(checkPasswordSQL, [userID, oldPassword], (err, results) => {
        if (err) {
            console.error("Error verifying old password:", err);
            req.flash('error_msg', 'Error updating password.'); 
            return res.redirect('/manage-account');
        }

        if (results.length === 0) {
            req.flash('error_msg', 'Incorrect old password.'); 
            return res.redirect('/manage-account');
        }

        // Update password
        const updatePasswordSQL = `UPDATE Users SET Password = SHA1(?) WHERE UserID = ?`;
        db.query(updatePasswordSQL, [newPassword, userID], (updateErr) => {
            if (updateErr) {
                console.error("Error updating password:", updateErr);
                req.flash('error_msg', 'Failed to update password.'); 
                return res.redirect('/manage-account');
            }

            req.flash('success_msg', 'Password updated successfully.'); 
            res.redirect('/manage-account');
        });
    });
};

exports.getForgotPassword = (req, res) => {
    res.render('forgotPassword', { 
        messages: req.flash('success_msg'), 
        errors: req.flash('error_msg'),
        verified: false,  // Ensure verified is always defined
        email: null 
    });
};


exports.forgotPassword = (req, res) => {
    const { email, contactNumber } = req.body;

    const sql = `SELECT * FROM Users WHERE Email = ? AND ContactNumber = ?`;
    db.query(sql, [email, contactNumber], (err, results) => {
        if (err) {
            console.error("Database error:", err);
            req.flash('error_msg', 'Database error. Please try again.');
            return res.redirect('/forgot-password');
        }

        if (results.length === 0) {
            req.flash('error_msg', 'Invalid email or contact number.');
            return res.redirect('/forgot-password');
        }

        req.session.resetUser = results[0]; // Store user in session temporarily
        res.render('forgotPassword', { verified: true, email: email, messages: [], errors: [] });
    });
};

exports.resetPassword = (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!newPassword || !confirmPassword) {
        req.flash('error_msg', 'All fields are required.');
        return res.redirect('/forgot-password');
    }

    if (newPassword !== confirmPassword) {
        req.flash('error_msg', 'New passwords do not match.');
        return res.redirect('/forgot-password');
    }

    if (!email) {
        req.flash('error_msg', 'Email not found. Please try again.');
        return res.redirect('/forgot-password');
    }

    // Hash new password using SHA1
    const updatePasswordSQL = `UPDATE Users SET Password = SHA1(?) WHERE Email = ?`;

    db.query(updatePasswordSQL, [newPassword, email], (err, results) => {
        if (err) {
            console.error("Error updating password:", err);
            req.flash('error_msg', 'Failed to update password.');
            return res.redirect('/forgot-password');
        }

        if (results.affectedRows === 0) {
            req.flash('error_msg', 'No user found with this email.');
            return res.redirect('/forgot-password');
        }

        req.flash('success_msg', 'Password updated successfully. Please log in.');
        res.redirect('/login');
    });
};


// admin
// Fetch all users and render the Manage Users page
exports.getManageUsers = (req, res) => {
    const query = `
        SELECT Users.*, UserTypes.userTypeName 
        FROM Users
        JOIN UserTypes ON Users.usertypeId = UserTypes.usertypeId
        WHERE UserTypes.usertypeName = 'User'
        ORDER BY Users.UserID ASC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).send('Error fetching users from the database.');
        }
        res.render('manage_user', { users: results });
    });
};

// Update user details
exports.updateUser = (req, res) => {
    const userID = req.params.id;
    const { firstName, lastName, email, gender, dob, contactNumber, country, usertypeId } = req.body;

    const sql = `
        UPDATE Users 
        SET FirstName = ?, LastName = ?, Email = ?, Gender = ?, DateOfBirth = ?, ContactNumber = ?, Country = ?, usertypeId = ?
        WHERE UserID = ?
    `;

    db.query(sql, [firstName, lastName, email, gender, dob, contactNumber, country, usertypeId, userID], (err, result) => {
        if (err) {
            console.error("Error updating user:", err);
            return res.status(500).send("Error updating user.");
        }
        res.redirect('/manage-users');
    });
};

// Delete user
exports.deleteUser = (req, res) => {
    const userID = req.params.id;

    const sql = "DELETE FROM Users WHERE UserID = ?";
    db.query(sql, [userID], (err, result) => {
        if (err) {
            console.error("Error deleting user:", err);
            return res.status(500).send("Error deleting user.");
        }
        res.redirect('/manage-users');
    });
};
