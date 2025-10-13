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
        // Base Controller (must load first)
        "controllers/base-controller.js",
        // Shared Components
        "components/shared/component-loader.js",
        "components/shared/sidebar.js",
        "components/shared/footer.js",
        "components/shared/loading-overlay.js",
        // Tab Components
        "components/tabs/cards-tab.js",
        "components/tabs/address-tab.js",
        "components/tabs/combined-tab.js",
        "components/tabs/cursor-reset-tab.js",
        "components/tabs/tempmail-tab.js",
        // Models
        "../models/card-generator.js",
        "../models/name-generator.js",
        "../models/address-generator.js",
        // Modules
        "../modules/csv-loader.js",
        // Controllers (Modular)
        "controllers/cards-controller.js",
        "controllers/address-controller.js",
        "controllers/combined-controller.js",
        "controllers/cursor-controller.js",
        "controllers/tempmail-controller.js",
        // Utils & Init
        "utils/utils.js",
        "dialog.js",
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
        // Components
        "components/shared/component-loader.js",
        "components/shared/admin-login.js",
        "components/shared/admin-sidebar.js",
        "components/shared/bins-section.js",
        "components/shared/settings-section.js",
        "components/shared/bin-modal.js",
        "components/shared/loading-overlay.js",
        // Utils & Init
        "utils/utils.js",
        "dialog.js",
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
