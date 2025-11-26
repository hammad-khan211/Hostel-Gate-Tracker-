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
<tr style="transition:0.2s;
           background: ${item.status === 'OUT' ? '#ffffff' : '#2a2a2a'};
           color: ${item.status === 'OUT' ? '#000000' : '#E0E0E0'};
           border-bottom:1px solid #555;"
    onmouseover="this.style.background='#6C63FF22'"
    onmouseout="this.style.background='${item.status === 'OUT' ? '#ffffff' : '#2a2a2a'}'">

  <td style="padding:10px; border-right:1px solid #555;">${item.name}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.person_id}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.room_no || "-"}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.block || "-"}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.purpose}</td>

  <td style="padding:10px; border-right:1px solid #555; font-weight:bold;">${item.status}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.time_in ? new Date(item.time_in).toLocaleString() : "-"}</td>
  <td style="padding:10px; border-right:1px solid #555;">${item.time_out ? new Date(item.time_out).toLocaleString() : "-"}</td>

  <td style="padding:10px; border-right:none;">
    ${
      item.status === "OUT"
      ? `<button onclick="markExit('${item._id}')" 
           style="background:#6C63FF; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">
           Mark IN
         </button>`
      : `<span style="color:gray;">Closed</span>`
    }
  </td>

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

async function downloadCSV() {
  try {
    const res = await fetch(`${BASE_URL}/export-csv`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) {
      alert("Unauthorized or failed to export CSV.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hostel_logs.csv";
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("CSV download error:", err);
    alert("Error downloading CSV.");
  }
}


//PDF
async function downloadPDF() {
  try {
    const res = await fetch(`${BASE_URL}/export-pdf`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    });

    if (!res.ok) {
      alert("Failed to export PDF.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "hostel_logs.pdf";
    a.click();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("PDF download error:", err);
    alert("Error downloading PDF.");
  }
}


//Dark Theme
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("themeToggle");

  // Load saved theme
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
