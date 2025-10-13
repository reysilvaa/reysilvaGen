/**
 * MVC Application Bootstrap
 * Loads and initializes the MVC architecture components
 * @module core/bootstrap
 */

(function () {
  "use strict";

  const AppBootstrap = {
    progressCallback: null,
    
    setProgressCallback(callback) {
      this.progressCallback = callback;
    },

    updateProgress(progress, status) {
      if (this.progressCallback) {
        this.progressCallback(progress, status);
      }
      console.log(`📊 ${Math.round(progress)}% - ${status}`);
    },

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
      const total = scripts.length;
      for (let i = 0; i < scripts.length; i++) {
        const script = scripts[i];
        const progress = ((i + 1) / total) * 80; // 80% for script loading
        const fileName = script.split('/').pop();
        this.updateProgress(progress, `Loading ${fileName}...`);
        await this.loadScript(script);
      }
    },

    async initMain() {
      console.log("🚀 Loading MVC main application...");
      this.updateProgress(5, "Initializing MVC architecture...");

      await this.loadScripts([
        // MVC Base Classes (must load first)
        "mvc/models/BaseModel.js",
        "mvc/views/BaseView.js", 
        "mvc/controllers/baseController.js",
        
        // Models
        "mvc/models/cardGenerator.js",
        "mvc/models/nameGenerator.js",
        "mvc/models/addressGenerator.js",
        
        // Views - Layouts
        "mvc/views/layouts/MainLayout.js",
        "mvc/views/layouts/AdminLayout.js",
        
        // Views - Components
        "mvc/views/components/componentLoader.js",
        "mvc/views/components/sidebar.js",
        "mvc/views/components/footer.js",
        "mvc/views/components/loadingOverlay.js",
        
        // Views - Pages
        "mvc/views/pages/cardsTab.js",  
        "mvc/views/pages/addressTab.js",
        "mvc/views/pages/combinedTab.js",
        "mvc/views/pages/cursorResetTab.js",
        "mvc/views/pages/tempmailTab.js",
        
        // Controllers
        "mvc/controllers/cardsController.js",
        "mvc/controllers/addressController.js",
        "mvc/controllers/combinedController.js",
        "mvc/controllers/cursorController.js",
        "mvc/controllers/tempmailController.js",
        
        // Core & Modules
        "../modules/csvLoader.js",
        "core/utils.js",
        "core/dialog.js",
        "core/appInit.js",
      ]);

      this.updateProgress(85, "Rendering UI components...");

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

      this.updateProgress(95, "Initializing application logic...");

      // Initialize app logic
      setTimeout(() => {
        this.updateProgress(100, "Application ready!");
        window.AppInit.init();
      }, 100);
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

  window.AppBootstrap = AppBootstrap;
})();
