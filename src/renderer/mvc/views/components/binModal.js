const BinModal = {
  render() {
    return `
      <div class="admin-modal" id="bin-modal" style="display: none">
        <div class="admin-modal-content">
          <div class="admin-modal-header">
            <h2 id="bin-modal-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Add New BIN
            </h2>
          </div>
          <form id="bin-form" class="admin-form">
            <input type="hidden" id="bin-id"/>
            <div class="form-group">
              <label for="bin-pattern">BIN Pattern *</label>
              <input
                type="text"
                id="bin-pattern"
                required
                placeholder="e.g., 445566"
                pattern="[0-9]{6,9}"
                maxlength="9"
              />
              <small>6-9 digits only</small>
            </div>
            <div class="form-group">
              <label for="card-type">Card Type *</label>
              <select id="card-type" required>
                <option value="">Select card type</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="American Express">American Express</option>
                <option value="Discover">Discover</option>
                <option value="JCB">JCB</option>
                <option value="Diners Club">Diners Club</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label for="bin-description">Description</label>
              <input
                type="text"
                id="bin-description"
                placeholder="e.g., Standard Visa"
              />
            </div>
            <div
              id="bin-error"
              class="error-message"
              style="display: none"
            ></div>
            <div class="button-group">
              <button type="submit" class="btn btn-primary">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="vertical-align: middle; margin-right: 6px"
                >
                  <path
                    d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                  />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save BIN
              </button>
              <button type="button" class="btn btn-secondary" id="cancel-bin">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  style="vertical-align: middle; margin-right: 6px"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },
};

window.BinModal = BinModal;
