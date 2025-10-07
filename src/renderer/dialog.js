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

    const style = document.createElement("style");
    style.textContent = `
      #custom-dialog{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:100000;display:none;align-items:center;justify-content:center}
      #custom-dialog.show{display:flex}
      .dialog-box{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:32px;min-width:420px;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,.8);animation:slideIn .3s ease}
      .dialog-icon{width:56px;height:56px;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:28px}
      .dialog-icon.info{background:rgba(74,158,255,.15);color:#4a9eff}
      .dialog-icon.success{background:rgba(16,185,129,.15);color:#10b981}
      .dialog-icon.warning{background:rgba(245,158,11,.15);color:#f59e0b}
      .dialog-icon.error{background:rgba(239,68,68,.15);color:#ef4444}
      .dialog-title{font-size:20px;font-weight:600;color:#fff;margin-bottom:12px;text-align:center}
      .dialog-message{font-size:14px;color:#b0b0b0;line-height:1.6;margin-bottom:28px;text-align:center;white-space:pre-line;user-select:text}
      .dialog-buttons{display:flex;gap:12px;justify-content:center}
      .dialog-btn{padding:12px 32px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:all .2s;font-family:inherit}
      .dialog-btn:hover{transform:translateY(-1px)}
      .dialog-btn.primary{background:#fff;color:#0a0a0a}
      .dialog-btn.primary:hover{background:#e0e0e0}
      .dialog-btn.secondary{background:#2a2a2a;color:#fff;border:1px solid #3a3a3a}
      .dialog-btn.secondary:hover{background:#3a3a3a}
      .dialog-btn.danger{background:#ef4444;color:#fff}
      .dialog-btn.danger:hover{background:#dc2626}
    `;

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

  show(opts) {
    return new Promise((resolve) => {
      const overlay = document.getElementById("custom-dialog");
      const icon = document.getElementById("d-icon");
      const title = document.getElementById("d-title");
      const message = document.getElementById("d-msg");
      const buttons = document.getElementById("d-btns");

      const icons = {
        info: "💡",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        confirm: "❓",
      };

      icon.textContent = icons[opts.type] || icons.info;
      icon.className = `dialog-icon ${opts.type || "info"}`;
      title.textContent = opts.title || "Notification";
      message.textContent = opts.message || "";

      buttons.innerHTML = "";

      const closeDialog = (val) => {
        overlay.classList.remove("show");
        resolve(val);
      };

      if (opts.type === "confirm") {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "dialog-btn secondary";
        cancelBtn.textContent = opts.cancelText || "Cancel";
        cancelBtn.onclick = () => closeDialog(false);

        const confirmBtn = document.createElement("button");
        confirmBtn.className = `dialog-btn ${
          opts.danger ? "danger" : "primary"
        }`;
        confirmBtn.textContent = opts.confirmText || "Confirm";
        confirmBtn.onclick = () => closeDialog(true);

        buttons.append(cancelBtn, confirmBtn);
      } else {
        const okBtn = document.createElement("button");
        okBtn.className = "dialog-btn primary";
        okBtn.textContent = opts.okText || "OK";
        okBtn.onclick = () => closeDialog(true);
        buttons.appendChild(okBtn);
      }

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

  alert(message, title = "Alert", type = "info") {
    return this.show({ message, title, type });
  }

  confirm(message, title = "Confirm", danger = false) {
    return this.show({ message, title, type: "confirm", danger });
  }

  success(message, title = "Success") {
    return this.show({ message, title, type: "success" });
  }

  error(message, title = "Error") {
    return this.show({ message, title, type: "error" });
  }

  warning(message, title = "Warning") {
    return this.show({ message, title, type: "warning" });
  }
}

window.dialog = new Dialog();
