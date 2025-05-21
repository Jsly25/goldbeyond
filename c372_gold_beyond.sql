CREATE DATABASE IF NOT EXISTS `c372_gold_beyond`;
USE `c372_gold_beyond`;

-- UserTypes Table
CREATE TABLE UserTypes (
    usertypeId INT AUTO_INCREMENT PRIMARY KEY,
    userTypeName VARCHAR(50) NOT NULL
);

-- Insert UserTypes
INSERT INTO UserTypes (usertypeId, userTypeName) VALUES
(1, 'User'),
(2, 'Admin');

-- Users Table
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(255),
    Gender VARCHAR(10),
    DateOfBirth DATE,
    ContactNumber VARCHAR(20),
    Country VARCHAR(50),
    usertypeId INT DEFAULT 1, -- Default to 'User'
    FOREIGN KEY (usertypeId) REFERENCES UserTypes(usertypeId)
);

INSERT INTO Users (UserID, FirstName, LastName, Email, Password, Gender, DateOfBirth, ContactNumber, Country, usertypeId) VALUES 
(1, 'Chloe','Tan', 'user1@abc.com', SHA1('12345'), 'Female', '2002-02-12', 88889999, 'Singapore', 1),
(2, 'Jenny','Lim', 'admin1@gmail.com', SHA1('54321'), 'Female', '1998-03-22', 88888888, 'Singapore', 2);

-- Category Table
CREATE TABLE Category (
    categoryID INT AUTO_INCREMENT PRIMARY KEY,
    categoryName VARCHAR(100) NOT NULL,
    categoryImg VARCHAR(255) NOT NULL
);

INSERT INTO Category (categoryID, categoryName, categoryImg) VALUES
(1, 'Necklaces', 'necklace-collection.png'),
(2, 'Rings', 'ring-collection.png'),
(3, 'Earrings', 'earrings-collection.png'),
(4, 'Bracelets', 'bracelet-collection.png');

-- Products Table (with new Stock column)
CREATE TABLE Products (
    productID INT AUTO_INCREMENT PRIMARY KEY,
    categoryID INT,
    productName VARCHAR(100) NOT NULL,
    productImg VARCHAR(255) NOT NULL,
    productDescription VARCHAR(999) NOT NULL,
    material VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    Stock INT NOT NULL DEFAULT 0, -- Added Stock column
    FOREIGN KEY (categoryID) REFERENCES Category(categoryID)
);

INSERT INTO Products (productID, categoryID, productName, productImg, productDescription, material, price, Stock) VALUES
(1, 2, '18K Gold Twist Ring', '18k_twist_ring.png', 'A gorgeous braid ring showcasing two intertwining bands. Crafted in 18k gold.', '18k Gold', 573.00, 20),
(2, 2, '18K Diamond Twist Ring', '18k_diamond_twist_ring.png', 'A twist ring with shining diamonds showcasing two intertwining bands. Crafted in 18k gold.', '18k Gold', 717.00, 15),
(3, 2, '18k Round Diamond Ring', '18k_round diamond_ring.png', 'Gorgeous and elegant huge round diamond gold ring. Crafted in 18k gold.', '18k Gold', 790.00, 10),
(4, 2, '18K Diamond Eternity Ring', '18k_eternity_ring.png', 'Gold ring signifying the never-ending love of eternity. Crafted in 18k gold.', '18k Gold', 717.00, 12),
(5, 3, '24K Pearl Drop Earrings', 'pearl_earring.png', 'Pearl drop earrings featuring a baroque freshwater pearl paired with a hammered gold organic setting.', '24k Gold', 700.00, 25),
(6, 3, '24K Dome Huggie Earrings', 'round_ring_earring.png', 'Mini huggie earrings showcasing a subtle tapered dome shape. Crafted in gold vermeil.', '24k Gold', 750.00, 30),
(7, 3, '18K Huge Hoop Earrings', 'big_hoop_earring.png', 'Large gold hoop earrings, dainty and classic, perfect for everyday wear.', '18k Gold', 580.00, 22),
(8, 3, '18K Huggie Earrings', 'diamond_hoop_earring.png', '18k yellow gold huggie earrings with 9 brilliant lab-grown diamonds.', '18k Gold', 620.00, 18),
(9, 1, '24K Snake Chain Necklace', '24k goldchain.png', 'Flat snake chain design crafted in 24k gold.', '24k Gold', 590.00, 20),
(10, 1, '22K Puffy Heart Necklace', 'heart_necklace.png', 'Statement necklace with a puffy heart pendant on a delicate gold chain.', '22k Gold', 480.00, 15),
(11, 1, '22K Pearl Necklace', 'pearl necklace.png', 'The Pearl Necklace features a keshi pearl nested in a unique 22k gold organic setting.', '22k Gold', 410.00, 10),
(12, 1, '24K Pisces Pendant Necklace', 'pisces necklace.png', 'Pisces Charm Necklace featuring the zodiac sign on a rectangular 24k gold pendant.', '24k Gold', 680.00, 8),
(13, 1, '24K Pisces Pendant Necklace', 'pisces necklace.png', 'Pisces Charm Necklace featuring the zodiac sign on a rectangular 24k gold pendant.', '24k Gold', 0.10, 30);

-- Cart Table
CREATE TABLE Cart (
    CartID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    ProductID INT,
    ProductName VARCHAR(100),
    Price DECIMAL(10, 2),
    ProductImg VARCHAR(255),
    Quantity INT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (ProductID) REFERENCES Products(productID)
);

-- Orders Table
DROP TABLE IF EXISTS Orders;
CREATE TABLE Orders  (
	orderItemID int NOT NULL AUTO_INCREMENT,
    productID INT NOT NULL,   
    quantity INT NOT NULL, 
    userID INT NOT NULL, 
    orderDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    trackingStatus VARCHAR(255) DEFAULT 'Processing',
    paymentMethod VARCHAR(45) DEFAULT NULL,
    orderId varchar(45) DEFAULT NULL,
    transactionID VARCHAR(45) DEFAULT NULL, 
  PRIMARY KEY (orderItemID),
  KEY fk_product_order_idx (productID),
  KEY fk_user_order_idx (userID),
  CONSTRAINT fk_product_order FOREIGN KEY (productID) REFERENCES products (productID),
  CONSTRAINT fk_user_order FOREIGN KEY (userID) REFERENCES users (userId)
);
--
-- Dumping data for table `order_items`
--
INSERT INTO Orders (orderItemID, productID, quantity, userID, orderDate, trackingStatus, paymentMethod, orderId, transactionID) VALUES 
(1,1,1,1,'2024-12-12', 'Completed', 'Paypal','2A159236F97946723','7Y553432E68491618'),
(2,2,1,3,'2024-12-12','Completed','Paypal','2A159236F97946723','7Y553432E68491618');

-- Appointments Table
CREATE TABLE Appointments (
    AppointmentID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Date DATE,
    Time TIME,
    Message TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID)
);

-- Reviews Table
CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    productID INT,
    Rating INT,
    Comment TEXT,
    Date DATETIME,
    FOREIGN KEY (UserID) REFERENCES Users(UserID),
    FOREIGN KEY (productID) REFERENCES Products(productID)
);
