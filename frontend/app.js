const BASE_URL = "https://hostel-gate-tracker.onrender.com";


// Submit Entry
document.getElementById("entryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const res = await fetch(`${BASE_URL}/entry`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: document.getElementById("name").value,
      roll: document.getElementById("roll").value,
      room: document.getElementById("room").value,
      block: document.getElementById("block").value,
      purpose: document.getElementById("purpose").value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Entry failed");
    return;
  }

  alert("Entry recorded!");

  document.getElementById("entryForm").reset();
  document.getElementById("name").focus();

  loadLogs();
});



// Load Logs
async function loadLogs() {

  try {

    const res = await fetch(`${BASE_URL}/logs`);
    const logs = await res.json();

    console.log("LOGS DATA:", logs);

    // Safety check
    if (!Array.isArray(logs)) {
      console.error("Invalid logs response:", logs);
      return;
    }

    let table = "";

    logs.forEach(item => {

      table += `
<tr style="transition:0.2s;
           background:${item.status === 'OUT' ? '#ffffff' : '#2a2a2a'};
           color:${item.status === 'OUT' ? '#000000' : '#E0E0E0'};
           border-bottom:1px solid #555;"
    onmouseover="this.style.background='#6C63FF22'"
    onmouseout="this.style.background='${item.status === 'OUT' ? '#ffffff' : '#2a2a2a'}'">

<td style="padding:10px;border-right:1px solid #555;">${item.name}</td>
<td style="padding:10px;border-right:1px solid #555;">${item.roll}</td>
<td style="padding:10px;border-right:1px solid #555;">${item.room || "-"}</td>
<td style="padding:10px;border-right:1px solid #555;">${item.block || "-"}</td>
<td style="padding:10px;border-right:1px solid #555;">${item.purpose}</td>

<td style="padding:10px;border-right:1px solid #555;font-weight:bold;">
${item.status}
</td>

<td style="padding:10px;border-right:1px solid #555;">
${item.time_in ? new Date(item.time_in).toLocaleString() : "-"}
</td>

<td style="padding:10px;border-right:1px solid #555;">
${item.time_out ? new Date(item.time_out).toLocaleString() : "-"}
</td>

<td style="padding:10px;border-right:none;">
${
  item.status === "OUT"
  ? `<button onclick="markExit('${item._id}')"
       style="background:#6C63FF;color:white;border:none;padding:6px 10px;border-radius:6px;cursor:pointer;">
       Mark IN
     </button>`
  : `<span style="color:gray;">Closed</span>`
}
</td>

</tr>
`;
    });

    document.querySelector("#logTable tbody").innerHTML = table;

  } catch (err) {
    console.error("Error loading logs:", err);
  }
}



// Mark Exit
async function markExit(id) {

  await fetch(`${BASE_URL}/exit/${id}`, {
    method: "PUT"
  });

  alert("Marked IN");

  loadLogs();
}



// Clear Logs
async function clearLogs() {

  const confirmDelete = confirm("Are you sure you want to delete ALL logs?");

  if (!confirmDelete) return;

  const res = await fetch(`${BASE_URL}/clear-logs`, {
    method: "DELETE"
  });

  const data = await res.json();

  alert(data.message);

  loadLogs();
}



// Download CSV
async function downloadCSV() {

  const res = await fetch(`${BASE_URL}/export-csv`);

  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "hostel_logs.csv";

  a.click();

  window.URL.revokeObjectURL(url);
}



// Download PDF
async function downloadPDF() {

  const res = await fetch(`${BASE_URL}/export-pdf`);

  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;
  a.download = "hostel_logs.pdf";

  a.click();

  window.URL.revokeObjectURL(url);
}



// Dark Mode Toggle
document.addEventListener("DOMContentLoaded", () => {

  const toggleBtn = document.getElementById("themeToggle");

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
    toggleBtn.textContent = "☀️ Light Mode";
  }

  toggleBtn.addEventListener("click", () => {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
      localStorage.setItem("theme", "dark");
      toggleBtn.textContent = "☀️ Light Mode";
    } else {
      localStorage.setItem("theme", "light");
      toggleBtn.textContent = "🌙 Dark Mode";
    }

  });

});



// Load logs when page loads
loadLogs();