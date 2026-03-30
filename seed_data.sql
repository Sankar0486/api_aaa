-- 1. Create a Sample Center (using ON DUPLICATE KEY UPDATE)
INSERT INTO centers (id, name, city, address, region, childCount) 
VALUES ('CENTER01', 'Green Valley Anganwadi', 'Springfield', '123 Maple St', 'North Sector', 10)
ON DUPLICATE KEY UPDATE name=VALUES(name), childCount=10;

-- 2. Sample Users are handled in index.js for proper hashing

-- 3. Create 10 Sample Children (using ON DUPLICATE KEY UPDATE)
INSERT INTO children (id, centerId, name, dob) VALUES 
(1, 'CENTER01', 'Aarav Sharma', '2020-05-15'),
(2, 'CENTER01', 'Vihaan Gupta', '2019-11-20'),
(3, 'CENTER01', 'Anaya Verma', '2021-02-10'),
(4, 'CENTER01', 'Ishani Nair', '2020-08-05'),
(5, 'CENTER01', 'Reyansh Das', '2019-03-30'),
(6, 'CENTER01', 'Saanvi Patel', '2021-01-25'),
(7, 'CENTER01', 'Arjun Singh', '2020-12-12'),
(8, 'CENTER01', 'Kyra Reddy', '2019-07-18'),
(9, 'CENTER01', 'Aditya Joshi', '2021-06-01'),
(10, 'CENTER01', 'Zoya Khan', '2020-02-28')
ON DUPLICATE KEY UPDATE name=VALUES(name), dob=VALUES(dob);

-- 4. Create Growth Entries (using ON DUPLICATE KEY UPDATE)
-- unique_child_growth_date (childId, date) ensures no duplicates
INSERT INTO growth_entries (childId, date, height, weight, present) VALUES 
(1, '2023-10-01', 95.5, 14.2, 1),
(2, '2023-10-01', 102.0, 16.5, 1),
(3, '2023-10-01', 88.0, 12.1, 1),
(4, '2023-10-01', 92.4, 13.8, 1),
(5, '2023-10-01', 105.2, 18.0, 1),
(6, '2023-10-01', 86.5, 11.5, 1),
(7, '2023-10-01', 94.0, 14.0, 1),
(8, '2023-10-01', 100.5, 15.8, 1),
(9, '2023-10-01', 84.2, 10.9, 1),
(10, '2023-10-01', 96.8, 14.5, 1)
ON DUPLICATE KEY UPDATE height=VALUES(height), weight=VALUES(weight);

-- 5. Create Attendance (using ON DUPLICATE KEY UPDATE)
-- unique_child_attendance_date (childId, date) ensures no duplicates
INSERT INTO attendance (childId, date, isPresentToday, notes) VALUES 
(1, CURDATE(), 1, 'Regular'),
(2, CURDATE(), 1, 'Regular'),
(3, CURDATE(), 1, 'Regular'),
(4, CURDATE(), 0, 'Sick leave'),
(5, CURDATE(), 1, 'Regular'),
(6, CURDATE(), 1, 'Regular'),
(7, CURDATE(), 1, 'Regular'),
(8, CURDATE(), 1, 'Regular'),
(9, CURDATE(), 1, 'Regular'),
(10, CURDATE(), 1, 'Regular')
ON DUPLICATE KEY UPDATE isPresentToday=VALUES(isPresentToday), notes=VALUES(notes);

-- 6. Create Initial Inventory (Add unique constraint and handle duplicates)
-- Note: schema needs unique constraint on (centerId, itemType) for this to work
INSERT INTO inventory (centerId, itemType, currentStock, minThreshold, notes) VALUES 
('CENTER01', 'rice', 50.0, 10.0, 'Monthly stock'),
('CENTER01', 'eggs', 120.0, 30.0, 'Fresh delivery'),
('CENTER01', 'multigrainHealthMix', 25.0, 5.0, 'High demand')
ON DUPLICATE KEY UPDATE currentStock=VALUES(currentStock), minThreshold=VALUES(minThreshold);

-- 7. Create 5 Sample Pregnant Women (using ON DUPLICATE KEY UPDATE)
-- Added unique constraint on name and phone for this purpose if needed, otherwise name/centerId
INSERT INTO pregnant_women (id, name, phone, address, centerId, expectedDeliveryDate, registrationDate, healthStatus) VALUES 
(1, 'Priya Rai', '9876543210', 'Flat 4, Blue Apts', 'CENTER01', '2024-03-15', '2023-08-01', 'Stable'),
(2, 'Meera Bai', '9876543211', 'House 12, Sector 4', 'CENTER01', '2024-01-20', '2023-07-15', 'Requires Checkup'),
(3, 'Anjali P', '9876543212', 'Villa 9, Green Way', 'CENTER01', '2024-05-10', '2023-09-10', 'Good'),
(4, 'Sonia G', '9876543213', 'Room 2, Old Lodge', 'CENTER01', '2024-02-28', '2023-08-20', 'Stable'),
(5, 'Rina S', '9876543214', 'Plot 55, North Hill', 'CENTER01', '2024-04-05', '2023-09-01', 'Good')
ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone);
