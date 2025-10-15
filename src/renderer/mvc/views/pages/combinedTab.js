const CombinedTab = {
  render() {
    return `
      <div class="tab-content" id="combined-tab">
        <div class="page-header">
          <h2>Combined Mode</h2>
          <p>
            Generate cards with complete person information and real
            address in one click. Perfect for complete data generation.
          </p>
        </div>

        <div class="combined-mode">
          <div class="info-panel">
            <h3>Settings</h3>

            <div class="form-grid">
              <div class="form-group">
                <label for="combined-bin-select">Select BIN Pattern</label>
                <select id="combined-bin-select">
                  <option value="">Loading BINs...</option>
                </select>
              </div>

              <div class="form-group">
                <label for="combined-count">Number of Cards</label>
                <input
                  type="number"
                  id="combined-count"
                  min="1"
                  max="100"
                  value="5"
                />
              </div>
            </div>

            <button
              class="btn btn--primary btn--lg"
              id="generate-combined-btn"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
              Generate All
            </button>
          </div>

          <div class="output-panel">
            <div class="output-header">
              <h3>Results</h3>
            </div>
            <textarea
              id="combined-output"
              readonly
              placeholder="Combined results will appear here..."
            ></textarea>
          </div>
        </div>
      </div>
    `;
  },
};

window.CombinedTab = CombinedTab;
