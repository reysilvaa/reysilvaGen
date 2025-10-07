/**
 * Combined Tab Controller
 * Handles combined card + address generation
 */

function initCombinedTab() {
  const generator = new CardGenerator();
  const nameGenerator = new NameGenerator();
  const csvLoader = new CSVLoader();
  const addressGenerator = new AddressGenerator(csvLoader);
  const utils = window.Utils;

  // Load CSV data
  async function loadCSV() {
    try {
      await csvLoader.load("../assets/address/us-US.csv");
      console.log(`✅ CSV loaded: ${csvLoader.getCount()} addresses`);
    } catch (error) {
      console.error("❌ CSV load failed:", error);
    }
  }

  // Initialize CSV loading
  loadCSV();

  const generateBtn = document.getElementById("generate-combined-btn");

  generateBtn?.addEventListener("click", async () => {
    const binPattern = document
      .getElementById("combined-bin-select")
      .value.trim();
    if (!binPattern) return utils.showError("Please select a BIN pattern");

    const count = parseInt(document.getElementById("combined-count").value);

    utils.showLoading();
    await new Promise((r) => setTimeout(r, 400));

    const cards = generator.generateBulk(binPattern, count, {
      length: null,
      yearsAhead: 5,
    });
    const address = addressGenerator.generate({
      includeName: true,
      nameGenerator,
    });

    let output =
      "=".repeat(60) + "\n  GENERATED TEST CARDS\n" + "=".repeat(60) + "\n\n";
    output += utils.formatCards(cards, "pipe") + "\n\n";
    output +=
      "=".repeat(60) +
      "\n  PERSON & ADDRESS INFORMATION\n" +
      "=".repeat(60) +
      "\n\n";

    if (address.Name) output += `Name: ${address.Name}\n`;
    if (address.Email) output += `Email: ${address.Email}\n`;
    if (address.Phone) output += `Phone: ${address.Phone}\n\n`;
    output += `Street: ${address.Street}\n`;
    output += `City: ${address.City}\n`;
    output += `State: ${address["State/province/area"]}\n`;
    output += `ZIP Code: ${address["Zip code"]}\n\n`;
    output +=
      "=".repeat(60) +
      "\nWARNING: For testing only. Real transactions are illegal.";

    document.getElementById("combined-output").value = output;
    utils.hideLoading();
    utils.showSuccess(`Generated ${count} cards with address!`);
  });
}

window.CombinedController = { init: initCombinedTab };

