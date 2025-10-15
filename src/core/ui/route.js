/**
 * Simple Tab Routing System
 * Manages tab navigation like a router to prevent confusion
 * @module core/ui/route
 */

(function () {
  "use strict";

  class TabRouter {
    constructor() {
      this.routes = new Map();
      this.currentRoute = null;
      this.controllers = new Map();
      this.isNavigating = false;
    }

    /**
     * Register a route with its controller
     * @param {string} path - Route path (tab name)
     * @param {Object} config - Route configuration
     */
    register(path, config) {
      this.routes.set(path, {
        path,
        controller: config.controller,
        element: config.element || `${path}-tab`,
        navElement: config.navElement || `[data-tab="${path}"]`,
        title: config.title || path,
        onEnter: config.onEnter || null,
        onLeave: config.onLeave || null
      });
      
      console.log(`🛣️ Route registered: ${path}`);
    }

    /**
     * Navigate to a specific route
     * @param {string} path - Route path to navigate to
     * @param {Object} options - Navigation options
     */
    async navigate(path, options = {}) {
      // Prevent double navigation
      if (this.isNavigating) {
        console.log(`⚠️ Navigation in progress, skipping ${path}`);
        return false;
      }

      // Check if already on this route
      if (this.currentRoute === path && !options.force) {
        console.log(`ℹ️ Already on route: ${path}`);
        return true;
      }

      this.isNavigating = true;

      try {
        const route = this.routes.get(path);
        if (!route) {
          console.error(`❌ Route not found: ${path}`);
          return false;
        }

        console.log(`🧭 Navigating to: ${path}`);

        // Call onLeave for current route
        if (this.currentRoute) {
          const currentRoute = this.routes.get(this.currentRoute);
          if (currentRoute?.onLeave) {
            await currentRoute.onLeave();
          }
        }

        // Hide all tabs
        this.hideAllTabs();

        // Update navigation UI
        this.updateNavigation(path);

        // Show target tab
        this.showTab(route.element);

        // Initialize controller if needed (only once)
        await this.initializeController(path, route);

        // Call onEnter for new route
        if (route.onEnter) {
          await route.onEnter();
        }

        // Update current route
        this.currentRoute = path;
        
        console.log(`✅ Navigation completed: ${path}`);
        return true;

      } catch (error) {
        console.error(`❌ Navigation failed to ${path}:`, error);
        return false;
      } finally {
        this.isNavigating = false;
      }
    }

    /**
     * Hide all tab content elements
     */
    hideAllTabs() {
      document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('tab-content--active');
      });
    }

    /**
     * Show specific tab element
     * @param {string} elementId - Tab element ID
     */
    showTab(elementId) {
      const tabElement = document.getElementById(elementId);
      if (tabElement) {
        tabElement.classList.add('tab-content--active');
      } else {
        console.warn(`⚠️ Tab element not found: ${elementId}`);
      }
    }

    /**
     * Update navigation UI state
     * @param {string} activePath - Currently active path
     */
    updateNavigation(activePath) {
      // Remove active class from all nav items
      document.querySelectorAll('.nav__item').forEach(nav => {
        nav.classList.remove('nav__item--active');
      });

      // Add active class to current nav item
      const activeNav = document.querySelector(`[data-tab="${activePath}"]`);
      if (activeNav) {
        activeNav.classList.add('nav__item--active');
      }
    }

    /**
     * Initialize controller for route if needed
     * @param {string} path - Route path
     * @param {Object} route - Route configuration
     */
    async initializeController(path, route) {
      if (!route.controller) return;

      // Check if controller already exists and is active
      const existingController = this.controllers.get(path);
      if (existingController && !existingController.isDestroyed) {
        console.log(`ℹ️ Controller already initialized for ${path}`);
        return existingController;
      }

      // Check if currently initializing to prevent race condition
      const initKey = `${path}_initializing`;
      if (this[initKey]) {
        console.log(`⏳ Controller initialization in progress for ${path}`);
        return;
      }

      // Set initialization flag
      this[initKey] = true;

      try {
        console.log(`🎮 Initializing controller for ${path}`);
        
        if (typeof route.controller === 'object' && route.controller.init) {
          const controller = await route.controller.init();
          if (controller) {
            this.controllers.set(path, controller);
            console.log(`✅ Controller stored for ${path}`);
            return controller;
          }
        }
      } catch (error) {
        console.error(`❌ Failed to initialize controller for ${path}:`, error);
      } finally {
        // Clear initialization flag
        delete this[initKey];
      }
    }

    /**
     * Get current route
     * @returns {string|null} Current route path
     */
    getCurrentRoute() {
      return this.currentRoute;
    }

    /**
     * Get controller for specific route
     * @param {string} path - Route path
     * @returns {Object|null} Controller instance
     */
    getController(path) {
      return this.controllers.get(path) || null;
    }

    /**
     * Check if route exists
     * @param {string} path - Route path
     * @returns {boolean} True if route exists
     */
    hasRoute(path) {
      return this.routes.has(path);
    }

    /**
     * Get all registered routes
     * @returns {Array} Array of route paths
     */
    getRoutes() {
      return Array.from(this.routes.keys());
    }

    /**
     * Setup navigation event listeners
     */
    setupNavigation() {
      const navItems = document.querySelectorAll('.nav__item[data-tab]');
      
      navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
          e.preventDefault();
          const path = item.getAttribute('data-tab');
          if (path) {
            await this.navigate(path);
          }
        });
      });

      console.log(`🎯 Navigation listeners setup for ${navItems.length} items`);
    }

    /**
     * Navigate to default route
     */
    async navigateToDefault() {
      const defaultRoute = this.getRoutes()[0] || 'cards';
      await this.navigate(defaultRoute);
    }
  }

  // Create global router instance
  const router = new TabRouter();

  // Export router
  window.TabRouter = router;

  console.log('🛣️ Tab Router initialized');
})();
