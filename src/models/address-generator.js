/**
 * US Address Generator - Real Data from CSV
 * Generates random US addresses from real CSV data
 * Developed by Reysilva
 */

class AddressGenerator {
  constructor(csvLoader = null) {
    this.csvLoader = csvLoader;
    // Real US street names
    this.streetNames = [
      "Main",
      "Oak",
      "Pine",
      "Maple",
      "Cedar",
      "Elm",
      "Washington",
      "Lake",
      "Hill",
      "Park",
      "River",
      "First",
      "Second",
      "Third",
      "Fourth",
      "Fifth",
      "Lincoln",
      "Market",
      "Church",
      "Spring",
      "Center",
      "Sunset",
      "Franklin",
      "Madison",
      "Jefferson",
      "Jackson",
      "Highland",
      "Meadow",
      "Grove",
      "Valley",
      "Ridge",
      "Summit",
      "Pleasant",
      "Hillside",
      "Woodland",
    ];

    this.streetTypes = [
      "Street",
      "Avenue",
      "Boulevard",
      "Drive",
      "Court",
      "Lane",
      "Road",
      "Way",
      "Circle",
      "Place",
      "Terrace",
      "Trail",
      "Parkway",
    ];

    this.directions = ["N", "S", "E", "W", "NE", "NW", "SE", "SW"];

    // Real US cities with their states and ZIP ranges
    this.cities = [
      // California
      {
        city: "Los Angeles",
        state: "California",
        zipStart: 90001,
        zipEnd: 90089,
      },
      {
        city: "San Francisco",
        state: "California",
        zipStart: 94102,
        zipEnd: 94188,
      },
      {
        city: "San Diego",
        state: "California",
        zipStart: 92101,
        zipEnd: 92199,
      },
      {
        city: "Sacramento",
        state: "California",
        zipStart: 94203,
        zipEnd: 94299,
      },
      { city: "San Jose", state: "California", zipStart: 95101, zipEnd: 95196 },

      // New York
      { city: "New York", state: "New York", zipStart: 10001, zipEnd: 10282 },
      { city: "Brooklyn", state: "New York", zipStart: 11201, zipEnd: 11256 },
      { city: "Buffalo", state: "New York", zipStart: 14201, zipEnd: 14280 },
      { city: "Rochester", state: "New York", zipStart: 14602, zipEnd: 14694 },

      // Texas
      { city: "Houston", state: "Texas", zipStart: 77001, zipEnd: 77099 },
      { city: "Dallas", state: "Texas", zipStart: 75201, zipEnd: 75398 },
      { city: "Austin", state: "Texas", zipStart: 78701, zipEnd: 78799 },
      { city: "San Antonio", state: "Texas", zipStart: 78201, zipEnd: 78299 },

      // Florida
      { city: "Miami", state: "Florida", zipStart: 33101, zipEnd: 33199 },
      { city: "Tampa", state: "Florida", zipStart: 33601, zipEnd: 33694 },
      { city: "Orlando", state: "Florida", zipStart: 32801, zipEnd: 32899 },
      {
        city: "Jacksonville",
        state: "Florida",
        zipStart: 32201,
        zipEnd: 32299,
      },

      // Illinois
      { city: "Chicago", state: "Illinois", zipStart: 60601, zipEnd: 60699 },
      {
        city: "Springfield",
        state: "Illinois",
        zipStart: 62701,
        zipEnd: 62799,
      },

      // Pennsylvania
      {
        city: "Philadelphia",
        state: "Pennsylvania",
        zipStart: 19101,
        zipEnd: 19199,
      },
      {
        city: "Pittsburgh",
        state: "Pennsylvania",
        zipStart: 15201,
        zipEnd: 15299,
      },

      // Arizona
      { city: "Phoenix", state: "Arizona", zipStart: 85001, zipEnd: 85099 },
      { city: "Tucson", state: "Arizona", zipStart: 85701, zipEnd: 85799 },

      // Ohio
      { city: "Columbus", state: "Ohio", zipStart: 43201, zipEnd: 43299 },
      { city: "Cleveland", state: "Ohio", zipStart: 44101, zipEnd: 44199 },

      // Washington
      { city: "Seattle", state: "Washington", zipStart: 98101, zipEnd: 98199 },
      { city: "Spokane", state: "Washington", zipStart: 99201, zipEnd: 99299 },

      // Massachusetts
      { city: "Boston", state: "Massachusetts", zipStart: 2101, zipEnd: 2299 },
      {
        city: "Cambridge",
        state: "Massachusetts",
        zipStart: 2138,
        zipEnd: 2142,
      },

      // Colorado
      { city: "Denver", state: "Colorado", zipStart: 80201, zipEnd: 80299 },
      { city: "Boulder", state: "Colorado", zipStart: 80301, zipEnd: 80310 },

      // Georgia
      { city: "Atlanta", state: "Georgia", zipStart: 30301, zipEnd: 30399 },
      { city: "Savannah", state: "Georgia", zipStart: 31401, zipEnd: 31499 },

      // Michigan
      { city: "Detroit", state: "Michigan", zipStart: 48201, zipEnd: 48299 },
      {
        city: "Grand Rapids",
        state: "Michigan",
        zipStart: 49501,
        zipEnd: 49599,
      },

      // Nevada
      { city: "Las Vegas", state: "Nevada", zipStart: 89101, zipEnd: 89199 },
      { city: "Reno", state: "Nevada", zipStart: 89501, zipEnd: 89599 },

      // Oregon
      { city: "Portland", state: "Oregon", zipStart: 97201, zipEnd: 97299 },
      { city: "Eugene", state: "Oregon", zipStart: 97401, zipEnd: 97499 },

      // North Carolina
      {
        city: "Charlotte",
        state: "North Carolina",
        zipStart: 28201,
        zipEnd: 28299,
      },
      {
        city: "Raleigh",
        state: "North Carolina",
        zipStart: 27601,
        zipEnd: 27699,
      },
    ];

    // Apartment/Suite types
    this.unitTypes = ["Apt", "Suite", "Unit", "#"];
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Pick a random element from an array
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate a street number
   */
  generateStreetNumber() {
    // Most street numbers are between 1-9999
    return this.randomInt(1, 9999);
  }

  /**
   * Generate a street name
   */
  generateStreetName() {
    const name = this.randomChoice(this.streetNames);
    const type = this.randomChoice(this.streetTypes);

    // Sometimes add direction prefix (30% chance)
    if (Math.random() < 0.3) {
      const direction = this.randomChoice(this.directions);
      return `${direction} ${name} ${type}`;
    }

    return `${name} ${type}`;
  }

  /**
   * Generate apartment/unit number (optional)
   */
  generateUnitNumber() {
    // 40% chance of having a unit number
    if (Math.random() < 0.4) {
      const unitType = this.randomChoice(this.unitTypes);
      const unitNumber = this.randomInt(1, 999);
      return ` ${unitType} ${unitNumber}`;
    }
    return "";
  }

  /**
   * Generate a complete street address
   */
  generateStreet() {
    const number = this.generateStreetNumber();
    const street = this.generateStreetName();
    const unit = this.generateUnitNumber();

    return `${number} ${street}${unit}`;
  }

  /**
   * Generate a ZIP code for a specific city
   */
  generateZipCode(cityData) {
    const zip = this.randomInt(cityData.zipStart, cityData.zipEnd);
    return zip.toString().padStart(5, "0");
  }

  /**
   * Generate a complete random US address with optional name
   */
  generate(options = {}) {
    const { includeName = false, nameGenerator = null } = options;

    let address;

    // Use CSV data if available
    if (this.csvLoader && this.csvLoader.isLoaded()) {
      const csvData = this.csvLoader.getRandomAddress();

      address = {
        Street: csvData["FULL ADDRESS"],
        City: csvData["CITY"],
        "State/province/area": csvData["JURISDICTION"] || "Louisiana",
        "Zip code": csvData["ZIP"],
      };

      // Add name if requested
      if (includeName && nameGenerator) {
        // Try to use councilperson name from CSV, or generate random
        let personName;
        if (
          csvData["COUNCILPERSON NAME"] &&
          csvData["COUNCILPERSON NAME"].trim()
        ) {
          const councilName = csvData["COUNCILPERSON NAME"].trim();
          const nameParts = councilName.split(" ");
          personName = {
            fullName: councilName,
            firstName: nameParts[0] || "John",
            lastName: nameParts[nameParts.length - 1] || "Doe",
          };
        } else {
          personName = nameGenerator.generate();
        }

        address.Name = personName.fullName;
        address.Email = nameGenerator.generateEmail(personName);
        address.Phone = nameGenerator.generatePhone();
      }
    } else {
      // Fallback to generated data if CSV not loaded
      const cityData = this.randomChoice(this.cities);
      const street = this.generateStreet();
      const zipCode = this.generateZipCode(cityData);

      address = {
        Street: street,
        City: cityData.city,
        "State/province/area": cityData.state,
        "Zip code": zipCode,
      };

      // Add name if requested
      if (includeName && nameGenerator) {
        const personName = nameGenerator.generate();
        address.Name = personName.fullName;
        address.Email = nameGenerator.generateEmail(personName);
        address.Phone = nameGenerator.generatePhone();
      }
    }

    return address;
  }

  /**
   * Generate multiple addresses
   */
  generateBulk(count = 1, options = {}) {
    const addresses = [];
    for (let i = 0; i < count; i++) {
      addresses.push(this.generate(options));
    }
    return addresses;
  }
}

// Export for use in renderer
if (typeof module !== "undefined" && module.exports) {
  module.exports = AddressGenerator;
}
