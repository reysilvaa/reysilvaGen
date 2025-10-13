const AdminLogin = {
  render() {
    return `
      <div class="admin-modal" id="login-modal">
        <div class="admin-modal-content">
          <div class="admin-modal-header">
            <h2>🔐 Admin Login</h2>
            <p>Enter your credentials to access admin panel</p>
          </div>
          <form id="login-form" class="admin-form">
            <div class="form-group">
              <label for="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                required
                autocomplete="username"
                placeholder="Enter username"
              />
            </div>
            <div class="form-group">
              <label for="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="Enter password"
              />
            </div>
            <div id="login-error" class="error-message" style="display: none"></div>
            <div class="button-group">
              <button type="submit" class="btn btn-primary btn-large">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Login
              </button>
              <button type="button" class="btn btn-secondary" id="cancel-login">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cancel
              </button>
            </div>
          </form>
          <div class="admin-note">
            <small><strong>Default:</strong> username=admin, password=admin123</small>
          </div>
        </div>
      </div>
    `;
  },
};

window.AdminLogin = AdminLogin;
