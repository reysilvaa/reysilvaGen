/**
 * Cursor Reset Tab Controller
 * Handles cursor reset operations
 */

function initCursorTab() {
  const utils = window.Utils;
  
  const resetBtn = document.getElementById("reset-machine-id-btn");
  const closeBtn = document.getElementById("close-cursor-btn");
  const statusBtn = document.getElementById("check-cursor-status-btn");
  const output = document.getElementById("cursor-reset-output");
  const idsDiv = document.getElementById("cursor-reset-ids");

  const addLog = (msg, type = "info") => {
    const colors = {
      info: "#4a9eff",
      success: "#4ade80",
      error: "#f87171",
      warning: "#ffc107",
    };
    const icons = {
      info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`,
      success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <polyline points="20 6 9 17 4 12"/>
      </svg>`,
      error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle; margin-right: 6px;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
    };
    const div = document.createElement("div");
    div.style.color = colors[type];
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.marginBottom = "6px";
    div.innerHTML = icons[type] + msg;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  resetBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    idsDiv.style.display = "none";
    utils.showLoading();
    addLog("Memulai reset Machine ID...", "info");

    try {
      const result = await window.cursorResetAPI.resetMachineId();
      if (result.success) {
        result.logs?.forEach((log) => addLog(log.message, log.type));
        if (result.newIds) {
          document.getElementById("new-device-id").textContent =
            result.newIds.devDeviceId || "-";
          document.getElementById("new-machine-id").textContent =
            result.newIds.machineId || "-";
          document.getElementById("new-sqm-id").textContent =
            result.newIds.sqmId || "-";
          idsDiv.style.display = "block";
        }
        addLog("Machine ID berhasil direset!", "success");
        utils.showSuccess("Machine ID reset berhasil!");
      } else {
        addLog(`Error: ${result.message}`, "error");
        utils.showError(result.message);
      }
    } catch (error) {
      addLog(error.message, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });

  closeBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    utils.showLoading();
    addLog("Menutup Cursor...", "info");
    try {
      const result = await window.cursorResetAPI.closeCursor();
      addLog(
        result.success ? "Cursor ditutup!" : result.message,
        result.success ? "success" : "warning"
      );
      if (result.success) utils.showSuccess("Cursor ditutup!");
    } catch (error) {
      addLog(error.message, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });

  statusBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    utils.showLoading();
    addLog("Memeriksa status...", "info");
    try {
      const result = await window.cursorResetAPI.checkCursorStatus();
      addLog(
        result.isRunning ? "Cursor berjalan" : "Cursor tidak berjalan",
        result.isRunning ? "success" : "info"
      );
    } catch (error) {
      addLog(error.message, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });
}

window.CursorController = { init: initCursorTab };

