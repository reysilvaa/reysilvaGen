/**
 * Address Tab Controller (Modular Version)
 * Handles address generation business logic using BaseController pattern
 */

class AddressController extends BaseController {
  constructor() {
    super('Address', { logLevel: 'info' });
    this.nameGenerator = null;
    this.csvLoader = null;
    this.addressGenerator = null;
    this.csvLoaded = false;
  }

  async onInit() {
    // Initialize generators
    this.initializeGenerators();
    
    // Setup UI elements and event listeners
    this.setupElements();
    this.setupEventListeners();
    
    // Load CSV data
    await this.loadCSV();
  }

  initializeGenerators() {
    this.nameGenerator = new NameGenerator();
    this.csvLoader = new CSVLoader();
    this.addressGenerator = new AddressGenerator(this.csvLoader);
    
    this.log('success', 'Generators initialized');
  }

  setupElements() {
    this.elements = this.getElements([
      'fetch-address-btn',
      'include-name-checkbox',
      'address-output'
    ]);
  }

  setupEventListeners() {
    this.addEventListener(this.elements['fetch-address-btn'], 'click', () => {
      this.handleFetchAddress();
    });
  }

  async loadCSV() {
    try {
      this.log('info', 'Loading CSV data...');
      await this.csvLoader.load("us-US.csv");
      this.csvLoaded = true;
      this.log('success', `CSV loaded: ${this.csvLoader.getCount()} addresses`);
    } catch (error) {
      this.log('error', 'CSV load failed:', error);
      this.csvLoaded = false;
    }
  }

  async handleFetchAddress() {
    await this.safeAsync(async () => {
      const includeName = this.elements['include-name-checkbox']?.checked || false;
      
      const address = this.addressGenerator.generate({ 
        includeName, 
        nameGenerator: this.nameGenerator 
      });

      this.renderAddress(address);
      
      const statusMessage = this.csvLoaded
        ? `Address from real data! (${this.csvLoader.getCount()} available)`
        : "Address generated!";
        
      this.showSuccess(statusMessage);
    }, 'Failed to generate address');
  }

  renderAddress(address) {
    const fields = this.buildAddressFields(address);
    const html = this.generateAddressHTML(fields);
    
    this.elements['address-output'].innerHTML = html;
  }

  buildAddressFields(address) {
    const fields = [];
    
    if (address.Name) fields.push({ label: "Name", value: address.Name });
    if (address.Email) fields.push({ label: "Email", value: address.Email });
    if (address.Phone) fields.push({ label: "Phone", value: address.Phone });
    
    fields.push({ label: "Street", value: address.Street });
    fields.push({ label: "City", value: address.City });
    fields.push({ 
      label: "State/Province", 
      value: address["State/province/area"] 
    });
    fields.push({ label: "ZIP Code", value: address["Zip code"] });

    return fields;
  }

  generateAddressHTML(fields) {
    return fields.map(field => {
      const escapedValue = field.value.replace(/'/g, "\\'");
      
      return `
        <div class="address-field clickable-field" 
             onclick="copyToClipboard('${escapedValue}', '${field.label}')" 
             title="Click to copy ${field.label}">
          <strong>${field.label}</strong>
          <span>${field.value}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5; margin-left: 8px;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </div>
      `;
    }).join('');
  }
}

// Initialize controller
async function initAddressTab() {
  try {
    const controller = new AddressController();
    await controller.init();
    
    // Store reference for cleanup if needed
    window.addressController = controller;
  } catch (error) {
    console.error('❌ Failed to initialize Address controller:', error);
    window.Utils?.showError('Failed to initialize address generator.');
  }
}

// Export for compatibility
window.AddressController = { init: initAddressTab };