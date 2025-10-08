/**
 * CSV Loader - Load and parse CSV data
 * Loads real US address data from CSV file
 * Developed by Reysilva
 */

class CSVLoader {
  constructor() {
    this.addresses = [];
    this.loaded = false;
  }

  /**
   * Parse CSV text to array of objects
   */
  parseCSV(csvText) {
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (handles basic cases)
      const values = this.parseCSVLine(line);
      if (values.length !== headers.length) continue;

      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index].trim();
      });

      // Only add if has required fields
      if (obj["FULL ADDRESS"] && obj["CITY"] && obj["ZIP"]) {
        data.push(obj);
      }
    }

    return data;
  }

  /**
   * Parse a single CSV line (handles quotes and commas)
   */
  parseCSVLine(line) {
    const values = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  }

  /**
   * Load CSV file
   */
  async load(filename) {
    try {
      // Use IPC to load CSV from main process
      const result = await window.csvLoader.loadCSV(filename);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      this.addresses = this.parseCSV(result.data);
      this.loaded = true;

      console.log(`Loaded ${this.addresses.length} addresses from CSV`);
      return this.addresses;
    } catch (error) {
      console.error("Error loading CSV:", error);
      this.loaded = false;
      return [];
    }
  }

  /**
   * Get a random address from loaded data
   */
  getRandomAddress() {
    if (!this.loaded || this.addresses.length === 0) {
      throw new Error("CSV data not loaded yet");
    }

    const randomIndex = Math.floor(Math.random() * this.addresses.length);
    return this.addresses[randomIndex];
  }

  /**
   * Get multiple random addresses
   */
  getRandomAddresses(count = 1) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(this.getRandomAddress());
    }
    return results;
  }

  /**
   * Get all addresses
   */
  getAllAddresses() {
    return this.addresses;
  }

  /**
   * Check if data is loaded
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Get total count
   */
  getCount() {
    return this.addresses.length;
  }
}

// Export for use in renderer
if (typeof module !== "undefined" && module.exports) {
  module.exports = CSVLoader;
}
