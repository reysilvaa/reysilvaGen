const AddressTab = {
  render() {
    return `
      <div class="tab-content" id="address-tab">
        <div class="page-header">
          <h2>Generate US Address</h2>
          <p>
            Generate random US addresses from real data (197k+ addresses).
            100% offline, no internet needed.
          </p>
        </div>

        <div class="address-fetcher">
          <div class="info-panel">
            <h3>Options</h3>
            <p>
              Generate a random US address. Data sourced
              from real addresses database.
            </p>

            <div class="form-group" style="margin-bottom: 20px">
              <label
                style="
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  cursor: pointer;
                "
              >
                <input type="checkbox" id="include-name-checkbox" checked />
                <span>Include person name, email, and phone</span>
              </label>
            </div>

            <button class="btn btn--primary btn--lg" id="fetch-address-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
              </svg>
              Generate Address
            </button>
          </div>

          <div class="output-panel">
            <div class="output-header">
              <h3>Address Details</h3>
            </div>
            <div id="address-output" class="address-display">
              <p class="placeholder">
                Click "Generate Address" to get a random US address
              </p>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};

window.AddressTab = AddressTab;
