/**
 * 買取台帳 自動転記 - Google Apps Script Web App
 *
 * doPost endpoint: JSON リクエストを受け取り、バリデーション・派生計算後に
 * Google スプレッドシートへ 1 行追記する。
 *
 * Dependencies: なし (standalone Apps Script)
 * Used by: demo/web/, demo/admin/ (PWA クライアント)
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
  "CertificatePhotoUrl",
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

function extractDriveFolderId_(urlOrId) {
  var text = sanitizeText_(urlOrId);
  if (!text) {
    return "";
  }

  if (/^[a-zA-Z0-9_-]{10,}$/.test(text)) {
    return text;
  }

  var folderMatch = text.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  var queryMatch = text.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch && queryMatch[1]) {
    return queryMatch[1];
  }

  return "";
}

function getExtensionByMimeType_(mimeType) {
  var m = sanitizeText_(mimeType).toLowerCase();
  if (m === "image/png") {
    return "png";
  }
  if (m === "image/webp") {
    return "webp";
  }
  if (m === "image/heic") {
    return "heic";
  }
  return "jpg";
}

function sanitizeFileNamePart_(value) {
  return sanitizeText_(value)
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 48);
}

function buildCertificateFileName_(fileNameHint, mimeType) {
  var safeHint = sanitizeFileNamePart_(fileNameHint) || "certificate";
  var timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "");
  return safeHint + "_" + timestamp + "." + getExtensionByMimeType_(mimeType);
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
  if (
    data.certificatePhotoUrl &&
    !/^https?:\/\/[^\s]+$/i.test(String(data.certificatePhotoUrl))
  ) {
    errors.push({
      field: "certificatePhotoUrl",
      message: "certificatePhotoUrl の形式が不正です",
    });
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
    data.certificatePhotoUrl || "",
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
 *   - selfGeneratedToken: string (required)
 *   - action: "readLastRow" | "health" | "listSheets" | "getHeaders"
 *
 * @param {Object} e - Apps Script event object
 * @returns {TextOutput} JSON response
 */
function getStoredAuthToken_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty("SELF_GENERATED_TOKEN") || "";
}

function getStoredAdminPasscode_() {
  return PropertiesService.getScriptProperties().getProperty("ADMIN_PASSCODE") || "";
}

function getProvidedTokenFromParams_(params) {
  return params.selfGeneratedToken || "";
}

function getProvidedTokenFromBody_(body) {
  return body.selfGeneratedToken || "";
}

function doGet(e) {
  try {
    var params = e.parameter || {};
    var storedToken = getStoredAuthToken_();
    var providedToken = getProvidedTokenFromParams_(params);
    if (!providedToken || providedToken !== storedToken) {
      return jsonResponse_({
        status: "error",
        code: "AUTH_ERROR",
        message: "Invalid self-generated token",
      });
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
    if (action === "listSheets") {
      var targetSheetId = params.spreadsheetId ||
        PropertiesService.getScriptProperties().getProperty("SHEET_ID");
      if (!targetSheetId) {
        return jsonResponse_({ status: "error", code: "CONFIG_ERROR", message: "No spreadsheet ID configured or provided" });
      }
      try {
        var ss = SpreadsheetApp.openById(targetSheetId);
        var sheets = ss.getSheets();
        var sheetNames = [];
        for (var i = 0; i < sheets.length; i++) {
          sheetNames.push(sheets[i].getName());
        }
        return jsonResponse_({ status: "success", spreadsheetId: targetSheetId, sheets: sheetNames });
      } catch (e) {
        return jsonResponse_({ status: "error", code: "ACCESS_ERROR", message: "Cannot access spreadsheet: " + e.message });
      }
    }
    if (action === "getHeaders") {
      var hSheetId = params.spreadsheetId ||
        PropertiesService.getScriptProperties().getProperty("SHEET_ID");
      var hSheetName = params.sheetName ||
        PropertiesService.getScriptProperties().getProperty("SHEET_NAME") || "Sheet1";
      if (!hSheetId) {
        return jsonResponse_({ status: "error", code: "CONFIG_ERROR", message: "No spreadsheet ID configured or provided" });
      }
      try {
        var hSheet = SpreadsheetApp.openById(hSheetId).getSheetByName(hSheetName);
        if (!hSheet) {
          return jsonResponse_({ status: "error", code: "NOT_FOUND", message: "Sheet '" + hSheetName + "' not found" });
        }
        var lastCol = hSheet.getLastColumn();
        var headers = lastCol > 0 ? hSheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
        return jsonResponse_({ status: "success", headers: headers, sheetName: hSheetName, expectedHeaders: SHEET_HEADERS });
      } catch (e) {
        return jsonResponse_({ status: "error", code: "ACCESS_ERROR", message: e.message });
      }
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
 *   selfGeneratedToken: string,
 *   action?: "appendRow" | "configure" | "verifyAdminPasscode" | "uploadCertificatePhoto",
 *   adminPasscode?: string,
 *   data: {
 *     visitDate, csCategory, customerName, gender, birthday,
 *     mobileNumber, email?, address, ref?, paymentMethod,
 *     country, totalPurchase?, grandTotal?, certificatePhotoUrl?
 *   }
 * }
 *
 * @param {Object} e - Apps Script event object
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);

    // --- 1. Shared token authentication ---
    var storedToken = getStoredAuthToken_();
    var providedToken = getProvidedTokenFromBody_(body);
    if (!providedToken || providedToken !== storedToken) {
      return jsonResponse_({
        status: "error",
        code: "AUTH_ERROR",
        message: "Invalid self-generated token",
      });
    }

    // --- Route by action ---
    var action = body.action || "appendRow";

    if (action === "verifyAdminPasscode") {
      var storedAdminPasscode = getStoredAdminPasscode_();
      if (!storedAdminPasscode) {
        return jsonResponse_({
          status: "error",
          code: "CONFIG_ERROR",
          message: "ADMIN_PASSCODE is not configured",
        });
      }
      var providedAdminPasscode =
        body.adminPasscode === undefined || body.adminPasscode === null
          ? ""
          : String(body.adminPasscode);
      if (!providedAdminPasscode || providedAdminPasscode !== storedAdminPasscode) {
        return jsonResponse_({
          status: "error",
          code: "AUTH_ERROR",
          message: "Invalid admin passcode",
        });
      }
      return jsonResponse_({
        status: "success",
        message: "Admin passcode verified",
      });
    }

    if (action === "configure") {
      var config = body.config;
      if (!config || typeof config !== "object") {
        return jsonResponse_({ status: "error", code: "VALIDATION_ERROR", message: "Missing or invalid config field" });
      }
      var props = PropertiesService.getScriptProperties();
      if (config.spreadsheetId) {
        try {
          SpreadsheetApp.openById(config.spreadsheetId);
        } catch (accessErr) {
          return jsonResponse_({ status: "error", code: "ACCESS_ERROR", message: "Cannot access spreadsheet: " + accessErr.message });
        }
        props.setProperty("SHEET_ID", config.spreadsheetId);
      }
      if (config.sheetName) {
        props.setProperty("SHEET_NAME", config.sheetName);
      }
      if (config.driveFolderUrl) {
        var driveFolderId = extractDriveFolderId_(config.driveFolderUrl);
        if (!driveFolderId) {
          return jsonResponse_({
            status: "error",
            code: "VALIDATION_ERROR",
            message: "Invalid Google Drive folder URL",
          });
        }
        try {
          DriveApp.getFolderById(driveFolderId).getName();
        } catch (folderErr) {
          return jsonResponse_({
            status: "error",
            code: "ACCESS_ERROR",
            message: "Cannot access Google Drive folder: " + folderErr.message,
          });
        }
        props.setProperty("DRIVE_FOLDER_ID", driveFolderId);
      }
      return jsonResponse_({
        status: "success",
        message: "Configuration updated",
        currentConfig: {
          sheetId: props.getProperty("SHEET_ID"),
          sheetName: props.getProperty("SHEET_NAME") || "Sheet1",
          driveFolderId: props.getProperty("DRIVE_FOLDER_ID") || "",
        }
      });
    }

    if (action === "uploadCertificatePhoto") {
      var photoBase64 = sanitizeText_(body.photoBase64);
      var mimeType = sanitizeText_(body.mimeType) || "image/jpeg";
      var fileNameHint = sanitizeText_(body.fileNameHint);
      var configuredDriveFolderId =
        PropertiesService.getScriptProperties().getProperty("DRIVE_FOLDER_ID") || "";

      if (!configuredDriveFolderId) {
        return jsonResponse_({
          status: "error",
          code: "CONFIG_ERROR",
          message: "Google Drive folder is not configured",
        });
      }
      if (!photoBase64) {
        return jsonResponse_({
          status: "error",
          code: "VALIDATION_ERROR",
          message: "photoBase64 is required",
        });
      }

      try {
        var bytes = Utilities.base64Decode(photoBase64);
        var blob = Utilities.newBlob(
          bytes,
          mimeType,
          buildCertificateFileName_(fileNameHint, mimeType),
        );
        var folder = DriveApp.getFolderById(configuredDriveFolderId);
        var file = folder.createFile(blob);
        return jsonResponse_({
          status: "success",
          message: "Certificate photo uploaded",
          fileId: file.getId(),
          fileName: file.getName(),
          fileUrl: file.getUrl(),
        });
      } catch (uploadErr) {
        return jsonResponse_({
          status: "error",
          code: "SERVER_ERROR",
          message: "Photo upload failed: " + uploadErr.message,
        });
      }
    }

    // --- 2. Extract data payload (appendRow action) ---
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
