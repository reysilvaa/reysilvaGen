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
    div.innerHTML = `<span>✅</span><span>${message}</span>`;
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:10001;animation:slideIn 0.3s ease";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  },

  showError(message) {
    const div = document.createElement("div");
    div.className = "error-message";
    div.innerHTML = `<span>❌</span><span>${message}</span>`;
    div.style.cssText =
      "position:fixed;top:20px;right:20px;z-index:10001;animation:slideIn 0.3s ease";
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
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
