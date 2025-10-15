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
      const constants = await this.loadConstants();
      
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
    this.addEvent(this.elements['generate-btn'], 'click', () => this.handleGenerate());
    this.addEvent(this.elements['save-btn'], 'click', () => this.handleSave());
    this.addEvent(this.elements['copy-btn'], 'click', () => this.handleCopy());
    this.addEvent(this.elements['clear-btn'], 'click', () => this.handleClear());
    this.addEvent(this.elements['output-format'], 'change', () => this.handleFormatChange());
  }

  async handleGenerate() {
    // Use BaseController validation
    const binPattern = this.elements['bin-select']?.value?.trim();
    if (!this.checkAndShow(BaseController.validate.selection, binPattern, 'BIN pattern')) {
      return;
    }

    const count = parseInt(this.elements['card-count']?.value || '1');
    if (!this.checkAndShow(BaseController.validate.numberRange, count, 1, 10000, 'Card count')) {
      return;
    }

    const selectedOption = this.elements['bin-select']?.options[this.elements['bin-select'].selectedIndex];
    const cardTypeFromDB = selectedOption?.getAttribute("data-card-type");
    const length = this.elements['card-length']?.value === "auto" ? null : parseInt(this.elements['card-length']?.value);
    const cvvLength = this.elements['cvv-length']?.value === "auto" ? null : parseInt(this.elements['cvv-length']?.value);
    const yearsAhead = parseInt(this.elements['years-ahead']?.value || '5');

    await this.run(async () => {
      const cards = this.cardGenerator.generateBulk(binPattern, count, {
        length, cvvLength, yearsAhead, cardType: cardTypeFromDB,
      });

      this.renderCards(cards, cardTypeFromDB);
      this.elements['cards-generated'].textContent = `${count} cards`;
      
      const displayType = cardTypeFromDB || cards[0]?.card_type || "UNKNOWN";
      this.notify('success', `Generated ${count} ${displayType.toUpperCase()} cards!`);
    }, 'Generating cards...');
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
    const format = this.elements['output-format']?.value || 'card';
    const content = this.getCardsContent(format);
    if (content) {
      const filename = `ReysilvaGen-cards-${Date.now()}.${format === 'json' ? 'json' : 'txt'}`;
      this.downloadFile(content, filename);
      this.notify('success', 'Cards saved successfully!');
    }
  }

  async handleCopy() {
    const format = this.elements['output-format']?.value || 'card';
    this.copyContent('cards-output', format, 'Cards');
  }

  handleClear() {
    this.clearContent('cards-output', '<p class="placeholder">Click "Generate Cards" to create card numbers</p>');
    this.elements['cards-generated'].textContent = "0 cards";
    this.elements['cards-output'].className = "cards-display";
  }

  getCardsContent(format) {
    const outputDiv = this.elements['cards-output'];
    const cards = outputDiv.querySelectorAll('.card-item');
    
    if (cards.length === 0) {
      this.notify('error', 'No cards to save');
      return null;
    }

    let content = '';
    cards.forEach((card, index) => {
      const number = card.dataset.number;
      const expiry = card.dataset.expiry;
      const cvv = card.dataset.cvv;

      if (format === 'json') {
        if (index === 0) content = '[\n';
        content += `  {"number": "${number}", "expMonth": "${expiry.split('/')[0]}", "expYear": "${expiry.split('/')[1]}", "cvv": "${cvv}"}`;
        content += index < cards.length - 1 ? ',\n' : '\n';
        if (index === cards.length - 1) content += ']';
      } else {
        content += `${number}|${expiry.replace('/', '|')}|${cvv}\n`;
      }
    });

    return content;
  }

  handleFormatChange() {
    const outputDiv = this.elements['cards-output'];
    const hasCards = outputDiv.querySelector(".card-item") || outputDiv.querySelector("pre");

    if (hasCards) {
      this.handleGenerate(); // Re-render with new format
    }
  }

  /**
   * Called when route enters
   */
  async onRouteEnter() {
    // Cards tab doesn't need special activation logic
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initCardsTab() {
  // Prevent multiple initialization - return existing if available
  if (window.cardsController && !window.cardsController.isDestroyed) {
    console.log('ℹ️ Cards controller already initialized, returning existing...');
    return window.cardsController;
  }

  try {
    // Cleanup existing controller if any
    if (window.cardsController) {
      window.cardsController.destroy();
    }

    console.log('🎮 Creating new Cards controller...');
    const controller = new CardsController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.cardsController = controller;
    console.log('✅ Cards controller initialized');
    return controller;
  } catch (error) {
    console.error('❌ Failed to initialize Cards controller:', error);
    window.Utils?.showError('Failed to initialize card generator. Please restart the application.');
    return null;
  }
}

// Export for compatibility
window.CardsController = { init: initCardsTab };