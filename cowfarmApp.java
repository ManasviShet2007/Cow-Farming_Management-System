
import java.sql.*;
import java.util.Scanner;

/**
 * Cow Farming Management System - Java + JDBC console application.
 * Needs: MySQL running, cow_farm_stage1.sql and cow_farm_stage2_queries.sql executed,
 *        MySQL Connector/J jar added to the project (VS Code -> Referenced Libraries).
 */
public class cowfarmApp {

    // ----- CHANGE THESE FOR YOUR MYSQL -----
    private static final String URL =
        "jdbc:mysql://localhost:3306/cow_farm_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "Mns.Shet13";

    private static final Scanner sc = new Scanner(System.in);

    // ---------- Connection ----------
    private static Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASSWORD);
    }

    // ---------- Input helpers ----------
    private static String readString(String prompt) {
        System.out.print(prompt);
        return sc.nextLine().trim();
    }

    private static int readInt(String prompt) {
        while (true) {
            try {
                return Integer.parseInt(readString(prompt));
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid whole number.");
            }
        }
    }

    private static double readDouble(String prompt) {
        while (true) {
            try {
                return Double.parseDouble(readString(prompt));
            } catch (NumberFormatException e) {
                System.out.println("Please enter a valid number.");
            }
        }
    }

    private static Date readDate(String prompt) {
        while (true) {
            try {
                return Date.valueOf(readString(prompt + " (yyyy-mm-dd): "));
            } catch (IllegalArgumentException e) {
                System.out.println("Invalid date format.");
            }
        }
    }

    // ---------- Generic SELECT: runs a query and prints a table ----------
    private static void runQuery(String sql, Object... params) {
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            try (ResultSet rs = ps.executeQuery()) {
                printResult(rs);
            }
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
        }
    }

    // ---------- Generic INSERT / UPDATE / DELETE ----------
    private static void runUpdate(String sql, String successMsg, Object... params) {
        try (Connection con = getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) ps.setObject(i + 1, params[i]);
            int rows = ps.executeUpdate();
            System.out.println(rows > 0 ? successMsg : "No matching record found.");
        } catch (SQLException e) {
            System.out.println("Database error: " + e.getMessage());
        }
    }

    private static void printResult(ResultSet rs) throws SQLException {
        ResultSetMetaData md = rs.getMetaData();
        int cols = md.getColumnCount();
        StringBuilder line = new StringBuilder();
        for (int i = 1; i <= cols; i++) {
            System.out.printf("%-22s", md.getColumnLabel(i));
            line.append("---------------------");
            line.append(" ");
        }
        System.out.println();
        System.out.println(line);
        int count = 0;
        while (rs.next()) {
            for (int i = 1; i <= cols; i++) {
                String v = rs.getString(i);
                System.out.printf("%-22s", v == null ? "NULL" : v);
            }
            System.out.println();
            count++;
        }
        System.out.println("(" + count + " row(s))");
    }

    // =========== COW MODULE ===========
    private static void addCow() {
        String name = readString("Cow name: ");
        String breed = readString("Breed: ");
        int age = readInt("Age (years): ");
        String gender = readString("Gender (Female/Male): ");
        double weight = readDouble("Weight (kg): ");
        runUpdate("INSERT INTO cow (cow_name, breed, age, gender, weight, registration_date) "
                + "VALUES (?, ?, ?, ?, ?, CURDATE())",
                "Cow registered successfully.", name, breed, age, gender, weight);
    }

    private static void updateHealthStatus() {
        int id = readInt("Cow ID: ");
        String st = readString("New status (Healthy/Under Treatment/Pregnant/Sick): ");
        runUpdate("UPDATE cow SET health_status = ? WHERE cow_id = ?",
                "Health status updated.", st, id);
    }

    private static void deleteCow() {
        int id = readInt("Cow ID to delete (all its records will also be deleted): ");
        String ok = readString("Type YES to confirm: ");
        if (ok.equals("YES"))
            runUpdate("DELETE FROM cow WHERE cow_id = ?", "Cow deleted.", id);
        else System.out.println("Cancelled.");
    }

    // =========== MILK MODULE ===========
    private static void addMilk() {
        int id = readInt("Cow ID: ");
        Date d = readDate("Date");
        double m = readDouble("Morning quantity (L): ");
        double e = readDouble("Evening quantity (L): ");
        try (Connection con = getConnection();
             CallableStatement cs = con.prepareCall("{CALL sp_add_milk(?, ?, ?, ?)}")) {
            cs.setInt(1, id);
            cs.setDate(2, d);
            cs.setDouble(3, m);
            cs.setDouble(4, e);
            cs.execute();
            System.out.println("Milk record saved.");
        } catch (SQLException ex) {
            System.out.println("Database error: " + ex.getMessage());
        }
    }

    // =========== FEEDING MODULE ===========
    private static void addFeeding() {
        int id = readInt("Cow ID: ");
        String type = readString("Feed type: ");
        double qty = readDouble("Quantity (kg): ");
        double cost = readDouble("Cost (Rs): ");
        runUpdate("INSERT INTO feeding (cow_id, feed_type, feed_qty_kg, feeding_date, feed_cost) "
                + "VALUES (?, ?, ?, CURDATE(), ?)",
                "Feeding record added.", id, type, qty, cost);
    }

    // =========== HEALTH MODULE ===========
    private static void addHealthRecord() {
        int cow = readInt("Cow ID: ");
        int vet = readInt("Vet ID (1-3): ");
        String disease = readString("Disease details: ");
        String treatment = readString("Treatment: ");
        String vac = readString("Vaccination date (yyyy-mm-dd, blank if none): ");
        Date vacDate = null;
        if (!vac.isEmpty()) {
            try {
                vacDate = Date.valueOf(vac);
            } catch (IllegalArgumentException e) {
                System.out.println("Invalid date format. Record not added.");
                return;
            }
        }
        runUpdate("INSERT INTO health_record (cow_id, vet_id, disease_details, treatment, "
                + "vaccination_date, record_date) VALUES (?, ?, ?, ?, ?, CURDATE())",
                "Health record added.", cow, vet, disease, treatment, vacDate);
    }

    private static void healthHistory() {
        int id = readInt("Cow ID: ");
        try (Connection con = getConnection();
             CallableStatement cs = con.prepareCall("{CALL sp_cow_health_history(?)}")) {
            cs.setInt(1, id);
            try (ResultSet rs = cs.executeQuery()) {
                printResult(rs);
            }
        } catch (SQLException ex) {
            System.out.println("Database error: " + ex.getMessage());
        }
    }

    // =========== BREEDING MODULE ===========
    private static void addBreeding() {
        int id = readInt("Cow ID: ");
        Date d = readDate("Breeding date");
        String st = readString("Pregnancy status (Pending/Confirmed/Not Pregnant/Delivered): ");
        runUpdate("INSERT INTO breeding (cow_id, breeding_date, pregnancy_status) VALUES (?, ?, ?)",
                "Breeding record added (trigger sets delivery date if Confirmed).", id, d, st);
    }

    // =========== SALES MODULE ===========
    private static void addSale() {
        String cust = readString("Customer name: ");
        double qty = readDouble("Milk quantity (L): ");
        double price = readDouble("Price per litre (Rs): ");
        Date d = readDate("Sale date");
        runUpdate("INSERT INTO milk_sales (sale_date, customer_name, milk_qty, price_per_litre) "
                + "VALUES (?, ?, ?, ?)", "Sale recorded.", d, cust, qty, price);
    }

    // =========== EXPENSE MODULE ===========
    private static void addExpense() {
        String cat = readString("Category (Feed/Medicine/Labour/Electricity/Maintenance/Other): ");
        String desc = readString("Description: ");
        double amt = readDouble("Amount (Rs): ");
        runUpdate("INSERT INTO expense (expense_category, expense_description, expense_date, amount) "
                + "VALUES (?, ?, CURDATE(), ?)", "Expense recorded.", cat, desc, amt);
    }

    // =========== MENU ===========
    private static void menu() {
        System.out.println("\n===== COW FARMING MANAGEMENT SYSTEM =====");
        System.out.println(" 1. Register new cow");
        System.out.println(" 2. View all cows");
        System.out.println(" 3. Update cow health status");
        System.out.println(" 4. Delete cow");
        System.out.println(" 5. Add milk record");
        System.out.println(" 6. Add feeding record");
        System.out.println(" 7. Add health record");
        System.out.println(" 8. Add breeding record");
        System.out.println(" 9. Add milk sale");
        System.out.println("10. Add expense");
        System.out.println("---------------- REPORTS ----------------");
        System.out.println("11. Total number of cows");
        System.out.println("12. Daily milk production");
        System.out.println("13. Monthly milk production");
        System.out.println("14. Cow-wise milk production");
        System.out.println("15. Total milk sales and revenue");
        System.out.println("16. Customer-wise sales");
        System.out.println("17. Monthly farm expenses");
        System.out.println("18. Cow health history");
        System.out.println("19. Feed consumption report");
        System.out.println(" 0. Exit");
    }

    public static void main(String[] args) {
        // Connection test
        try (Connection con = getConnection()) {
            System.out.println("Connected to database: " + con.getCatalog());
        } catch (SQLException e) {
            System.out.println("Cannot connect to MySQL: " + e.getMessage());
            return;
        }

        int choice;
        do {
            menu();
            choice = readInt("Enter choice: ");
            switch (choice) {
                case 1 -> addCow();
                case 2 -> runQuery("SELECT * FROM cow");
                case 3 -> updateHealthStatus();
                case 4 -> deleteCow();
                case 5 -> addMilk();
                case 6 -> addFeeding();
                case 7 -> addHealthRecord();
                case 8 -> addBreeding();
                case 9 -> addSale();
                case 10 -> addExpense();
                case 11 -> runQuery("SELECT COUNT(*) AS total_cows FROM cow");
                case 12 -> runQuery("SELECT * FROM v_daily_milk_production ORDER BY production_date");
                case 13 -> runQuery("SELECT DATE_FORMAT(production_date,'%Y-%m') AS month, "
                        + "SUM(total_qty) AS total_milk FROM milk_production "
                        + "GROUP BY DATE_FORMAT(production_date,'%Y-%m')");
                case 14 -> runQuery("SELECT * FROM v_cow_milk_summary ORDER BY total_milk DESC");
                case 15 -> runQuery("SELECT SUM(milk_qty) AS litres_sold, "
                        + "SUM(total_amount) AS total_revenue FROM milk_sales");
                case 16 -> runQuery("SELECT * FROM v_sales_summary ORDER BY total_amount DESC");
                case 17 -> runQuery("SELECT * FROM v_monthly_expense ORDER BY month_name");
                case 18 -> healthHistory();
                case 19 -> runQuery("SELECT * FROM v_feed_report");
                case 0 -> System.out.println("Thank you. Goodbye!");
                default -> System.out.println("Invalid choice.");
            }
        } while (choice != 0);
    }
}
