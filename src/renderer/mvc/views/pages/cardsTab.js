const CardsTab = {
  render() {
    return `
      <div class="tab-content tab-content--active" id="cards-tab">
        <div class="page-header">
          <h2 class="page__title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M9 3v18"/>
            </svg>
            Generate Cards
          </h2>
          <p class="page__description">
            Generate credit card numbers from BIN patterns. All cards are Luhn-valid and ready for testing.
          </p>
        </div>

        <div class="card-generator">
          <div class="settings-panel">
            <h3>Settings</h3>

            <div class="form-grid">
              <div class="form-group">
                <label for="bin-select">Select BIN Pattern</label>
                <select id="bin-select">
                  <option value="">Loading BINs...</option>
                </select>
                <small>BIN patterns configured by administrator</small>
              </div>

              <div class="form-group">
                <label for="card-count">Number of Cards</label>
                <input
                  type="number"
                  id="card-count"
                  min="1"
                  max="1000"
                  value="10"
                />
              </div>

              <div class="form-group">
                <label for="card-length">Card Length</label>
                <select id="card-length">
                  <option value="auto">Auto</option>
                  <option value="13">13</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                  <option value="16" selected>16</option>
                  <option value="17">17</option>
                  <option value="18">18</option>
                  <option value="19">19</option>
                </select>
              </div>

                <div class="form-group">
                  <label for="output-format">Display & Export Format</label>
                  <select id="output-format">
                    <option value="card" selected>Card (visual display)</option>
                    <option value="plain">Plain (numbers only)</option>
                    <option value="pipe">
                      Pipe (number|mm|yy|cvv)
                    </option>
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                  </select>
                  <small>Display & export format</small>
                </div>

              <div class="form-group">
                <label for="cvv-length">CVV Length</label>
                <select id="cvv-length">
                  <option value="auto" selected>
                    Auto (based on card type)
                  </option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
              </div>

              <div class="form-group">
                <label for="years-ahead">Years Ahead (Expiry)</label>
                <input
                  type="number"
                  id="years-ahead"
                  min="0"
                  max="20"
                  value="5"
                />
              </div>
            </div>

            <!-- Primary Action -->
            <button class="btn btn--primary btn--lg" id="generate-btn" style="width: 100%; margin-bottom: 12px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18M9 3v18"/>
              </svg>
              Generate Cards
            </button>

            <!-- Action Buttons -->
            <div class="action-buttons-grid">
              <button class="btn btn--secondary" id="save-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Save
              </button>
              <button class="btn btn--secondary" id="copy-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                Copy
              </button>
              <button class="btn btn--danger" id="clear-btn" style="grid-column: 1 / -1;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Clear All
              </button>
            </div>
          </div>

          <div class="output-panel">
            <div class="output-header">
              <h3>Generated Cards</h3>
              <span class="card-count-badge" id="cards-generated">0 cards</span>
            </div>
            <div id="cards-output" class="cards-display">
              <p class="placeholder">
                Click "Generate Cards" to create card numbers
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};

window.CardsTab = CardsTab;
