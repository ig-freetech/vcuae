/**
 * 買取台帳 自動転記 - Google Apps Script Web App
 *
 * doPost endpoint: JSON リクエストを受け取り、バリデーション・派生計算後に
 * Google スプレッドシートへ 1 行追記する。
 *
 * Dependencies: なし (standalone Apps Script)
 * Used by: demo/web/ (PWA クライアント)
 */

// =====================================================================
// Constants
// =====================================================================

var SHEET_HEADERS = [
  "VisitDate",
  "CsCategory",
  "CustomerName",
  "Gender",
  "Birthday",
  "Age",
  "MobileNumber",
  "Email",
  "Address",
  "REF",
  "PaymentMethod",
  "Country",
  "CountryJP",
  "Continent大陸",
  "Subregion小地域",
  "誕生月",
  "総買取額",
  "総合計",
];

var COUNTRY_METADATA = {
  "UNITED ARAB EMIRATES": {
    country: "United Arab Emirates",
    countryJP: "アラブ首長国連邦",
    continent: "Asia",
    subregion: "Western Asia",
  },
  INDIA: {
    country: "India",
    countryJP: "インド",
    continent: "Asia",
    subregion: "Southern Asia",
  },
  "SRI LANKA": {
    country: "Sri Lanka",
    countryJP: "スリランカ",
    continent: "Asia",
    subregion: "Southern Asia",
  },
  PAKISTAN: {
    country: "Pakistan",
    countryJP: "パキスタン",
    continent: "Asia",
    subregion: "Southern Asia",
  },
  LEBANON: {
    country: "Lebanon",
    countryJP: "レバノン",
    continent: "Asia",
    subregion: "Western Asia",
  },
  THAILAND: {
    country: "Thailand",
    countryJP: "タイ",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  "SOUTH AFRICA": {
    country: "South Africa",
    countryJP: "南アフリカ",
    continent: "Africa",
    subregion: "Southern Africa",
  },
  NEPAL: {
    country: "Nepal",
    countryJP: "ネパール",
    continent: "Asia",
    subregion: "Southern Asia",
  },
  PHILIPPINES: {
    country: "Philippines",
    countryJP: "フィリピン",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  KAZAKHSTAN: {
    country: "Kazakhstan",
    countryJP: "カザフスタン",
    continent: "Asia",
    subregion: "Central Asia",
  },
  GERMANY: {
    country: "Germany",
    countryJP: "ドイツ",
    continent: "Europe",
    subregion: "Western Europe",
  },
  AUSTRALIA: {
    country: "Australia",
    countryJP: "オーストラリア",
    continent: "Oceania",
    subregion: "Australia and New Zealand",
  },
  VIETNAM: {
    country: "Vietnam",
    countryJP: "ベトナム",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  "UNITED KINGDOM": {
    country: "United Kingdom",
    countryJP: "イギリス",
    continent: "Europe",
    subregion: "Northern Europe",
  },
  ROMANIA: {
    country: "Romania",
    countryJP: "ルーマニア",
    continent: "Europe",
    subregion: "Eastern Europe",
  },
  NIGERIA: {
    country: "Nigeria",
    countryJP: "ナイジェリア",
    continent: "Africa",
    subregion: "Western Africa",
  },
  BELARUS: {
    country: "Belarus",
    countryJP: "ベラルーシ",
    continent: "Europe",
    subregion: "Eastern Europe",
  },
  NETHERLANDS: {
    country: "Netherlands",
    countryJP: "オランダ",
    continent: "Europe",
    subregion: "Western Europe",
  },
  CANADA: {
    country: "Canada",
    countryJP: "カナダ",
    continent: "Americas",
    subregion: "Northern America",
  },
  JORDAN: {
    country: "Jordan",
    countryJP: "ヨルダン",
    continent: "Asia",
    subregion: "Western Asia",
  },
  GEORGIA: {
    country: "Georgia",
    countryJP: "ジョージア",
    continent: "Asia",
    subregion: "Western Asia",
  },
  "UNITED STATES": {
    country: "United States",
    countryJP: "アメリカ合衆国",
    continent: "Americas",
    subregion: "Northern America",
  },
  JAPAN: {
    country: "Japan",
    countryJP: "日本",
    continent: "Asia",
    subregion: "Eastern Asia",
  },
  CHINA: {
    country: "China",
    countryJP: "中国",
    continent: "Asia",
    subregion: "Eastern Asia",
  },
  "KOREA REPUBLIC OF": {
    country: "Korea, Republic of",
    countryJP: "韓国",
    continent: "Asia",
    subregion: "Eastern Asia",
  },
  "RUSSIAN FEDERATION": {
    country: "Russian Federation",
    countryJP: "ロシア",
    continent: "Europe",
    subregion: "Eastern Europe",
  },
  FRANCE: {
    country: "France",
    countryJP: "フランス",
    continent: "Europe",
    subregion: "Western Europe",
  },
  ITALY: {
    country: "Italy",
    countryJP: "イタリア",
    continent: "Europe",
    subregion: "Southern Europe",
  },
  SPAIN: {
    country: "Spain",
    countryJP: "スペイン",
    continent: "Europe",
    subregion: "Southern Europe",
  },
  "SAUDI ARABIA": {
    country: "Saudi Arabia",
    countryJP: "サウジアラビア",
    continent: "Asia",
    subregion: "Western Asia",
  },
  QATAR: {
    country: "Qatar",
    countryJP: "カタール",
    continent: "Asia",
    subregion: "Western Asia",
  },
  KUWAIT: {
    country: "Kuwait",
    countryJP: "クウェート",
    continent: "Asia",
    subregion: "Western Asia",
  },
  OMAN: {
    country: "Oman",
    countryJP: "オマーン",
    continent: "Asia",
    subregion: "Western Asia",
  },
  EGYPT: {
    country: "Egypt",
    countryJP: "エジプト",
    continent: "Africa",
    subregion: "Northern Africa",
  },
  TURKEY: {
    country: "Turkey",
    countryJP: "トルコ",
    continent: "Asia",
    subregion: "Western Asia",
  },
  BRAZIL: {
    country: "Brazil",
    countryJP: "ブラジル",
    continent: "Americas",
    subregion: "South America",
  },
  MEXICO: {
    country: "Mexico",
    countryJP: "メキシコ",
    continent: "Americas",
    subregion: "Central America",
  },
  BANGLADESH: {
    country: "Bangladesh",
    countryJP: "バングラデシュ",
    continent: "Asia",
    subregion: "Southern Asia",
  },
  INDONESIA: {
    country: "Indonesia",
    countryJP: "インドネシア",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  MALAYSIA: {
    country: "Malaysia",
    countryJP: "マレーシア",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  SINGAPORE: {
    country: "Singapore",
    countryJP: "シンガポール",
    continent: "Asia",
    subregion: "South-eastern Asia",
  },
  ETHIOPIA: {
    country: "Ethiopia",
    countryJP: "エチオピア",
    continent: "Africa",
    subregion: "Eastern Africa",
  },
  KENYA: {
    country: "Kenya",
    countryJP: "ケニア",
    continent: "Africa",
    subregion: "Eastern Africa",
  },
};

var COUNTRY_ALIASES = {
  UAE: "UNITED ARAB EMIRATES",
  "U A E": "UNITED ARAB EMIRATES",
  "UNITED STATES OF AMERICA": "UNITED STATES",
  USA: "UNITED STATES",
  US: "UNITED STATES",
  "GREAT BRITAIN": "UNITED KINGDOM",
  BRITAIN: "UNITED KINGDOM",
  UK: "UNITED KINGDOM",
  ENGLAND: "UNITED KINGDOM",
  "VIET NAM": "VIETNAM",
  "SOUTH KOREA": "KOREA REPUBLIC OF",
  KOREA: "KOREA REPUBLIC OF",
  RUSSIA: "RUSSIAN FEDERATION",
};

// =====================================================================
// Helper functions
// =====================================================================

/**
 * Trim and collapse whitespace.
 * @param {*} value
 * @returns {string}
 */
function sanitizeText_(value) {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value).replace(/\s+/g, " ").trim();
}

/**
 * Check whether an ISO date string (YYYY-MM-DD) is calendar-valid.
 * @param {string} isoDate
 * @returns {boolean}
 */
function isValidIsoDate_(isoDate) {
  var parts = isoDate.split("-").map(Number);
  if (parts.length !== 3) {
    return false;
  }
  var year = parts[0];
  var month = parts[1];
  var day = parts[2];
  var date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

/**
 * Calculate age from birthday and visit date (both ISO strings).
 * @param {string} birthdayIso
 * @param {string} visitDateIso
 * @returns {number|null}
 */
function calculateAge_(birthdayIso, visitDateIso) {
  if (!birthdayIso || !visitDateIso) {
    return null;
  }
  if (!isValidIsoDate_(birthdayIso) || !isValidIsoDate_(visitDateIso)) {
    return null;
  }
  var birthday = birthdayIso.split("-").map(Number);
  var visit = visitDateIso.split("-").map(Number);
  var age = visit[0] - birthday[0];
  var hasHadBirthday =
    visit[1] > birthday[1] ||
    (visit[1] === birthday[1] && visit[2] >= birthday[2]);
  return hasHadBirthday ? age : age - 1;
}

/**
 * Extract birth month from ISO date string.
 * @param {string} birthdayIso
 * @returns {number|null}
 */
function deriveBirthMonth_(birthdayIso) {
  if (!birthdayIso || !isValidIsoDate_(birthdayIso)) {
    return null;
  }
  return Number(birthdayIso.split("-")[1]);
}

/**
 * Normalize a country name to its uppercase key, resolving aliases.
 * @param {string} country
 * @returns {string}
 */
function normalizeCountryKey_(country) {
  var text = sanitizeText_(country)
    .toUpperCase()
    .replace(/&/g, " AND ")
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) {
    return "";
  }
  return COUNTRY_ALIASES[text] || text;
}

/**
 * Resolve country metadata (countryJP, continent, subregion).
 * @param {string} country
 * @returns {Object}
 */
function resolveCountryMetadata_(country) {
  var raw = sanitizeText_(country);
  if (!raw) {
    return {
      country: "",
      countryJP: "N/A",
      continent: "N/A",
      subregion: "N/A",
      matched: false,
    };
  }
  var key = normalizeCountryKey_(raw);
  var matched = COUNTRY_METADATA[key];
  if (matched) {
    return {
      country: matched.country,
      countryJP: matched.countryJP,
      continent: matched.continent,
      subregion: matched.subregion,
      matched: true,
    };
  }
  return {
    country: raw,
    countryJP: "N/A",
    continent: "N/A",
    subregion: "N/A",
    matched: false,
  };
}

/**
 * Validate the incoming data payload. Returns an array of error objects.
 * @param {Object} data
 * @returns {Array<{field: string, message: string}>}
 */
function validatePayload_(data) {
  var errors = [];
  var requiredFields = [
    ["visitDate", "visitDate は必須です"],
    ["csCategory", "csCategory は必須です"],
    ["customerName", "customerName は必須です"],
    ["gender", "gender は必須です"],
    ["birthday", "birthday は必須です"],
    ["mobileNumber", "mobileNumber は必須です"],
    ["address", "address は必須です"],
    ["paymentMethod", "paymentMethod は必須です"],
    ["country", "country は必須です"],
  ];

  for (var i = 0; i < requiredFields.length; i++) {
    var field = requiredFields[i][0];
    var message = requiredFields[i][1];
    if (!sanitizeText_(data[field])) {
      errors.push({ field: field, message: message });
    }
  }

  if (data.visitDate && !isValidIsoDate_(String(data.visitDate))) {
    errors.push({ field: "visitDate", message: "visitDate の日付形式が不正です" });
  }
  if (data.birthday && !isValidIsoDate_(String(data.birthday))) {
    errors.push({ field: "birthday", message: "birthday の日付形式が不正です" });
  }

  return errors;
}

/**
 * Build a row array matching SHEET_HEADERS order.
 * @param {Object} data - validated input data
 * @param {Object} derived - derived fields
 * @returns {Array}
 */
function buildSheetRow_(data, derived) {
  return [
    data.visitDate || "",
    data.csCategory || "",
    data.customerName || "",
    data.gender || "",
    data.birthday || "",
    derived.age === null ? "" : derived.age,
    data.mobileNumber || "",
    data.email || "",
    data.address || "",
    data.ref || "",
    data.paymentMethod || "",
    derived.country,
    derived.countryJP,
    derived.continent,
    derived.subregion,
    derived.birthMonth === null ? "" : derived.birthMonth,
    data.totalPurchase === undefined || data.totalPurchase === null || data.totalPurchase === ""
      ? ""
      : data.totalPurchase,
    data.grandTotal === undefined || data.grandTotal === null || data.grandTotal === ""
      ? ""
      : data.grandTotal,
  ];
}

// =====================================================================
// JSON response helper
// =====================================================================

/**
 * Create a JSON response for Apps Script.
 * @param {Object} payload
 * @returns {TextOutput}
 */
function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

// =====================================================================
// GET endpoint (verification / health check)
// =====================================================================

/**
 * GET endpoint for reading spreadsheet data (used by E2E verification).
 *
 * Query params:
 *   - apiKey: string (required)
 *   - action: "readLastRow" | "health"
 *
 * @param {Object} e - Apps Script event object
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  try {
    var params = e.parameter || {};
    var storedKey = PropertiesService.getScriptProperties().getProperty("API_KEY");
    if (!params.apiKey || params.apiKey !== storedKey) {
      return jsonResponse_({ status: "error", code: "AUTH_ERROR", message: "Invalid API key" });
    }
    var action = params.action || "health";
    if (action === "readLastRow") {
      var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
      var sheetName = PropertiesService.getScriptProperties().getProperty("SHEET_NAME") || "Sheet1";
      var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
      var lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        return jsonResponse_({ status: "error", code: "NO_DATA", message: "No data rows found" });
      }
      var data = sheet.getRange(lastRow, 1, 1, SHEET_HEADERS.length).getValues()[0];
      return jsonResponse_({ status: "success", headers: SHEET_HEADERS, row: data });
    }
    return jsonResponse_({ status: "ok", message: "Web App is running" });
  } catch (err) {
    return jsonResponse_({ status: "error", code: "SERVER_ERROR", message: err.message });
  }
}

/**
 * Ensure header row exists in the sheet. Called on first write.
 */
function ensureHeaders_(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(SHEET_HEADERS);
  }
}

// =====================================================================
// Main endpoint
// =====================================================================

/**
 * POST endpoint for the Apps Script Web App.
 *
 * Expected JSON body:
 * {
 *   apiKey: string,
 *   data: {
 *     visitDate, csCategory, customerName, gender, birthday,
 *     mobileNumber, email?, address, ref?, paymentMethod,
 *     country, totalPurchase?, grandTotal?
 *   }
 * }
 *
 * @param {Object} e - Apps Script event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // --- 1. API Key authentication ---
    var storedKey = PropertiesService.getScriptProperties().getProperty("API_KEY");
    if (!body.apiKey || body.apiKey !== storedKey) {
      return jsonResponse_({
        status: "error",
        code: "AUTH_ERROR",
        message: "Invalid API key",
      });
    }

    // --- 2. Extract data payload ---
    var data = body.data;
    if (!data || typeof data !== "object") {
      return jsonResponse_({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Missing or invalid data field",
        errors: [{ field: "data", message: "data フィールドが必要です" }],
      });
    }

    // --- 3. Validate ---
    var validationErrors = validatePayload_(data);
    if (validationErrors.length > 0) {
      return jsonResponse_({
        status: "error",
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    // --- 4. Derive fields ---
    var countryMeta = resolveCountryMetadata_(data.country);
    var age = calculateAge_(String(data.birthday), String(data.visitDate));
    var birthMonth = deriveBirthMonth_(String(data.birthday));

    var derived = {
      age: age,
      birthMonth: birthMonth,
      country: countryMeta.country || data.country,
      countryJP: countryMeta.countryJP,
      continent: countryMeta.continent,
      subregion: countryMeta.subregion,
    };

    // --- 5. Build row ---
    var row = buildSheetRow_(data, derived);

    // --- 6. Append to spreadsheet ---
    var sheetId = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
    var sheetName =
      PropertiesService.getScriptProperties().getProperty("SHEET_NAME") || "Sheet1";
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(sheetName);
    ensureHeaders_(sheet);
    sheet.appendRow(row);

    // --- 7. Success ---
    return jsonResponse_({
      status: "success",
      message: "Row appended successfully",
    });
  } catch (err) {
    return jsonResponse_({
      status: "error",
      code: "SERVER_ERROR",
      message: err.message,
    });
  }
}
