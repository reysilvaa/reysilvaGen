const SettingsSection = {
  render() {
    return `
      <div class="admin-section" id="settings-section">
        <div class="page-header">
          <h2>Configuration Settings</h2>
          <p>Manage configuration and reset to defaults.</p>
        </div>
        <div class="settings-grid">
          <div class="settings-panel">
            <h3>Config File Location</h3>
            <div
              style="
                margin: 20px 0;
                padding: 16px;
                background: var(--bg-tertiary);
                border-radius: 8px;
                border: 1px solid var(--border);
              "
            >
              <p
                style="
                  color: var(--text-muted);
                  font-size: 13px;
                  margin-bottom: 8px;
                "
              >
                File Path:
              </p>
              <code
                id="config-path"
                style="
                  color: var(--text-primary);
                  font-size: 12px;
                  word-break: break-all;
                  display: block;
                  user-select: text;
                "
                >Loading...</code
              >
            </div>
            <h3 style="margin-top: 30px">Reset Configuration</h3>
            <p style="color: var(--text-muted); margin: 12px 0">
              Reset all settings to default values. This will:
            </p>
            <ul
              style="
                color: var(--text-muted);
                margin: 12px 0 20px 20px;
                line-height: 1.8;
              "
            >
              <li>
                Reset admin password to:
                <strong style="color: var(--text-primary)"
                  >admin123</strong
                >
              </li>
              <li>Reset all BINs to default values</li>
              <li>Clear all sessions</li>
            </ul>
            <button class="btn btn--danger" id="reset-config-btn">
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
              Reset to Default
            </button>
          </div>
        </div>
      </div>
    `;
  },
};

window.SettingsSection = SettingsSection;
