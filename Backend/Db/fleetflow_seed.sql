-- ============================================================
--  FLEETFLOW — Seed Data
--  Run AFTER fleetflow_schema.sql
--  Realistic demo data for all 11 tables
-- ============================================================

USE fleetflow;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- CLEAR EXISTING DATA (safe re-seed)
-- ============================================================
DELETE FROM vehicle_status_logs;
DELETE FROM driver_status_logs;
DELETE FROM expenses;
DELETE FROM fuel_logs;
DELETE FROM maintenance_logs;
DELETE FROM trips;
DELETE FROM shipments;
DELETE FROM drivers;
DELETE FROM vehicles;
DELETE FROM users;
DELETE FROM roles;

-- Reset auto-increment counters
ALTER TABLE vehicle_status_logs  AUTO_INCREMENT = 1;
ALTER TABLE driver_status_logs   AUTO_INCREMENT = 1;
ALTER TABLE expenses             AUTO_INCREMENT = 1;
ALTER TABLE fuel_logs            AUTO_INCREMENT = 1;
ALTER TABLE maintenance_logs     AUTO_INCREMENT = 1;
ALTER TABLE trips                AUTO_INCREMENT = 1;
ALTER TABLE shipments            AUTO_INCREMENT = 1;
ALTER TABLE drivers              AUTO_INCREMENT = 1;
ALTER TABLE vehicles             AUTO_INCREMENT = 1;
ALTER TABLE users                AUTO_INCREMENT = 1;
ALTER TABLE roles                AUTO_INCREMENT = 1;

-- ============================================================
-- TABLE 1: roles
-- ============================================================
INSERT INTO roles (role_id, name, created_by, updated_by, is_deleted) VALUES
(1, 'Manager',          NULL, NULL, FALSE),
(2, 'Dispatcher',       NULL, NULL, FALSE),
(3, 'Safety Officer',   NULL, NULL, FALSE),
(4, 'Financial Analyst',NULL, NULL, FALSE);

-- ============================================================
-- TABLE 2: users
-- Password for all users: FleetFlow@123
-- Hash below is bcrypt of 'FleetFlow@123' — replace in production
-- ============================================================
INSERT INTO users (user_id, role_id, full_name, email, password_hash, is_active, last_login, created_by) VALUES
-- Managers
(1,  1, 'Arjun Mehta',     'arjun.mehta@fleetflow.com',     '$2b$10$hashed_arjun',    TRUE,  '2026-02-21 09:00:00', NULL),
(2,  1, 'Priya Sharma',    'priya.sharma@fleetflow.com',    '$2b$10$hashed_priya',    TRUE,  '2026-02-21 08:45:00', 1),
-- Dispatchers
(3,  2, 'Ravi Kumar',      'ravi.kumar@fleetflow.com',      '$2b$10$hashed_ravi',     TRUE,  '2026-02-21 09:15:00', 1),
(4,  2, 'Sneha Patel',     'sneha.patel@fleetflow.com',     '$2b$10$hashed_sneha',    TRUE,  '2026-02-20 14:30:00', 1),
(5,  2, 'Aakash Verma',    'aakash.verma@fleetflow.com',    '$2b$10$hashed_aakash',   TRUE,  '2026-02-21 10:00:00', 1),
-- Safety Officers
(6,  3, 'Neha Joshi',      'neha.joshi@fleetflow.com',      '$2b$10$hashed_neha',     TRUE,  '2026-02-21 08:00:00', 1),
(7,  3, 'Suresh Nair',     'suresh.nair@fleetflow.com',     '$2b$10$hashed_suresh',   TRUE,  '2026-02-20 17:00:00', 1),
-- Financial Analysts
(8,  4, 'Kavya Reddy',     'kavya.reddy@fleetflow.com',     '$2b$10$hashed_kavya',    TRUE,  '2026-02-21 09:30:00', 1),
(9,  4, 'Manish Gupta',    'manish.gupta@fleetflow.com',    '$2b$10$hashed_manish',   TRUE,  '2026-02-19 11:00:00', 1),
-- Inactive user
(10, 2, 'Rohit Singh',     'rohit.singh@fleetflow.com',     '$2b$10$hashed_rohit',    FALSE, '2026-01-15 10:00:00', 1);

-- ============================================================
-- TABLE 3: vehicles
-- ============================================================
INSERT INTO vehicles (vehicle_id, license_plate, make, model, year, type, max_load_kg, fuel_tank_liters, odometer_km, acquisition_cost, status, created_by) VALUES
-- Trucks
(1,  'GJ01AB1234', 'Tata',   'Prima 4928.S',  2022, 'Truck', 10000.00, 400.00, 45230.50, 3500000.00, 'Available',      1),
(2,  'GJ01CD5678', 'Ashok Leyland', 'U3118', 2021, 'Truck', 12000.00, 450.00, 62100.00, 4200000.00, 'On Trip',        1),
(3,  'GJ01EF9012', 'Mahindra', 'Blazo X 35', 2023, 'Truck', 8000.00,  380.00, 18500.00, 3200000.00, 'In Shop',        1),
(4,  'GJ02GH3456', 'Eicher',  'Pro 6031',    2020, 'Truck', 9500.00,  420.00, 89000.00, 3800000.00, 'Available',      1),
(5,  'GJ02IJ7890', 'Tata',    'LPT 1613',    2019, 'Truck', 7500.00,  350.00, 112000.00,2800000.00, 'Out of Service', 1),
-- Vans
(6,  'GJ03KL1234', 'Force',   'Traveller 26', 2023, 'Van',  2000.00,  80.00,  8900.00,  850000.00,  'Available',      1),
(7,  'GJ03MN5678', 'Tata',    'Ace Gold',     2022, 'Van',  1500.00,  60.00,  23400.00, 720000.00,  'On Trip',        1),
(8,  'GJ04OP9012', 'Mahindra','Bolero Pik-Up',2023, 'Van',  1800.00,  70.00,  15600.00, 900000.00,  'Available',      1),
(9,  'GJ04QR3456', 'Force',   'Gurkha Van',   2021, 'Van',  1600.00,  65.00,  34200.00, 780000.00,  'Available',      1),
-- Bikes
(10, 'GJ05ST7890', 'Honda',   'CB Shine',     2023, 'Bike', 150.00,   12.00,  4500.00,  75000.00,   'Available',      1),
(11, 'GJ05UV1234', 'Hero',    'Splendor Plus',2022, 'Bike', 120.00,   10.00,  12300.00, 65000.00,   'On Trip',        1),
(12, 'GJ06WX5678', 'Bajaj',   'Pulsar 150',   2023, 'Bike', 130.00,   15.00,  6700.00,  90000.00,   'Available',      1);

-- ============================================================
-- TABLE 4: drivers
-- ============================================================
INSERT INTO drivers (driver_id, user_id, full_name, phone, email, license_number, license_type, license_expiry_date, is_license_valid, total_trips, completed_trips, safety_score, status, created_by) VALUES
-- Truck Drivers
(1,  NULL, 'Ramesh Yadav',     '+919876543210', 'ramesh.yadav@gmail.com',   'GJ-TK-20180001', 'Truck', '2027-06-30', TRUE,  45, 43, 96.50, 'Available',  1),
(2,  NULL, 'Sunil Chauhan',    '+919876543211', 'sunil.chauhan@gmail.com',  'GJ-TK-20190002', 'Truck', '2026-08-15', TRUE,  38, 36, 89.00, 'On Trip',    1),
(3,  NULL, 'Manoj Tiwari',     '+919876543212', 'manoj.tiwari@gmail.com',   'GJ-TK-20170003', 'Truck', '2025-03-20', FALSE, 61, 55, 72.50, 'Suspended',  1),
(4,  NULL, 'Dinesh Rawat',     '+919876543213', 'dinesh.rawat@gmail.com',   'GJ-TK-20210004', 'Truck', '2028-12-10', TRUE,  22, 22, 100.00,'Available',  1),
(5,  NULL, 'Prakash Solanki',  '+919876543214', 'prakash.sol@gmail.com',    'GJ-TK-20200005', 'Truck', '2027-04-25', TRUE,  31, 29, 93.00, 'Off Duty',   1),
-- Van Drivers
(6,  NULL, 'Ajay Desai',       '+919876543215', 'ajay.desai@gmail.com',     'GJ-VN-20200006', 'Van',   '2027-09-14', TRUE,  55, 54, 98.00, 'Available',  1),
(7,  NULL, 'Vijay Patil',      '+919876543216', 'vijay.patil@gmail.com',    'GJ-VN-20190007', 'Van',   '2026-11-30', TRUE,  42, 40, 91.50, 'On Trip',    1),
(8,  NULL, 'Sanjay Bhatt',     '+919876543217', 'sanjay.bhatt@gmail.com',   'GJ-VN-20220008', 'Van',   '2028-07-22', TRUE,  18, 18, 100.00,'Available',  1),
(9,  NULL, 'Kishore Jain',     '+919876543218', 'kishore.jain@gmail.com',   'GJ-VN-20180009', 'Van',   '2025-01-15', FALSE, 67, 60, 78.00, 'Off Duty',   1),
-- Bike Riders
(10, NULL, 'Ankit Sharma',     '+919876543219', 'ankit.sharma@gmail.com',   'GJ-BK-20230010', 'Bike',  '2028-03-31', TRUE,  88, 87, 99.00, 'Available',  1),
(11, NULL, 'Rohit Mishra',     '+919876543220', 'rohit.mishra@gmail.com',   'GJ-BK-20220011', 'Bike',  '2027-10-20', TRUE,  72, 71, 95.50, 'On Trip',    1),
(12, NULL, 'Deepak Rao',       '+919876543221', 'deepak.rao@gmail.com',     'GJ-BK-20210012', 'Bike',  '2026-05-18', TRUE,  64, 62, 88.00, 'Available',  1);

-- ============================================================
-- TABLE 5: shipments
-- ============================================================
INSERT INTO shipments (shipment_id, shipment_code, description, cargo_weight_kg, cargo_volume_m3, cargo_type, origin_address, destination_address, sender_name, sender_phone, receiver_name, receiver_phone, declared_value, delivery_charge, status, created_by) VALUES
-- Pending shipments (waiting for assignment)
(1,  'SHP-2026-0001', 'Industrial Steel Pipes',         4500.00, 12.50, 'General',    'GIDC Vatva, Ahmedabad, GJ',       'Rajkot Industrial Estate, Rajkot, GJ',     'Mehta Steel Works',    '+917654321001', 'Rajkot Fabricators',  '+917654321002', 850000.00,  12000.00, 'Pending',   3),
(2,  'SHP-2026-0002', 'Pharmaceutical Supplies',         380.00,  2.10, 'Fragile',    'Naroda GIDC, Ahmedabad, GJ',      'Civil Hospital, Surat, GJ',                'Pharma India Ltd',     '+917654321003', 'Civil Hospital Surat', '+917654321004', 250000.00,  5500.00,  'Pending',   3),
(3,  'SHP-2026-0003', 'Fresh Vegetables',                900.00,  4.80, 'Perishable', 'APMC Market, Ahmedabad, GJ',      'Crawford Market, Mumbai, MH',              'Gujarat Agro Traders', '+917654321005', 'Mumbai Wholesale Hub', '+917654321006', 45000.00,   8500.00,  'Pending',   4),
(4,  'SHP-2026-0004', 'Chemical Drums (Non-Flammable)',  2200.00, 8.00, 'Hazardous',  'Chemical Zone, Ankleshwar, GJ',   'MIDC Taloja, Navi Mumbai, MH',             'Gujarat Chemicals',    '+917654321007', 'Navi Mumbai Chemicals','+917654321008', 1200000.00, 18000.00, 'Pending',   3),
(5,  'SHP-2026-0005', 'Electronic Components',           120.00,  0.80, 'Fragile',    'SG Highway, Ahmedabad, GJ',       'Pune IT Park, Pune, MH',                   'Tech Components India','+917654321009', 'Pune Tech Solutions',  '+917654321010', 380000.00,  4200.00,  'Pending',   4),
-- Assigned shipments (linked to active trips)
(6,  'SHP-2026-0006', 'Textile Rolls',                   5500.00, 18.00, 'General',   'Textile Market, Surat, GJ',       'Bhiwandi Warehouse, Thane, MH',            'Surat Textiles Co',    '+917654321011', 'Bhiwandi Depot',       '+917654321012', 750000.00,  14500.00, 'In Transit',3),
(7,  'SHP-2026-0007', 'Auto Parts',                      1200.00,  5.50, 'General',   'Auto Zone, Sanand, GJ',           'Pune Auto Cluster, Pune, MH',              'Sanand Auto Parts',    '+917654321013', 'Pune Motors',          '+917654321014', 420000.00,  9800.00,  'In Transit',4),
(8,  'SHP-2026-0008', 'Courier Packages (Mixed)',          85.00,  0.60, 'Fragile',   'Navrangpura, Ahmedabad, GJ',      'Koregaon Park, Pune, MH',                  'Quick Commerce GJ',   '+917654321015', 'Pune Delivery Hub',    '+917654321016', 35000.00,   1800.00,  'In Transit',4),
-- Completed shipments
(9,  'SHP-2026-0009', 'Ceramic Tiles',                   3800.00, 14.00, 'General',   'Morbi Tile Market, Morbi, GJ',    'Delhi Wholesale Market, Delhi',            'Morbi Ceramics Ltd',   '+917654321017', 'Delhi Tiles Depot',    '+917654321018', 620000.00,  15000.00, 'Delivered', 3),
(10, 'SHP-2026-0010', 'FMCG Products',                    750.00,  3.20, 'General',   'C.G. Road, Ahmedabad, GJ',        'Indore Distribution, Indore, MP',          'FMCG India Pvt Ltd',  '+917654321019', 'Indore Distributor',   '+917654321020', 180000.00,  6500.00,  'Delivered', 4),
(11, 'SHP-2026-0011', 'Machinery Parts',                 7200.00, 22.00, 'General',   'Vatva GIDC, Ahmedabad, GJ',       'Ludhiana Industrial, Ludhiana, PB',        'Gujarat Machinery Co', '+917654321021', 'Ludhiana Industries',  '+917654321022', 950000.00,  22000.00, 'Delivered', 3),
(12, 'SHP-2026-0012', 'Organic Fruits',                   600.00,  3.50, 'Perishable','Unjha APMC, Unjha, GJ',           'Azadpur Mandi, Delhi',                     'Unjha Agro Traders',  '+917654321023', 'Delhi Fruit Market',   '+917654321024', 90000.00,   7200.00,  'Delivered', 4),
-- Cancelled
(13, 'SHP-2026-0013', 'Construction Material',           6000.00, 20.00, 'General',   'Naroda, Ahmedabad, GJ',           'Jaipur Construction Site, Jaipur, RJ',     'Build India Corp',    '+917654321025', 'Jaipur Builders',      '+917654321026', 500000.00,  11000.00, 'Cancelled', 3);

-- ============================================================
-- TABLE 6: trips
-- ============================================================
INSERT INTO trips (trip_id, trip_code, vehicle_id, driver_id, shipment_id, origin_address, destination_address, estimated_distance_km, actual_distance_km, odometer_start_km, odometer_end_km, cargo_weight_kg, scheduled_start, scheduled_end, actual_start, actual_end, estimated_fuel_liters, estimated_fuel_cost, total_fuel_cost, total_expense_cost, status, completed_at, cancelled_reason, cancelled_at, cancelled_by, created_by) VALUES
-- Active trips (In Transit)
(1, 'TRP-2026-0001', 2, 2, 6, 'Textile Market, Surat, GJ', 'Bhiwandi Warehouse, Thane, MH', 290.00, NULL,      62100.00, NULL,      5500.00, '2026-02-21 06:00:00', '2026-02-21 14:00:00', '2026-02-21 06:15:00', NULL,  58.00, 4060.00, 4060.00, 850.00,  'In Transit', NULL,                NULL,                           NULL,                NULL, 3),
(2, 'TRP-2026-0002', 7, 7, 7, 'Auto Zone, Sanand, GJ',     'Pune Auto Cluster, Pune, MH',   540.00, NULL,      23400.00, NULL,      1200.00, '2026-02-21 07:00:00', '2026-02-22 10:00:00', '2026-02-21 07:20:00', NULL,  38.00, 2660.00, 2660.00, 420.00,  'In Transit', NULL,                NULL,                           NULL,                NULL, 4),
(3, 'TRP-2026-0003', 11,11, 8, 'Navrangpura, Ahmedabad, GJ','Koregaon Park, Pune, MH',       550.00, NULL,      12300.00, NULL,      85.00,   '2026-02-21 08:00:00', '2026-02-22 08:00:00', '2026-02-21 08:30:00', NULL,  18.00, 1080.00, 1080.00, 200.00,  'In Transit', NULL,                NULL,                           NULL,                NULL, 4),
-- Completed trips
(4, 'TRP-2026-0004', 1, 1, 9, 'Morbi Tile Market, Morbi, GJ','Delhi Wholesale Market, Delhi', 980.00, 975.00,  44255.50, 45230.50,  3800.00, '2026-02-18 05:00:00', '2026-02-19 18:00:00', '2026-02-18 05:10:00', '2026-02-19 17:45:00', 196.00, 13720.00,13500.00,2800.00,'Completed',  '2026-02-19 17:45:00', NULL,                           NULL,                NULL, 3),
(5, 'TRP-2026-0005', 9, 6, 10,'C.G. Road, Ahmedabad, GJ',  'Indore Distribution, Indore, MP',320.00, 318.00,  33882.00, 34200.00,  750.00,  '2026-02-17 09:00:00', '2026-02-18 09:00:00', '2026-02-17 09:05:00', '2026-02-18 08:30:00', 22.00, 1540.00, 1510.00, 650.00,  'Completed',  '2026-02-18 08:30:00', NULL,                           NULL,                NULL, 4),
(6, 'TRP-2026-0006', 4, 4, 11,'Vatva GIDC, Ahmedabad, GJ', 'Ludhiana Industrial, Ludhiana, PB',1420.00,1415.00,87585.00,89000.00, 7200.00, '2026-02-14 04:00:00', '2026-02-16 20:00:00', '2026-02-14 04:00:00', '2026-02-16 19:30:00', 284.00,19880.00,19600.00,4200.00,'Completed',  '2026-02-16 19:30:00', NULL,                           NULL,                NULL, 3),
(7, 'TRP-2026-0007', 6, 8, 12,'Unjha APMC, Unjha, GJ',     'Azadpur Mandi, Delhi',           920.00, 922.00,  7978.00,  8900.00,   600.00,  '2026-02-15 03:00:00', '2026-02-16 15:00:00', '2026-02-15 03:00:00', '2026-02-16 14:45:00', 46.00, 3220.00, 3200.00, 900.00,  'Completed',  '2026-02-16 14:45:00', NULL,                           NULL,                NULL, 4),
-- Cancelled trip
(8, 'TRP-2026-0008', 4, 5, 13,'Naroda, Ahmedabad, GJ',     'Jaipur Construction Site, RJ',   650.00, NULL,      87000.00, NULL,      6000.00, '2026-02-20 06:00:00', '2026-02-20 20:00:00', NULL,                  NULL,  130.00, 9100.00, 0.00,    0.00,    'Cancelled',  NULL,                'Driver fell ill before departure',  '2026-02-19 22:00:00', 1,    3);

-- ============================================================
-- TABLE 7: maintenance_logs
-- ============================================================
INSERT INTO maintenance_logs (maintenance_id, maintenance_code, vehicle_id, service_type, service_description, service_provider, service_provider_phone, service_date, expected_completion, actual_completion, labour_cost, parts_cost, odometer_at_service, status, completion_notes, next_service_due_km, next_service_due_date, created_by) VALUES
-- Current In Progress (vehicle 3 is In Shop)
(1, 'MNT-2026-0001', 3, 'Engine Repair',       'Engine overheating issue — coolant leak detected, replacing radiator hose and thermostat', 'Mahindra Service Center, Ahmedabad', '+917001002001', '2026-02-20', '2026-02-23', NULL,          8500.00, 12000.00, 18500.00, 'In Progress', NULL, 28500.00, '2026-05-20', 1),
-- Scheduled future service
(2, 'MNT-2026-0002', 5, 'General Inspection',  'Annual roadworthiness inspection before considering reinstatement',                        'Tata Motors Authorised, Ahmedabad',  '+917001002002', '2026-02-25', '2026-02-25', NULL,          2000.00,   500.00, 112000.00,'Scheduled',   NULL, NULL,    '2026-02-25', 1),
-- Completed maintenance records
(3, 'MNT-2026-0003', 1, 'Oil Change',           'Regular engine oil + oil filter change at 45,000 km service interval',                   'Tata Authorised Workshop, Ahmd',     '+917001002003', '2026-02-10', '2026-02-10', '2026-02-10', 1200.00,  1800.00, 44500.00, 'Completed',   'Oil changed, filter replaced, levels normal', 50500.00, '2026-08-10', 1),
(4, 'MNT-2026-0004', 4, 'Tyre Replacement',    'All 6 tyres worn out, replaced with MRF ZV2K heavy-duty tyres',                          'MRF Tyre Centre, Ahmedabad',          '+917001002004', '2026-02-05', '2026-02-05', '2026-02-05', 3000.00, 42000.00, 86000.00, 'Completed',   'All 6 tyres replaced, alignment done',       146000.00,'2027-02-05', 1),
(5, 'MNT-2026-0005', 2, 'Brake Service',        'Front and rear brake pads worn, replacing brake pads and bleeding brake lines',          'Ashok Leyland Workshop, Surat',      '+917001002005', '2026-01-28', '2026-01-28', '2026-01-28', 2500.00,  6500.00, 61500.00, 'Completed',   'Brake pads replaced, brake fluid flushed',   81500.00, '2026-07-28', 1),
(6, 'MNT-2026-0006', 6, 'AC Service',           'AC compressor weak, refrigerant low — serviced and recharged',                           'Auto Cool Service, Ahmedabad',        '+917001002006', '2026-02-01', '2026-02-01', '2026-02-01', 1500.00,  3500.00,  7500.00, 'Completed',   'AC fully functional after recharge',          NULL,     '2027-02-01', 1),
(7, 'MNT-2026-0007', 9, 'Oil Change',           'Standard 10,000 km oil change service',                                                   'Quick Service Garage, Ahmedabad',    '+917001002007', '2026-01-15', '2026-01-15', '2026-01-15',  800.00,  1200.00, 24400.00, 'Completed',   'Oil and filter changed',                      34400.00, '2026-07-15', 1),
(8, 'MNT-2026-0008', 10,'General Inspection',   'Routine 6-month bike inspection',                                                         'Honda Service Center, Ahmedabad',    '+917001002008', '2026-01-20', '2026-01-20', '2026-01-20',  500.00,   800.00,  3500.00, 'Completed',   'All checks passed, chain lubricated',          8500.00, '2026-07-20', 1);

-- ============================================================
-- TABLE 8: fuel_logs
-- ============================================================
INSERT INTO fuel_logs (fuel_log_id, fuel_log_code, vehicle_id, trip_id, driver_id, fuel_type, liters_filled, price_per_liter, odometer_at_fuel, fuel_station_name, fuel_station_city, receipt_number, fueled_at, created_by) VALUES
-- Trip 1 (TRP-2026-0001) — Truck, Surat to Bhiwandi, In Transit
(1,  'FUEL-2026-0001', 2, 1, 2, 'Diesel', 58.00, 70.00, 62158.00, 'HP Petrol Pump',          'Surat',          'HP-2026-011001', '2026-02-21 06:00:00', 3),
-- Trip 2 (TRP-2026-0002) — Van, Sanand to Pune, In Transit
(2,  'FUEL-2026-0002', 7, 2, 7, 'Diesel', 38.00, 70.00, 23438.00, 'Indian Oil Station',      'Sanand',         'IO-2026-022001', '2026-02-21 07:00:00', 4),
-- Trip 3 (TRP-2026-0003) — Bike, Ahmedabad to Pune, In Transit
(3,  'FUEL-2026-0003',11, 3,11, 'Petrol', 10.00, 96.00, 12310.00, 'BPCL Pump',               'Ahmedabad',      'BP-2026-033001', '2026-02-21 08:00:00', 4),
(4,  'FUEL-2026-0004',11, 3,11, 'Petrol',  8.00, 96.00, 12610.00, 'Reliance Petrol Pump',    'Vadodara',       'RL-2026-033002', '2026-02-21 14:00:00', 4),
-- Trip 4 (TRP-2026-0004) — Truck, Morbi to Delhi, Completed
(5,  'FUEL-2026-0005', 1, 4, 1, 'Diesel',100.00, 69.50, 44355.50, 'Indian Oil Highway',      'Palanpur',       'IO-2026-044001', '2026-02-18 08:00:00', 3),
(6,  'FUEL-2026-0006', 1, 4, 1, 'Diesel', 96.00, 70.00, 44855.50, 'HP Highway Pump',         'Ajmer',          'HP-2026-044002', '2026-02-18 16:30:00', 3),
-- Trip 5 (TRP-2026-0005) — Van, Ahmedabad to Indore, Completed
(7,  'FUEL-2026-0007', 9, 5, 6, 'Diesel', 22.00, 68.60, 33904.00, 'BPCL Station',            'Ahmedabad',      'BP-2026-055001', '2026-02-17 09:00:00', 4),
-- Trip 6 (TRP-2026-0006) — Truck, Ahmedabad to Ludhiana, Completed
(8,  'FUEL-2026-0008', 4, 6, 4, 'Diesel',100.00, 69.50, 87685.00, 'Indian Oil Highway',      'Udaipur',        'IO-2026-066001', '2026-02-14 10:00:00', 3),
(9,  'FUEL-2026-0009', 4, 6, 4, 'Diesel', 96.00, 70.00, 88085.00, 'HP Highway Pump',         'Jaipur',         'HP-2026-066002', '2026-02-14 20:00:00', 3),
(10, 'FUEL-2026-0010', 4, 6, 4, 'Diesel', 88.00, 70.50, 88585.00, 'BPCL Highway Station',    'Delhi',          'BP-2026-066003', '2026-02-15 14:00:00', 3),
-- Trip 7 (TRP-2026-0007) — Van, Unjha to Delhi, Completed
(11, 'FUEL-2026-0011', 6, 7, 8, 'Diesel', 30.00, 69.00, 8008.00,  'Indian Oil',              'Unjha',          'IO-2026-077001', '2026-02-15 03:00:00', 4),
(12, 'FUEL-2026-0012', 6, 7, 8, 'Diesel', 16.00, 70.00, 8508.00,  'HP Petrol Pump',          'Udaipur',        'HP-2026-077002', '2026-02-15 15:00:00', 4);

-- ============================================================
-- TABLE 9: expenses
-- ============================================================
INSERT INTO expenses (expense_id, expense_code, vehicle_id, trip_id, maintenance_id, driver_id, expense_type, description, amount, receipt_number, expense_date, is_approved, approved_by, approved_at, created_by) VALUES
-- Trip 1 expenses (In Transit)
(1,  'EXP-2026-0001', 2, 1, NULL, 2, 'Toll',            'Mumbai-Surat Expressway toll',                450.00, 'TOLL-2026-001', '2026-02-21', TRUE,  1, '2026-02-21 07:00:00', 3),
(2,  'EXP-2026-0002', 2, 1, NULL, 2, 'Driver Allowance','Per diem allowance for Sunil — day trip',      400.00, NULL,            '2026-02-21', TRUE,  1, '2026-02-21 07:00:00', 3),
-- Trip 2 expenses (In Transit)
(3,  'EXP-2026-0003', 7, 2, NULL, 7, 'Toll',            'Pune Expressway toll charges',                 180.00, 'TOLL-2026-002', '2026-02-21', TRUE,  1, '2026-02-21 08:00:00', 4),
(4,  'EXP-2026-0004', 7, 2, NULL, 7, 'Driver Allowance','Overnight allowance — Vijay',                  600.00, NULL,            '2026-02-21', TRUE,  1, '2026-02-21 08:00:00', 4),
(5,  'EXP-2026-0005', 7, 2, NULL, 7, 'Parking',         'Overnight truck parking at Pune depot',        240.00, 'PRK-2026-001',  '2026-02-21', FALSE, NULL, NULL,                4),
-- Trip 3 expenses (In Transit)
(6,  'EXP-2026-0006',11, 3, NULL,11, 'Driver Allowance','Overnight allowance — Rohit Mishra',           500.00, NULL,            '2026-02-21', TRUE,  1, '2026-02-21 09:00:00', 4),
-- Trip 4 expenses (Completed)
(7,  'EXP-2026-0007', 1, 4, NULL, 1, 'Toll',            'National Highway toll — Morbi to Delhi',      1800.00, 'TOLL-2026-003', '2026-02-18', TRUE,  1, '2026-02-18 10:00:00', 3),
(8,  'EXP-2026-0008', 1, 4, NULL, 1, 'Driver Allowance','2-day trip allowance — Ramesh Yadav',         1000.00, NULL,            '2026-02-18', TRUE,  1, '2026-02-18 10:00:00', 3),
-- Trip 5 expenses (Completed)
(9,  'EXP-2026-0009', 9, 5, NULL, 6, 'Toll',            'Ahmedabad-Indore highway toll',                550.00, 'TOLL-2026-004', '2026-02-17', TRUE,  1, '2026-02-17 10:00:00', 4),
(10, 'EXP-2026-0010', 9, 5, NULL, 6, 'Loading Fee',     'Warehouse loading charges at C.G. Road',       100.00, 'LDF-2026-001',  '2026-02-17', TRUE,  1, '2026-02-17 10:00:00', 4),
-- Trip 6 expenses (Completed - Long haul)
(11, 'EXP-2026-0011', 4, 6, NULL, 4, 'Toll',            'Multi-state highway toll — Ahmedabad to Ludhiana', 3200.00, 'TOLL-2026-005', '2026-02-14', TRUE, 1, '2026-02-14 06:00:00', 3),
(12, 'EXP-2026-0012', 4, 6, NULL, 4, 'Driver Allowance','3-day long haul trip allowance',              1500.00, NULL,            '2026-02-14', TRUE,  1, '2026-02-14 06:00:00', 3),
(13, 'EXP-2026-0013', 4, 6, NULL, 4, 'Parking',         'Overnight parking at Delhi warehouse',          500.00, 'PRK-2026-002',  '2026-02-15', TRUE,  1, '2026-02-15 20:00:00', 3),
-- Trip 7 expenses (Completed)
(14, 'EXP-2026-0014', 6, 7, NULL, 8, 'Toll',            'Rajasthan and Delhi highway tolls',             720.00, 'TOLL-2026-006', '2026-02-15', TRUE,  1, '2026-02-15 05:00:00', 4),
(15, 'EXP-2026-0015', 6, 7, NULL, 8, 'Driver Allowance','2-day trip allowance — Sanjay Bhatt',         1000.00, NULL,            '2026-02-15', TRUE,  1, '2026-02-15 05:00:00', 4),
(16, 'EXP-2026-0016', 6, 7, NULL, 8, 'Tyre Puncture',   'Roadside tyre puncture repair near Ajmer',     180.00, 'TYR-2026-001',  '2026-02-15', TRUE,  1, '2026-02-15 10:00:00', 4),
-- Non-trip vehicle expenses
(17, 'EXP-2026-0017', 5, NULL,2, NULL,'Insurance',      'Annual vehicle insurance renewal — GJ02IJ7890',18500.00,'INS-2026-001', '2026-02-01', TRUE,  1, '2026-02-01 11:00:00', 8),
(18, 'EXP-2026-0018', 3, NULL,1, NULL,'Emergency Repair','Additional parts for engine repair — gasket set',3500.00,'PRT-2026-001','2026-02-20', TRUE,  1, '2026-02-20 15:00:00', 1),
-- Pending approval
(19, 'EXP-2026-0019',12, NULL,NULL,NULL,'Registration',  'Vehicle RC renewal and fitness certificate',   4500.00, 'REG-2026-001',  '2026-02-19', FALSE, NULL, NULL,               8);

-- ============================================================
-- TABLE 10: driver_status_logs
-- ============================================================
INSERT INTO driver_status_logs (driver_status_log_id, driver_id, trip_id, previous_status, new_status, changed_reason, remarks, incident_type, incident_description, safety_score_before, safety_score_after, changed_at, created_by) VALUES
-- Driver 1 (Ramesh) — Trip 4 cycle
(1,  1, 4,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                        96.50,  96.50,  '2026-02-18 05:10:00', 3),
(2,  1, 4,    'On Trip',    'Available',  'Trip Completed',         NULL,                        NULL,                NULL,                                                        96.50,  96.50,  '2026-02-19 17:45:00', 3),
-- Driver 2 (Sunil) — Current Trip 1
(3,  2, 1,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                        89.00,  89.00,  '2026-02-21 06:15:00', 3),
-- Driver 3 (Manoj) — License expired + suspension
(4,  3, NULL, 'Available',  'Suspended',  'License Expired',        'License expired on 2025-03-20, reassignment blocked',NULL,NULL,                                             78.50,  72.50,  '2025-03-21 09:00:00', 6),
-- Driver 4 (Dinesh) — Trip 6 cycle
(5,  4, 6,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                       100.00, 100.00, '2026-02-14 04:00:00', 3),
(6,  4, 6,    'On Trip',    'Available',  'Trip Completed',         NULL,                        NULL,                NULL,                                                       100.00, 100.00, '2026-02-16 19:30:00', 3),
-- Driver 5 (Prakash) — Off Duty after cancelled trip
(7,  5, 8,    'Available',  'Off Duty',   'Trip Cancelled',         'Driver reported ill, trip cancelled',NULL,        NULL,                                                       93.00,  93.00,  '2026-02-19 22:00:00', 1),
-- Driver 6 (Ajay) — Trip 5 and 7 cycles
(8,  6, 5,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                        98.00,  98.00,  '2026-02-17 09:05:00', 4),
(9,  6, 5,    'On Trip',    'Available',  'Trip Completed',         NULL,                        NULL,                NULL,                                                        98.00,  98.00,  '2026-02-18 08:30:00', 4),
-- Driver 7 (Vijay) — Current Trip 2
(10, 7, 2,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                        91.50,  91.50,  '2026-02-21 07:20:00', 4),
-- Driver 8 (Sanjay) — Trip 7 cycle
(11, 8, 7,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                       100.00, 100.00, '2026-02-15 03:00:00', 4),
(12, 8, 7,    'On Trip',    'Available',  'Trip Completed',         NULL,                        NULL,                NULL,                                                       100.00, 100.00, '2026-02-16 14:45:00', 4),
-- Driver 9 (Kishore) — License expiry → Off Duty
(13, 9, NULL, 'Available',  'Off Duty',   'License Expired',        'License expired 2025-01-15, pending renewal',NULL,  NULL,                                                   80.00,  78.00,  '2025-01-16 08:00:00', 6),
-- Driver 11 (Rohit) — Current Trip 3
(14,11, 3,    'Available',  'On Trip',    'Trip Dispatched',        NULL,                        NULL,                NULL,                                                        95.50,  95.50,  '2026-02-21 08:30:00', 4),
-- Safety incident example — Driver 3 previous violation
(15, 3, NULL, 'On Trip',    'Available',  'Trip Completed',         NULL,                        NULL,                NULL,                                                        85.00,  85.00,  '2025-02-14 18:00:00', 6),
(16, 3, NULL, 'Available',  'Suspended',  'Safety Violation',       'Driver caused accident at highway junction',  'Accident', 'Rear-end collision near Vadodara highway, minor damage to cargo vehicle, police challan issued', 85.00, 72.50, '2025-03-10 10:00:00', 6);

-- ============================================================
-- TABLE 11: vehicle_status_logs
-- ============================================================
INSERT INTO vehicle_status_logs (vehicle_status_log_id, vehicle_id, trip_id, maintenance_id, previous_status, new_status, changed_reason, remarks, odometer_at_change, changed_at, created_by) VALUES
-- Vehicle 1 (GJ01AB1234) — Trip 4 cycle
(1,  1, 4,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 44255.50, '2026-02-18 05:10:00', 3),
(2,  1, 4,    NULL, 'On Trip',       'Available',       'Trip Completed',         NULL, 45230.50, '2026-02-19 17:45:00', 3),
-- Vehicle 2 (GJ01CD5678) — Current Trip 1
(3,  2, 1,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 62100.00, '2026-02-21 06:15:00', 3),
-- Vehicle 3 (GJ01EF9012) — Maintenance In Progress
(4,  3, NULL, 1,    'Available',     'In Shop',         'Maintenance Started',    'Engine overheating repair started', 18500.00, '2026-02-20 09:00:00', 1),
-- Vehicle 4 (GJ02GH3456) — Trip 6 and 8 cycles
(5,  4, 6,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 87585.00, '2026-02-14 04:00:00', 3),
(6,  4, 6,    NULL, 'On Trip',       'Available',       'Trip Completed',         NULL, 89000.00, '2026-02-16 19:30:00', 3),
(7,  4, 8,    NULL, 'Available',     'Available',       'Trip Cancelled',         'Trip cancelled due to driver illness', 89000.00, '2026-02-19 22:00:00', 1),
-- Vehicle 5 (GJ02IJ7890) — Retired
(8,  5, NULL, NULL, 'Available',     'Out of Service',  'Manually Retired',       'Vehicle exceeded 100,000 km, deemed uneconomical for repair', 112000.00, '2026-01-10 10:00:00', 1),
-- Vehicle 6 (GJ03KL1234) — Trip 7 cycle
(9,  6, 7,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 7978.00,  '2026-02-15 03:00:00', 4),
(10, 6, 7,    NULL, 'On Trip',       'Available',       'Trip Completed',         NULL, 8900.00,  '2026-02-16 14:45:00', 4),
-- Vehicle 6 — Previous maintenance cycle
(11, 6, NULL, 6,    'Available',     'In Shop',         'Maintenance Started',    'AC compressor service', 7500.00, '2026-02-01 09:00:00', 1),
(12, 6, NULL, 6,    'In Shop',       'Available',       'Maintenance Completed',  'AC fully serviced', 7500.00, '2026-02-01 17:00:00', 1),
-- Vehicle 7 (GJ03MN5678) — Current Trip 2
(13, 7, 2,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 23400.00, '2026-02-21 07:20:00', 4),
-- Vehicle 9 (GJ04QR3456) — Trip 5 cycle
(14, 9, 5,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 33882.00, '2026-02-17 09:05:00', 4),
(15, 9, 5,    NULL, 'On Trip',       'Available',       'Trip Completed',         NULL, 34200.00, '2026-02-18 08:30:00', 4),
-- Vehicle 11 (GJ05UV1234) — Current Trip 3
(16,11, 3,    NULL, 'Available',     'On Trip',         'Trip Dispatched',        NULL, 12300.00, '2026-02-21 08:30:00', 4),
-- Vehicle 1 — Previous maintenance (oil change)
(17, 1, NULL, 3,    'Available',     'In Shop',         'Maintenance Started',    'Routine oil change', 44500.00, '2026-02-10 09:00:00', 1),
(18, 1, NULL, 3,    'In Shop',       'Available',       'Maintenance Completed',  'Oil change done', 44500.00, '2026-02-10 15:00:00', 1),
-- Vehicle 4 — Tyre replacement
(19, 4, NULL, 4,    'Available',     'In Shop',         'Maintenance Started',    'All tyres replacement', 86000.00, '2026-02-05 09:00:00', 1),
(20, 4, NULL, 4,    'In Shop',       'Available',       'Maintenance Completed',  'All 6 tyres replaced', 86000.00, '2026-02-05 18:00:00', 1);

-- ============================================================
-- RE-ENABLE FK CHECKS
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- VERIFICATION QUERIES — Run after seeding to confirm data
-- ============================================================

-- Quick count check
SELECT 'roles'               AS tbl, COUNT(*) AS row_count FROM roles
UNION ALL SELECT 'users',               COUNT(*) FROM users
UNION ALL SELECT 'vehicles',            COUNT(*) FROM vehicles
UNION ALL SELECT 'drivers',             COUNT(*) FROM drivers
UNION ALL SELECT 'shipments',           COUNT(*) FROM shipments
UNION ALL SELECT 'trips',               COUNT(*) FROM trips
UNION ALL SELECT 'maintenance_logs',    COUNT(*) FROM maintenance_logs
UNION ALL SELECT 'fuel_logs',           COUNT(*) FROM fuel_logs
UNION ALL SELECT 'expenses',            COUNT(*) FROM expenses
UNION ALL SELECT 'driver_status_logs',  COUNT(*) FROM driver_status_logs
UNION ALL SELECT 'vehicle_status_logs', COUNT(*) FROM vehicle_status_logs;

-- Dashboard KPIs preview
SELECT
  (SELECT COUNT(*) FROM vehicles  WHERE status = 'On Trip'   AND is_deleted = FALSE) AS active_fleet,
  (SELECT COUNT(*) FROM vehicles  WHERE status = 'In Shop'   AND is_deleted = FALSE) AS maintenance_alerts,
  (SELECT COUNT(*) FROM shipments WHERE status = 'Pending'   AND is_deleted = FALSE) AS pending_cargo,
  ROUND(
    (SELECT COUNT(*) FROM vehicles WHERE status = 'On Trip' AND is_deleted = FALSE)
    / (SELECT COUNT(*) FROM vehicles WHERE is_deleted = FALSE) * 100, 1
  ) AS utilization_rate_pct;

-- ============================================================
-- SEED COMPLETE — FleetFlow v1.0
-- ============================================================
