
const API = "http://localhost:8080/api";

// ===============================
// PAGE NAVIGATION
// ===============================

function showPage(page, element) {
    document.querySelectorAll(".page").forEach(section => {
        section.classList.add("hidden");
    });

    document.getElementById(page).classList.remove("hidden");

    document.querySelectorAll("nav a").forEach(link => {
        link.classList.remove("active");
    });

    if (element) element.classList.add("active");

    const titles = {
        dashboard: "Dashboard",
        cows: "Cow Management",
        breeding: "Breeding Management",
        feeding: "Feeding Management",
        expenses: "Farm Expenses",
        milk: "Milk Production",
        sales: "Milk Sales",
        health: "Health Records",
        veterinarians: "Veterinarian Management",
        reports: "Farm Reports"
    };

    document.getElementById("page-title").textContent =
        titles[page] || page;

    const loaders = {
        dashboard: loadDashboard,
        cows: loadCows,
        breeding: loadBreeding,
        feeding: loadFeeding,
        expenses: loadExpenses,
        milk: loadMilk,
        sales: loadSales,
        health: loadHealth,
        veterinarians: loadVeterinarians,
        reports: loadReports
    };

    if (loaders[page]) loaders[page]();
}

// ===============================
// DASHBOARD
// ===============================

async function loadDashboard() {
    try {
        const response = await fetch(`${API}/dashboard`);
        const data = await response.json();

        document.getElementById("totalCows").textContent =
            data.totalCows ?? "--";

        document.getElementById("todayMilk").textContent =
            (data.todayMilk ?? "--") + " L";

        document.getElementById("activeCows").textContent =
            data.activeCows ?? "--";

        document.getElementById("healthCount").textContent =
            data.healthCount ?? "--";

    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

// ===============================
// COW MANAGEMENT
// ===============================

let cowRecords = [];

async function loadCows() {
    try {
        const response = await fetch(`${API}/cows`);
        const cows = await response.json();

        if (!Array.isArray(cows)) {
            throw new Error(cows.error || "Unable to load cows");
        }

        cowRecords = cows;

        document.getElementById("cowList").innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Breed</th>
                        <th>Age</th>
                        <th>Gender</th>
                        <th>Weight</th>
                        <th>Registration Date</th>
                        <th>Health</th>
                        <th>Actions</th>
                    </tr>
                </thead>

                <tbody>
                    ${cows.map(cow => `
                        <tr>
                            <td>${cow.cow_id}</td>
                            <td>${cow.cow_name}</td>
                            <td>${cow.breed}</td>
                            <td>${cow.age}</td>
                            <td>${cow.gender}</td>
                            <td>${cow.weight}</td>
                            <td>${cow.registration_date}</td>
                            <td>${cow.health_status}</td>
                            <td>
                                <button onclick="editCow(${cow.cow_id})">
                                    Edit
                                </button>

                                <button onclick="deleteCow(${cow.cow_id})">
                                    Delete
                                </button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error("Cow loading error:", error);
        document.getElementById("cowList").textContent =
            "Unable to load cow records: " + error.message;
    }
}

// ADD / UPDATE COW

const cowForm = document.getElementById("cowForm");

cowForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const cowId = document.getElementById("cowId").value;

    const cow = {
        cowId: cowId,
        cowName: document.getElementById("cowName").value,
        cowBreed: document.getElementById("cowBreed").value,
        cowAge: document.getElementById("cowAge").value,
        cowGender: document.getElementById("cowGender").value,
        cowWeight: document.getElementById("cowWeight").value,
        cowDate: document.getElementById("cowDate").value,
        cowHealth: document.getElementById("cowHealth").value
    };

    try {
        const response = await fetch(`${API}/cows`, {
            method: cowId ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(cow)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to save cow");
        }

        alert(cowId
            ? "Cow updated successfully!"
            : "Cow registered successfully!");

        resetCowForm();
        loadCows();
        loadDashboard();

    } catch (error) {
        alert("Error: " + error.message);
    }
});

// EDIT COW

function editCow(id) {
    const cow = cowRecords.find(item => item.cow_id === id);

    if (!cow) return;

    document.getElementById("cowId").value = cow.cow_id;
    document.getElementById("cowName").value = cow.cow_name;
    document.getElementById("cowBreed").value = cow.breed;
    document.getElementById("cowAge").value = cow.age;
    document.getElementById("cowGender").value = cow.gender;
    document.getElementById("cowWeight").value = cow.weight;
    document.getElementById("cowDate").value =
        String(cow.registration_date).substring(0, 10);
    document.getElementById("cowHealth").value = cow.health_status;

    document.getElementById("cowForm").scrollIntoView({
        behavior: "smooth"
    });
}

// DELETE COW

async function deleteCow(id) {
    if (!confirm("Are you sure you want to delete this cow?")) {
        return;
    }

    try {
        const response = await fetch(
            `${API}/cows?id=${encodeURIComponent(id)}`,
            { method: "DELETE" }
        );

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to delete cow");
        }

        alert("Cow deleted successfully!");

        resetCowForm();
        loadCows();
        loadDashboard();

    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

// RESET COW FORM

function resetCowForm() {
    document.getElementById("cowForm").reset();
    document.getElementById("cowId").value = "";
}

// ===============================
// MILK PRODUCTION
// ===============================

async function loadMilk() {
    try {
        const response = await fetch(`${API}/milk`);
        const records = await response.json();

        document.getElementById("milkList").innerHTML = `
            <table>
                <tr>
                    <th>Production ID</th>
                    <th>Cow ID</th>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                </tr>

                ${records.map(record => `
                    <tr>
                        <td>${record.production_id}</td>
                        <td>${record.cow_id}</td>
                        <td>${record.production_date}</td>
                        <td>${record.morning_qty}</td>
                        <td>${record.evening_qty}</td>
                        <td>${record.total_qty}</td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Milk loading error:", error);
    }
}

// ===============================
// HEALTH RECORDS
// ===============================

async function loadHealth() {
    try {
        const response = await fetch(`${API}/health`);
        const records = await response.json();

        document.getElementById("healthList").innerHTML = `
            <table>
                <tr>
                    <th>Record ID</th>
                    <th>Cow ID</th>
                    <th>Veterinarian ID</th>
                    <th>Disease</th>
                    <th>Treatment</th>
                    <th>Record Date</th>
                </tr>

                ${records.map(record => `
                    <tr>
                        <td>${record.record_id}</td>
                        <td>${record.cow_id}</td>
                        <td>${record.vet_id}</td>
                        <td>${record.disease_details}</td>
                        <td>${record.treatment}</td>
                        <td>${record.record_date}</td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Health loading error:", error);
    }
}

// ===============================
// BREEDING
// ===============================

async function loadBreeding() {
    loadTable("/breeding", "breedingList", [
        ["ID", "breeding_id"],
        ["Cow ID", "cow_id"],
        ["Breeding Date", "breeding_date"],
        ["Pregnancy Status", "pregnancy_status"],
        ["Expected Delivery", "expected_delivery_date"]
    ]);
}

// ===============================
// FEEDING
// ===============================

async function loadFeeding() {
    loadTable("/feeding", "feedingList", [
        ["Feed ID", "feed_id"],
        ["Cow ID", "cow_id"],
        ["Feed Type", "feed_type"],
        ["Quantity (kg)", "feed_qty_kg"],
        ["Date", "feeding_date"],
        ["Cost", "feed_cost"]
    ]);
}

// ===============================
// EXPENSES
// ===============================

async function loadExpenses() {
    loadTable("/expenses", "expenseList", [
        ["ID", "expense_id"],
        ["Category", "expense_category"],
        ["Description", "expense_description"],
        ["Date", "expense_date"],
        ["Amount", "amount"]
    ]);
}

// ===============================
// MILK SALES
// ===============================

async function loadSales() {
    loadTable("/sales", "salesList", [
        ["Sale ID", "sale_id"],
        ["Date", "sale_date"],
        ["Customer", "customer_name"],
        ["Milk Quantity", "milk_qty"],
        ["Price/Litre", "price_per_litre"],
        ["Total Amount", "total_amount"]
    ]);
}

// ===============================
// VETERINARIANS
// ===============================

async function loadVeterinarians() {
    loadTable("/veterinarians", "vetList", [
        ["Vet ID", "vet_id"],
        ["Name", "vet_name"],
        ["Phone", "phone"],
        ["Clinic", "clinic"]
    ]);
}

// ===============================
// COMMON TABLE LOADER
// ===============================

async function loadTable(endpoint, elementId, columns) {
    const container = document.getElementById(elementId);

    try {
        container.textContent = "Loading records...";

        const response = await fetch(`${API}${endpoint}`);
        const records = await response.json();

        if (!response.ok || !Array.isArray(records)) {
            throw new Error(records.error || "Unable to load records");
        }

        if (records.length === 0) {
            container.textContent = "No records found.";
            return;
        }

        container.innerHTML = `
            <table>
                <thead>
                    <tr>
                        ${columns.map(col => `<th>${col[0]}</th>`).join("")}
                    </tr>
                </thead>

                <tbody>
                    ${records.map(record => `
                        <tr>
                            ${columns.map(col =>
                                `<td>${record[col[1]] ?? "-"}</td>`
                            ).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

    } catch (error) {
        console.error("Loading error:", error);
        container.textContent =
            "Error loading records: " + error.message;
    }
}

// ===============================
// REPORTS
// ===============================

async function loadReports() {
    const container = document.getElementById("reportList");

    try {
        const endpoints = [
            ["Cows", "/cows"],
            ["Milk Production", "/milk"],
            ["Milk Sales", "/sales"],
            ["Expenses", "/expenses"],
            ["Feeding", "/feeding"],
            ["Breeding", "/breeding"],
            ["Health Records", "/health"]
        ];

        const results = await Promise.all(
            endpoints.map(async ([name, endpoint]) => {
                const response = await fetch(`${API}${endpoint}`);

                if (!response.ok) {
                    throw new Error(name + " report failed");
                }

                const data = await response.json();

                if (!Array.isArray(data)) {
                    throw new Error(name + " data unavailable");
                }

                return [name, data.length];
            })
        );

        container.innerHTML = `
            <table>
                <tr>
                    <th>Report</th>
                    <th>Total Records</th>
                </tr>

                ${results.map(([name, count]) => `
                    <tr>
                        <td>${name}</td>
                        <td>${count}</td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Report error:", error);
        container.textContent =
            "Unable to load reports: " + error.message;
    }
}

// ===============================
// INITIAL LOAD
// ===============================

loadDashboard();