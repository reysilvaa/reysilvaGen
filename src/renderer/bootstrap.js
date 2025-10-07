/**
 * Universal Bootstrap - KISS Principle
 * One file to rule them all
 */

(function () {
  "use strict";

  const Bootstrap = {
    loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed: ${src}`));
        document.head.appendChild(script);
      });
    },

    async loadScripts(scripts) {
      for (const script of scripts) await this.loadScript(script);
    },

    async initMain() {
      console.log("🚀 Loading main app...");

      await this.loadScripts([
        // Components
        "components/component-loader.js",
        "components/sidebar.js",
        "components/cards-tab.js",
        "components/address-tab.js",
        "components/combined-tab.js",
        "components/cursor-reset-tab.js",
        "components/tempmail-tab.js",
        "components/footer.js",
        "components/loading-overlay.js",
        // Libraries
        "dialog.js",
        "../lib/card-generator.js",
        "../lib/name-generator.js",
        "../lib/csv-loader.js",
        "../lib/address-generator.js",
        // Utils & Init
        "utils.js",
        "app-init.js",
      ]);

      // Render UI
      const sidebar = document.getElementById("sidebar-container");
      if (sidebar) sidebar.innerHTML = window.Sidebar.render();

      const main = document.getElementById("main-content-container");
      if (main) {
        main.innerHTML =
          window.CardsTab.render() +
          window.AddressTab.render() +
          window.CombinedTab.render() +
          window.CursorResetTab.render() +
          window.TempmailTab.render();
      }

      const footer = document.getElementById("footer-container");
      if (footer) footer.innerHTML = window.Footer.render();

      const loading = document.getElementById("loading-overlay-container");
      if (loading) loading.innerHTML = window.LoadingOverlay.render();

      // Initialize app logic
      setTimeout(() => window.AppInit.init(), 100);
    },

    async initAdmin() {
      console.log("🔐 Loading admin panel...");

      await this.loadScripts([
        "components/component-loader.js",
        "components/admin-login.js",
        "components/admin-sidebar.js",
        "components/bins-section.js",
        "components/settings-section.js",
        "components/bin-modal.js",
        "components/loading-overlay.js",
        "dialog.js",
        "utils.js",
        "admin.js",
      ]);

      const login = document.getElementById("admin-login-container");
      if (login) login.innerHTML = window.AdminLogin.render();

      const sidebar = document.getElementById("admin-sidebar-container");
      if (sidebar) sidebar.innerHTML = window.AdminSidebar.render();

      const adminContent = document.getElementById("admin-main-content");
      if (adminContent) {
        adminContent.innerHTML =
          window.BinsSection.render() + window.SettingsSection.render();
      }

      const adminModals = document.getElementById("admin-modals-container");
      if (adminModals) adminModals.innerHTML = window.BinModal.render();

      const loading = document.getElementById("loading-overlay-container");
      if (loading) loading.innerHTML = window.LoadingOverlay.render();

      // Initialize admin logic
      setTimeout(() => window.AdminInit.init(), 100);
    },

    async init(type = "main") {
      try {
        console.log(`📦 Bootstrap: ${type}`);
        if (type === "admin") await this.initAdmin();
        else await this.initMain();
        console.log("✅ Bootstrap complete!");
      } catch (error) {
        console.error("❌ Bootstrap failed:", error);
        alert(`Bootstrap failed: ${error.message}`);
      }
    },
  };

  window.AppBootstrap = Bootstrap;
})();
