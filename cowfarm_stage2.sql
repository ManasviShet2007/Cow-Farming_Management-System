-- =====================================================
-- COW FARMING MANAGEMENT SYSTEM  (MySQL 8.0+)
-- Stage 2: Queries, Views, Stored Procedures, Triggers
-- Run cow_farm_stage1.sql FIRST.
-- =====================================================
USE cow_farm_db;

CREATE INDEX idx_milk_date ON milk_production(production_date);
CREATE INDEX idx_sale_date ON milk_sales(sale_date);

-- =====================================================
-- PART A: SELECT QUERIES (30) with expected output
-- =====================================================

-- Q1. Show all cows.
SELECT * FROM cow;
-- Output: 8 rows (Lakshmi ... Ganga)

-- Q2. Total number of cows (report).
SELECT COUNT(*) AS total_cows FROM cow;
-- Output: 8

-- Q3. Female cows, oldest first (WHERE + ORDER BY).
SELECT cow_name, breed, age FROM cow
WHERE gender = 'Female'
ORDER BY age DESC, cow_name;
-- Output: Radha 7 | Kamadhenu 6 | Ganga 5 | Lakshmi 5 | Gowri 4 | Nandini 3 | Sundari 2

-- Q4. Number of cows in each breed (GROUP BY + COUNT).
SELECT breed, COUNT(*) AS no_of_cows FROM cow
GROUP BY breed;
-- Output: Holstein Friesian 2 | Jersey 2 | Gir 2 | Sahiwal 1 | Hallikar 1

-- Q5. Cows grouped by health status.
SELECT health_status, COUNT(*) AS no_of_cows FROM cow
GROUP BY health_status;
-- Output: Healthy 5 | Pregnant 1 | Under Treatment 1 | Sick 1

-- Q6. Average, minimum and maximum weight (aggregate functions).
SELECT ROUND(AVG(weight),2) AS avg_weight, MIN(weight) AS min_weight, MAX(weight) AS max_weight
FROM cow;
-- Output: 449.00 | 330.00 | 545.00

-- Q7. Cows whose name starts with G (LIKE).
SELECT cow_id, cow_name FROM cow WHERE cow_name LIKE 'G%' ORDER BY cow_name;
-- Output: Ganga | Gowri

-- Q8. DAILY milk production report.
SELECT production_date, SUM(morning_qty) AS morning, SUM(evening_qty) AS evening,
       SUM(total_qty) AS day_total
FROM milk_production
GROUP BY production_date
ORDER BY production_date;
-- Output: 2026-11-10 80.00 | 2026-11-11 78.00 | 2026-11-12 76.70 (day totals)

-- Q9. MONTHLY milk production report.
SELECT DATE_FORMAT(production_date, '%Y-%m') AS month, SUM(total_qty) AS month_total
FROM milk_production
GROUP BY DATE_FORMAT(production_date, '%Y-%m');
-- Output: 2026-11 | 234.70

-- Q10. COW-WISE milk production (INNER JOIN).
SELECT c.cow_name, SUM(m.total_qty) AS total_milk, ROUND(AVG(m.total_qty),2) AS avg_per_day
FROM cow c
INNER JOIN milk_production m ON c.cow_id = m.cow_id
GROUP BY c.cow_id, c.cow_name
ORDER BY total_milk DESC;
-- Output: Lakshmi 69.00 | Kamadhenu 52.50 | Gowri 46.20 | Nandini 35.00 | Radha 32.00

-- Q11. All cows including those with no milk record (LEFT JOIN).
SELECT c.cow_name, c.gender, COALESCE(SUM(m.total_qty), 0) AS total_milk
FROM cow c
LEFT JOIN milk_production m ON c.cow_id = m.cow_id
GROUP BY c.cow_id, c.cow_name, c.gender
ORDER BY total_milk DESC, c.cow_name;
-- Output: 8 rows; Ganga, Sundari, Bheema (male) show 0

-- Q12. All cows with breeding status, NULL if never bred (RIGHT JOIN).
SELECT c.cow_name, b.breeding_date, b.pregnancy_status
FROM breeding b
RIGHT JOIN cow c ON b.cow_id = c.cow_id
ORDER BY c.cow_name;
-- Output: 8 rows; Bheema, Ganga, Gowri, Radha have NULL breeding details

-- Q13. Total milk sales and revenue.
SELECT SUM(milk_qty) AS total_litres_sold, SUM(total_amount) AS total_revenue
FROM milk_sales;
-- Output: 117.50 | 6202.00

-- Q14. Customer-wise sales.
SELECT customer_name, COUNT(*) AS no_of_sales, SUM(milk_qty) AS litres, SUM(total_amount) AS amount
FROM milk_sales
GROUP BY customer_name
ORDER BY amount DESC;
-- Output: Nandini Dairy 3 84.50 4394.00 | Sri Sai Sweets 1 15.00 810.00 |
--         Ravi Kumar 1 10.00 550.00 | Meena Stores 1 8.00 448.00

-- Q15. Customers who bought more than Rs.1000 in total (HAVING).
SELECT customer_name, SUM(total_amount) AS amount
FROM milk_sales
GROUP BY customer_name
HAVING SUM(total_amount) > 1000;
-- Output: Nandini Dairy 4394.00

-- Q16. Daily revenue.
SELECT sale_date, SUM(total_amount) AS revenue
FROM milk_sales
GROUP BY sale_date
ORDER BY sale_date;
-- Output: 2026-11-10 2110.00 | 2026-11-11 2266.00 | 2026-11-12 1826.00

-- Q17. Average selling price per litre.
SELECT ROUND(AVG(price_per_litre), 2) AS avg_price FROM milk_sales;
-- Output: 53.50

-- Q18. MONTHLY farm expenses by category.
SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month, expense_category, SUM(amount) AS total
FROM expense
GROUP BY DATE_FORMAT(expense_date, '%Y-%m'), expense_category
ORDER BY month, total DESC;
-- Output (Nov): Feed 10700 | Labour 9000 | Maintenance 2600 | Electricity 1800 |
--               Medicine 850 | Other 400 ; (Oct): Medicine 1200

-- Q19. Total expense per month.
SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month, SUM(amount) AS total_expense
FROM expense
GROUP BY DATE_FORMAT(expense_date, '%Y-%m');
-- Output: 2026-10 1200.00 | 2026-11 25350.00

-- Q20. COW HEALTH HISTORY with vet details (3-table INNER JOIN).
SELECT c.cow_name, h.record_date, h.disease_details, h.treatment, v.vet_name
FROM health_record h
INNER JOIN cow c ON h.cow_id = c.cow_id
INNER JOIN veterinarian v ON h.vet_id = v.vet_id
ORDER BY c.cow_name, h.record_date;
-- Output: 6 rows (Ganga, Gowri, Kamadhenu, Lakshmi, Nandini, Radha)

-- Q21. Vaccination records only.
SELECT c.cow_name, h.disease_details, h.vaccination_date
FROM health_record h JOIN cow c ON c.cow_id = h.cow_id
WHERE h.vaccination_date IS NOT NULL;
-- Output: Gowri FMD 2026-09-20 | Nandini LSD 2026-10-02

-- Q22. Number of cases handled by each vet (all vets shown).
SELECT v.vet_name, COUNT(h.record_id) AS cases
FROM health_record h
RIGHT JOIN veterinarian v ON h.vet_id = v.vet_id
GROUP BY v.vet_id, v.vet_name;
-- Output: Dr. Ramesh Gowda 2 | Dr. Anitha Rao 2 | Dr. Suresh Patil 2

-- Q23. FEED CONSUMPTION report by feed type.
SELECT feed_type, SUM(feed_qty_kg) AS total_kg, SUM(feed_cost) AS total_cost
FROM feeding
GROUP BY feed_type;
-- Output: Green Fodder 67.00 402.00 | Cattle Feed 12.50 350.00 | Dry Fodder 22.00 176.00

-- Q24. Feed cost per cow.
SELECT c.cow_name, SUM(f.feed_qty_kg) AS kg, SUM(f.feed_cost) AS cost
FROM feeding f JOIN cow c ON c.cow_id = f.cow_id
GROUP BY c.cow_id, c.cow_name
ORDER BY cost DESC;
-- Output: Lakshmi 30.00 290 | Radha 22.00 132 | Gowri 20.00 120 | Nandini 4.00 112 |
--         Sundari 3.50 98 | Bheema 12.00 96 | Kamadhenu 10.00 80

-- Q25. SUBQUERY: cows producing more than the average cow.
SELECT c.cow_name, SUM(m.total_qty) AS total_milk
FROM cow c JOIN milk_production m ON c.cow_id = m.cow_id
GROUP BY c.cow_id, c.cow_name
HAVING SUM(m.total_qty) > (SELECT AVG(t.s) FROM
                            (SELECT SUM(total_qty) AS s FROM milk_production GROUP BY cow_id) t);
-- Output: Lakshmi 69.00 | Kamadhenu 52.50   (average = 46.94)

-- Q26. SUBQUERY (NOT IN): cows with no milk record.
SELECT cow_id, cow_name FROM cow
WHERE cow_id NOT IN (SELECT DISTINCT cow_id FROM milk_production);
-- Output: Ganga | Sundari | Bheema

-- Q27. SUBQUERY: heaviest cow.
SELECT cow_name, weight FROM cow WHERE weight = (SELECT MAX(weight) FROM cow);
-- Output: Radha 545.00

-- Q28. SUBQUERY: expenses above the average expense.
SELECT expense_description, amount FROM expense
WHERE amount > (SELECT AVG(amount) FROM expense);
-- Output: Cattle feed bags 7500.00 | Monthly wages 9000.00   (average = 3318.75)

-- Q29. Pregnant cows with expected delivery date.
SELECT c.cow_name, b.breeding_date, b.expected_delivery_date,
       DATEDIFF(b.expected_delivery_date, CURDATE()) AS days_left
FROM breeding b JOIN cow c ON c.cow_id = b.cow_id
WHERE b.pregnancy_status = 'Confirmed'
ORDER BY b.expected_delivery_date;
-- Output: Kamadhenu 2026-03-01 2026-12-08 (days_left depends on today's date)

-- Q30. Milk produced vs sold (scalar subqueries).
SELECT (SELECT SUM(total_qty) FROM milk_production) AS produced,
       (SELECT SUM(milk_qty)  FROM milk_sales)      AS sold,
       (SELECT SUM(total_qty) FROM milk_production) -
       (SELECT SUM(milk_qty)  FROM milk_sales)      AS remaining;
-- Output: 234.70 | 117.50 | 117.20

-- =====================================================
-- PART B: VIEWS
-- =====================================================

CREATE OR REPLACE VIEW v_daily_milk_production AS
SELECT production_date, COUNT(*) AS cows_milked,
       SUM(morning_qty) AS morning_total, SUM(evening_qty) AS evening_total,
       SUM(total_qty) AS day_total
FROM milk_production
GROUP BY production_date;

CREATE OR REPLACE VIEW v_cow_milk_summary AS
SELECT c.cow_id, c.cow_name, c.breed,
       COALESCE(SUM(m.total_qty), 0) AS total_milk,
       COALESCE(ROUND(AVG(m.total_qty), 2), 0) AS avg_per_day
FROM cow c
LEFT JOIN milk_production m ON c.cow_id = m.cow_id
WHERE c.gender = 'Female'
GROUP BY c.cow_id, c.cow_name, c.breed;

CREATE OR REPLACE VIEW v_sales_summary AS
SELECT customer_name, COUNT(*) AS no_of_sales,
       SUM(milk_qty) AS total_litres, SUM(total_amount) AS total_amount
FROM milk_sales
GROUP BY customer_name;

CREATE OR REPLACE VIEW v_monthly_expense AS
SELECT DATE_FORMAT(expense_date, '%Y-%m') AS month_name,
       expense_category, SUM(amount) AS total_amount
FROM expense
GROUP BY DATE_FORMAT(expense_date, '%Y-%m'), expense_category;

CREATE OR REPLACE VIEW v_cow_health_history AS
SELECT c.cow_id, c.cow_name, h.record_date, h.disease_details,
       h.treatment, h.vaccination_date, v.vet_name, v.phone
FROM health_record h
JOIN cow c ON c.cow_id = h.cow_id
JOIN veterinarian v ON v.vet_id = h.vet_id;

CREATE OR REPLACE VIEW v_feed_report AS
SELECT feed_type, COUNT(*) AS times_fed,
       SUM(feed_qty_kg) AS total_kg, SUM(feed_cost) AS total_cost
FROM feeding
GROUP BY feed_type;

-- Using the views
SELECT * FROM v_daily_milk_production ORDER BY production_date;
SELECT * FROM v_cow_milk_summary ORDER BY total_milk DESC;
SELECT * FROM v_sales_summary;
SELECT * FROM v_monthly_expense ORDER BY month_name;
SELECT * FROM v_cow_health_history WHERE cow_name = 'Radha';
SELECT * FROM v_feed_report;

-- =====================================================
-- PART C: STORED PROCEDURES
-- =====================================================
DELIMITER //

-- Add (or correct) a milk record for a cow on a date
CREATE PROCEDURE sp_add_milk(IN p_cow_id INT, IN p_date DATE,
                             IN p_morning DECIMAL(5,2), IN p_evening DECIMAL(5,2))
BEGIN
    INSERT INTO milk_production (cow_id, production_date, morning_qty, evening_qty)
    VALUES (p_cow_id, p_date, p_morning, p_evening)
    ON DUPLICATE KEY UPDATE morning_qty = p_morning, evening_qty = p_evening;
END //

-- Health history of one cow
CREATE PROCEDURE sp_cow_health_history(IN p_cow_id INT)
BEGIN
    SELECT record_date, disease_details, treatment, vaccination_date, vet_name
    FROM v_cow_health_history
    WHERE cow_id = p_cow_id
    ORDER BY record_date;
END //

-- Monthly summary: milk, revenue, expenses
CREATE PROCEDURE sp_monthly_report(IN p_year INT, IN p_month INT)
BEGIN
    SELECT 'Milk produced (L)' AS item, COALESCE(SUM(total_qty), 0) AS value
    FROM milk_production
    WHERE YEAR(production_date) = p_year AND MONTH(production_date) = p_month
    UNION ALL
    SELECT 'Milk sold (L)', COALESCE(SUM(milk_qty), 0)
    FROM milk_sales
    WHERE YEAR(sale_date) = p_year AND MONTH(sale_date) = p_month
    UNION ALL
    SELECT 'Revenue (Rs)', COALESCE(SUM(total_amount), 0)
    FROM milk_sales
    WHERE YEAR(sale_date) = p_year AND MONTH(sale_date) = p_month
    UNION ALL
    SELECT 'Expenses (Rs)', COALESCE(SUM(amount), 0)
    FROM expense
    WHERE YEAR(expense_date) = p_year AND MONTH(expense_date) = p_month;
END //

DELIMITER ;

CALL sp_add_milk(1, '2026-11-13', 12.00, 10.50);
CALL sp_cow_health_history(5);
CALL sp_monthly_report(2026, 11);
-- Output of last call (after the sp_add_milk row above is added):
-- Milk produced 257.20 | Milk sold 117.50 | Revenue 6202.00 | Expenses 25350.00

-- =====================================================
-- PART D: TRIGGERS
-- =====================================================
DELIMITER //

-- 1. Auto-fill expected delivery date (283 days) for a confirmed pregnancy
CREATE TRIGGER trg_breeding_bi
BEFORE INSERT ON breeding
FOR EACH ROW
BEGIN
    IF NEW.pregnancy_status = 'Confirmed' AND NEW.expected_delivery_date IS NULL THEN
        SET NEW.expected_delivery_date = DATE_ADD(NEW.breeding_date, INTERVAL 283 DAY);
    END IF;
END //

-- 2. Confirmed pregnancy -> cow status becomes Pregnant
CREATE TRIGGER trg_breeding_ai
AFTER INSERT ON breeding
FOR EACH ROW
BEGIN
    IF NEW.pregnancy_status = 'Confirmed' THEN
        UPDATE cow SET health_status = 'Pregnant' WHERE cow_id = NEW.cow_id;
    END IF;
END //

-- 3. Delivery recorded -> cow status goes back to Healthy
CREATE TRIGGER trg_breeding_au
AFTER UPDATE ON breeding
FOR EACH ROW
BEGIN
    IF NEW.pregnancy_status = 'Delivered' AND OLD.pregnancy_status <> 'Delivered' THEN
        UPDATE cow SET health_status = 'Healthy' WHERE cow_id = NEW.cow_id;
    END IF;
END //

-- 4. Cannot sell more milk on a day than was produced that day
CREATE TRIGGER trg_sales_bi
BEFORE INSERT ON milk_sales
FOR EACH ROW
BEGIN
    DECLARE produced DECIMAL(8,2);
    DECLARE sold DECIMAL(8,2);
    SELECT COALESCE(SUM(total_qty), 0) INTO produced
    FROM milk_production WHERE production_date = NEW.sale_date;
    SELECT COALESCE(SUM(milk_qty), 0) INTO sold
    FROM milk_sales WHERE sale_date = NEW.sale_date;
    IF sold + NEW.milk_qty > produced THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Sale quantity exceeds milk produced on that date';
    END IF;
END //

DELIMITER ;

-- Trigger tests (ROLLBACK keeps your sample data unchanged)
START TRANSACTION;

-- Test 1 + 2: expected date auto-filled, cow 6 becomes Pregnant
INSERT INTO breeding (cow_id, breeding_date, pregnancy_status)
VALUES (6, '2026-11-01', 'Confirmed');
SELECT b.breeding_date, b.expected_delivery_date, c.health_status
FROM breeding b JOIN cow c ON c.cow_id = b.cow_id
WHERE b.cow_id = 6 AND b.breeding_date = '2026-11-01';
-- Output: 2026-11-01 | 2027-08-11 | Pregnant

-- Test 3: delivery recorded -> cow 3 becomes Healthy
UPDATE breeding SET pregnancy_status = 'Delivered' WHERE cow_id = 3;
SELECT cow_name, health_status FROM cow WHERE cow_id = 3;
-- Output: Kamadhenu | Healthy

-- Test 4: this fails with error 1644 "Sale quantity exceeds milk produced on that date"
INSERT INTO milk_sales (sale_date, customer_name, milk_qty, price_per_litre)
VALUES ('2026-11-12', 'Test Customer', 500, 50);

ROLLBACK;

-- =====================================================
-- PART E: INSERT / UPDATE / DELETE DEMO (rolled back)
-- =====================================================
START TRANSACTION;

INSERT INTO cow (cow_name, breed, age, gender, weight, registration_date)
VALUES ('Tulasi', 'Jersey', 3, 'Female', 360.00, CURDATE());   -- health_status gets DEFAULT 'Healthy'

UPDATE cow SET weight = 372.50, health_status = 'Under Treatment'
WHERE cow_name = 'Tulasi';

SELECT * FROM cow WHERE cow_name = 'Tulasi';

DELETE FROM cow WHERE cow_name = 'Tulasi';

-- DELETE with CASCADE: removing a cow also removes its milk/feed/health/breeding rows
-- DELETE FROM cow WHERE cow_id = 8;

ROLLBACK;

-- Constraint tests (each one should FAIL with an error):
-- INSERT INTO cow (cow_name, breed, age, weight, registration_date)
--   VALUES ('Lakshmi', 'Jersey', 3, 300, CURDATE());          -- UNIQUE violated
-- INSERT INTO cow (cow_name, breed, age, weight, registration_date)
--   VALUES ('Old Cow', 'Jersey', 40, 300, CURDATE());         -- CHECK age violated
-- INSERT INTO milk_production (cow_id, production_date, morning_qty, evening_qty)
--   VALUES (99, CURDATE(), 5, 5);                             -- FOREIGN KEY violated
