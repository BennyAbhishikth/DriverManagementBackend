CREATE TABLE Driver_Details1 (
	driverId INT AUTO_INCREMENT PRIMARY KEY,
    driverName VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    gender VARCHAR(10) NOT NULL,
    dob VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    experience VARCHAR(255) NOT NULL,
    aadhar VARCHAR(12) NOT NULL,
    pan VARCHAR(10) NOT NULL,
    licenceNumber VARCHAR(255) NOT NULL,
    profilePic VARCHAR(255) NOT NULL,
    totalDistance INT NULL, 
    successfulTrips INT NULL,
    joiningDate TIMESTAMP,
    leaveCount INT NULL,
    vehicleId INT NULL,
    driverStatus TINYINT(1) DEFAULT 0
);

ALTER TABLE Driver_Details1
    ADD vendorName VARCHAR(255) NOT NULL AFTER driverName;