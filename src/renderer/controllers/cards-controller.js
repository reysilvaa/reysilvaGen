/**
 * Cards Tab Controller
 * Handles card generation business logic
 */

function initCardsTab() {
  const generator = new CardGenerator();
  const utils = window.Utils;

  const generateBtn = document.getElementById("generate-btn");
  const saveBtn = document.getElementById("save-btn");
  const copyBtn = document.getElementById("copy-btn");
  const clearBtn = document.getElementById("clear-btn");

  generateBtn?.addEventListener("click", async () => {
    const binSelect = document.getElementById("bin-select");
    const binPattern = binSelect.value.trim();
    if (!binPattern) return utils.showError("Please select a BIN pattern");

    // Get card type from data attribute if available
    const selectedOption = binSelect.options[binSelect.selectedIndex];
    const cardTypeFromDB = selectedOption?.getAttribute("data-card-type");

    const count = parseInt(document.getElementById("card-count").value);
    const length =
      document.getElementById("card-length").value === "auto"
        ? null
        : parseInt(document.getElementById("card-length").value);
    const cvvLength =
      document.getElementById("cvv-length").value === "auto"
        ? null
        : parseInt(document.getElementById("cvv-length").value);
    const yearsAhead = parseInt(document.getElementById("years-ahead").value);

    utils.showLoading();
    await new Promise((r) => setTimeout(r, 300));

    const cards = generator.generateBulk(binPattern, count, {
      length,
      cvvLength,
      yearsAhead,
      cardType: cardTypeFromDB, // Pass card type from database
    });

    const format = document.getElementById("output-format").value;
    const outputDiv = document.getElementById("cards-output");
    let html = "";

    if (format === "card") {
      // Card Visual Format
      cards.forEach((card, index) => {
        const expiry = `${card.exp_month}/${card.exp_year}`;
        // Use card_type from the generated card
        const cardType = (card.card_type || "unknown").toLowerCase();
        const cardClass = `card-${cardType}`;
        const formattedNumber = card.number.match(/.{1,4}/g).join(" ");
        const displayCardType = cardTypeFromDB || card.card_type || "UNKNOWN";

        html += `
          <div class="card-item ${cardClass}" data-number="${
          card.number
        }" data-expiry="${expiry}" data-cvv="${card.cvv}">
            <div class="card-inner">
              <div class="card-item-header">
                <span class="card-item-number">CARD #${index + 1}</span>
                <span class="card-logo">${displayCardType.toUpperCase()}</span>
              </div>
              
              <div class="card-chip"></div>
              
              <div class="card-number-display" onclick="copyToClipboard('${
                card.number
              }', 'Card Number')" title="Click to copy">
                <div class="card-number-label">Card Number</div>
                <div class="card-number-value">${formattedNumber}</div>
              </div>
              
              <div class="card-details">
                <div class="card-name-display" onclick="copyToClipboard('CARD HOLDER', 'Name')" title="Click to copy">
                  <div class="card-detail-label">Name</div>
                  <div class="card-name-value">CARD HOLDER</div>
                </div>
                
                <div class="card-detail-item" onclick="copyToClipboard('${expiry}', 'Valid Thru')" title="Click to copy">
                  <div class="card-detail-label">Valid</div>
                  <div class="card-detail-value">${expiry}</div>
                </div>
                
                <div class="card-detail-item" onclick="copyToClipboard('${
                  card.cvv
                }', 'CVV')" title="Click to copy">
                  <div class="card-detail-label">CVV</div>
                  <div class="card-detail-value">${card.cvv}</div>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      outputDiv.className = "cards-display";
    } else {
      // Text Formats
      cards.forEach((card, index) => {
        const expiry = `${card.exp_month}/${card.exp_year}`;

        if (format === "pipe") {
          html += `${card.number}|${expiry.replace("/", "|")}|${card.cvv}\n`;
        } else if (format === "csv") {
          if (index === 0) html += "Card Number,Expiry,CVV\n";
          html += `${card.number},${expiry},${card.cvv}\n`;
        } else if (format === "json") {
          if (index === 0) html = "[\n";
          html += `  {"number": "${card.number}", "expMonth": "${card.exp_month}", "expYear": "${card.exp_year}", "cvv": "${card.cvv}"}`;
          html += index < cards.length - 1 ? ",\n" : "\n";
          if (index === cards.length - 1) html += "]";
        } else {
          // plain
          html += `${card.number}\n`;
        }
      });
      outputDiv.className = "cards-display text-format";
      html = `<pre style="margin: 0; color: var(--text-primary); font-family: var(--font-mono); font-size: 14px; line-height: 1.6;">${html}</pre>`;
    }

    outputDiv.innerHTML = html;
    document.getElementById("cards-generated").textContent = `${count} cards`;

    utils.hideLoading();
    const displayType = cardTypeFromDB || cards[0]?.card_type || "UNKNOWN";
    utils.showSuccess(
      `Generated ${count} ${displayType.toUpperCase()} cards!`
    );
  });

  saveBtn?.addEventListener("click", () => {
    const outputDiv = document.getElementById("cards-output");
    const format = document.getElementById("output-format").value;
    let content = "";

    if (format === "card") {
      const cardItems = outputDiv.querySelectorAll(".card-item");
      if (cardItems.length === 0) return utils.showError("No cards to save");

      cardItems.forEach((item) => {
        const number = item.dataset.number;
        const expiry = item.dataset.expiry;
        const cvv = item.dataset.cvv;
        content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
      });

      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ReysilvaGen-cards-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      utils.showSuccess("Cards saved successfully!");
    } else {
      const pre = outputDiv.querySelector("pre");
      if (!pre || !pre.textContent.trim())
        return utils.showError("No cards to save");

      content = pre.textContent;
      const ext =
        format === "json" ? "json" : format === "csv" ? "csv" : "txt";
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ReysilvaGen-cards-${Date.now()}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      utils.showSuccess("Cards saved successfully!");
    }
  });

  copyBtn?.addEventListener("click", async () => {
    const outputDiv = document.getElementById("cards-output");
    const format = document.getElementById("output-format").value;
    let content = "";

    if (format === "card") {
      const cardItems = outputDiv.querySelectorAll(".card-item");
      if (cardItems.length === 0) return utils.showError("No cards to copy");

      cardItems.forEach((item) => {
        const number = item.dataset.number;
        const expiry = item.dataset.expiry;
        const cvv = item.dataset.cvv;
        content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
      });
    } else {
      const pre = outputDiv.querySelector("pre");
      if (!pre || !pre.textContent.trim())
        return utils.showError("No cards to copy");

      content = pre.textContent;
    }

    await navigator.clipboard.writeText(content);
    utils.showSuccess("Cards copied to clipboard!");
  });

  clearBtn?.addEventListener("click", () => {
    document.getElementById("cards-output").innerHTML =
      '<p class="placeholder">Click "Generate Cards" to create card numbers</p>';
    document.getElementById("cards-generated").textContent = "0 cards";
    document.getElementById("cards-output").className = "cards-display";
  });

  // Listen to format changes to re-render if cards exist
  const formatSelect = document.getElementById("output-format");
  formatSelect?.addEventListener("change", () => {
    const outputDiv = document.getElementById("cards-output");
    const hasCards =
      outputDiv.querySelector(".card-item") || outputDiv.querySelector("pre");

    if (hasCards) {
      const generateBtn = document.getElementById("generate-btn");
      if (generateBtn) generateBtn.click();
    }
  });
}

window.CardsController = { init: initCardsTab };

