/**
 * Application Initialization
 * Orchestration layer - delegates to controllers
 */

(function () {
  "use strict";

  const utils = window.Utils;
  let availableBins = [];

  // ============= BIN Management =============
  async function loadBins() {
    try {
      const result = await window.electron.getActiveBins();
      if (result.success) {
        availableBins = result.bins;
        populateBinSelects();
        console.log(`✅ Loaded ${availableBins.length} BINs`);
      }
    } catch (error) {
      console.error("❌ BIN load failed:", error);
    }
  }

  function populateBinSelects() {
    const binSelect = document.getElementById("bin-select");
    const combinedBinSelect = document.getElementById("combined-bin-select");

    if (!binSelect || !combinedBinSelect) return;

    if (availableBins.length === 0) {
      const msg =
        '<option value="">No BINs configured - Contact admin</option>';
      binSelect.innerHTML = msg;
      combinedBinSelect.innerHTML = msg;
      return;
    }

    const binsByType = {};
    availableBins.forEach((bin) => {
      const type = bin.card_type || "Other";
      if (!binsByType[type]) binsByType[type] = [];
      binsByType[type].push(bin);
    });

    let html = "";
    Object.keys(binsByType)
      .sort()
      .forEach((type) => {
        html += `<optgroup label="${type}">`;
        binsByType[type].forEach((bin) => {
          html += `<option value="${bin.bin_pattern}">${type}</option>`;
        });
        html += `</optgroup>`;
      });

    binSelect.innerHTML = html;
    combinedBinSelect.innerHTML = html;
  }

  // ============= Global Helper =============
  window.copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      utils.showSuccess(`${label} copied!`);
    } catch (error) {
      utils.showError(`Failed to copy ${label}`);
    }
  };

  // ============= Navigation =============
  function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const tabContents = document.querySelectorAll(".tab-content");

    navItems.forEach((item) => {
      item.addEventListener("click", () => {
        const tabName = item.getAttribute("data-tab");
        navItems.forEach((nav) => nav.classList.remove("active"));
        tabContents.forEach((content) => content.classList.remove("active"));
        item.classList.add("active");
        document.getElementById(`${tabName}-tab`)?.classList.add("active");
      });
    });

    // Admin shortcut
    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        window.goToAdmin();
      }
    });
  }

  // ============= Main Init =============
  async function init() {
    console.log("🚀 Initializing app...");

    await loadBins();

    // Initialize all controllers
    window.CardsController?.init();
    window.AddressController?.init();
    window.CombinedController?.init();
    window.CursorController?.init();
    window.TempmailInit?.init();
    
    initNavigation();

    console.log("✅ App ready!");
  }

  window.AppInit = { init };
})();
