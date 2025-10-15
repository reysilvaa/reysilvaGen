/**
 * Custom Dialog System
 * Clean, Simple, Beautiful
 */

class Dialog {
  constructor() {
    this.init();
  }

  init() {
    if (document.getElementById("custom-dialog")) return;

    // Consolidated CSS - more maintainable
    const styles = {
      overlay: 'position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:100000;display:none;align-items:center;justify-content:center',
      overlayShow: 'display:flex',
      box: 'background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;min-width:420px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.8);animation:slideIn .3s ease',
      icon: 'width:56px;height:56px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px',
      title: 'font-size:20px;font-weight:600;color:#fff;margin-bottom:12px;text-align:center',
      message: 'font-size:14px;color:#b0b0b0;line-height:1.6;margin-bottom:28px;text-align:center;white-space:pre-line;user-select:text',
      buttons: 'display:flex;gap:12px;justify-content:center',
      btn: 'padding:12px 32px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit',
      btnHover: 'transform:translateY(-1px)'
    };

    const iconThemes = {
      info: 'background:rgba(74,158,255,.15);color:#4a9eff',
      success: 'background:rgba(16,185,129,.15);color:#10b981', 
      warning: 'background:rgba(245,158,11,.15);color:#f59e0b',
      error: 'background:rgba(239,68,68,.15);color:#ef4444'
    };

    const btnThemes = {
      primary: 'background:#fff;color:#0a0a0a',
      primaryHover: 'background:#e0e0e0',
      secondary: 'background:#2a2a2a;color:#fff;border:1px solid #3a3a3a',
      secondaryHover: 'background:#3a3a3a',
      danger: 'background:#ef4444;color:#fff',
      dangerHover: 'background:#dc2626'
    };

    // Build CSS dynamically - DRY principle
    const cssRules = [
      `#custom-dialog{${styles.overlay}}`,
      `#custom-dialog.show{${styles.overlayShow}}`,
      `.dialog-box{${styles.box}}`,
      `.dialog-icon{${styles.icon}}`,
      ...Object.entries(iconThemes).map(([type, style]) => `.dialog-icon.${type}{${style}}`),
      `.dialog-title{${styles.title}}`,
      `.dialog-message{${styles.message}}`,
      `.dialog-buttons{${styles.buttons}}`,
      `.dialog-btn{${styles.btn}}`,
      `.dialog-btn:hover{${styles.btnHover}}`,
      `.dialog-btn.primary{${btnThemes.primary}}`,
      `.dialog-btn.primary:hover{${btnThemes.primaryHover}}`,
      `.dialog-btn.secondary{${btnThemes.secondary}}`,
      `.dialog-btn.secondary:hover{${btnThemes.secondaryHover}}`,
      `.dialog-btn.danger{${btnThemes.danger}}`,
      `.dialog-btn.danger:hover{${btnThemes.dangerHover}}`
    ];

    const style = document.createElement("style");
    style.textContent = cssRules.join('');

    const overlay = document.createElement("div");
    overlay.id = "custom-dialog";
    overlay.innerHTML = `
      <div class="dialog-box">
        <div class="dialog-icon" id="d-icon"></div>
        <div class="dialog-title" id="d-title">Title</div>
        <div class="dialog-message" id="d-msg">Message</div>
        <div class="dialog-buttons" id="d-btns"></div>
      </div>
    `;

    document.head.appendChild(style);
    document.body.appendChild(overlay);
  }

  // Icon definitions - DRY principle
  getIconSvg(type) {
    const iconPaths = {
      info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
      success: '<polyline points="20 6 9 17 4 12"/>',
      warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      confirm: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    };
    
    const path = iconPaths[type] || iconPaths.info;
    const strokeWidth = type === 'success' || type === 'error' ? '2.5' : '2';
    
    return `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}">${path}</svg>`;
  }

  // Button factory - DRY principle
  createButton(config, onClick) {
    const btn = document.createElement("button");
    btn.className = `dialog-btn ${config.type}`;
    btn.textContent = config.text;
    btn.onclick = onClick;
    return btn;
  }

  show(opts) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("custom-dialog");
      const icon = document.getElementById("d-icon");
      const title = document.getElementById("d-title");
      const message = document.getElementById("d-msg");
      const buttons = document.getElementById("d-btns");

      // Set dialog content
      icon.innerHTML = this.getIconSvg(opts.type);
      icon.className = `dialog-icon ${opts.type || "info"}`;
      title.textContent = opts.title || "Notification";
      message.textContent = opts.message || "";

      buttons.innerHTML = "";

      const closeDialog = (val) => {
        overlay.classList.remove("show");
        resolve(val);
      };

      // Create buttons based on dialog type - DRY principle
      if (opts.type === "confirm") {
        const cancelConfig = { type: "secondary", text: opts.cancelText || "Cancel" };
        const confirmConfig = { 
          type: opts.danger ? "danger" : "primary", 
          text: opts.confirmText || "Confirm" 
        };
        
        const cancelBtn = this.createButton(cancelConfig, () => closeDialog(false));
        const confirmBtn = this.createButton(confirmConfig, () => closeDialog(true));
        
        buttons.append(cancelBtn, confirmBtn);
      } else {
        const okConfig = { type: "primary", text: opts.okText || "OK" };
        const okBtn = this.createButton(okConfig, () => closeDialog(true));
        buttons.appendChild(okBtn);
      }

      // Show dialog and setup event handlers
      overlay.classList.add("show");
      overlay.onclick = (e) => e.target === overlay && closeDialog(false);

      const escHandler = (e) => {
        if (e.key === "Escape") {
          closeDialog(false);
          document.removeEventListener("keydown", escHandler);
        }
      };
      document.addEventListener("keydown", escHandler);
    });
  }

  // Simplified shortcut methods - DRY principle
  alert(message, title = "Alert", type = "info") {
    return this.show({ message, title, type });
  }

  confirm(message, title = "Confirm", danger = false) {
    return this.show({ message, title, type: "confirm", danger });
  }

  success(message, title = "Success") {
    return this.alert(message, title, "success");
  }

  error(message, title = "Error") {
    return this.alert(message, title, "error");
  }

  warning(message, title = "Warning") {
    return this.alert(message, title, "warning");
  }
}

window.dialog = new Dialog();
