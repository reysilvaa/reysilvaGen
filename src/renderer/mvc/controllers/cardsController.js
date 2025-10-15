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
    
    // Register content area for cards output
    this.registerContentArea('cards-output', {
      type: 'cards',
      emptyMessage: 'Click "Generate Cards" to create card numbers',
      placeholderTemplate: '<p class="placeholder">Click "Generate Cards" to create card numbers</p>',
      validators: [
        (content, count) => ({
          valid: count > 0,
          message: 'No cards to process'
        })
      ]
    });
    
    // Register validation rules
    this.registerValidationRules('cards-form', {
      'bin-select': [
        { type: 'selection', message: 'Please select a BIN pattern' }
      ],
      'card-count': [
        { type: 'required', message: 'Card count is required' },
        { type: 'number', message: 'Card count must be a valid number' },
        { type: 'min', value: 1, message: 'Card count must be at least 1' },
        { type: 'max', value: 10000, message: 'Card count must be at most 10000' }
      ]
    });
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
    // Use BaseController validation
    const binPattern = this.elements['bin-select']?.value?.trim();
    if (!this.validateAndShow(BaseController.quickValidate.selection, binPattern, 'BIN pattern')) {
      return;
    }

    const count = parseInt(this.elements['card-count']?.value || '1');
    if (!this.validateAndShow(BaseController.quickValidate.numberRange, count, 1, 10000, 'Card count')) {
      return;
    }

    const selectedOption = this.elements['bin-select']?.options[this.elements['bin-select'].selectedIndex];
    const cardTypeFromDB = selectedOption?.getAttribute("data-card-type");
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
    const format = this.elements['output-format']?.value || 'card';
    this.saveContentFromArea('cards-output', format, 'ReysilvaGen-cards');
  }

  async handleCopy() {
    const format = this.elements['output-format']?.value || 'card';
    await this.copyContentFromArea('cards-output', format, 'Cards');
  }

  handleClear() {
    this.clearContentArea('cards-output');
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