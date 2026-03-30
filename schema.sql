SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS vaccinations;
DROP TABLE IF EXISTS pregnant_women;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS attendance;
DROP TABLE IF EXISTS growth_entries;
DROP TABLE IF EXISTS children;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS centers;

CREATE TABLE centers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    address TEXT,
    region VARCHAR(100),
    childCount INT DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('parent', 'staff', 'admin') NOT NULL,
    centerId VARCHAR(50),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE SET NULL
);

CREATE TABLE children (
    id INT AUTO_INCREMENT PRIMARY KEY,
    centerId VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);

CREATE TABLE growth_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    childId INT NOT NULL,
    date DATE NOT NULL,
    height FLOAT NOT NULL,
    weight FLOAT NOT NULL,
    present BOOLEAN NOT NULL,
    status VARCHAR(50),
    prediction TEXT,
    suggestions TEXT,
    syncStatus VARCHAR(20) DEFAULT 'synced',
    FOREIGN KEY (childId) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_growth_date (childId, date)
);

CREATE TABLE attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    childId INT NOT NULL,
    date DATE NOT NULL,
    isPresentToday BOOLEAN NOT NULL,
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (childId) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE KEY unique_child_attendance_date (childId, date)
);

CREATE TABLE inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    centerId VARCHAR(50) NOT NULL,
    itemType VARCHAR(50) NOT NULL,
    currentStock FLOAT DEFAULT 0,
    minThreshold FLOAT DEFAULT 0,
    lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inventory (centerId, itemType)
);

CREATE TABLE pregnant_women (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    centerId VARCHAR(50) NOT NULL,
    expectedDeliveryDate DATE,
    healthStatus VARCHAR(100),
    hasReceivedCurrentMonthMix BOOLEAN DEFAULT FALSE,
    lastDistributionDate DATE,
    notes TEXT,
    registrationDate DATE NOT NULL,
    FOREIGN KEY (centerId) REFERENCES centers(id) ON DELETE CASCADE
);

CREATE TABLE vaccinations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    childId INT DEFAULT NULL,
    womanId INT DEFAULT NULL,
    vaccineName VARCHAR(100) NOT NULL,
    dueDate DATE NOT NULL,
    completionDate DATE DEFAULT NULL,
    isCompleted BOOLEAN DEFAULT FALSE,
    administeredBy VARCHAR(100),
    FOREIGN KEY (childId) REFERENCES children(id) ON DELETE CASCADE,
    FOREIGN KEY (womanId) REFERENCES pregnant_women(id) ON DELETE CASCADE
);

SET FOREIGN_KEY_CHECKS = 1;
