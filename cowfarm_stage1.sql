-- =====================================================
-- COW FARMING MANAGEMENT SYSTEM  (MySQL 8.0+)
-- Stage 1: Database creation, tables, sample data
-- =====================================================

DROP DATABASE IF EXISTS cow_farm_db;
CREATE DATABASE cow_farm_db;
USE cow_farm_db;

-- 1. COW (parent table)
CREATE TABLE cow (
    cow_id            INT AUTO_INCREMENT PRIMARY KEY,
    cow_name          VARCHAR(50)  NOT NULL UNIQUE,
    breed             VARCHAR(50)  NOT NULL,
    age               INT          NOT NULL,
    gender            ENUM('Female','Male') NOT NULL DEFAULT 'Female',
    weight            DECIMAL(6,2) NOT NULL,
    registration_date DATE         NOT NULL,
    health_status     ENUM('Healthy','Under Treatment','Pregnant','Sick')
                      NOT NULL DEFAULT 'Healthy',
    CONSTRAINT chk_cow_age    CHECK (age BETWEEN 0 AND 25),
    CONSTRAINT chk_cow_weight CHECK (weight > 0)
);

-- 2. VETERINARIAN (separate table so vet details are not repeated -> 3NF)
CREATE TABLE veterinarian (
    vet_id   INT AUTO_INCREMENT PRIMARY KEY,
    vet_name VARCHAR(60) NOT NULL,
    phone    VARCHAR(15) NOT NULL UNIQUE,
    clinic   VARCHAR(80)
);

-- 3. MILK PRODUCTION
CREATE TABLE milk_production (
    production_id   INT AUTO_INCREMENT PRIMARY KEY,
    cow_id          INT NOT NULL,
    production_date DATE NOT NULL,
    morning_qty     DECIMAL(5,2) NOT NULL DEFAULT 0,
    evening_qty     DECIMAL(5,2) NOT NULL DEFAULT 0,
    total_qty       DECIMAL(6,2) GENERATED ALWAYS AS (morning_qty + evening_qty) STORED,
    CONSTRAINT fk_milk_cow FOREIGN KEY (cow_id) REFERENCES cow(cow_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_milk_qty CHECK (morning_qty >= 0 AND evening_qty >= 0),
    CONSTRAINT uq_cow_day UNIQUE (cow_id, production_date)
);

-- 4. FEEDING
CREATE TABLE feeding (
    feed_id      INT AUTO_INCREMENT PRIMARY KEY,
    cow_id       INT NOT NULL,
    feed_type    VARCHAR(50) NOT NULL,
    feed_qty_kg  DECIMAL(6,2) NOT NULL,
    feeding_date DATE NOT NULL,
    feed_cost    DECIMAL(8,2) NOT NULL,
    CONSTRAINT fk_feed_cow FOREIGN KEY (cow_id) REFERENCES cow(cow_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_feed CHECK (feed_qty_kg > 0 AND feed_cost >= 0)
);

-- 5. HEALTH RECORD (also resolves many-to-many between COW and VETERINARIAN)
CREATE TABLE health_record (
    record_id        INT AUTO_INCREMENT PRIMARY KEY,
    cow_id           INT NOT NULL,
    vet_id           INT NOT NULL,
    disease_details  VARCHAR(150) NOT NULL DEFAULT 'Routine checkup',
    treatment        VARCHAR(150),
    vaccination_date DATE,
    record_date      DATE NOT NULL,
    CONSTRAINT fk_health_cow FOREIGN KEY (cow_id) REFERENCES cow(cow_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_health_vet FOREIGN KEY (vet_id) REFERENCES veterinarian(vet_id)
        ON UPDATE CASCADE
);

-- 6. BREEDING
CREATE TABLE breeding (
    breeding_id            INT AUTO_INCREMENT PRIMARY KEY,
    cow_id                 INT NOT NULL,
    breeding_date          DATE NOT NULL,
    pregnancy_status       ENUM('Pending','Confirmed','Not Pregnant','Delivered')
                           NOT NULL DEFAULT 'Pending',
    expected_delivery_date DATE,
    CONSTRAINT fk_breed_cow FOREIGN KEY (cow_id) REFERENCES cow(cow_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT chk_delivery CHECK (expected_delivery_date IS NULL
                                   OR expected_delivery_date > breeding_date)
);

-- 7. MILK SALES
CREATE TABLE milk_sales (
    sale_id         INT AUTO_INCREMENT PRIMARY KEY,
    sale_date       DATE NOT NULL,
    customer_name   VARCHAR(60) NOT NULL,
    milk_qty        DECIMAL(6,2) NOT NULL,
    price_per_litre DECIMAL(6,2) NOT NULL DEFAULT 50.00,
    total_amount    DECIMAL(10,2) GENERATED ALWAYS AS (milk_qty * price_per_litre) STORED,
    CONSTRAINT chk_sale CHECK (milk_qty > 0 AND price_per_litre > 0)
);

-- 8. EXPENSE
CREATE TABLE expense (
    expense_id          INT AUTO_INCREMENT PRIMARY KEY,
    expense_category    ENUM('Feed','Medicine','Labour','Electricity','Maintenance','Other')
                        NOT NULL,
    expense_description VARCHAR(150) NOT NULL,
    expense_date        DATE NOT NULL,
    amount              DECIMAL(10,2) NOT NULL,
    CONSTRAINT chk_amount CHECK (amount > 0)
);

-- =====================================================
-- SAMPLE DATA
-- =====================================================

INSERT INTO cow (cow_name, breed, age, gender, weight, registration_date, health_status) VALUES
('Lakshmi', 'Holstein Friesian', 5, 'Female', 520.50, '2023-04-10', 'Healthy'),
('Gowri',   'Jersey',            4, 'Female', 410.00, '2023-06-15', 'Healthy'),
('Kamadhenu','Gir',              6, 'Female', 480.75, '2022-12-01', 'Pregnant'),
('Nandini', 'Sahiwal',           3, 'Female', 390.25, '2024-02-20', 'Healthy'),
('Radha',   'Holstein Friesian', 7, 'Female', 545.00, '2022-08-05', 'Under Treatment'),
('Sundari', 'Jersey',            2, 'Female', 330.00, '2025-01-12', 'Healthy'),
('Bheema',  'Hallikar',          4, 'Male',   450.00, '2023-09-18', 'Healthy'),
('Ganga',   'Gir',               5, 'Female', 465.50, '2023-03-25', 'Sick');

INSERT INTO veterinarian (vet_name, phone, clinic) VALUES
('Dr. Ramesh Gowda',  '9845012345', 'Gowda Veterinary Clinic'),
('Dr. Anitha Rao',    '9880123456', 'Rao Animal Care'),
('Dr. Suresh Patil',  '9741234567', 'Government Veterinary Hospital');

INSERT INTO milk_production (cow_id, production_date, morning_qty, evening_qty) VALUES
(1, '2026-11-10', 12.50, 10.00), (2, '2026-11-10',  8.00,  7.00),
(3, '2026-11-10',  9.50,  8.50), (4, '2026-11-10',  6.00,  5.50),
(5, '2026-11-10',  7.00,  6.00),
(1, '2026-11-11', 13.00, 10.50), (2, '2026-11-11',  8.50,  7.50),
(3, '2026-11-11',  9.00,  8.00), (4, '2026-11-11',  6.50,  5.00),
(5, '2026-11-11',  5.50,  4.50),
(1, '2026-11-12', 12.00, 11.00), (2, '2026-11-12',  8.00,  7.20),
(3, '2026-11-12',  9.20,  8.30), (4, '2026-11-12',  6.20,  5.80),
(5, '2026-11-12',  5.00,  4.00);

INSERT INTO feeding (cow_id, feed_type, feed_qty_kg, feeding_date, feed_cost) VALUES
(1, 'Green Fodder',    25.00, '2026-11-10', 150.00),
(1, 'Cattle Feed',      5.00, '2026-11-10', 140.00),
(2, 'Green Fodder',    20.00, '2026-11-10', 120.00),
(3, 'Dry Fodder',      10.00, '2026-11-11',  80.00),
(4, 'Cattle Feed',      4.00, '2026-11-11', 112.00),
(5, 'Green Fodder',    22.00, '2026-11-11', 132.00),
(6, 'Cattle Feed',      3.50, '2026-11-12',  98.00),
(7, 'Dry Fodder',      12.00, '2026-11-12',  96.00);

INSERT INTO health_record (cow_id, vet_id, disease_details, treatment, vaccination_date, record_date) VALUES
(1, 1, 'Routine checkup',   'Vitamin supplements',          NULL,         '2026-09-05'),
(2, 2, 'Foot and Mouth Disease vaccination', 'Vaccination given', '2026-09-20', '2026-09-20'),
(5, 1, 'Mastitis',          'Antibiotic course for 5 days', NULL,         '2026-11-08'),
(8, 3, 'Fever and loss of appetite', 'Antipyretics and fluids', NULL,     '2026-11-11'),
(3, 2, 'Pregnancy checkup', 'Calcium supplements',          NULL,         '2026-10-15'),
(4, 3, 'Lumpy Skin Disease vaccination', 'Vaccination given', '2026-10-02', '2026-10-02');

INSERT INTO breeding (cow_id, breeding_date, pregnancy_status, expected_delivery_date) VALUES
(3, '2026-03-01', 'Confirmed',    '2026-12-08'),
(1, '2026-01-26', 'Delivered',    '2026-11-05'),
(4, '2026-10-05', 'Pending',      NULL),
(6, '2026-08-15', 'Not Pregnant', NULL);

INSERT INTO milk_sales (sale_date, customer_name, milk_qty, price_per_litre) VALUES
('2026-11-10', 'Nandini Dairy',   30.00, 52.00),
('2026-11-10', 'Ravi Kumar',      10.00, 55.00),
('2026-11-11', 'Nandini Dairy',   28.00, 52.00),
('2026-11-11', 'Sri Sai Sweets',  15.00, 54.00),
('2026-11-12', 'Nandini Dairy',   26.50, 52.00),
('2026-11-12', 'Meena Stores',     8.00, 56.00);

INSERT INTO expense (expense_category, expense_description, expense_date, amount) VALUES
('Feed',        'Cattle feed bags (10 bags)',    '2026-11-03', 7500.00),
('Feed',        'Green fodder purchase',         '2026-11-07', 3200.00),
('Medicine',    'Antibiotics for mastitis',      '2026-11-08',  850.00),
('Labour',      'Monthly wages for farm helper', '2026-11-01', 9000.00),
('Electricity', 'Farm electricity bill',         '2026-11-05', 1800.00),
('Maintenance', 'Shed roof repair',              '2026-11-09', 2600.00),
('Medicine',    'Vaccines purchase',             '2026-10-02', 1200.00),
('Other',       'Transport of milk',             '2026-11-12',  400.00);

-- Quick check
SELECT 'cow' AS tbl, COUNT(*) AS rows_count FROM cow
UNION ALL SELECT 'veterinarian', COUNT(*) FROM veterinarian
UNION ALL SELECT 'milk_production', COUNT(*) FROM milk_production
UNION ALL SELECT 'feeding', COUNT(*) FROM feeding
UNION ALL SELECT 'health_record', COUNT(*) FROM health_record
UNION ALL SELECT 'breeding', COUNT(*) FROM breeding
UNION ALL SELECT 'milk_sales', COUNT(*) FROM milk_sales
UNION ALL SELECT 'expense', COUNT(*) FROM expense;
