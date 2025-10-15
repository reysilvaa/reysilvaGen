/**
 * Page Components - Unified Architecture
 * All page components using single BaseComponent pattern
 * @module components/Pages
 */

class CardsPage extends BaseComponent {
  constructor() {
    super('CardsPage', { logLevel: 'info' });
    
    this.setTemplate(`
      <div class="page tab-content tab-content--active" id="cards-tab">
        <div class="page__header">
          <h2 class="page__title">Generate Cards</h2>
          <p class="page__description">Generate credit card numbers from BIN patterns. All cards are Luhn-valid.</p>
        </div>

        <div class="grid grid--main">
          <div class="card">
            <h3 class="card__title">Settings</h3>
            
            <form id="card-form" class="form">
              <div class="form-group">
                <label class="form-label" for="bin-select">Select BIN Pattern</label>
                <select class="form-select" id="bin-select">
                  <option value="">Loading BINs...</option>
                </select>
                <small class="form-help">BIN patterns configured by administrator</small>
              </div>

              <div class="form-group">
                <label class="form-label" for="card-count">Number of Cards</label>
                <input class="form-input" type="number" id="card-count" min="1" max="1000" value="10" />
              </div>

              <div class="form-group">
                <label class="form-label" for="card-length">Card Length</label>
                <select class="form-select" id="card-length">
                  <option value="auto">Auto</option>
                  <option value="13">13</option>
                  <option value="14">14</option>
                  <option value="15">15</option>
                  <option value="16" selected>16</option>
                  <option value="17">17</option>
                  <option value="18">18</option>
                  <option value="19">19</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="output-format">Display & Export Format</label>
                <select class="form-select" id="output-format">
                  <option value="card" selected>Card (visual display)</option>
                  <option value="plain">Plain (numbers only)</option>
                  <option value="pipe">Pipe (number|mm|yy|cvv)</option>
                  <option value="csv">CSV</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="cvv-length">CVV Length</label>
                <select class="form-select" id="cvv-length">
                  <option value="auto" selected>Auto (based on card type)</option>
                  <option value="3">3 digits</option>
                  <option value="4">4 digits</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="years-ahead">Years Ahead (Expiry)</label>
                <input class="form-input" type="number" id="years-ahead" min="0" max="20" value="5" />
              </div>

              <button type="submit" class="btn btn--primary btn--lg btn--full">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 3v18"/>
                </svg>
                Generate Cards
              </button>

              <div class="flex flex--gap-3" style="margin-top: var(--space-3);">
                <button type="button" class="btn btn--secondary flex-1" id="save-cards">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  Save
                </button>
                <button type="button" class="btn btn--secondary flex-1" id="copy-cards">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  Copy
                </button>
                <button type="button" class="btn btn--danger flex-1" id="clear-cards">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Clear
                </button>
              </div>
            </form>
          </div>

          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Generated Cards</h3>
              <span class="badge badge--secondary" id="cards-count">0 cards</span>
            </div>
            <div class="cards-display" id="cards-output">
              <div class="placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 3v18"/>
                </svg>
                <p>Click "Generate Cards" to create card numbers</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    
    this.setupEvents();
  }

  setupEvents() {
    this.on('submit #card-form', this.handleGenerate);
    this.on('click #save-cards', this.handleSave);
    this.on('click #copy-cards', this.handleCopy);
    this.on('click #clear-cards', this.handleClear);
  }

  handleGenerate(event) {
    event.preventDefault();
    this.emit('generate-cards', this.getFormData());
  }

  handleSave() {
    this.emit('save-cards');
  }

  handleCopy() {
    this.emit('copy-cards');
  }

  handleClear() {
    this.emit('clear-cards');
  }

  getFormData() {
    if (!this.element) return {};
    
    return {
      binPattern: this.element.querySelector('#bin-select')?.value,
      count: parseInt(this.element.querySelector('#card-count')?.value) || 10,
      length: this.element.querySelector('#card-length')?.value,
      format: this.element.querySelector('#output-format')?.value,
      cvvLength: this.element.querySelector('#cvv-length')?.value,
      yearsAhead: parseInt(this.element.querySelector('#years-ahead')?.value) || 5
    };
  }

  updateBins(bins) {
    const select = this.element?.querySelector('#bin-select');
    if (!select) return;

    if (!bins || bins.length === 0) {
      select.innerHTML = '<option value="">No BINs configured - Contact admin</option>';
      return;
    }

    const binsByType = {};
    bins.forEach(bin => {
      const type = bin.card_type || 'Other';
      if (!binsByType[type]) binsByType[type] = [];
      binsByType[type].push(bin);
    });

    let html = '';
    Object.keys(binsByType).sort().forEach(type => {
      html += `<optgroup label="${type}">`;
      binsByType[type].forEach(bin => {
        const description = bin.description ? ` - ${bin.description}` : '';
        html += `<option value="${bin.bin_pattern}">${bin.bin_pattern}${description}</option>`;
      });
      html += '</optgroup>';
    });

    select.innerHTML = html;
  }

  updateCards(cards, format = 'card') {
    const output = this.element?.querySelector('#cards-output');
    const counter = this.element?.querySelector('#cards-count');
    
    if (!output || !counter) return;

    counter.textContent = `${cards.length} cards`;

    if (cards.length === 0) {
      output.innerHTML = `
        <div class="placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M3 9h18M9 3v18"/>
          </svg>
          <p>Click "Generate Cards" to create card numbers</p>
        </div>
      `;
      return;
    }

    if (format === 'card') {
      output.innerHTML = cards.map(card => this.renderCard(card)).join('');
      output.classList.remove('cards-display--text');
    } else {
      output.innerHTML = `<pre>${this.formatCards(cards, format)}</pre>`;
      output.classList.add('cards-display--text');
    }
  }

  renderCard(card) {
    const brandClass = `credit-card--${card.brand?.toLowerCase() || 'other'}`;
    
    return `
      <div class="credit-card ${brandClass}">
        <div class="credit-card__header">
          <div class="credit-card__logo">${card.brand || 'CARD'}</div>
        </div>
        
        <div class="credit-card__chip"></div>
        
        <div class="credit-card__number" onclick="window.copyToClipboard('${card.number}', 'Card number')">
          ${card.number.replace(/(.{4})/g, '$1 ').trim()}
        </div>
        
        <div class="credit-card__details">
          <div class="credit-card__detail" onclick="window.copyToClipboard('${card.exp_month}/${card.exp_year}', 'Expiry date')">
            <div class="credit-card__detail-label">Valid Thru</div>
            <div class="credit-card__detail-value">${card.exp_month}/${card.exp_year}</div>
          </div>
          <div class="credit-card__detail" onclick="window.copyToClipboard('${card.cvv}', 'CVV')">
            <div class="credit-card__detail-label">CVV</div>
            <div class="credit-card__detail-value">${card.cvv}</div>
          </div>
          <div class="credit-card__detail credit-card__name" onclick="window.copyToClipboard('${card.name}', 'Name')">
            <div class="credit-card__detail-label">Name</div>
            <div class="credit-card__detail-value">${card.name}</div>
          </div>
        </div>
      </div>
    `;
  }

  formatCards(cards, format) {
    switch (format) {
      case 'plain':
        return cards.map(c => c.number).join('\n');
      case 'pipe':
        return cards.map(c => `${c.number}|${c.exp_month}|${c.exp_year}|${c.cvv}`).join('\n');
      case 'csv':
        return 'card_number,exp_month,exp_year,cvv,name\n' +
               cards.map(c => `${c.number},${c.exp_month},${c.exp_year},${c.cvv},"${c.name}"`).join('\n');
      case 'json':
        return JSON.stringify(cards, null, 2);
      default:
        return cards.map(c => c.number).join('\n');
    }
  }
}

class AddressPage extends BaseComponent {
  constructor() {
    super('AddressPage');
    
    this.setTemplate(`
      <div class="page tab-content" id="address-tab">
        <div class="page__header">
          <h2 class="page__title">Generate US Address</h2>
          <p class="page__description">Generate random US addresses from real data (197k+ addresses). 100% offline, no internet needed.</p>
        </div>

        <div class="grid grid--main">
          <div class="card">
            <h3 class="card__title">Options</h3>
            <p class="card__body">Generate a random US address. Data sourced from real addresses database.</p>

            <div class="form-group">
              <label class="form-checkbox">
                <input type="checkbox" id="include-name" checked />
                Include person name, email, and phone
              </label>
            </div>

            <button class="btn btn--primary btn--lg btn--full" id="generate-address">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
              </svg>
              Generate Address
            </button>
          </div>

          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Address Details</h3>
            </div>
            <div class="address-display" id="address-output">
              <div class="placeholder">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
                </svg>
                <p>Click "Generate Address" to get a random US address</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);
    
    this.setupEvents();
  }

  setupEvents() {
    this.on('click #generate-address', this.handleGenerate);
  }

  handleGenerate() {
    const includeName = this.element?.querySelector('#include-name')?.checked;
    this.emit('generate-address', { includeName });
  }

  updateAddress(address) {
    const output = this.element?.querySelector('#address-output');
    if (!output) return;

    if (!address) {
      output.innerHTML = `
        <div class="placeholder">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2L2 7v10c0 5 10 5 10 5s10 0 10-5V7L12 2z"/>
          </svg>
          <p>Click "Generate Address" to get a random US address</p>
        </div>
      `;
      return;
    }

    const fields = [
      { label: 'Full Address', value: `${address.street}, ${address.city}, ${address.state} ${address.zip}` },
      { label: 'Street Address', value: address.street },
      { label: 'City', value: address.city },
      { label: 'State', value: address.state },
      { label: 'ZIP Code', value: address.zip },
      { label: 'Country', value: address.country || 'United States' }
    ];

    if (address.name) {
      fields.unshift({ label: 'Full Name', value: address.name });
    }
    if (address.email) {
      fields.push({ label: 'Email', value: address.email });
    }
    if (address.phone) {
      fields.push({ label: 'Phone', value: address.phone });
    }

    output.innerHTML = fields.map(field => `
      <div class="address-field" onclick="window.copyToClipboard('${field.value}', '${field.label}')">
        <strong>${field.label}</strong>
        <span>${field.value}</span>
      </div>
    `).join('');
  }
}

// Combined, CursorReset, and Tempmail pages follow similar pattern...
// For brevity, I'll show the structure for one more:

class CombinedPage extends BaseComponent {
  constructor() {
    super('CombinedPage');
    
    this.setTemplate(`
      <div class="page tab-content" id="combined-tab">
        <div class="page__header">
          <h2 class="page__title">Combined Mode</h2>
          <p class="page__description">Generate cards with complete person information and real address in one click. Perfect for complete data generation.</p>
        </div>

        <div class="grid grid--main">
          <div class="card">
            <h3 class="card__title">Settings</h3>
            
            <div class="form-group">
              <label class="form-label" for="combined-bin-select">Select BIN Pattern</label>
              <select class="form-select" id="combined-bin-select">
                <option value="">Loading BINs...</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" for="combined-count">Number of Cards</label>
              <input class="form-input" type="number" id="combined-count" min="1" max="100" value="5" />
            </div>

            <button class="btn btn--primary btn--lg btn--full" id="generate-combined">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 12h8M12 8v8"/>
              </svg>
              Generate All
            </button>
          </div>

          <div class="card">
            <div class="card__header">
              <h3 class="card__title">Results</h3>
            </div>
            <textarea class="form-textarea" id="combined-output" readonly placeholder="Combined results will appear here..." style="min-height: 400px; font-family: var(--font-mono);"></textarea>
          </div>
        </div>
      </div>
    `);
    
    this.setupEvents();
  }

  setupEvents() {
    this.on('click #generate-combined', this.handleGenerate);
  }

  handleGenerate() {
    const binPattern = this.element?.querySelector('#combined-bin-select')?.value;
    const count = parseInt(this.element?.querySelector('#combined-count')?.value) || 5;
    this.emit('generate-combined', { binPattern, count });
  }

  updateBins(bins) {
    const select = this.element?.querySelector('#combined-bin-select');
    if (!select) return;

    if (!bins || bins.length === 0) {
      select.innerHTML = '<option value="">No BINs configured</option>';
      return;
    }

    select.innerHTML = bins.map(bin => {
      const description = bin.description ? ` - ${bin.description}` : '';
      return `<option value="${bin.bin_pattern}">${bin.bin_pattern}${description}</option>`;
    }).join('');
  }

  updateOutput(data) {
    const output = this.element?.querySelector('#combined-output');
    if (output) {
      output.value = data;
    }
  }
}

// Register components
BaseComponent.register('CardsPage', CardsPage);
BaseComponent.register('AddressPage', AddressPage);
BaseComponent.register('CombinedPage', CombinedPage);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CardsPage, AddressPage, CombinedPage };
} else {
  window.Pages = { CardsPage, AddressPage, CombinedPage };
}


