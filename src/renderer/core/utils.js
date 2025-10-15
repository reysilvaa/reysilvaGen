/**
 * Shared Utilities
 * DRY principle - no duplication
 */

const Utils = {
  showLoading() {
    document.getElementById("loading-overlay")?.classList.add("show");
  },

  hideLoading() {
    document.getElementById("loading-overlay")?.classList.remove("show");
  },

  showSuccess(message) {
    const div = document.createElement("div");
    div.className = "success-message";
    div.innerHTML = `
      <span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </span>
      <span>${message}</span>
    `;
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:10001;animation:slideIn 0.3s ease";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  },

  showError(message) {
    const div = document.createElement("div");
    div.className = "error-message";
    div.innerHTML = `
      <span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </span>
      <span>${message}</span>
    `;
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:10001;animation:slideIn 0.3s ease";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
  },

  showInfo(message) {
    const div = document.createElement("div");
    div.className = "info-message";
    div.innerHTML = `
      <span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align: middle;">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4"/>
          <path d="M12 8h.01"/>
        </svg>
      </span>
      <span>${message}</span>
    `;
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:10001;animation:slideIn 0.3s ease";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3500);
  },

  formatCards(cards, format) {
    switch (format) {
      case "plain":
        return cards.map((c) => c.number).join("\n");
      case "pipe":
        return cards
          .map((c) => `${c.number}|${c.exp_month}|${c.exp_year}|${c.cvv}`)
          .join("\n");
      case "csv":
        return (
          "card_number,exp_month,exp_year,cvv\n" +
          cards
            .map((c) => `${c.number},${c.exp_month},${c.exp_year},${c.cvv}`)
            .join("\n")
        );
      case "json":
        return JSON.stringify(cards, null, 2);
      default:
        return cards.map((c) => c.number).join("\n");
    }
  },
};

window.Utils = Utils;
window.RendererUtils = Utils; // Compatibility alias
