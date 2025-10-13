/**
 * Name Generator Model - Realistic Fake Names
 * Generates random US names for testing purposes
 * @module mvc/models/name-generator
 */

class NameGenerator extends BaseModel {
  constructor() {
    // Initialize base model
    super('NameGenerator', { logLevel: 'info' });
    // Popular US first names
    this.firstNamesMale = [
      "James",
      "John",
      "Robert",
      "Michael",
      "William",
      "David",
      "Richard",
      "Joseph",
      "Thomas",
      "Charles",
      "Christopher",
      "Daniel",
      "Matthew",
      "Anthony",
      "Mark",
      "Donald",
      "Steven",
      "Paul",
      "Andrew",
      "Joshua",
      "Kenneth",
      "Kevin",
      "Brian",
      "George",
      "Edward",
      "Ronald",
      "Timothy",
      "Jason",
      "Jeffrey",
      "Ryan",
      "Jacob",
      "Gary",
      "Nicholas",
      "Eric",
      "Jonathan",
      "Stephen",
      "Larry",
      "Justin",
      "Scott",
      "Brandon",
      "Benjamin",
      "Samuel",
      "Raymond",
      "Gregory",
      "Frank",
      "Alexander",
      "Patrick",
      "Jack",
      "Dennis",
      "Jerry",
      "Tyler",
      "Aaron",
      "Jose",
      "Adam",
      "Henry",
      "Nathan",
      "Douglas",
      "Zachary",
      "Peter",
      "Kyle",
      "Walter",
      "Ethan",
      "Jeremy",
      "Harold",
      "Keith",
      "Christian",
      "Roger",
      "Noah",
      "Gerald",
      "Carl",
      "Terry",
      "Sean",
      "Austin",
      "Arthur",
      "Lawrence",
      "Jesse",
      "Dylan",
      "Bryan",
      "Joe",
      "Jordan",
      "Billy",
      "Bruce",
      "Albert",
      "Willie",
      "Gabriel",
      "Logan",
      "Alan",
      "Juan",
      "Wayne",
      "Roy",
      "Ralph",
      "Randy",
      "Eugene",
    ];

    this.firstNamesFemale = [
      "Mary",
      "Patricia",
      "Jennifer",
      "Linda",
      "Barbara",
      "Elizabeth",
      "Susan",
      "Jessica",
      "Sarah",
      "Karen",
      "Nancy",
      "Lisa",
      "Betty",
      "Margaret",
      "Sandra",
      "Ashley",
      "Kimberly",
      "Emily",
      "Donna",
      "Michelle",
      "Dorothy",
      "Carol",
      "Amanda",
      "Melissa",
      "Deborah",
      "Stephanie",
      "Rebecca",
      "Sharon",
      "Laura",
      "Cynthia",
      "Kathleen",
      "Amy",
      "Angela",
      "Shirley",
      "Anna",
      "Brenda",
      "Pamela",
      "Emma",
      "Nicole",
      "Helen",
      "Samantha",
      "Katherine",
      "Christine",
      "Debra",
      "Rachel",
      "Carolyn",
      "Janet",
      "Catherine",
      "Maria",
      "Heather",
      "Diane",
      "Ruth",
      "Julie",
      "Olivia",
      "Joyce",
      "Virginia",
      "Victoria",
      "Kelly",
      "Lauren",
      "Christina",
      "Joan",
      "Evelyn",
      "Judith",
      "Megan",
      "Andrea",
      "Cheryl",
      "Hannah",
      "Jacqueline",
      "Martha",
      "Gloria",
      "Teresa",
      "Ann",
      "Sara",
      "Madison",
      "Frances",
      "Kathryn",
      "Janice",
      "Jean",
      "Abigail",
      "Alice",
      "Judy",
      "Sophia",
      "Grace",
      "Denise",
      "Amber",
      "Doris",
      "Marilyn",
      "Danielle",
      "Beverly",
      "Isabella",
      "Theresa",
      "Diana",
      "Natalie",
      "Brittany",
    ];

    this.lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
      "Hernandez",
      "Lopez",
      "Gonzalez",
      "Wilson",
      "Anderson",
      "Thomas",
      "Taylor",
      "Moore",
      "Jackson",
      "Martin",
      "Lee",
      "Perez",
      "Thompson",
      "White",
      "Harris",
      "Sanchez",
      "Clark",
      "Ramirez",
      "Lewis",
      "Robinson",
      "Walker",
      "Young",
      "Allen",
      "King",
      "Wright",
      "Scott",
      "Torres",
      "Nguyen",
      "Hill",
      "Flores",
      "Green",
      "Adams",
      "Nelson",
      "Baker",
      "Hall",
      "Rivera",
      "Campbell",
      "Mitchell",
      "Carter",
      "Roberts",
      "Gomez",
      "Phillips",
      "Evans",
      "Turner",
      "Diaz",
      "Parker",
      "Cruz",
      "Edwards",
      "Collins",
      "Reyes",
      "Stewart",
      "Morris",
      "Morales",
      "Murphy",
      "Cook",
      "Rogers",
      "Gutierrez",
      "Ortiz",
      "Morgan",
      "Cooper",
      "Peterson",
      "Bailey",
      "Reed",
      "Kelly",
      "Howard",
      "Ramos",
      "Kim",
      "Cox",
      "Ward",
      "Richardson",
      "Watson",
      "Brooks",
      "Chavez",
      "Wood",
      "James",
      "Bennett",
      "Gray",
      "Mendoza",
      "Ruiz",
      "Hughes",
      "Price",
      "Alvarez",
      "Castillo",
      "Sanders",
      "Patel",
      "Myers",
      "Long",
      "Ross",
      "Foster",
      "Jimenez",
      "Powell",
      "Jenkins",
      "Perry",
      "Russell",
      "Sullivan",
      "Bell",
      "Coleman",
      "Butler",
      "Henderson",
      "Barnes",
      "Gonzales",
      "Fisher",
      "Vasquez",
      "Simmons",
      "Romero",
      "Jordan",
      "Patterson",
      "Alexander",
      "Hamilton",
      "Graham",
      "Reynolds",
      "Griffin",
      "Wallace",
      "Moreno",
      "West",
      "Cole",
      "Hayes",
      "Bryant",
      "Herrera",
      "Gibson",
      "Ellis",
      "Tran",
      "Medina",
      "Aguilar",
      "Stevens",
      "Murray",
      "Ford",
      "Castro",
      "Marshall",
      "Owens",
    ];

    this.middleInitials = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ];

    this.prefixes = ["Mr.", "Mrs.", "Ms.", "Dr."];
    this.suffixes = ["Jr.", "Sr.", "II", "III", "IV"];
  }

  /**
   * Pick a random element from an array
   */
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate a random first name
   */
  generateFirstName(gender = null) {
    if (gender === "male") {
      return this.randomChoice(this.firstNamesMale);
    } else if (gender === "female") {
      return this.randomChoice(this.firstNamesFemale);
    } else {
      // Random gender
      const allFirstNames = [...this.firstNamesMale, ...this.firstNamesFemale];
      return this.randomChoice(allFirstNames);
    }
  }

  /**
   * Generate a random last name
   */
  generateLastName() {
    return this.randomChoice(this.lastNames);
  }

  /**
   * Generate a middle initial (optional)
   */
  generateMiddleInitial() {
    // 70% chance of having a middle initial
    if (Math.random() < 0.7) {
      return this.randomChoice(this.middleInitials) + ".";
    }
    return "";
  }

  /**
   * Generate a prefix (optional)
   */
  generatePrefix() {
    // 20% chance of having a prefix
    if (Math.random() < 0.2) {
      return this.randomChoice(this.prefixes);
    }
    return "";
  }

  /**
   * Generate a suffix (optional)
   */
  generateSuffix() {
    // 10% chance of having a suffix
    if (Math.random() < 0.1) {
      return this.randomChoice(this.suffixes);
    }
    return "";
  }

  /**
   * Generate a full name
   */
  generate(options = {}) {
    const {
      gender = null,
      includeMiddle = true,
      includePrefix = false,
      includeSuffix = false,
    } = options;

    const parts = [];

    // Prefix
    if (includePrefix) {
      const prefix = this.generatePrefix();
      if (prefix) parts.push(prefix);
    }

    // First name
    const firstName = this.generateFirstName(gender);
    parts.push(firstName);

    // Middle initial
    if (includeMiddle) {
      const middle = this.generateMiddleInitial();
      if (middle) parts.push(middle);
    }

    // Last name
    const lastName = this.generateLastName();
    parts.push(lastName);

    // Suffix
    if (includeSuffix) {
      const suffix = this.generateSuffix();
      if (suffix) parts.push(suffix);
    }

    const fullName = parts.join(" ");

    return {
      fullName: fullName,
      firstName: firstName,
      lastName: lastName,
    };
  }

  /**
   * Generate multiple names
   */
  generateBulk(count = 1, options = {}) {
    const names = [];
    for (let i = 0; i < count; i++) {
      names.push(this.generate(options));
    }
    return names;
  }

  /**
   * Generate email from name
   */
  generateEmail(name, domain = null) {
    const domains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
      "icloud.com",
      "aol.com",
      "mail.com",
      "protonmail.com",
    ];

    const selectedDomain = domain || this.randomChoice(domains);
    const firstName = name.firstName.toLowerCase();
    const lastName = name.lastName.toLowerCase();

    // Different email formats
    const formats = [
      `${firstName}.${lastName}@${selectedDomain}`,
      `${firstName}${lastName}@${selectedDomain}`,
      `${firstName}${lastName}${Math.floor(
        Math.random() * 999
      )}@${selectedDomain}`,
      `${firstName.charAt(0)}${lastName}@${selectedDomain}`,
      `${firstName}_${lastName}@${selectedDomain}`,
    ];

    return this.randomChoice(formats);
  }

  /**
   * Generate phone number (US format)
   */
  generatePhone() {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const prefix = Math.floor(Math.random() * 900) + 100;
    const lineNumber = Math.floor(Math.random() * 9000) + 1000;

    return `(${areaCode}) ${prefix}-${lineNumber}`;
  }
}

// Export for use in renderer
if (typeof module !== "undefined" && module.exports) {
  module.exports = NameGenerator;
} else {
  window.NameGenerator = NameGenerator;
}
