/**
 * Simple Script Loader
 * Only handles loading JavaScript files - KISS principle
 * @module core/bootstrap
 */

(function () {
  "use strict";

  const ScriptLoader = {
    // Simple script loader
    async loadScript(src) {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        script.onerror = () => reject(new Error(`Failed to load: ${src}`));
        document.head.appendChild(script);
      });
    },

    // Load multiple scripts in sequence
    async loadScripts(scripts) {
      for (const script of scripts) {
        console.log(`📦 Loading ${script.split('/').pop()}...`);
        await this.loadScript(script);
      }
    },

    // Main app scripts
    getMainScripts() {
      return [
        // Core utilities first
        "core/utils.js",
        "core/dialog.js",
        
        // Base classes (load order matters!)
        "mvc/models/BaseModel.js",
        "mvc/views/BaseView.js",
        "mvc/controllers/baseController.js",
        
        // Models
        "mvc/models/cardGenerator.js",
        "mvc/models/nameGenerator.js", 
        "mvc/models/addressGenerator.js",
        
        // Views - Components
        "mvc/views/components/sidebar.js",
        "mvc/views/components/footer.js",
        "mvc/views/components/loadingOverlay.js",
        
        // Views - Pages
        "mvc/views/pages/cardsTab.js",
        "mvc/views/pages/addressTab.js",
        "mvc/views/pages/combinedTab.js",
        "mvc/views/pages/cursorResetTab.js",
        "mvc/views/pages/tempmailTab.js",
        
        // Controllers (after base classes)
        "mvc/controllers/cardsController.js",
        "mvc/controllers/addressController.js",
        "mvc/controllers/combinedController.js",
        "mvc/controllers/cursorController.js",
        "mvc/controllers/tempmailController.js",
        
        // CSV loader
        "../modules/csvLoader.js",
        
        // App initialization (last!)
        "core/appInit.js"
      ];
    },

    // Admin scripts
    getAdminScripts() {
      return [
        "core/utils.js",
        "core/dialog.js",
        "components/shared/admin-login.js",
        "components/shared/admin-sidebar.js",
        "components/shared/bins-section.js",
        "components/shared/settings-section.js",
        "admin.js"
      ];
    },

    // Initialize based on mode
    async init(mode = "main") {
      try {
        console.log(`🚀 Loading ${mode} application...`);
        
        const scripts = mode === "admin" ? this.getAdminScripts() : this.getMainScripts();
        await this.loadScripts(scripts);
        
        console.log("✅ Scripts loaded successfully!");
        return true;
      } catch (error) {
        console.error("❌ Script loading failed:", error);
        alert(`Failed to load application: ${error.message}`);
        return false;
      }
    }
  };

  window.ScriptLoader = ScriptLoader;
  // Backward compatibility
  window.AppBootstrap = ScriptLoader;
})();
