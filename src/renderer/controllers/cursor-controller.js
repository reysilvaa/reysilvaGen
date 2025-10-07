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
    const div = document.createElement("div");
    div.style.color = colors[type];
    div.textContent = msg;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
  };

  resetBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    idsDiv.style.display = "none";
    utils.showLoading();
    addLog("🔄 Memulai reset Machine ID...", "info");

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
        addLog("✅ Machine ID berhasil direset!", "success");
        utils.showSuccess("Machine ID reset berhasil!");
      } else {
        addLog(`❌ Error: ${result.message}`, "error");
        utils.showError(result.message);
      }
    } catch (error) {
      addLog(`❌ ${error.message}`, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });

  closeBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    utils.showLoading();
    addLog("❌ Menutup Cursor...", "info");
    try {
      const result = await window.cursorResetAPI.closeCursor();
      addLog(
        result.success ? "✅ Cursor ditutup!" : `⚠️ ${result.message}`,
        result.success ? "success" : "warning"
      );
      if (result.success) utils.showSuccess("Cursor ditutup!");
    } catch (error) {
      addLog(`❌ ${error.message}`, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });

  statusBtn?.addEventListener("click", async () => {
    output.innerHTML = "";
    utils.showLoading();
    addLog("📊 Memeriksa status...", "info");
    try {
      const result = await window.cursorResetAPI.checkCursorStatus();
      addLog(
        result.isRunning ? "✅ Cursor berjalan" : "ℹ️ Cursor tidak berjalan",
        result.isRunning ? "success" : "info"
      );
    } catch (error) {
      addLog(`❌ ${error.message}`, "error");
      utils.showError(error.message);
    } finally {
      utils.hideLoading();
    }
  });
}

window.CursorController = { init: initCursorTab };

