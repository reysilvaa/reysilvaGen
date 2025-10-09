/**
 * Admin Panel - Simple & Clean
 */

(function () {
  "use strict";

  let session = null;
  let user = null;
  let editingBinId = null;

  function showPanel() {
    document.getElementById("login-modal").style.display = "none";
    document.getElementById("admin-panel").style.display = "flex";
    document.getElementById("admin-username").textContent = user;
    loadBins();
  }

  async function loadBins() {
    Utils.showLoading();
    const result = await window.electron.getAllBins();
    Utils.hideLoading();

    const tbody = document.getElementById("bins-table-body");

    if (!result.success || result.bins.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-muted)">
        ${
          result.success ? "No BINs. Click Add New BIN." : "Failed to load"
        }</td></tr>`;
      return;
    }

    tbody.innerHTML = result.bins
      .map(
        (b) => `
      <tr>
        <td>${b.id}</td>
        <td><span class="bin-pattern">${b.bin_pattern}</span></td>
        <td><span class="card-type-badge">${b.card_type || "N/A"}</span></td>
        <td>${b.description || "-"}</td>
        <td>${b.created_by || "system"}</td>
        <td>${new Date(b.created_at).toLocaleString()}</td>
        <td>
          <div class="bin-actions">
            <button class="btn btn-secondary btn-icon" onclick="editBin(${
              b.id
            },'${b.bin_pattern}','${b.card_type || ""}','${
          b.description || ""
        }')" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn btn-danger btn-icon" onclick="deleteBin(${
              b.id
            })" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `
      )
      .join("");
  }

  // Edit BIN
  window.editBin = (id, pattern, type, description) => {
    editingBinId = id;
    document.getElementById("bin-modal-title").innerHTML =
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:8px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit BIN';
    document.getElementById("bin-pattern").value = pattern;
    document.getElementById("card-type").value = type;
    document.getElementById("bin-description").value = description;
    document.getElementById("bin-modal").style.display = "flex";
  };

  // Delete BIN
  window.deleteBin = async (id) => {
    if (!(await window.dialog.confirm("Delete BIN?", "Delete", true))) return;
    Utils.showLoading();
    const result = await window.electron.deleteBin(id);
    Utils.hideLoading();
    if (result.success) {
      await window.dialog.success("Deleted!");
      loadBins();
    } else {
      await window.dialog.error("Failed: " + result.message);
    }
  };

  async function init() {
    console.log("Admin init starting...");

    // Check session
    const sessionToken = localStorage.getItem("adminSession");
    const storedUser = localStorage.getItem("adminUser");

    if (sessionToken && storedUser) {
      Utils.showLoading();
      const result = await window.electron.adminVerifySession(sessionToken);
      Utils.hideLoading();

      if (result.valid) {
        session = sessionToken;
        user = storedUser;
        showPanel();
        setupEventListeners();
        return;
      }

      localStorage.clear();
    }

    document.getElementById("login-modal").style.display = "flex";
    setupEventListeners();
  }

  function setupEventListeners() {
    console.log("Setting up event listeners...");

    // Login
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        console.log("Login form submitted");

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        Utils.showLoading();
        const result = await window.electron.adminLogin({ username, password });
        Utils.hideLoading();

        console.log("Login result:", result);

        if (result.success) {
          session = result.sessionToken;
          user = result.username;
          localStorage.setItem("adminSession", session);
          localStorage.setItem("adminUser", user);

          console.log("Login successful, showing panel");
          showPanel();
          e.target.reset();
        } else {
          const err = document.getElementById("login-error");
          err.textContent = result.message || "Login failed";
          err.style.display = "block";
          setTimeout(() => (err.style.display = "none"), 5000);
        }
      });
    }

    // Cancel / Back
    const cancelBtn = document.getElementById("cancel-login");
    const backBtn = document.getElementById("back-to-main-btn");
    if (cancelBtn) cancelBtn.onclick = () => window.goToMain();
    if (backBtn) backBtn.onclick = () => window.goToMain();

    // Logout
    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        if (!(await window.dialog.confirm("Logout?"))) return;
        Utils.showLoading();
        await window.electron.adminLogout(session);
        Utils.hideLoading();
        localStorage.clear();
        window.location.reload();
      };
    }

    // Navigation
    document.querySelectorAll(".nav-item").forEach((item) => {
      item.onclick = async () => {
        const section = item.dataset.section;
        document
          .querySelectorAll(".nav-item")
          .forEach((n) => n.classList.remove("active"));
        document
          .querySelectorAll(".admin-section")
          .forEach((s) => s.classList.remove("active"));
        item.classList.add("active");
        document.getElementById(`${section}-section`).classList.add("active");

        if (section === "settings") {
          const result = await window.electron.getConfigPath();
          if (result.success)
            document.getElementById("config-path").textContent = result.path;
        }
      };
    });

    // Reset Config
    const resetBtn = document.getElementById("reset-config-btn");
    if (resetBtn) {
      resetBtn.onclick = async () => {
        if (
          !(await window.dialog.confirm(
            "Reset config?\n\n- Password: admin123\n- BINs: default\n- Sessions: cleared",
            "Reset",
            true
          ))
        )
          return;

        Utils.showLoading();
        const result = await window.electron.resetConfig();
        Utils.hideLoading();

        if (result.success) {
          await window.dialog.success("Config reset!");
          localStorage.clear();
          window.goToMain();
        } else {
          await window.dialog.error("Failed: " + result.message);
        }
      };
    }

    // Add BIN
    const addBinBtn = document.getElementById("add-bin-btn");
    if (addBinBtn) {
      addBinBtn.onclick = () => {
        editingBinId = null;
        document.getElementById("bin-modal-title").innerHTML =
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-right:8px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> Add New BIN';
        document.getElementById("bin-form").reset();
        document.getElementById("bin-modal").style.display = "flex";
      };
    }

    // Save BIN
    const binForm = document.getElementById("bin-form");
    if (binForm) {
      binForm.onsubmit = async (e) => {
        e.preventDefault();

        const binPattern = document.getElementById("bin-pattern").value.trim();
        const cardType = document.getElementById("card-type").value;
        const description = document
          .getElementById("bin-description")
          .value.trim();

        if (!/^[0-9]{6,16}$/.test(binPattern)) {
          const err = document.getElementById("bin-error");
          err.textContent = "BIN must be 6-16 digits";
          err.style.display = "block";
          setTimeout(() => (err.style.display = "none"), 5000);
          return;
        }

        Utils.showLoading();
        const result = editingBinId
          ? await window.electron.updateBin({
              id: editingBinId,
              binPattern,
              cardType,
              description,
            })
          : await window.electron.addBin({
              binPattern,
              cardType,
              description,
              createdBy: user,
            });
        Utils.hideLoading();

        if (result.success) {
          Utils.showSuccess(editingBinId ? "Updated!" : "Added!");
          document.getElementById("bin-modal").style.display = "none";
          e.target.reset();
          loadBins();
        } else {
          const err = document.getElementById("bin-error");
          err.textContent = result.message || "Failed";
          err.style.display = "block";
          setTimeout(() => (err.style.display = "none"), 5000);
        }
      };
    }

    // Cancel BIN
    const cancelBinBtn = document.getElementById("cancel-bin");
    if (cancelBinBtn) {
      cancelBinBtn.onclick = () => {
        document.getElementById("bin-modal").style.display = "none";
        document.getElementById("bin-form").reset();
      };
    }

    // Refresh
    const refreshBtn = document.getElementById("refresh-bins-btn");
    if (refreshBtn) refreshBtn.onclick = loadBins;

    // Escape key
    document.onkeydown = (e) => {
      if (e.key === "Escape") {
        const modal = document.getElementById("bin-modal");
        if (modal && modal.style.display === "flex") {
          modal.style.display = "none";
          document.getElementById("bin-form").reset();
        }
      }
    };

    console.log("Event listeners setup complete");
  }

  // Export
  window.AdminInit = { init };
})();
