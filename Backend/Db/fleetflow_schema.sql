-- ============================================================
--  FLEETFLOW — Complete Database Schema
--  Compatible with: MySQL 8.0+
--  Run this in DBeaver as a full script
-- ============================================================

-- Create & select database
CREATE DATABASE IF NOT EXISTS fleetflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fleetflow;

-- Disable FK checks so drops/creates work in any order
SET FOREIGN_KEY_CHECKS = 0;


-- Drop tables in reverse FK order (safe re-run, IF EXISTS prevents errors on first run)
DROP TABLE IF EXISTS fleetflow.vehicle_status_logs;
DROP TABLE IF EXISTS fleetflow.driver_status_logs;
DROP TABLE IF EXISTS fleetflow.expenses;
DROP TABLE IF EXISTS fleetflow.fuel_logs;
DROP TABLE IF EXISTS fleetflow.maintenance_logs;
DROP TABLE IF EXISTS fleetflow.trips;
DROP TABLE IF EXISTS fleetflow.shipments;
DROP TABLE IF EXISTS fleetflow.drivers;
DROP TABLE IF EXISTS fleetflow.vehicles;
DROP TABLE IF EXISTS fleetflow.users;
DROP TABLE IF EXISTS fleetflow.roles;

-- ============================================================
-- TABLE 1: roles
-- ============================================================
CREATE TABLE roles (
    role_id     INT PRIMARY KEY AUTO_INCREMENT,
    name        ENUM('Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst')
                NOT NULL UNIQUE,

    -- Audit Columns
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by  INT NULL,
    updated_by  INT NULL,
    is_deleted  BOOLEAN DEFAULT FALSE
);

-- ============================================================
-- TABLE 2: users
-- ============================================================
CREATE TABLE users (
    user_id       INT PRIMARY KEY AUTO_INCREMENT,
    role_id       INT NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    last_login    DATETIME NULL,

    -- Audit Columns
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by    INT NULL,
    updated_by    INT NULL,
    is_deleted    BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_users_role       FOREIGN KEY (role_id)    REFERENCES roles(role_id),
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- Add FK back to roles after users exists
ALTER TABLE roles
    ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id);

-- ============================================================
-- TABLE 3: vehicles
-- ============================================================
CREATE TABLE vehicles (
    vehicle_id        INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    license_plate     VARCHAR(20) NOT NULL UNIQUE,
    make              VARCHAR(50) NOT NULL,
    model             VARCHAR(50) NOT NULL,
    year              YEAR NOT NULL,
    type              ENUM('Truck', 'Van', 'Bike') NOT NULL,

    -- Capacity
    max_load_kg       DECIMAL(10,2) NOT NULL,
    fuel_tank_liters  DECIMAL(6,2) NOT NULL,

    -- Tracking
    odometer_km       DECIMAL(10,2) DEFAULT 0.00,
    acquisition_cost  DECIMAL(12,2) NOT NULL,

    -- Status
    status            ENUM(
                        'Available',
                        'On Trip',
                        'In Shop',
                        'Out of Service'
                      ) DEFAULT 'Available',

    -- Audit Columns
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        INT NULL,
    updated_by        INT NULL,
    is_deleted        BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_vehicles_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_vehicles_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 4: drivers
-- ============================================================
CREATE TABLE drivers (
    driver_id           INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    user_id             INT NULL,
    full_name           VARCHAR(100) NOT NULL,
    phone               VARCHAR(20) NOT NULL UNIQUE,
    email               VARCHAR(150) NULL UNIQUE,
    profile_photo_url   VARCHAR(255) NULL,

    -- License Details
    license_number      VARCHAR(50) NOT NULL UNIQUE,
    license_type        ENUM('Truck', 'Van', 'Bike') NOT NULL,
    license_expiry_date DATE NOT NULL,
    is_license_valid    BOOLEAN DEFAULT TRUE,

    -- Performance Metrics
    total_trips         INT DEFAULT 0,
    completed_trips     INT DEFAULT 0,
    safety_score        DECIMAL(5,2) DEFAULT 100.00,

    -- Status
    status              ENUM(
                          'Available',
                          'On Trip',
                          'Off Duty',
                          'Suspended'
                        ) DEFAULT 'Available',

    -- Audit Columns
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          INT NULL,
    updated_by          INT NULL,
    is_deleted          BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_drivers_user_id    FOREIGN KEY (user_id)    REFERENCES users(user_id),
    CONSTRAINT fk_drivers_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_drivers_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 5: shipments
-- ============================================================
CREATE TABLE shipments (
    shipment_id         INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    shipment_code       VARCHAR(30) NOT NULL UNIQUE,
    description         VARCHAR(255) NOT NULL,

    -- Cargo Details
    cargo_weight_kg     DECIMAL(10,2) NOT NULL,
    cargo_volume_m3     DECIMAL(8,2) NULL,
    cargo_type          ENUM(
                          'General',
                          'Fragile',
                          'Perishable',
                          'Hazardous'
                        ) DEFAULT 'General',

    -- Locations
    origin_address      VARCHAR(255) NOT NULL,
    destination_address VARCHAR(255) NOT NULL,
    origin_lat          DECIMAL(10,8) NULL,
    origin_lng          DECIMAL(11,8) NULL,
    destination_lat     DECIMAL(10,8) NULL,
    destination_lng     DECIMAL(11,8) NULL,

    -- Sender & Receiver
    sender_name         VARCHAR(100) NOT NULL,
    sender_phone        VARCHAR(20) NOT NULL,
    receiver_name       VARCHAR(100) NOT NULL,
    receiver_phone      VARCHAR(20) NOT NULL,

    -- Financial
    declared_value      DECIMAL(12,2) NULL,
    delivery_charge     DECIMAL(10,2) DEFAULT 0.00,

    -- Status
    status              ENUM(
                          'Pending',
                          'Assigned',
                          'In Transit',
                          'Delivered',
                          'Cancelled'
                        ) DEFAULT 'Pending',

    -- Audit Columns
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          INT NULL,
    updated_by          INT NULL,
    is_deleted          BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_shipments_created_by FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_shipments_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 6: trips
-- ============================================================
CREATE TABLE trips (
    trip_id                INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    trip_code              VARCHAR(30) NOT NULL UNIQUE,

    -- Core Relations
    vehicle_id             INT NOT NULL,
    driver_id              INT NOT NULL,
    shipment_id            INT NOT NULL,

    -- Route Details
    origin_address         VARCHAR(255) NOT NULL,
    destination_address    VARCHAR(255) NOT NULL,
    estimated_distance_km  DECIMAL(10,2) NULL,
    actual_distance_km     DECIMAL(10,2) NULL,

    -- Odometer Snapshot
    odometer_start_km      DECIMAL(10,2) NOT NULL,
    odometer_end_km        DECIMAL(10,2) NULL,

    -- Cargo Snapshot
    cargo_weight_kg        DECIMAL(10,2) NOT NULL,

    -- Timing
    scheduled_start        DATETIME NOT NULL,
    scheduled_end          DATETIME NOT NULL,
    actual_start           DATETIME NULL,
    actual_end             DATETIME NULL,

    -- Estimated Fuel
    estimated_fuel_liters  DECIMAL(8,2) NULL,
    estimated_fuel_cost    DECIMAL(10,2) NULL,

    -- Financial Summary
    total_fuel_cost        DECIMAL(10,2) DEFAULT 0.00,
    total_expense_cost     DECIMAL(10,2) DEFAULT 0.00,
    total_trip_cost        DECIMAL(10,2)
                           GENERATED ALWAYS AS (total_fuel_cost + total_expense_cost) STORED,

    -- Status
    status                 ENUM(
                             'Draft',
                             'Dispatched',
                             'In Transit',
                             'Completed',
                             'Cancelled'
                           ) DEFAULT 'Draft',

    -- Cancellation
    cancelled_reason       VARCHAR(255) NULL,
    cancelled_at           DATETIME NULL,
    cancelled_by           INT NULL,

    -- Completion
    completed_at           DATETIME NULL,
    completion_notes       VARCHAR(255) NULL,

    -- Audit Columns
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by             INT NULL,
    updated_by             INT NULL,
    is_deleted             BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_trips_vehicle      FOREIGN KEY (vehicle_id)   REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_trips_driver       FOREIGN KEY (driver_id)    REFERENCES drivers(driver_id),
    CONSTRAINT fk_trips_shipment     FOREIGN KEY (shipment_id)  REFERENCES shipments(shipment_id),
    CONSTRAINT fk_trips_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES users(user_id),
    CONSTRAINT fk_trips_created_by   FOREIGN KEY (created_by)   REFERENCES users(user_id),
    CONSTRAINT fk_trips_updated_by   FOREIGN KEY (updated_by)   REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 7: maintenance_logs
-- ============================================================
CREATE TABLE maintenance_logs (
    maintenance_id         INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    maintenance_code       VARCHAR(30) NOT NULL UNIQUE,

    -- Core Relation
    vehicle_id             INT NOT NULL,

    -- Service Details
    service_type           ENUM(
                             'Oil Change',
                             'Tyre Replacement',
                             'Brake Service',
                             'Engine Repair',
                             'Body Work',
                             'Electrical',
                             'AC Service',
                             'General Inspection',
                             'Other'
                           ) NOT NULL,
    service_description    TEXT NULL,
    service_provider       VARCHAR(150) NULL,
    service_provider_phone VARCHAR(20) NULL,

    -- Timing
    service_date           DATE NOT NULL,
    expected_completion    DATE NOT NULL,
    actual_completion      DATE NULL,

    -- Financial
    labour_cost            DECIMAL(10,2) DEFAULT 0.00,
    parts_cost             DECIMAL(10,2) DEFAULT 0.00,
    total_cost             DECIMAL(10,2)
                           GENERATED ALWAYS AS (labour_cost + parts_cost) STORED,

    -- Odometer at Service
    odometer_at_service    DECIMAL(10,2) NOT NULL,

    -- Status
    status                 ENUM(
                             'Scheduled',
                             'In Progress',
                             'Completed',
                             'Cancelled'
                           ) DEFAULT 'Scheduled',

    -- Completion Notes
    completion_notes       TEXT NULL,
    next_service_due_km    DECIMAL(10,2) NULL,
    next_service_due_date  DATE NULL,

    -- Audit Columns
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by             INT NULL,
    updated_by             INT NULL,
    is_deleted             BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_maintenance_vehicle    FOREIGN KEY (vehicle_id)  REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_maintenance_created_by FOREIGN KEY (created_by)  REFERENCES users(user_id),
    CONSTRAINT fk_maintenance_updated_by FOREIGN KEY (updated_by)  REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 8: fuel_logs
-- ============================================================
CREATE TABLE fuel_logs (
    fuel_log_id         INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    fuel_log_code       VARCHAR(30) NOT NULL UNIQUE,

    -- Core Relations
    vehicle_id          INT NOT NULL,
    trip_id             INT NOT NULL,
    driver_id           INT NOT NULL,

    -- Fuel Details
    fuel_type           ENUM(
                          'Petrol',
                          'Diesel',
                          'CNG',
                          'Electric'
                        ) NOT NULL,
    liters_filled       DECIMAL(8,2) NOT NULL,
    price_per_liter     DECIMAL(6,2) NOT NULL,
    total_fuel_cost     DECIMAL(10,2)
                        GENERATED ALWAYS AS (liters_filled * price_per_liter) STORED,

    -- Odometer At Fueling
    odometer_at_fuel    DECIMAL(10,2) NOT NULL,

    -- Location
    fuel_station_name   VARCHAR(150) NULL,
    fuel_station_city   VARCHAR(100) NULL,

    -- Receipt
    receipt_number      VARCHAR(100) NULL,
    receipt_photo_url   VARCHAR(255) NULL,

    -- Timing
    fueled_at           DATETIME NOT NULL,

    -- Audit Columns
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          INT NULL,
    updated_by          INT NULL,
    is_deleted          BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_fuel_vehicle    FOREIGN KEY (vehicle_id)  REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_fuel_trip       FOREIGN KEY (trip_id)     REFERENCES trips(trip_id),
    CONSTRAINT fk_fuel_driver     FOREIGN KEY (driver_id)   REFERENCES drivers(driver_id),
    CONSTRAINT fk_fuel_created_by FOREIGN KEY (created_by)  REFERENCES users(user_id),
    CONSTRAINT fk_fuel_updated_by FOREIGN KEY (updated_by)  REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 9: expenses
-- ============================================================
CREATE TABLE expenses (
    expense_id        INT PRIMARY KEY AUTO_INCREMENT,

    -- Identity
    expense_code      VARCHAR(30) NOT NULL UNIQUE,

    -- Core Relations
    vehicle_id        INT NOT NULL,
    trip_id           INT NULL,
    maintenance_id    INT NULL,
    driver_id         INT NULL,

    -- Expense Details
    expense_type      ENUM(
                        'Toll',
                        'Parking',
                        'Loading Fee',
                        'Unloading Fee',
                        'Fine/Penalty',
                        'Driver Allowance',
                        'Tyre Puncture',
                        'Emergency Repair',
                        'Cleaning',
                        'Insurance',
                        'Registration',
                        'Other'
                      ) NOT NULL,
    description       VARCHAR(255) NULL,
    amount            DECIMAL(10,2) NOT NULL,

    -- Receipt & Proof
    receipt_number    VARCHAR(100) NULL,
    receipt_photo_url VARCHAR(255) NULL,

    -- Timing
    expense_date      DATE NOT NULL,

    -- Approval
    is_approved       BOOLEAN DEFAULT FALSE,
    approved_by       INT NULL,
    approved_at       DATETIME NULL,

    -- Audit Columns
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by        INT NULL,
    updated_by        INT NULL,
    is_deleted        BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_expense_vehicle     FOREIGN KEY (vehicle_id)    REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_expense_trip        FOREIGN KEY (trip_id)       REFERENCES trips(trip_id),
    CONSTRAINT fk_expense_maintenance FOREIGN KEY (maintenance_id)REFERENCES maintenance_logs(maintenance_id),
    CONSTRAINT fk_expense_driver      FOREIGN KEY (driver_id)     REFERENCES drivers(driver_id),
    CONSTRAINT fk_expense_approved_by FOREIGN KEY (approved_by)   REFERENCES users(user_id),
    CONSTRAINT fk_expense_created_by  FOREIGN KEY (created_by)    REFERENCES users(user_id),
    CONSTRAINT fk_expense_updated_by  FOREIGN KEY (updated_by)    REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 10: driver_status_logs
-- ============================================================
CREATE TABLE driver_status_logs (
    driver_status_log_id  INT PRIMARY KEY AUTO_INCREMENT,

    -- Core Relations
    driver_id             INT NOT NULL,
    trip_id               INT NULL,

    -- Status Change
    previous_status       ENUM(
                            'Available',
                            'On Trip',
                            'Off Duty',
                            'Suspended'
                          ) NOT NULL,
    new_status            ENUM(
                            'Available',
                            'On Trip',
                            'Off Duty',
                            'Suspended'
                          ) NOT NULL,
    changed_reason        ENUM(
                            'Trip Dispatched',
                            'Trip Completed',
                            'Trip Cancelled',
                            'License Expired',
                            'Safety Violation',
                            'Medical Leave',
                            'Disciplinary Action',
                            'Manually Set by Manager',
                            'Reinstated',
                            'Other'
                          ) NOT NULL,
    remarks               VARCHAR(255) NULL,

    -- Safety Incident
    incident_type         ENUM(
                            'Accident',
                            'Traffic Violation',
                            'Cargo Damage',
                            'Late Delivery',
                            'Unauthorized Stop',
                            'Other'
                          ) NULL,
    incident_description  TEXT NULL,
    safety_score_before   DECIMAL(5,2) NULL,
    safety_score_after    DECIMAL(5,2) NULL,

    -- Timing
    changed_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit Columns
    created_at            DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at            DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by            INT NULL,
    updated_by            INT NULL,
    is_deleted            BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_dsl_driver      FOREIGN KEY (driver_id)  REFERENCES drivers(driver_id),
    CONSTRAINT fk_dsl_trip        FOREIGN KEY (trip_id)    REFERENCES trips(trip_id),
    CONSTRAINT fk_dsl_created_by  FOREIGN KEY (created_by) REFERENCES users(user_id),
    CONSTRAINT fk_dsl_updated_by  FOREIGN KEY (updated_by) REFERENCES users(user_id)
);

-- ============================================================
-- TABLE 11: vehicle_status_logs
-- ============================================================
CREATE TABLE vehicle_status_logs (
    vehicle_status_log_id  INT PRIMARY KEY AUTO_INCREMENT,

    -- Core Relations
    vehicle_id             INT NOT NULL,
    trip_id                INT NULL,
    maintenance_id         INT NULL,

    -- Status Change
    previous_status        ENUM(
                             'Available',
                             'On Trip',
                             'In Shop',
                             'Out of Service'
                           ) NOT NULL,
    new_status             ENUM(
                             'Available',
                             'On Trip',
                             'In Shop',
                             'Out of Service'
                           ) NOT NULL,
    changed_reason         ENUM(
                             'Trip Dispatched',
                             'Trip Completed',
                             'Trip Cancelled',
                             'Maintenance Started',
                             'Maintenance Completed',
                             'Maintenance Cancelled',
                             'Manually Retired',
                             'Manually Reinstated',
                             'Other'
                           ) NOT NULL,
    remarks                VARCHAR(255) NULL,

    -- Odometer Snapshot
    odometer_at_change     DECIMAL(10,2) NOT NULL,

    -- Timing
    changed_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit Columns
    created_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by             INT NULL,
    updated_by             INT NULL,
    is_deleted             BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_vsl_vehicle     FOREIGN KEY (vehicle_id)     REFERENCES vehicles(vehicle_id),
    CONSTRAINT fk_vsl_trip        FOREIGN KEY (trip_id)        REFERENCES trips(trip_id),
    CONSTRAINT fk_vsl_maintenance FOREIGN KEY (maintenance_id) REFERENCES maintenance_logs(maintenance_id),
    CONSTRAINT fk_vsl_created_by  FOREIGN KEY (created_by)     REFERENCES users(user_id),
    CONSTRAINT fk_vsl_updated_by  FOREIGN KEY (updated_by)     REFERENCES users(user_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Seed Roles
INSERT INTO roles (name, created_by) VALUES
('Manager',           NULL),
('Dispatcher',        NULL),
('Safety Officer',    NULL),
('Financial Analyst', NULL);

-- Seed Admin User (password: Admin@123 — replace hash with bcrypt in production)
INSERT INTO users (role_id, full_name, email, password_hash, is_active, created_by) VALUES
(1, 'Super Admin', 'admin@fleetflow.com', '$2b$10$placeholder_bcrypt_hash', TRUE, NULL);

-- ============================================================
-- SCHEMA COMPLETE — 11 Tables | FleetFlow v1.0
-- ============================================================

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;
