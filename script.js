
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


let milkRecords = [];

async function loadMilk() {
    try {
        const response = await fetch(`${API}/milk`);
        const records = await response.json();

        if (!response.ok || !Array.isArray(records)) {
            throw new Error(records.error || "Unable to load milk records");
        }

        milkRecords = records;

        // Load cow names into the milk form dropdown
        const cowResponse = await fetch(`${API}/cows`);
        const cows = await cowResponse.json();

        const cowSelect = document.getElementById("milkCowId");

        if (cowSelect && Array.isArray(cows)) {
            cowSelect.innerHTML = `
                <option value="">Select Cow</option>
                ${cows.map(cow => `
                    <option value="${cow.cow_id}">
                        ${cow.cow_name} (ID: ${cow.cow_id})
                    </option>
                `).join("")}
            `;
        }

        document.getElementById("milkList").innerHTML = `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Cow ID</th>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Total</th>
                    <th>Actions</th>
                </tr>

                ${records.map(record => `
                    <tr>
                        <td>${record.production_id}</td>
                        <td>${record.cow_id}</td>
                        <td>${record.production_date}</td>
                        <td>${record.morning_qty}</td>
                        <td>${record.evening_qty}</td>
                        <td>${record.total_qty}</td>
                        <td>
                            <button onclick="editMilk(${record.production_id})">Edit</button>
                            <button onclick="deleteMilk(${record.production_id})">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Milk loading error:", error);
        document.getElementById("milkList").textContent =
            "Unable to load milk records: " + error.message;
    }
}

// ===============================
// HEALTH RECORDS
// ===============================


let healthRecords = [];

async function loadHealth() {
    try {
        const response = await fetch(`${API}/health`);
        const records = await response.json();

        if (!response.ok || !Array.isArray(records)) {
            throw new Error(records.error || "Unable to load health records");
        }

        healthRecords = records;

        const [cowResponse, vetResponse] = await Promise.all([
            fetch(`${API}/cows`),
            fetch(`${API}/veterinarians`)
        ]);

        const cows = await cowResponse.json();
        const vets = await vetResponse.json();

        document.getElementById("healthCowId").innerHTML =
            '<option value="">Select Cow</option>' +
            cows.map(cow =>
                `<option value="${cow.cow_id}">${cow.cow_name} (ID: ${cow.cow_id})</option>`
            ).join("");

        document.getElementById("healthVetId").innerHTML =
            '<option value="">Select Veterinarian</option>' +
            vets.map(vet =>
                `<option value="${vet.vet_id}">${vet.vet_name} (ID: ${vet.vet_id})</option>`
            ).join("");

        document.getElementById("healthList").innerHTML = `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Cow ID</th>
                    <th>Vet ID</th>
                    <th>Disease</th>
                    <th>Treatment</th>
                    <th>Vaccination Date</th>
                    <th>Record Date</th>
                    <th>Actions</th>
                </tr>
                ${records.map(record => `
                    <tr>
                        <td>${record.record_id}</td>
                        <td>${record.cow_id}</td>
                        <td>${record.vet_id}</td>
                        <td>${record.disease_details || ""}</td>
                        <td>${record.treatment || ""}</td>
                        <td>${record.vaccination_date || ""}</td>
                        <td>${record.record_date || ""}</td>
                        <td>
                            <button onclick="editHealth(${record.record_id})">Edit</button>
                            <button onclick="deleteHealth(${record.record_id})">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Health error:", error);
        document.getElementById("healthList").textContent =
            "Unable to load health records: " + error.message;
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



let feedingRecords = [];

async function loadFeeding() {
    try {
        const response = await fetch(`${API}/feeding`);
        const records = await response.json();

        if (!response.ok || !Array.isArray(records)) {
            throw new Error(records.error || "Unable to load feeding records");
        }

        feedingRecords = records;

        // Load registered cows into dropdown
        const cowResponse = await fetch(`${API}/cows`);
        const cows = await cowResponse.json();

        const cowSelect = document.getElementById("feedCowId");

        if (cowSelect && Array.isArray(cows)) {
            cowSelect.innerHTML = `
                <option value="">Select Cow</option>
                ${cows.map(cow => `
                    <option value="${cow.cow_id}">
                        ${cow.cow_name} (ID: ${cow.cow_id})
                    </option>
                `).join("")}
            `;
        }

        document.getElementById("feedingList").innerHTML = `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Cow ID</th>
                    <th>Feed Type</th>
                    <th>Quantity</th>
                    <th>Date</th>
                    <th>Cost</th>
                    <th>Actions</th>
                </tr>

                ${records.map(record => `
                    <tr>
                        <td>${record.feed_id}</td>
                        <td>${record.cow_id}</td>
                        <td>${record.feed_type}</td>
                        <td>${record.feed_qty_kg} kg</td>
                        <td>${record.feeding_date}</td>
                        <td>₹${record.feed_cost}</td>
                        <td>
                            <button onclick="editFeeding(${record.feed_id})">Edit</button>
                            <button onclick="deleteFeeding(${record.feed_id})">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Feeding error:", error);
        document.getElementById("feedingList").textContent =
            "Unable to load feeding records: " + error.message;
    }
}

// ===============================
// EXPENSES
// ===============================


   
let expenseRecords = [];

async function loadExpenses() {
    try {
        const response = await fetch(`${API}/expenses`);
        const records = await response.json();

        if (!response.ok || !Array.isArray(records)) {
            throw new Error(records.error || "Unable to load expenses");
        }

        expenseRecords = records;

        document.getElementById("expenseList").innerHTML = `
            <table>
                <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                </tr>

                ${records.map(record => `
                    <tr>
                        <td>${record.expense_id}</td>
                        <td>${record.expense_category}</td>
                        <td>${record.expense_description}</td>
                        <td>${record.expense_date}</td>
                        <td>${record.amount}</td>
                        <td>
                            <button onclick="editExpense(${record.expense_id})">Edit</button>
                            <button onclick="deleteExpense(${record.expense_id})">Delete</button>
                        </td>
                    </tr>
                `).join("")}
            </table>
        `;

    } catch (error) {
        console.error("Expense loading error:", error);
        document.getElementById("expenseList").textContent =
            "Unable to load expenses: " + error.message;
    }
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
// MILK FORM OPERATIONS
// ===============================

document.getElementById("milkForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("productionId").value;

    const data = {
        productionId: id,
        milkCowId: document.getElementById("milkCowId").value,
        milkDate: document.getElementById("milkDate").value,
        morningQty: document.getElementById("morningQty").value,
        eveningQty: document.getElementById("eveningQty").value
    };

    try {
        const response = await fetch(`${API}/milk`, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();

        if (result.error) throw new Error(result.error);

        alert("Milk record saved successfully!");

        resetMilkForm();
        loadMilk();
        loadDashboard();

    } catch (error) {
        alert("Milk error: " + error.message);
    }
});

function editMilk(id) {
    const record = milkRecords.find(item => item.production_id === id);
    if (!record) return;

    document.getElementById("productionId").value = record.production_id;
    document.getElementById("milkCowId").value = record.cow_id;
    document.getElementById("milkDate").value = String(record.production_date).substring(0, 10);
    document.getElementById("morningQty").value = record.morning_qty;
    document.getElementById("eveningQty").value = record.evening_qty;

    document.getElementById("milkForm").scrollIntoView({
        behavior: "smooth"
    });
}

async function deleteMilk(id) {
    if (!confirm("Delete this milk record?")) return;

    try {
        const response = await fetch(`${API}/milk?id=${id}`, {
            method: "DELETE"
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        alert("Milk record deleted!");
        resetMilkForm();
        loadMilk();
        loadDashboard();

    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

function resetMilkForm() {
    document.getElementById("milkForm").reset();
    document.getElementById("productionId").value = "";
}


// ===============================
// EXPENSE FORM OPERATIONS
// ===============================

document.getElementById("expenseForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("expenseId").value;

    const data = {
        expenseId: id,
        expenseCategory: document.getElementById("expenseCategory").value,
        expenseDescription: document.getElementById("expenseDescription").value,
        expenseDate: document.getElementById("expenseDate").value,
        expenseAmount: document.getElementById("expenseAmount").value
    };

    try {
        const response = await fetch(`${API}/expenses`, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        alert("Expense saved successfully!");

        resetExpenseForm();
        loadExpenses();

    } catch (error) {
        alert("Expense error: " + error.message);
    }
});

function editExpense(id) {
    const record = expenseRecords.find(item => item.expense_id === id);
    if (!record) return;

    document.getElementById("expenseId").value = record.expense_id;
    document.getElementById("expenseCategory").value = record.expense_category;
    document.getElementById("expenseDescription").value = record.expense_description;
    document.getElementById("expenseDate").value = String(record.expense_date).substring(0, 10);
    document.getElementById("expenseAmount").value = record.amount;

    document.getElementById("expenseForm").scrollIntoView({
        behavior: "smooth"
    });
}

async function deleteExpense(id) {
    if (!confirm("Delete this expense record?")) return;

    try {
        const response = await fetch(`${API}/expenses?id=${id}`, {
            method: "DELETE"
        });

        const result = await response.json();
        if (result.error) throw new Error(result.error);

        alert("Expense deleted successfully!");

        resetExpenseForm();
        loadExpenses();

    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

function resetExpenseForm() {
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseId").value = "";
}

// ===============================
// FEEDING FORM OPERATIONS
// ===============================

document.getElementById("feedingForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("feedId").value;

    const data = {
        feedId: id,
        feedCowId: document.getElementById("feedCowId").value,
        feedType: document.getElementById("feedType").value,
        feedQtyKg: document.getElementById("feedQtyKg").value,
        feedingDate: document.getElementById("feedingDate").value,
        feedCost: document.getElementById("feedCost").value
    };

    try {
        const response = await fetch(`${API}/feeding`, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to save feeding record");
        }

        alert("Feeding record saved successfully!");

        resetFeedingForm();
        loadFeeding();

    } catch (error) {
        alert("Feeding error: " + error.message);
    }
});

function editFeeding(id) {
    const record = feedingRecords.find(item => item.feed_id === id);
    if (!record) return;

    document.getElementById("feedId").value = record.feed_id;
    document.getElementById("feedCowId").value = record.cow_id;
    document.getElementById("feedType").value = record.feed_type;
    document.getElementById("feedQtyKg").value = record.feed_qty_kg;
    document.getElementById("feedingDate").value =
        String(record.feeding_date).substring(0, 10);
    document.getElementById("feedCost").value = record.feed_cost;

    document.getElementById("feedingForm").scrollIntoView({
        behavior: "smooth"
    });
}

async function deleteFeeding(id) {
    if (!confirm("Are you sure you want to delete this feeding record?")) {
        return;
    }

    try {
        const response = await fetch(`${API}/feeding?id=${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to delete record");
        }

        alert("Feeding record deleted successfully!");

        resetFeedingForm();
        loadFeeding();

    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

function resetFeedingForm() {
    document.getElementById("feedingForm").reset();
    document.getElementById("feedId").value = "";
}

document.getElementById("healthForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("recordId").value;

    const data = {
        recordId: id,
        healthCowId: document.getElementById("healthCowId").value,
        healthVetId: document.getElementById("healthVetId").value,
        diseaseDetails: document.getElementById("diseaseDetails").value,
        treatment: document.getElementById("treatment").value,
        vaccinationDate: document.getElementById("vaccinationDate").value,
        recordDate: document.getElementById("recordDate").value
    };

    try {
        const response = await fetch(`${API}/health`, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams(data)
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to save health record");
        }

        alert("Health record saved successfully!");
        resetHealthForm();
        loadHealth();

    } catch (error) {
        alert("Health error: " + error.message);
    }
});

function editHealth(id) {
    const record = healthRecords.find(item => item.record_id === id);

    if (!record) return;

    document.getElementById("recordId").value = record.record_id;
    document.getElementById("healthCowId").value = record.cow_id;
    document.getElementById("healthVetId").value = record.vet_id;
    document.getElementById("diseaseDetails").value = record.disease_details;
    document.getElementById("treatment").value = record.treatment;
    document.getElementById("vaccinationDate").value =
        record.vaccination_date ? String(record.vaccination_date).substring(0, 10) : "";
    document.getElementById("recordDate").value =
        String(record.record_date).substring(0, 10);

    document.getElementById("healthForm").scrollIntoView({behavior: "smooth"});
}

async function deleteHealth(id) {
    if (!confirm("Are you sure you want to delete this health record?")) return;

    try {
        const response = await fetch(`${API}/health?id=${id}`, {
            method: "DELETE"
        });

        const result = await response.json();

        if (!response.ok || result.error) {
            throw new Error(result.error || "Unable to delete record");
        }

        alert("Health record deleted successfully!");
        resetHealthForm();
        loadHealth();

    } catch (error) {
        alert("Delete error: " + error.message);
    }
}

function resetHealthForm() {
    document.getElementById("healthForm").reset();
    document.getElementById("recordId").value = "";
}

// ===============================
// INITIAL LOAD
// ===============================

loadDashboard();