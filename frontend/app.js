const BASE_URL = "https://hostel-gate-tracker.onrender.com";


// Submit Entry
document.getElementById("entryForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  await fetch(`${BASE_URL}/entry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": localStorage.getItem("token") },
    body: JSON.stringify({
  name: document.getElementById("name").value,
  person_id: document.getElementById("personid").value,
  room_no: document.getElementById("room").value,
  block: document.getElementById("block").value,
  purpose: document.getElementById("purpose").value
})
  });

  alert("Entry recorded!");
  loadLogs();
});

// Load Logs
async function loadLogs() {
  const res = await fetch(`${BASE_URL}/logs`, {
    headers: { "Authorization": localStorage.getItem("token") }
  });

  const logs = await res.json();
  console.log("LOGS DATA:", logs); 

  let table = "";
  logs.forEach(item => {
   table += `
<tr class="${item.status === 'OUT' ? '' : 'closed-row'}">
  <td>${item.name}</td>
  <td>${item.person_id}</td>
 <td>${item.room_no || "-"}</td>
<td>${item.block || "-"}</td>
<td>${item.purpose}</td>

  <td>${item.status}</td>
  <td>${item.time_in ? new Date(item.time_in).toLocaleString() : "-"}</td>
  <td>${item.time_out ? new Date(item.time_out).toLocaleString() : "-"}</td>
  <td>${item.status === "OUT" ? `<button onclick="markExit('${item._id}')">Mark IN</button>` : "Closed"}</td>
</tr>
`;

  });

  document.querySelector("#logTable tbody").innerHTML = table;
}


//Delete Logs / Clear Logs
async function clearLogs() {
  const confirmDelete = confirm("Are you sure you want to delete ALL logs? This action cannot be undone.");
  if (!confirmDelete) return;

  try {
    const res = await fetch(`${BASE_URL}/clear-logs`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      }
    });

    // Read response as text first (because backend might return HTML on error)
    const text = await res.text();

    // If not OK (status != 200)
    if (!res.ok) {
      console.error("Clear logs error:", res.status, text);

      try {
        const json = JSON.parse(text);
        alert(json.message || "Failed to clear logs");
      } catch {
        alert("Failed to clear logs. Check console for details.");
      }
      return;
    }

    // Parse JSON on success
    const data = JSON.parse(text);

    alert(data.message || "All logs cleared successfully.");
    loadLogs();  // Refresh the table after delete

  } catch (err) {
    console.error("Network error:", err);
    alert("Unable to connect to server. Please try again later.");
  }
}




// Mark exit → convert OUT ➜ IN
async function markExit(id) {
  await fetch(`${BASE_URL}/exit/${id}`, {
    method: "PUT",
    headers: {
      "Authorization": localStorage.getItem("token")
    }
  });

  alert("Marked IN");
  loadLogs();
}

loadLogs();
