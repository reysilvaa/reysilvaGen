/**
 * Cards Tab Controller (Modular Version)
 * Handles card generation business logic using BaseController pattern
 */

class CardsController extends BaseController {
  constructor() {
    super('Cards', { logLevel: 'info' });
    this.cardGenerator = null;
  }

  async onInit() {
    // Initialize card generator with constants
    await this.initializeCardGenerator();
    
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
  }

  async initializeCardGenerator() {
    if (this.cardGenerator) return this.cardGenerator;
    
    try {
      this.log('info', 'Loading constants from main process...');
      const constants = await this.initializeConstants();
      
      this.cardGenerator = new CardGenerator(constants);
      this.log('success', 'CardGenerator initialized successfully');
      return this.cardGenerator;
    } catch (error) {
      this.log('error', 'Failed to initialize CardGenerator:', error);
      throw new Error('Cannot initialize card generator. Please restart the application.');
    }
  }

  setupElements() {
    this.elements = this.getElements([
      'generate-btn', 'save-btn', 'copy-btn', 'clear-btn',
      'bin-select', 'card-count', 'card-length', 'cvv-length', 
      'years-ahead', 'output-format', 'cards-output', 'cards-generated'
    ]);
  }

  setupEventListeners() {
    this.addEventListener(this.elements['generate-btn'], 'click', () => this.handleGenerate());
    this.addEventListener(this.elements['save-btn'], 'click', () => this.handleSave());
    this.addEventListener(this.elements['copy-btn'], 'click', () => this.handleCopy());
    this.addEventListener(this.elements['clear-btn'], 'click', () => this.handleClear());
    this.addEventListener(this.elements['output-format'], 'change', () => this.handleFormatChange());
  }

  async handleGenerate() {
    const binPattern = this.elements['bin-select']?.value?.trim();
    if (!binPattern) {
      return this.showError("Please select a BIN pattern");
    }

    const selectedOption = this.elements['bin-select']?.options[this.elements['bin-select'].selectedIndex];
    const cardTypeFromDB = selectedOption?.getAttribute("data-card-type");

    const count = parseInt(this.elements['card-count']?.value || '1');
    const length = this.elements['card-length']?.value === "auto" ? null : parseInt(this.elements['card-length']?.value);
    const cvvLength = this.elements['cvv-length']?.value === "auto" ? null : parseInt(this.elements['cvv-length']?.value);
    const yearsAhead = parseInt(this.elements['years-ahead']?.value || '5');

    await this.safeAsync(async () => {
      const cards = this.cardGenerator.generateBulk(binPattern, count, {
        length, cvvLength, yearsAhead, cardType: cardTypeFromDB,
      });

      this.renderCards(cards, cardTypeFromDB);
      this.elements['cards-generated'].textContent = `${count} cards`;
      
      const displayType = cardTypeFromDB || cards[0]?.card_type || "UNKNOWN";
      this.showSuccess(`Generated ${count} ${displayType.toUpperCase()} cards!`);
    }, 'Failed to generate cards');
  }

  renderCards(cards, cardTypeFromDB) {
    const format = this.elements['output-format']?.value || 'card';
    const outputDiv = this.elements['cards-output'];
    let html = "";

    if (format === "card") {
      // Card Visual Format
      cards.forEach((card, index) => {
        const expiry = `${card.exp_month}/${card.exp_year}`;
        const cardType = (card.card_type || "unknown").toLowerCase();
        const cardClass = `card-${cardType}`;
        const formattedNumber = card.number.match(/.{1,4}/g).join(" ");
        const displayCardType = cardTypeFromDB || card.card_type || "UNKNOWN";

        html += `
          <div class="card-item ${cardClass}" data-number="${card.number}" data-expiry="${expiry}" data-cvv="${card.cvv}">
            <div class="card-inner">
              <div class="card-item-header">
                <span class="card-item-number">CARD #${index + 1}</span>
                <span class="card-logo">${displayCardType.toUpperCase()}</span>
              </div>
              
              <div class="card-chip"></div>
              
              <div class="card-number-display" onclick="copyToClipboard('${card.number}', 'Card Number')" title="Click to copy">
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
                
                <div class="card-detail-item" onclick="copyToClipboard('${card.cvv}', 'CVV')" title="Click to copy">
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
  }

  handleSave() {
    const outputDiv = this.elements['cards-output'];
    const format = this.elements['output-format']?.value || 'card';
    let content = "";

    if (format === "card") {
      const cardItems = outputDiv.querySelectorAll(".card-item");
      if (cardItems.length === 0) return this.showError("No cards to save");

      cardItems.forEach((item) => {
        const number = item.dataset.number;
        const expiry = item.dataset.expiry;
        const cvv = item.dataset.cvv;
        content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
      });
    } else {
      const pre = outputDiv.querySelector("pre");
      if (!pre || !pre.textContent.trim()) return this.showError("No cards to save");
      content = pre.textContent;
    }

    const ext = format === "json" ? "json" : format === "csv" ? "csv" : "txt";
    this.downloadFile(content, `ReysilvaGen-cards-${Date.now()}.${ext}`);
    this.showSuccess("Cards saved successfully!");
  }

  async handleCopy() {
    const outputDiv = this.elements['cards-output'];
    const format = this.elements['output-format']?.value || 'card';
    let content = "";

    if (format === "card") {
      const cardItems = outputDiv.querySelectorAll(".card-item");
      if (cardItems.length === 0) return this.showError("No cards to copy");

      cardItems.forEach((item) => {
        const number = item.dataset.number;
        const expiry = item.dataset.expiry;
        const cvv = item.dataset.cvv;
        content += `${number}|${expiry.replace("/", "|")}|${cvv}\n`;
      });
    } else {
      const pre = outputDiv.querySelector("pre");
      if (!pre || !pre.textContent.trim()) return this.showError("No cards to copy");
      content = pre.textContent;
    }

    await this.copyToClipboard(content, 'Cards');
  }

  handleClear() {
    this.elements['cards-output'].innerHTML = '<p class="placeholder">Click "Generate Cards" to create card numbers</p>';
    this.elements['cards-generated'].textContent = "0 cards";
    this.elements['cards-output'].className = "cards-display";
  }

  handleFormatChange() {
    const outputDiv = this.elements['cards-output'];
    const hasCards = outputDiv.querySelector(".card-item") || outputDiv.querySelector("pre");

    if (hasCards) {
      this.handleGenerate(); // Re-render with new format
    }
  }

  downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initCardsTab() {
  try {
    // Prevent multiple initialization
    if (window.cardsController && !window.cardsController.isDestroyed) {
      console.log('ℹ️ Cards controller already initialized, skipping...');
      return;
    }

    // Cleanup existing controller if any
    if (window.cardsController) {
      window.cardsController.destroy();
    }

    const controller = new CardsController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.cardsController = controller;
    console.log('✅ Cards controller initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Cards controller:', error);
    window.Utils?.showError('Failed to initialize card generator. Please restart the application.');
  }
}

// Export for compatibility
window.CardsController = { init: initCardsTab };