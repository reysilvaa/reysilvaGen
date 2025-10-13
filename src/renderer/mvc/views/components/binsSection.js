const BinsSection = {
  render() {
    return `
      <div class="admin-section active" id="bins-section">
        <div class="page-header">
          <h2>BIN Management</h2>
          <p>Manage BIN patterns for card generation.</p>
        </div>
        <div class="admin-actions">
          <button class="btn btn-primary" id="add-bin-btn">
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
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Add New BIN
          </button>
          <button class="btn btn-secondary" id="refresh-bins-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              style="vertical-align: middle; margin-right: 6px"
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path
                d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"
              />
            </svg>
            Refresh
          </button>
        </div>
        <div class="bins-table-container">
          <table class="bins-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>BIN Pattern</th>
                <th>Card Type</th>
                <th>Description</th>
                <th>Created By</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="bins-table-body">
              <tr>
                <td colspan="7" style="text-align: center; padding: 40px">
                  Loading...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },
};

window.BinsSection = BinsSection;

