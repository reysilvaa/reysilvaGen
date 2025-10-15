/**
 * Combined Tab Controller (Modular Version)
 * Handles combined card + address generation using BaseController pattern
 */

class CombinedController extends BaseController {
  constructor() {
    super('Combined', { logLevel: 'info' });
    this.cardGenerator = null;
    this.nameGenerator = null;
    this.csvLoader = null;
    this.addressGenerator = null;
  }

  async onInit() {
    // Initialize card generator with constants
    await this.initializeCardGenerator();
    
    // Initialize other generators
    this.initializeGenerators();
    
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
    
    // Load CSV data
    await this.loadCSV();
  }

  async initializeCardGenerator() {
    try {
      this.log('info', 'Loading constants from main process...');
      const constants = await this.loadConstants();
      
      this.cardGenerator = new CardGenerator(constants);
      this.log('success', 'CardGenerator initialized successfully');
    } catch (error) {
      this.log('error', 'Failed to initialize CardGenerator:', error);
      throw new Error('Cannot initialize card generator for combined tab.');
    }
  }

  initializeGenerators() {
    this.nameGenerator = new NameGenerator();
    this.csvLoader = new CSVLoader();
    this.addressGenerator = new AddressGenerator(this.csvLoader);
    
    this.log('success', 'Other generators initialized');
  }

  setupElements() {
    this.elements = this.getElements([
      'generate-combined-btn',
      'combined-bin-select',
      'combined-count',
      'combined-output'
    ]);
  }

  setupEventListeners() {
    this.addEvent(this.elements['generate-combined-btn'], 'click', () => {
      this.handleGenerate();
    });
  }

  async loadCSV() {
    try {
      this.log('info', 'Loading CSV data...');
      await this.csvLoader.load("us-US.csv");
      this.log('success', `CSV loaded: ${this.csvLoader.getCount()} addresses`);
    } catch (error) {
      this.log('error', 'CSV load failed:', error);
    }
  }

  async handleGenerate() {
    const binPattern = this.elements['combined-bin-select']?.value?.trim();
    if (!this.checkAndShow(BaseController.validate.selection, binPattern, 'BIN pattern')) {
      return;
    }

    const count = parseInt(this.elements['combined-count']?.value || '1');
    if (!this.checkAndShow(BaseController.validate.numberRange, count, 1, 100, 'Count')) {
      return;
    }

    const selectedOption = this.elements['combined-bin-select']?.options[this.elements['combined-bin-select'].selectedIndex];
    const cardTypeFromDB = selectedOption?.getAttribute("data-card-type");

    await this.run(async () => {
      // Generate cards
      const cards = this.cardGenerator.generateBulk(binPattern, count, {
        length: null,
        yearsAhead: 5,
        cardType: cardTypeFromDB,
      });

      // Generate address
      const address = this.addressGenerator.generate({
        includeName: true,
        nameGenerator: this.nameGenerator,
      });

      // Render combined output
      this.renderCombinedOutput(cards, address, count);
      
      this.showSuccess(`Generated ${count} cards with address!`);
    }, 'Failed to generate combined data');
  }

  renderCombinedOutput(cards, address, count) {
    let output = this.buildHeader("GENERATED TEST CARDS");
    output += this.formatCards(cards) + "\n\n";
    output += this.buildHeader("PERSON & ADDRESS INFORMATION");
    output += this.formatAddress(address);
    output += this.buildFooter();

    this.elements['combined-output'].value = output;
  }

  buildHeader(title) {
    const separator = "=".repeat(60);
    return `${separator}\n  ${title}\n${separator}\n\n`;
  }

  buildFooter() {
    const separator = "=".repeat(60);
    return `\n${separator}\nWARNING: For testing only. Real transactions are illegal.`;
  }

  formatCards(cards) {
    return this.utils.formatCards ? 
      this.utils.formatCards(cards, "pipe") : 
      cards.map(card => `${card.number}|${card.exp_month}/${card.exp_year}|${card.cvv}`).join('\n');
  }

  formatAddress(address) {
    let output = "";
    
    if (address.Name) output += `Name: ${address.Name}\n`;
    if (address.Email) output += `Email: ${address.Email}\n`;
    if (address.Phone) output += `Phone: ${address.Phone}\n\n`;
    
    output += `Street: ${address.Street}\n`;
    output += `City: ${address.City}\n`;
    output += `State: ${address["State/province/area"]}\n`;
    output += `ZIP Code: ${address["Zip code"]}\n`;

    return output;
  }

  /**
   * Called when route enters
   */
  async onRouteEnter() {
    // Combined tab doesn't need special activation logic
  }
}

// Initialize controller (singleton pattern to prevent duplicates)
async function initCombinedTab() {
  // Prevent multiple initialization - return existing if available
  if (window.combinedController && !window.combinedController.isDestroyed) {
    console.log('ℹ️ Combined controller already initialized, returning existing...');
    return window.combinedController;
  }

  try {
    // Cleanup existing controller if any
    if (window.combinedController) {
      window.combinedController.destroy();
    }

    console.log('🎮 Creating new Combined controller...');
    const controller = new CombinedController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.combinedController = controller;
    console.log('✅ Combined controller initialized');
    return controller;
  } catch (error) {
    console.error('❌ Failed to initialize Combined controller:', error);
    window.Utils?.showError('Failed to initialize combined generator.');
    return null;
  }
}

// Export for compatibility
window.CombinedController = { init: initCombinedTab };