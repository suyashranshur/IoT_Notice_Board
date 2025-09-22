// ===== CONFIGURATION =====
const WRITE_API_KEY = "G1D1OFB5PGZWS2GV";
const CHANNEL_ID = "3074435";
const READ_API_KEY = "EFRS9QCXXMPDQJQJ";

const USERNAME = "admin";  // Change this
const PASSWORD = "1234";   // Change this

async function login() {
  let user = document.getElementById("username").value;
  let pass = document.getElementById("password").value;
const response = await fetch('/api/login', {   // ✅ relative path works on Vercel

    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  });
  const data = await response.json();
  if (data.success) {
    document.getElementById("loginCard").classList.add("hidden");
    // We keep the public notice card visible, but hide the login card and show the authenticated card
    document.getElementById("noticeCard").classList.remove("hidden");
    document.getElementById("loggedUser").textContent = "👤 " + user;
    loadHistory(false);
  } else {
    alert(data.message || "Invalid Credentials!");
  }
}

function logout() {
  document.getElementById("loginCard").classList.remove("hidden");
  document.getElementById("noticeCard").classList.add("hidden");
  document.getElementById("loggedUser").textContent = "";
}

async function sendNotice() {
  let notice = document.getElementById("noticeInput").value.trim();
  if(notice === "") {
    alert("Please enter a notice.");
    return;
  }
  let url = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}&field1=${encodeURIComponent(notice)}`;
  let response = await fetch(url);
  if(response.ok) {
    alert("✅ Notice sent successfully!");
    document.getElementById("noticeInput").value = "";
    loadHistory(false);
  } else {
    alert("❌ Failed to send notice.");
  }
}

// showAll: false = previous day only, true = all
async function loadHistory(showAll = false) {
  let historyDiv = document.getElementById("history");
  historyDiv.innerHTML = "<p>Loading notices...</p>";
  let url = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=10`;
  let response = await fetch(url);
  
  // Check if the user is currently logged in by checking the visibility of the authenticated card
  const isLoggedIn = !document.getElementById("noticeCard").classList.contains("hidden");

  if(response.ok) {
    let data = await response.json();
    let feeds = data.feeds;
    if(feeds.length === 0) {
      historyDiv.innerHTML = "<p>No notices found.</p>";
      return;
    }
    historyDiv.innerHTML = "";
    // Calculate last 24 hours range
    let now = new Date();
    let last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let filteredFeeds = feeds.reverse().filter(f => {
      let noticeText = f.field1;
      if (!noticeText || noticeText.trim() === "") return false;
      if (showAll) return true;
      let created = new Date(f.created_at);
      return created >= last24h && created <= now;
    });

    filteredFeeds.forEach(f => {
      let noticeText = f.field1;
      let time = new Date(f.created_at).toLocaleString();
      let div = document.createElement("div");
      div.className = "notice-item";
      
      let actionsHtml = '';
      
      // ONLY show republish/delete buttons if the user is logged in
      if (isLoggedIn) {
          actionsHtml = `
            <div class="notice-actions">
              <button class="notice-action-btn" onclick="republishNotice('${noticeText.replace(/'/g,"\\'")}')">Republish</button>
              <button class="notice-action-btn delete-btn" onclick="deleteNotice('${f.entry_id}')">Delete</button>
            </div>
          `;
      }

      div.innerHTML = `
        <strong>${time}</strong><br>${noticeText}
        ${actionsHtml}
      `;
      historyDiv.appendChild(div);
    });

    if (historyDiv.innerHTML === "") {
      historyDiv.innerHTML = "<p>No notices found.</p>";
    }
  } else {
    historyDiv.innerHTML = "<p>Failed to load history.</p>";
  }
}

// Republish: asks for confirmation, then sends to ThingSpeak if confirmed
function republishNotice(text) {
  if (confirm("Are you sure you want to republish this notice?")) {
    // Send to ThingSpeak
    let url = `https://api.thingspeak.com/update?api_key=${WRITE_API_KEY}&field1=${encodeURIComponent(text)}`;
    fetch(url)
      .then(response => {
        if (response.ok) {
          alert("✅ Notice republished successfully!");
          loadHistory(false);
        } else {
          alert("❌ Failed to republish notice.");
        }
      })
      .catch(() => {
        alert("❌ Failed to republish notice.");
      });
  }
}

// Delete: only removes from UI (ThingSpeak free API does not support delete)
function deleteNotice(entryId) {
  // Only remove from UI, as ThingSpeak does not support delete via API
  if(confirm("Are you sure you want to delete this notice? (This only removes it from view until next reload)")) {
    const btn = event.target;
    const noticeDiv = btn.closest('.notice-item');
    if(noticeDiv) noticeDiv.remove();
  }
}

function showReset() {
  document.getElementById("loginCard").classList.add("hidden");
  document.getElementById("resetCard").classList.remove("hidden");
}

function hideReset() {
  document.getElementById("resetCard").classList.add("hidden");
  document.getElementById("loginCard").classList.remove("hidden");
}

function resetPassword() {
  const username = document.getElementById("resetUsername").value.trim();
  const email = document.getElementById("resetEmail").value.trim();
  if (!username || !email) {
    alert("Please enter your username and email.");
    return;
  }
  // Simulate sending reset link
  alert("If the username and email are correct, a password reset link will be sent to your email.");
  hideReset();
}

// Make sure functions are globally accessible
window.login = login;
window.logout = logout;
window.sendNotice = sendNotice;
window.loadHistory = loadHistory;
window.republishNotice = republishNotice;
window.deleteNotice = deleteNotice;
window.showReset = showReset;
window.hideReset = hideReset;
window.resetPassword = resetPassword;

// Load notices immediately when the page loads
window.onload = function() {
  // loadHistory(false) is called here to populate the new Public Notices Card
  loadHistory(false); 
};