# 💳 Reysilvagen Desktop

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Electron](https://img.shields.io/badge/electron-28.0-green)
![License](https://img.shields.io/badge/license-Testing%20Only-red)

**Modern Electron Desktop Application** untuk generate test credit cards dan fake US addresses untuk keperluan QA testing.

## ⚠️ PERINGATAN PENTING

**Tool ini HANYA untuk TESTING dan DEVELOPMENT!**

- Nomor kartu yang dihasilkan hanya untuk keperluan QA testing
- JANGAN gunakan untuk transaksi nyata
- Penggunaan yang salah adalah ILEGAL
- Developer tidak bertanggung jawab atas penyalahgunaan

## ✨ Fitur Unggulan

### 🎨 UI Modern & Beautiful

- Splash screen profesional dengan gradient animation
- Gradient purple/blue design yang eye-catching
- 3 tab interface yang smooth dan intuitif
- Dark theme output area
- Toast notifications untuk feedback
- Smooth animations di setiap interaksi

### 🔧 Admin Panel dengan SQLite Database 🆕

- **Sistem autentikasi admin** yang aman
- **Konfigurasi BIN terpusat** di database
- User hanya bisa pilih BIN yang sudah di-approve admin
- CRUD operations untuk management BIN
- Session-based authentication (expire 24 jam)
- SQLite database untuk konfigurasi persistent
- Default admin: `username=admin`, `password=admin123`
- Lihat [Panduan Admin Panel](README_ADMIN.md) untuk detail

### 💳 Card Generator Module

- Generate kartu test dari **BIN yang sudah dikonfigurasi admin**
- Support: Visa, Mastercard, Amex, Discover
- Luhn algorithm validation
- Bulk generation (1-1000 kartu)
- Multiple output formats: Plain, Pipe, CSV, JSON
- Custom CVV length
- Configurable expiry dates

### 🏠 Address Generator Module

- **100% Offline** - Tidak perlu internet!
- **Real data from CSV** - 197,000+ real US addresses!
- Random selection dari database besar
- Real street addresses, cities, dan ZIP codes
- Optional fake person names, email, dan phone
- Data authentic dan berkualitas tinggi

### 🚀 Combined Mode

- Generate cards + person + address sekaligus
- Complete test data: cards, name, email, phone, address
- Perfect untuk complete test data generation

## 📦 Installation

### Prerequisites

- **Node.js** 14.0+ ([Download](https://nodejs.org/))
- **npm** (included dengan Node.js)

### Setup

```bash
# Install dependencies
npm install
```

## 🚀 Quick Start

### Development Mode

```bash
npm start
```

### Build Executable

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Hasil build ada di folder `dist/`

## 📁 Project Structure

```
Reysilvagen-desktop/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.js        # Main entry point
│   │   └── preload.js     # Preload script (security)
│   │
│   ├── renderer/          # UI layer
│   │   ├── index.html     # Main UI
│   │   ├── splash.html    # Splash screen
│   │   ├── styles.css     # Beautiful styling
│   │   └── renderer.js    # UI logic & event handlers
│   │
│   └── lib/              # Core modules
│       ├── card-generator.js     # Card generation logic
│       ├── name-generator.js     # Name faker module
│       ├── csv-loader.js         # CSV data loader
│       └── address-generator.js  # Address from CSV
│
├── assets/               # Icons & data files
│   └── address/
│       └── us-US.csv    # 197k+ real US addresses
├── legacy/              # Old Python CLI (deprecated)
├── package.json         # Dependencies & scripts
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🎯 Modules

### CardGenerator

```javascript
const generator = new CardGenerator();

// Generate single card
const card = generator.generateFromBin("445566", 16);

// Generate bulk cards
const cards = generator.generateBulk("445566", 10, {
  length: 16,
  cvvLength: 3,
  yearsAhead: 5,
});
```

### AddressGenerator

```javascript
const csvLoader = new CSVLoader();
await csvLoader.load("../assets/address/us-US.csv");

const addressGen = new AddressGenerator(csvLoader);

// Generate single address
const address = addressGen.generate();
// Returns: { Street, City, "State/province/area", "Zip code" }

// Generate with person data
const addressWithPerson = addressGen.generate({
  includeName: true,
  nameGenerator: nameGenerator,
});
// Returns: { Name, Email, Phone, Street, City, State, Zip }

// Generate multiple addresses
const addresses = addressGen.generateBulk(5, {
  includeName: true,
  nameGenerator: nameGenerator,
});
```

## 📖 Usage Guide

### Admin Panel

1. Klik tombol **"🔧 Admin Panel"** di sidebar
2. Login dengan credentials (default: `admin` / `admin123`)
3. Manage BIN patterns:
   - Add new BIN patterns
   - Edit existing configurations
   - Delete unused BINs
4. Lihat [Panduan Admin Panel](README_ADMIN.md) untuk dokumentasi lengkap

### Tab 1: Generate Cards

1. **Pilih BIN pattern** dari dropdown (sudah dikonfigurasi admin)
2. Configure options (count, length, format, CVV, expiry)
3. Klik "Generate Cards"
4. Copy to clipboard atau save to file

> **Note**: BIN pattern sekarang dikelola melalui Admin Panel. User hanya bisa pilih dari BIN yang sudah dikonfigurasi.

### Tab 2: Fetch Address

1. Centang/uncheck "Include person name, email, and phone"
2. Klik "Generate Random Address"
3. Address langsung ter-generate (offline dari 197k+ database!)
4. Lihat hasil formatted

### Tab 3: Combined Mode

1. **Pilih BIN pattern** dari dropdown
2. Set jumlah cards
3. Klik "Generate All"
4. Dapatkan kartu + person info + address sekaligus!

**Output includes:**

- Test credit cards (dengan CVV & expiry)
- Person name, email, dan phone
- Real US address dari CSV database

## 🎨 Output Formats

### Plain

```
4111111111111111
5555555555554444
```

### Pipe (Default)

```
4111111111111111|12|28|123
5555555555554444|06|29|456
```

### CSV

```
card_number,exp_month,exp_year,cvv
4111111111111111,12,28,123
```

### JSON

```json
[
  {
    "number": "4111111111111111",
    "cvv": "123",
    "exp_month": "12",
    "exp_year": "28"
  }
]
```

## 🔧 Technical Stack

- **Electron 28** - Cross-platform desktop framework
- **HTML5/CSS3** - Modern UI
- **JavaScript ES6+** - Clean modular code
- **No external dependencies** - All generators are local!

## 🎯 Card Types Supported

| Card Type  | BIN Start        | CVV Length |
| ---------- | ---------------- | ---------- |
| Visa       | 4                | 3          |
| Mastercard | 51-55, 2221-2720 | 3          |
| Amex       | 34, 37           | 4          |
| Discover   | 6011, 64, 65     | 3          |

## 🗃️ Real Address Database

**197,000+ real US addresses** dari CSV database:

- Addresses dari Louisiana (Baton Rouge, Zachary, Baker, dll)
- Real street names, numbers, dan ZIP codes
- Actual city dan jurisdiction data
- Council districts dan councilperson names
- Semua data authentic dan valid untuk testing

## 💡 Features Highlight

✅ **100% Offline** - Tidak perlu internet untuk generate data  
✅ **Real Data** - 197k+ real US addresses dari CSV  
✅ **Fast** - Generate ribuan kartu dalam sekejap  
✅ **Complete** - Cards + Person + Address dalam satu klik  
✅ **Modular** - Kode terorganisir dengan baik  
✅ **Beautiful UI** - Design modern & professional  
✅ **Cross-platform** - Windows, macOS, Linux

## 🛠️ Development

### Enable DevTools

```bash
npm run dev
```

### Debugging

- **Windows/Linux**: `Ctrl+Shift+I`
- **macOS**: `Cmd+Option+I`

## 🔒 Security

- Context isolation enabled
- Node integration disabled di renderer
- Preload script untuk safe IPC
- No eval() atau unsafe code

## 🆘 Troubleshooting

### Error: Cannot find module 'electron'

```bash
npm install
```

### App tidak mau start

```bash
# Delete node_modules
rm -rf node_modules

# Reinstall
npm install

# Start
npm start
```

## 📝 Changelog

### v2.0.0 (Current)

- ✅ Full Electron implementation
- ✅ Beautiful modern UI
- ✅ Modular architecture
- ✅ Local address generator (offline!)
- ✅ Organized folder structure
- ✅ Card generator module
- ✅ Address generator module

## 👨‍💻 Developer

**Developed and maintained by Reysilva**

Untuk legitimate testing dan QA purposes only. Semua penggunaan harus comply dengan hukum dan regulasi setempat.

## 📜 License

**FOR TESTING PURPOSES ONLY**

Software ini disediakan untuk QA testing dan development purposes only. Segala penyalahgunaan dilarang keras dan bisa jadi ilegal.

---

**Made with ❤️ for QA Engineers | Reysilvagen v2.0**

**Remember**: Ini adalah TEST data untuk QA purposes. NEVER gunakan untuk real transactions! 🚫💳
