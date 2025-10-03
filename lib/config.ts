/**
 * Application configuration and constants
 */

export const RWANDA_DISTRICTS = [
  "Gasabo",
  "Kicukiro",
  "Nyarugenge",
  "Bugesera",
  "Gatsibo",
  "Kayonza",
  "Kirehe",
  "Ngoma",
  "Nyagatare",
  "Rwamagana",
  "Gicumbi",
  "Musanze",
  "Rulindo",
  "Burera",
  "Gakenke",
  "Nyabihu",
  "Ngororero",
  "Rubavu",
  "Rutsiro",
  "Karongi",
  "Muhanga",
  "Nyanza",
  "Ruhango",
  "Kamonyi",
  "Rusizi",
  "Huye",
  "Nyaruguru",
  "Gisagara",
  "Nyamagabe",
  "Nyamasheke",
];

export const COUNTRY_CODES = [
  { code: "+250", country: "Rwanda", flag: "🇷🇼" },
  { code: "+254", country: "Kenya", flag: "🇰🇪" },
  { code: "+256", country: "Uganda", flag: "🇺🇬" },
  { code: "+255", country: "Tanzania", flag: "🇹🇿" },
  { code: "+257", country: "Burundi", flag: "🇧🇮" },
];

export const SERVICE_CATEGORIES = [
  "House Cleaning",
  "Cooking",
  "Childcare",
  "Elderly Care",
  "Gardening",
  "Laundry & Ironing",
  "General Housework",
  "Pet Care",
  "Event Staff",
];

export const LANGUAGES = [
  "Kinyarwanda",
  "English",
  "French",
  "Swahili",
];

export const FILE_UPLOAD_LIMITS = {
  maxSize: 5 * 1024 * 1024, // 5MB
  imageTypes: ["image/jpeg", "image/png", "image/jpg"],
  documentTypes: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
};

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
};

export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
};