/**
 * Address Tab Controller
 * Handles address generation business logic
 */

function initAddressTab() {
  const nameGenerator = new NameGenerator();
  const csvLoader = new CSVLoader();
  const addressGenerator = new AddressGenerator(csvLoader);
  const utils = window.Utils;
  let csvLoaded = false;

  // Load CSV data
  async function loadCSV() {
    try {
      await csvLoader.load("../assets/address/us-US.csv");
      csvLoaded = true;
      console.log(`✅ CSV loaded: ${csvLoader.getCount()} addresses`);
    } catch (error) {
      console.error("❌ CSV load failed:", error);
    }
  }

  // Initialize CSV loading
  loadCSV();

  const fetchBtn = document.getElementById("fetch-address-btn");

  fetchBtn?.addEventListener("click", async () => {
    utils.showLoading();
    await new Promise((r) => setTimeout(r, 300));

    const includeName = document.getElementById(
      "include-name-checkbox"
    ).checked;
    const address = addressGenerator.generate({ includeName, nameGenerator });

    const fields = [];
    if (address.Name) fields.push({ label: "Name", value: address.Name });
    if (address.Email) fields.push({ label: "Email", value: address.Email });
    if (address.Phone) fields.push({ label: "Phone", value: address.Phone });
    fields.push({ label: "Street", value: address.Street });
    fields.push({ label: "City", value: address.City });
    fields.push({
      label: "State/Province",
      value: address["State/province/area"],
    });
    fields.push({ label: "ZIP Code", value: address["Zip code"] });

    let html = "";
    fields.forEach((f) => {
      html += `
        <div class="address-field clickable-field" onclick="copyToClipboard('${f.value.replace(
          /'/g,
          "\\'"
        )}', '${f.label}')" title="Click to copy ${f.label}">
          <strong>${f.label}</strong>
          <span>${f.value}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.5; margin-left: 8px;">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        </div>
      `;
    });

    document.getElementById("address-output").innerHTML = html;
    utils.hideLoading();
    utils.showSuccess(
      csvLoaded
        ? `Address from real data! (${csvLoader.getCount()} available)`
        : "Address generated!"
    );
  });
}

window.AddressController = { init: initAddressTab };

