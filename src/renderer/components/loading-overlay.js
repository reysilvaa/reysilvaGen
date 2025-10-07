const LoadingOverlay = {
  render() {
    return `
      <div class="loading-overlay" id="loading-overlay">
        <div class="spinner"></div>
        <p>Processing...</p>
      </div>
    `;
  },
};

window.LoadingOverlay = LoadingOverlay;
