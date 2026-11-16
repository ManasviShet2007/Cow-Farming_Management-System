
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.sql.*;

public class CowFarmWebServer {

    public static void main(String[] args) throws IOException {

        HttpServer server = HttpServer.create(
            new InetSocketAddress(8080), 0
        );

        server.createContext("/api/", exchange -> {
            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Origin", "*"
            );
            exchange.getResponseHeaders().set(
               "Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS" 
            );
            exchange.getResponseHeaders().set(
                "Access-Control-Allow-Headers", "Content-Type"
            );

            if (exchange.getRequestMethod().equals("OPTIONS")) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            System.out.println("REQUEST PATH: " + path);
            if (path.equals("/api/health") &&
    !exchange.getRequestMethod().equals("GET")) {
    handleHealth(exchange);
    return;
}
             if (path.equals("/api/cows") &&
    !exchange.getRequestMethod().equals("GET")) {

    try {
        String method = exchange.getRequestMethod();

        String input;

        if (method.equals("DELETE")) {
            input = exchange.getRequestURI().getRawQuery();
        } else {
            input = new String(
                exchange.getRequestBody().readAllBytes(),
                StandardCharsets.UTF_8
            );
        }

        java.util.Map<String, String> data = new java.util.HashMap<>();

        if (input != null) {
            for (String pair : input.split("&")) {
                String[] parts = pair.split("=", 2);

                String key = java.net.URLDecoder.decode(
                    parts[0], StandardCharsets.UTF_8
                );

                String value = parts.length > 1
                    ? java.net.URLDecoder.decode(
                        parts[1], StandardCharsets.UTF_8
                    )
                    : "";

                data.put(key, value);
            }
        }

        try (Connection con = DBConnection.getConnection()) {

            if (method.equals("POST")) {
                String sql = "INSERT INTO cow " +
                    "(cow_name, breed, age, gender, weight, " +
                    "registration_date, health_status) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, data.get("cowName"));
                    ps.setString(2, data.get("cowBreed"));
                    ps.setInt(3, Integer.parseInt(data.get("cowAge")));
                    ps.setString(4, data.get("cowGender"));
                    ps.setDouble(5, Double.parseDouble(data.get("cowWeight")));
                    ps.setDate(6, java.sql.Date.valueOf(data.get("cowDate")));
                    ps.setString(7, data.get("cowHealth"));
                    ps.executeUpdate();
                }

            } else if (method.equals("PUT")) {
                String sql = "UPDATE cow SET cow_name=?, breed=?, age=?, " +
                    "gender=?, weight=?, registration_date=?, health_status=? " +
                    "WHERE cow_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, data.get("cowName"));
                    ps.setString(2, data.get("cowBreed"));
                    ps.setInt(3, Integer.parseInt(data.get("cowAge")));
                    ps.setString(4, data.get("cowGender"));
                    ps.setDouble(5, Double.parseDouble(data.get("cowWeight")));
                    ps.setDate(6, java.sql.Date.valueOf(data.get("cowDate")));
                    ps.setString(7, data.get("cowHealth"));
                    ps.setInt(8, Integer.parseInt(data.get("cowId")));
                    ps.executeUpdate();
                }

            } else if (method.equals("DELETE")) {
                String sql = "DELETE FROM cow WHERE cow_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("id")));
                    ps.executeUpdate();
                }

            } else {
                send(exchange, "{\"error\":\"Method not supported\"}");
                return;
            }
        }

        send(exchange, "{\"message\":\"Cow record saved successfully\"}");

    } catch (Exception e) {
        send(exchange, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
    }

    return;
}// MILK: Add, edit and delete
if (path.equals("/api/milk") ||
    path.equals("/api/milk-production")) {

    if (!exchange.getRequestMethod().equals("GET")) {
        handleMilk(exchange);
        return;
    }
}

// EXPENSES: Add, edit and delete
if (path.equals("/api/expenses")) {
    if (!exchange.getRequestMethod().equals("GET")) {
        handleExpense(exchange);
        return;
    }
}

if (path.equals("/api/feeding") &&
    !exchange.getRequestMethod().equals("GET")) {
    handleFeeding(exchange);
    return;
}
if (path.equals("/api/health") &&
    !exchange.getRequestMethod().equals("GET")) {
    handleHealth(exchange);
    return;
}

            String sql = null;
            String response;

            try {
                switch (path) {
                    case "/api/cows":
                        sql = "SELECT * FROM cow";
                        break;
                    case "/api/milk":
                    case "/api/milk-production":
                        sql = "SELECT * FROM milk_production ORDER BY production_date DESC";
                        break;
                    case "/api/sales":
                        sql = "SELECT * FROM milk_sales ORDER BY sale_date DESC";
                        break;
                    case "/api/expenses":
                        sql = "SELECT * FROM expense ORDER BY expense_date DESC";
                        break;
                    case "/api/feeding":
                        sql = "SELECT * FROM feeding ORDER BY feeding_date DESC";
                        break;
                    case "/api/breeding":
                        sql = "SELECT * FROM breeding ORDER BY breeding_date DESC";
                        break;
                    case "/api/health":
                        sql = "SELECT * FROM health_record ORDER BY record_date DESC";
                        break;
                    case "/api/veterinarians":
                        sql = "SELECT * FROM veterinarian";
                        break;
                    case "/api/dashboard":
                        response = getDashboard();
                        send(exchange, response);
                        return;
                    default:
                        send(exchange, "{\"error\":\"API endpoint not found\"}");
                        return;
                }

                response = getRows(sql);

            } catch (Exception e) {
                response = "{\"error\":\"" +
                    escape(e.getMessage()) + "\"}";
            }

            send(exchange, response);
        });

        server.start();

        System.out.println("Cow Farm Backend Started!");
        System.out.println("Website API: http://localhost:8080/api/");
    }

private static java.util.Map<String, String> readForm(HttpExchange exchange)
        throws IOException {

    String input;

    if (exchange.getRequestMethod().equals("DELETE")) {
        input = exchange.getRequestURI().getRawQuery();
    } else {
        input = new String(
            exchange.getRequestBody().readAllBytes(),
            StandardCharsets.UTF_8
        );
    }

    java.util.Map<String, String> data = new java.util.HashMap<>();

    if (input != null && !input.isEmpty()) {
        for (String pair : input.split("&")) {
            String[] parts = pair.split("=", 2);

            String key = java.net.URLDecoder.decode(
                parts[0], StandardCharsets.UTF_8
            );

            String value = parts.length > 1
                ? java.net.URLDecoder.decode(
                    parts[1], StandardCharsets.UTF_8
                )
                : "";

            data.put(key, value);
        }
    }

    return data;
}

private static void handleMilk(HttpExchange exchange)
        throws IOException {

    try {
        String method = exchange.getRequestMethod();
        java.util.Map<String, String> data = readForm(exchange);

        try (Connection con = DBConnection.getConnection()) {

            if (method.equals("POST")) {
                String sql =
                    "INSERT INTO milk_production " +
                    "(cow_id, production_date, morning_qty, evening_qty) " +
                    "VALUES (?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE " +
                    "morning_qty=VALUES(morning_qty), " +
                    "evening_qty=VALUES(evening_qty)";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("milkCowId")));
                    ps.setDate(2, java.sql.Date.valueOf(data.get("milkDate")));
                    ps.setDouble(3, Double.parseDouble(data.get("morningQty")));
                    ps.setDouble(4, Double.parseDouble(data.get("eveningQty")));
                    ps.executeUpdate();
                }

            } else if (method.equals("PUT")) {
                String sql =
                    "UPDATE milk_production SET cow_id=?, " +
                    "production_date=?, morning_qty=?, evening_qty=? " +
                    "WHERE production_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("milkCowId")));
                    ps.setDate(2, java.sql.Date.valueOf(data.get("milkDate")));
                    ps.setDouble(3, Double.parseDouble(data.get("morningQty")));
                    ps.setDouble(4, Double.parseDouble(data.get("eveningQty")));
                    ps.setInt(5, Integer.parseInt(data.get("productionId")));
                    ps.executeUpdate();
                }

            } else if (method.equals("DELETE")) {
                String sql =
                    "DELETE FROM milk_production WHERE production_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("id")));
                    ps.executeUpdate();
                }

            } else {
                send(exchange, "{\"error\":\"Method not supported\"}");
                return;
            }
        }

        send(exchange, "{\"message\":\"Milk record saved successfully\"}");

    } catch (Exception e) {
        send(exchange, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
    }
}

private static void handleExpense(HttpExchange exchange)
        throws IOException {

    try {
        String method = exchange.getRequestMethod();
        java.util.Map<String, String> data = readForm(exchange);

        try (Connection con = DBConnection.getConnection()) {

            if (method.equals("POST")) {
                String sql =
                    "INSERT INTO expense " +
                    "(expense_category, expense_description, expense_date, amount) " +
                    "VALUES (?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, data.get("expenseCategory"));
                    ps.setString(2, data.get("expenseDescription"));
                    ps.setDate(3, java.sql.Date.valueOf(data.get("expenseDate")));
                    ps.setDouble(4, Double.parseDouble(data.get("expenseAmount")));
                    ps.executeUpdate();
                }

            } else if (method.equals("PUT")) {
                String sql =
                    "UPDATE expense SET expense_category=?, " +
                    "expense_description=?, expense_date=?, amount=? " +
                    "WHERE expense_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, data.get("expenseCategory"));
                    ps.setString(2, data.get("expenseDescription"));
                    ps.setDate(3, java.sql.Date.valueOf(data.get("expenseDate")));
                    ps.setDouble(4, Double.parseDouble(data.get("expenseAmount")));
                    ps.setInt(5, Integer.parseInt(data.get("expenseId")));
                    ps.executeUpdate();
                }

            } else if (method.equals("DELETE")) {
                String sql = "DELETE FROM expense WHERE expense_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("id")));
                    ps.executeUpdate();
                }

            } else {
                send(exchange, "{\"error\":\"Method not supported\"}");
                return;
            }
        }

        send(exchange, "{\"message\":\"Expense record saved successfully\"}");

    } catch (Exception e) {
        send(exchange, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
    }
}
private static void handleFeeding(HttpExchange exchange)
        throws IOException {

    try {
        String method = exchange.getRequestMethod();
        java.util.Map<String, String> data = readForm(exchange);

        try (Connection con = DBConnection.getConnection()) {

            if (method.equals("POST")) {
                String sql =
                    "INSERT INTO feeding " +
                    "(cow_id, feed_type, feed_qty_kg, feeding_date, feed_cost) " +
                    "VALUES (?, ?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("feedCowId")));
                    ps.setString(2, data.get("feedType"));
                    ps.setDouble(3, Double.parseDouble(data.get("feedQtyKg")));
                    ps.setDate(4, java.sql.Date.valueOf(data.get("feedingDate")));
                    ps.setDouble(5, Double.parseDouble(data.get("feedCost")));
                    ps.executeUpdate();
                }

            } else if (method.equals("PUT")) {
                String sql =
                    "UPDATE feeding SET cow_id=?, feed_type=?, " +
                    "feed_qty_kg=?, feeding_date=?, feed_cost=? " +
                    "WHERE feed_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("feedCowId")));
                    ps.setString(2, data.get("feedType"));
                    ps.setDouble(3, Double.parseDouble(data.get("feedQtyKg")));
                    ps.setDate(4, java.sql.Date.valueOf(data.get("feedingDate")));
                    ps.setDouble(5, Double.parseDouble(data.get("feedCost")));
                    ps.setInt(6, Integer.parseInt(data.get("feedId")));
                    ps.executeUpdate();
                }

            } else if (method.equals("DELETE")) {
                String sql = "DELETE FROM feeding WHERE feed_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("id")));
                    ps.executeUpdate();
                }

            } else {
                send(exchange, "{\"error\":\"Method not supported\"}");
                return;
            }
        }

        send(exchange, "{\"message\":\"Feeding record saved successfully\"}");

    } catch (Exception e) {
        send(exchange, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
    }
}


private static void handleHealth(HttpExchange exchange)
        throws IOException {
    try {
        String method = exchange.getRequestMethod();
        java.util.Map<String, String> data = readForm(exchange);

        try (Connection con = DBConnection.getConnection()) {

            if (method.equals("POST")) {

                String sql = "INSERT INTO health_record " +
                    "(cow_id, vet_id, disease_details, treatment, vaccination_date, record_date) " +
                    "VALUES (?, ?, ?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("healthCowId")));
                    ps.setInt(2, Integer.parseInt(data.get("healthVetId")));
                    ps.setString(3, data.get("diseaseDetails"));
                    ps.setString(4, data.get("treatment"));

                    if (data.get("vaccinationDate") == null ||
                        data.get("vaccinationDate").isEmpty()) {
                        ps.setNull(5, java.sql.Types.DATE);
                    } else {
                        ps.setDate(5, java.sql.Date.valueOf(data.get("vaccinationDate")));
                    }

                    ps.setDate(6, java.sql.Date.valueOf(data.get("recordDate")));
                    ps.executeUpdate();
                }

            } else if (method.equals("PUT")) {

                String sql = "UPDATE health_record SET cow_id=?, vet_id=?, " +
                    "disease_details=?, treatment=?, vaccination_date=?, record_date=? " +
                    "WHERE record_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("healthCowId")));
                    ps.setInt(2, Integer.parseInt(data.get("healthVetId")));
                    ps.setString(3, data.get("diseaseDetails"));
                    ps.setString(4, data.get("treatment"));

                    if (data.get("vaccinationDate") == null ||
                        data.get("vaccinationDate").isEmpty()) {
                        ps.setNull(5, java.sql.Types.DATE);
                    } else {
                        ps.setDate(5, java.sql.Date.valueOf(data.get("vaccinationDate")));
                    }

                    ps.setDate(6, java.sql.Date.valueOf(data.get("recordDate")));
                    ps.setInt(7, Integer.parseInt(data.get("recordId")));
                    ps.executeUpdate();
                }

            } else if (method.equals("DELETE")) {

                String sql = "DELETE FROM health_record WHERE record_id=?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, Integer.parseInt(data.get("id")));
                    ps.executeUpdate();
                }

            } else {
                send(exchange, "{\"error\":\"Method not supported\"}");
                return;
            }
        }

        send(exchange, "{\"message\":\"Health record saved successfully\"}");

    } catch (Exception e) {
        send(exchange, "{\"error\":\"" + escape(e.getMessage()) + "\"}");
    }
}

    private static String getRows(String sql) throws SQLException {
        StringBuilder json = new StringBuilder("[");
        try (Connection con = DBConnection.getConnection();
             Statement st = con.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            ResultSetMetaData md = rs.getMetaData();
            int count = md.getColumnCount();
            boolean firstRow = true;

            while (rs.next()) {
                if (!firstRow) json.append(",");
                firstRow = false;
                json.append("{");

                for (int i = 1; i <= count; i++) {
                    if (i > 1) json.append(",");

                    String key = md.getColumnLabel(i);
                    Object value = rs.getObject(i);

                    json.append("\"").append(escape(key)).append("\":");

                    if (value == null) {
                        json.append("null");
                    } else if (value instanceof Number ||
                               value instanceof Boolean) {
                        json.append(value);
                    } else {
                        json.append("\"")
                            .append(escape(value.toString()))
                            .append("\"");
                    }
                }
                json.append("}");
            }
        }
        return json.append("]").toString();
    }

    private static String getDashboard() throws SQLException {
        try (Connection con = DBConnection.getConnection();
             Statement st = con.createStatement()) {

            int cows = getNumber(st,
                "SELECT COUNT(*) FROM cow");

            double milk = getDecimal(st,
                "SELECT COALESCE(SUM(total_qty),0) " +
                "FROM milk_production WHERE production_date=CURDATE()");

            int health = getNumber(st,
                "SELECT COUNT(*) FROM health_record");

            return "{\"totalCows\":" + cows +
                   ",\"activeCows\":" + cows +
                   ",\"todayMilk\":" + milk +
                   ",\"healthCount\":" + health + "}";
        }
    }

    private static int getNumber(Statement st, String sql)
            throws SQLException {
        try (ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getInt(1);
        }
    }

    private static double getDecimal(Statement st, String sql)
            throws SQLException {
        try (ResultSet rs = st.executeQuery(sql)) {
            rs.next();
            return rs.getDouble(1);
        }
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
    }

    private static void send(HttpExchange exchange, String response)
            throws IOException {
        byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set(
            "Content-Type", "application/json; charset=UTF-8"
        );
        exchange.sendResponseHeaders(200, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }
}
