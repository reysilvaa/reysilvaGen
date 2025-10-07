const CursorResetTab = {
  render() {
    return `
      <div class="tab-content" id="cursor-reset-tab">
        <div class="page-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 8px;">
              <path d="M23 4v6h-6M1 20v-6h6"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Cursor VIP Reset Tool
          </h2>
          <p>
            Reset Cursor Machine ID untuk bypass trial limit. Based on
            Reysilva's Python script.
          </p>
        </div>

        <div class="address-fetcher">
          <div class="info-panel">
            <h3>Actions</h3>
            <div
              class="button-group"
              style="flex-direction: column; gap: 12px"
            >
              <button
                class="btn btn-primary btn-large"
                id="reset-machine-id-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <path d="M23 4v6h-6M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Reset Machine ID
              </button>
              <button
                class="btn btn-secondary btn-large"
                id="close-cursor-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Tutup Cursor
              </button>
              <button
                class="btn btn-secondary btn-large"
                id="check-cursor-status-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
                Cek Status Cursor
              </button>
            </div>
            <div
              style="
                margin-top: 16px;
                padding: 12px;
                background: rgba(255, 193, 7, 0.1);
                border: 1px solid rgba(255, 193, 7, 0.3);
                border-radius: 8px;
              "
            >
              <p style="margin: 0; font-size: 13px; color: #ffc107">
                ⚠️ <strong>Perhatian:</strong> Disarankan tutup Cursor terlebih dahulu menggunakan tombol "Tutup Cursor" untuk hasil terbaik.
              </p>
            </div>
          </div>

          <div class="output-panel">
            <div class="output-header">
              <h3>Logs</h3>
            </div>
            <div
              id="cursor-reset-output"
              style="
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.6;
                max-height: 400px;
                overflow-y: auto;
                padding: 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
              "
            >
              <div style="color: #4a9eff">ℹ️ Siap untuk melakukan reset...</div>
              <div style="color: #ffc107">
                ⚠️ Pastikan Anda memiliki hak administrator
              </div>
            </div>
            <div
              id="cursor-reset-ids"
              style="
                display: none;
                margin-top: 16px;
                padding: 12px;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
              "
            >
              <h4 style="margin: 0 0 12px 0; color: #667eea">
                New Machine IDs:
              </h4>
              <div style="font-size: 12px; line-height: 2">
                <div>
                  <strong style="color: #667eea">Device ID:</strong>
                  <span id="new-device-id" style="font-family: monospace">-</span>
                </div>
                <div>
                  <strong style="color: #667eea">Machine ID:</strong>
                  <span id="new-machine-id" style="font-family: monospace">-</span>
                </div>
                <div>
                  <strong style="color: #667eea">SQM ID:</strong>
                  <span id="new-sqm-id" style="font-family: monospace">-</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
};

window.CursorResetTab = CursorResetTab;
