const db = require('../db');

exports.getSalesReport = async (req, res) => {
    try {
        const query = `
            SELECT 
                p.productName, 
                p.price AS productPrice, 
                SUM(o.quantity) AS totalQuantity, 
                SUM(o.quantity * p.price) AS totalSales
            FROM Orders o
            JOIN Products p ON o.productID = p.productID
            GROUP BY p.productID, p.productName, p.price;
        `;

        db.query(query, (err, results) => {
            if (err) {
                console.error("Database Error: ", err);
                return res.status(500).send("Database query failed");
            }

            // Convert totalSales and productPrice to numbers
            const formattedResults = results.map(sale => ({
                productName: sale.productName,
                productPrice: Number(sale.productPrice), 
                totalQuantity: sale.totalQuantity,
                totalSales: Number(sale.totalSales) 
            }));

            res.render("report", { sales: formattedResults, user: req.session.user });
        });

    } catch (error) {
        console.error("Server Error: ", error);
        res.status(500).send("Internal server error");
    }
};
