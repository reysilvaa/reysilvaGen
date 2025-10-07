class ComponentLoader {
  static loadComponent(componentName, targetId) {
    const target = document.getElementById(targetId);
    if (!target) {
      console.error(`Target element #${targetId} not found`);
      return;
    }

    if (
      window[componentName] &&
      typeof window[componentName].render === "function"
    ) {
      target.innerHTML = window[componentName].render();
    } else {
      console.error(
        `Component ${componentName} not found or has no render method`
      );
    }
  }

  static loadComponents(components) {
    components.forEach(({ component, target }) => {
      this.loadComponent(component, target);
    });
  }
}

window.ComponentLoader = ComponentLoader;
