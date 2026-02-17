"use strict";

// -------------------------------------------------------
// Tests for demo/apps-script/Code.gs
// -------------------------------------------------------
// Apps Script code exposes functions via global scope.
// For testing, we load Code.gs in Node and exercise its exported functions.

// --- Mock GAS globals ---
var scriptProperties = {};
var appendedRows = [];
var lastSheetId = null;
var lastSheetName = null;
var createdFiles = [];
var driveFolders = {};
var driveAccessError = null;
var lastDriveFolderId = null;

global.PropertiesService = {
  getScriptProperties: function () {
    return {
      getProperty: function (key) {
        return scriptProperties[key] || null;
      },
      setProperty: function (key, value) {
        scriptProperties[key] = String(value);
      },
    };
  },
};

function makeSheetMock_(opts) {
  var options = opts || {};
  var lastRow = options.hasHeader === false ? 0 : 1;
  var appendError = options.appendError || null;
  var sheetTabId = options.sheetTabId === undefined ? 123456789 : options.sheetTabId;

  return {
    getLastRow: function () {
      return lastRow;
    },
    getSheetId: function () {
      return sheetTabId;
    },
    appendRow: function (row) {
      if (appendError) {
        throw appendError;
      }
      appendedRows.push(row);
      lastRow += 1;
    },
  };
}

function installSpreadsheetMock_(opts) {
  global.SpreadsheetApp = {
    openById: function (id) {
      lastSheetId = id;
      return {
        getSheetByName: function (name) {
          lastSheetName = name;
          return makeSheetMock_(opts);
        },
      };
    },
  };
}

installSpreadsheetMock_({ hasHeader: true });

function installDriveMock_(opts) {
  var options = opts || {};
  driveFolders = options.folders || {
    "folder-abc": { name: "Certificate Photos" },
    "folder-test-1": { name: "Test Folder 1" },
  };
  driveAccessError = options.accessError || null;
  createdFiles = [];
  lastDriveFolderId = null;

  global.DriveApp = {
    getFolderById: function (id) {
      lastDriveFolderId = id;
      if (driveAccessError) {
        throw driveAccessError;
      }
      if (!driveFolders[id]) {
        throw new Error("Folder not found: " + id);
      }

      return {
        getName: function () {
          return driveFolders[id].name;
        },
        createFile: function (blob) {
          var fileId = "file-" + String(createdFiles.length + 1);
          var file = {
            id: fileId,
            name: blob.getName(),
            contentType: blob.getContentType(),
            size: blob.getBytes().length,
            folderId: id,
            url: "https://drive.google.com/file/d/" + fileId + "/view",
          };
          createdFiles.push(file);
          return {
            getId: function () {
              return file.id;
            },
            getName: function () {
              return file.name;
            },
            getUrl: function () {
              return file.url;
            },
          };
        },
      };
    },
  };
}

installDriveMock_();

global.Utilities = {
  base64Decode: function (input) {
    return Buffer.from(String(input), "base64");
  },
  newBlob: function (bytes, mimeType, name) {
    var data = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
    return {
      getBytes: function () {
        return data;
      },
      getContentType: function () {
        return mimeType;
      },
      getName: function () {
        return name;
      },
    };
  },
};

global.ContentService = {
  createTextOutput: function (text) {
    return {
      _text: text,
      setMimeType: function () {
        return this;
      },
      getContent: function () {
        return this._text;
      },
    };
  },
  MimeType: { JSON: "JSON" },
};

// Load Code.gs into global scope (Apps Script functions are global)
var fs = require("fs");
var path = require("path");
var vm = require("vm");
var codeGsPath = path.join(__dirname, "..", "apps-script", "Code.gs");
var codeGsSource = fs.readFileSync(codeGsPath, "utf8");
vm.runInThisContext(codeGsSource, { filename: "Code.gs" });

// --- Helpers ---
function callDoPost(payload) {
  var e = { postData: { contents: JSON.stringify(payload) } };
  var response = doPost(e);
  return JSON.parse(response.getContent());
}

function resetMocks() {
  scriptProperties = {
    SELF_GENERATED_TOKEN: "test-key-123",
    ADMIN_PASSCODE: "admin-9876",
    SHEET_ID: "sheet-abc",
    SHEET_NAME: "TestSheet",
    DRIVE_FOLDER_ID: "folder-abc",
  };
  appendedRows = [];
  lastSheetId = null;
  lastSheetName = null;
  installSpreadsheetMock_({ hasHeader: true });
  installDriveMock_();
}

// --- Test runner ---
var passed = 0;
var failed = 0;
var total = 0;

function assert(condition, message) {
  total++;
  if (condition) {
    passed++;
    console.log("  PASS: " + message);
  } else {
    failed++;
    console.log("  FAIL: " + message);
  }
}

function assertEqual(actual, expected, message) {
  total++;
  if (actual === expected) {
    passed++;
    console.log("  PASS: " + message);
  } else {
    failed++;
    console.log("  FAIL: " + message + " | expected: " + JSON.stringify(expected) + " got: " + JSON.stringify(actual));
  }
}

function assertDeepEqual(actual, expected, message) {
  total++;
  var actualStr = JSON.stringify(actual);
  var expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    passed++;
    console.log("  PASS: " + message);
  } else {
    failed++;
    console.log("  FAIL: " + message + "\n    expected: " + expectedStr + "\n    got:      " + actualStr);
  }
}

// ===========================
// Test: AUTH_ERROR
// ===========================
console.log("\n--- AUTH_ERROR ---");
resetMocks();
(function () {
  var result = callDoPost({ selfGeneratedToken: "wrong-key", data: {} });
  assertEqual(result.status, "error", "auth error status");
  assertEqual(result.code, "AUTH_ERROR", "auth error code");
  assert(result.message.indexOf("Invalid") >= 0, "auth error message contains Invalid");
})();

(function () {
  var result = callDoPost({ data: {} });
  assertEqual(result.status, "error", "missing selfGeneratedToken returns error");
  assertEqual(result.code, "AUTH_ERROR", "missing selfGeneratedToken returns AUTH_ERROR");
})();

// ===========================
// Test: verifyAdminPasscode
// ===========================
console.log("\n--- VERIFY ADMIN PASSCODE ---");
resetMocks();
(function () {
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "verifyAdminPasscode",
    adminPasscode: "admin-9876",
  });
  assertEqual(result.status, "success", "verifyAdminPasscode success status");
  assert(result.message.indexOf("verified") >= 0, "verifyAdminPasscode success message");
})();

(function () {
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "verifyAdminPasscode",
    adminPasscode: "wrong-passcode",
  });
  assertEqual(result.status, "error", "verifyAdminPasscode invalid passcode status");
  assertEqual(result.code, "AUTH_ERROR", "verifyAdminPasscode invalid passcode code");
})();

(function () {
  scriptProperties = {
    SELF_GENERATED_TOKEN: "test-key-123",
    SHEET_ID: "sheet-abc",
    SHEET_NAME: "TestSheet",
  };
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "verifyAdminPasscode",
    adminPasscode: "any-value",
  });
  assertEqual(result.status, "error", "verifyAdminPasscode missing property status");
  assertEqual(result.code, "CONFIG_ERROR", "verifyAdminPasscode missing property code");
})();

// ===========================
// Test: configure
// ===========================
console.log("\n--- CONFIGURE ---");
resetMocks();
(function () {
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "configure",
    config: {
      spreadsheetId: "sheet-abc",
      sheetName: "ConfiguredSheet",
      driveFolderUrl: "https://drive.google.com/drive/folders/folder-test-1",
    },
  });

  assertEqual(result.status, "success", "configure success status");
  assertEqual(scriptProperties.SHEET_ID, "sheet-abc", "configure stores SHEET_ID");
  assertEqual(scriptProperties.SHEET_NAME, "ConfiguredSheet", "configure stores SHEET_NAME");
  assertEqual(scriptProperties.DRIVE_FOLDER_ID, "folder-test-1", "configure stores DRIVE_FOLDER_ID");
  assertEqual(result.currentConfig.driveFolderId, "folder-test-1", "configure response includes driveFolderId");
})();

(function () {
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "configure",
    config: {
      spreadsheetId: "sheet-abc",
      sheetName: "ConfiguredSheet",
      driveFolderUrl: "invalid drive folder url",
    },
  });

  assertEqual(result.status, "error", "configure invalid drive URL status");
  assertEqual(result.code, "VALIDATION_ERROR", "configure invalid drive URL code");
})();

// ===========================
// Test: uploadCertificatePhoto
// ===========================
console.log("\n--- UPLOAD CERTIFICATE PHOTO ---");
resetMocks();
(function () {
  var base64 = Buffer.from("fake-image-bytes").toString("base64");
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "uploadCertificatePhoto",
    photoBase64: base64,
    mimeType: "image/png",
    fileNameHint: "2026-01-15_John_REF-001",
  });

  assertEqual(result.status, "success", "uploadCertificatePhoto success status");
  assertEqual(createdFiles.length, 1, "upload creates one drive file");
  assertEqual(createdFiles[0].folderId, "folder-abc", "upload uses configured drive folder");
  assertEqual(createdFiles[0].contentType, "image/png", "upload preserves mime type");
  assert(result.fileUrl.indexOf("https://drive.google.com/file/d/file-1/view") === 0, "upload returns file URL");
})();

(function () {
  delete scriptProperties.DRIVE_FOLDER_ID;
  var base64 = Buffer.from("fake-image-bytes").toString("base64");
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "uploadCertificatePhoto",
    photoBase64: base64,
    mimeType: "image/jpeg",
  });

  assertEqual(result.status, "error", "upload without configured folder status");
  assertEqual(result.code, "CONFIG_ERROR", "upload without configured folder code");
})();

(function () {
  resetMocks();
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    action: "uploadCertificatePhoto",
    photoBase64: "",
    mimeType: "image/jpeg",
  });

  assertEqual(result.status, "error", "upload missing base64 status");
  assertEqual(result.code, "VALIDATION_ERROR", "upload missing base64 code");
})();

// ===========================
// Test: VALIDATION_ERROR
// ===========================
console.log("\n--- VALIDATION_ERROR ---");
resetMocks();
(function () {
  var result = callDoPost({
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "",
      csCategory: "",
      customerName: "",
      gender: "",
      birthday: "",
      mobileNumber: "",
      address: "",
      paymentMethod: "",
      country: "",
    },
  });
  assertEqual(result.status, "error", "validation error status");
  assertEqual(result.code, "VALIDATION_ERROR", "validation error code");
  assert(Array.isArray(result.errors), "errors is array");
  assert(result.errors.length >= 9, "at least 9 validation errors for all empty required fields");
})();

(function () {
  // Missing 'data' field entirely
  var result = callDoPost({ selfGeneratedToken: "test-key-123" });
  assertEqual(result.status, "error", "missing data field returns error");
  assertEqual(result.code, "VALIDATION_ERROR", "missing data field returns VALIDATION_ERROR");
})();

// ===========================
// Test: SUCCESS (valid payload)
// ===========================
console.log("\n--- SUCCESS ---");
resetMocks();
(function () {
  var payload = {
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "2026-01-15",
      csCategory: "Sales (\u8ca9\u58f2)",
      customerName: "John Smith",
      gender: "Male",
      birthday: "1990-05-15",
      mobileNumber: "+971501234567",
      email: "john@example.com",
      address: "Dubai Marina",
      ref: "REF-001",
      paymentMethod: "Cash",
      country: "United Arab Emirates",
      totalPurchase: 15000,
      grandTotal: 16500,
      certificatePhotoUrl: "https://drive.google.com/file/d/file-1/view",
    },
  };
  var result = callDoPost(payload);
  assertEqual(result.status, "success", "success status");
  assert(result.message.indexOf("appended") >= 0, "success message mentions appended");
  assertEqual(result.writeTarget.sheetId, "sheet-abc", "success response includes writeTarget.sheetId");
  assertEqual(result.writeTarget.sheetName, "TestSheet", "success response includes writeTarget.sheetName");
  assertEqual(result.writeTarget.rowNumber, 2, "success response includes writeTarget.rowNumber");
  assertEqual(
    result.writeTarget.sheetUrl,
    "https://docs.google.com/spreadsheets/d/sheet-abc/edit#gid=123456789",
    "success response includes writeTarget.sheetUrl",
  );

  // Verify row was appended
  assertEqual(appendedRows.length, 1, "one row appended");
  var row = appendedRows[0];
  assertEqual(row.length, 19, "row has 19 columns (SHEET_HEADERS length)");

  // Verify column values
  assertEqual(row[0], "2026-01-15", "VisitDate");
  assertEqual(row[1], "Sales (\u8ca9\u58f2)", "CsCategory");
  assertEqual(row[2], "John Smith", "CustomerName");
  assertEqual(row[3], "Male", "Gender");
  assertEqual(row[4], "1990-05-15", "Birthday");
  assertEqual(row[5], 35, "Age (born 1990-05-15, visit 2026-01-15)");
  assertEqual(row[6], "+971501234567", "MobileNumber");
  assertEqual(row[7], "john@example.com", "Email");
  assertEqual(row[8], "Dubai Marina", "Address");
  assertEqual(row[9], "REF-001", "REF");
  assertEqual(row[10], "Cash", "PaymentMethod");
  assertEqual(row[11], "United Arab Emirates", "Country");
  assertEqual(row[12], "\u30a2\u30e9\u30d6\u9996\u9577\u56fd\u9023\u90a6", "CountryJP");
  assertEqual(row[13], "Asia", "Continent");
  assertEqual(row[14], "Western Asia", "Subregion");
  assertEqual(row[15], 5, "BirthMonth");
  assertEqual(row[16], 15000, "totalPurchase");
  assertEqual(row[17], 16500, "grandTotal");
  assertEqual(row[18], "https://drive.google.com/file/d/file-1/view", "certificatePhotoUrl");

  // Verify spreadsheet target
  assertEqual(lastSheetId, "sheet-abc", "opened correct sheet ID");
  assertEqual(lastSheetName, "TestSheet", "opened correct sheet name");
})();

// ===========================
// Test: Derived fields (country alias)
// ===========================
console.log("\n--- DERIVED FIELDS (country alias) ---");
resetMocks();
(function () {
  var payload = {
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "2026-06-01",
      csCategory: "buy (\u8cb7\u53d6)",
      customerName: "Jane Doe",
      gender: "Female",
      birthday: "2000-12-25",
      mobileNumber: "+441234567890",
      email: "",
      address: "London, UK",
      ref: "",
      paymentMethod: "Card",
      country: "UK",
      totalPurchase: 5000,
      grandTotal: 5500,
    },
  };
  var result = callDoPost(payload);
  assertEqual(result.status, "success", "UK alias accepted");

  var row = appendedRows[0];
  assertEqual(row[11], "United Kingdom", "Country resolved from alias UK");
  assertEqual(row[12], "\u30a4\u30ae\u30ea\u30b9", "CountryJP for UK");
  assertEqual(row[13], "Europe", "Continent for UK");
  assertEqual(row[14], "Northern Europe", "Subregion for UK");
  assertEqual(row[5], 25, "Age (born 2000-12-25, visit 2026-06-01)");
  assertEqual(row[15], 12, "BirthMonth December");
})();

// ===========================
// Test: Unknown country
// ===========================
console.log("\n--- UNKNOWN COUNTRY ---");
resetMocks();
(function () {
  var payload = {
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "2026-03-01",
      csCategory: "Sales (\u8ca9\u58f2)",
      customerName: "Test User",
      gender: "Other",
      birthday: "1995-07-20",
      mobileNumber: "+1234567890",
      email: "",
      address: "Somewhere",
      ref: "",
      paymentMethod: "Bank Transfer",
      country: "Atlantis",
      totalPurchase: 1000,
      grandTotal: 1100,
    },
  };
  var result = callDoPost(payload);
  assertEqual(result.status, "success", "unknown country still succeeds");

  var row = appendedRows[0];
  assertEqual(row[11], "Atlantis", "Country kept as-is for unknown");
  assertEqual(row[12], "N/A", "CountryJP N/A for unknown");
  assertEqual(row[13], "N/A", "Continent N/A for unknown");
  assertEqual(row[14], "N/A", "Subregion N/A for unknown");
})();

// ===========================
// Test: Default sheet name
// ===========================
console.log("\n--- DEFAULT SHEET NAME ---");
(function () {
  scriptProperties = { SELF_GENERATED_TOKEN: "test-key-123", SHEET_ID: "sheet-xyz" };
  appendedRows = [];
  lastSheetId = null;
  lastSheetName = null;

  var payload = {
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "2026-01-01",
      csCategory: "Sales (\u8ca9\u58f2)",
      customerName: "Test",
      gender: "Male",
      birthday: "1990-01-01",
      mobileNumber: "+971501234567",
      email: "",
      address: "Test Address",
      ref: "",
      paymentMethod: "Cash",
      country: "UAE",
      totalPurchase: 100,
      grandTotal: 110,
    },
  };
  var result = callDoPost(payload);
  assertEqual(result.status, "success", "success with default sheet name");
  assertEqual(lastSheetName, "Sheet1", "default sheet name is Sheet1");
})();

// ===========================
// Test: SERVER_ERROR
// ===========================
console.log("\n--- SERVER_ERROR ---");
(function () {
  scriptProperties = { SELF_GENERATED_TOKEN: "test-key-123", SHEET_ID: "sheet-abc", SHEET_NAME: "TestSheet" };
  appendedRows = [];

  // Make appendRow throw
  installSpreadsheetMock_({
    hasHeader: true,
    appendError: new Error("Spreadsheet write failed"),
  });

  var payload = {
    selfGeneratedToken: "test-key-123",
    data: {
      visitDate: "2026-01-01",
      csCategory: "Sales (\u8ca9\u58f2)",
      customerName: "Test",
      gender: "Male",
      birthday: "1990-01-01",
      mobileNumber: "+971501234567",
      email: "",
      address: "Test Address",
      ref: "",
      paymentMethod: "Cash",
      country: "UAE",
      totalPurchase: 100,
      grandTotal: 110,
    },
  };
  var result = callDoPost(payload);
  assertEqual(result.status, "error", "server error status");
  assertEqual(result.code, "SERVER_ERROR", "server error code");
  assert(result.message.indexOf("Spreadsheet write failed") >= 0, "server error preserves message");

  // Restore mock
  installSpreadsheetMock_({ hasHeader: true });
})();

// ===========================
// Test: Helper functions directly
// ===========================
console.log("\n--- HELPER FUNCTIONS ---");
(function () {
  // calculateAge
  assertEqual(calculateAge_("1990-05-15", "2026-01-15"), 35, "calculateAge before birthday in year");
  assertEqual(calculateAge_("1990-05-15", "2026-05-15"), 36, "calculateAge on birthday");
  assertEqual(calculateAge_("1990-05-15", "2026-06-01"), 36, "calculateAge after birthday");
  assertEqual(calculateAge_("", "2026-01-01"), null, "calculateAge with empty birthday");
  assertEqual(calculateAge_("1990-05-15", ""), null, "calculateAge with empty visitDate");

  // deriveBirthMonth
  assertEqual(deriveBirthMonth_("1990-05-15"), 5, "deriveBirthMonth May");
  assertEqual(deriveBirthMonth_("2000-12-25"), 12, "deriveBirthMonth December");
  assertEqual(deriveBirthMonth_(""), null, "deriveBirthMonth empty");

  // normalizeCountryKey
  assertEqual(normalizeCountryKey_("UAE"), "UNITED ARAB EMIRATES", "normalizeCountryKey UAE alias");
  assertEqual(normalizeCountryKey_("uk"), "UNITED KINGDOM", "normalizeCountryKey uk lowercase");
  assertEqual(normalizeCountryKey_("India"), "INDIA", "normalizeCountryKey India");
  assertEqual(normalizeCountryKey_(""), "", "normalizeCountryKey empty");

  // resolveCountryMetadata
  var meta = resolveCountryMetadata_("Japan");
  assertEqual(meta.countryJP, "\u65e5\u672c", "resolveCountryMetadata Japan countryJP");
  assertEqual(meta.continent, "Asia", "resolveCountryMetadata Japan continent");
  assertEqual(meta.matched, true, "resolveCountryMetadata Japan matched");

  var unknown = resolveCountryMetadata_("Narnia");
  assertEqual(unknown.matched, false, "resolveCountryMetadata unknown not matched");
  assertEqual(unknown.countryJP, "N/A", "resolveCountryMetadata unknown countryJP");

  // drive helpers
  assertEqual(
    extractDriveFolderId_("https://drive.google.com/drive/folders/folder-abc"),
    "folder-abc",
    "extractDriveFolderId extracts from folder URL",
  );
  assertEqual(
    extractDriveFolderId_("https://drive.google.com/open?id=folder-abc"),
    "folder-abc",
    "extractDriveFolderId extracts from query id",
  );
  assertEqual(extractDriveFolderId_("folder-abc"), "folder-abc", "extractDriveFolderId accepts raw ID");
})();

// ===========================
// Test: validatePayload
// ===========================
console.log("\n--- VALIDATE PAYLOAD ---");
(function () {
  var valid = validatePayload_({
    visitDate: "2026-01-15",
    csCategory: "Sales (\u8ca9\u58f2)",
    customerName: "John",
    gender: "Male",
    birthday: "1990-05-15",
    mobileNumber: "+971501234567",
    address: "Dubai",
    paymentMethod: "Cash",
    country: "UAE",
  });
  assertEqual(valid.length, 0, "no errors for valid payload");

  var errors = validatePayload_({
    visitDate: "",
    csCategory: "",
    customerName: "",
    gender: "",
    birthday: "",
    mobileNumber: "",
    address: "",
    paymentMethod: "",
    country: "",
  });
  assert(errors.length >= 9, "all required fields missing yields >= 9 errors");

  var dateErrors = validatePayload_({
    visitDate: "not-a-date",
    csCategory: "Sales (\u8ca9\u58f2)",
    customerName: "John",
    gender: "Male",
    birthday: "also-not-a-date",
    mobileNumber: "+971501234567",
    address: "Dubai",
    paymentMethod: "Cash",
    country: "UAE",
  });
  var hasVisitDateError = dateErrors.some(function (e) { return e.field === "visitDate"; });
  var hasBirthdayError = dateErrors.some(function (e) { return e.field === "birthday"; });
  assert(hasVisitDateError, "invalid visitDate format detected");
  assert(hasBirthdayError, "invalid birthday format detected");

  var urlErrors = validatePayload_({
    visitDate: "2026-01-15",
    csCategory: "Sales (\u8ca9\u58f2)",
    customerName: "John",
    gender: "Male",
    birthday: "1990-05-15",
    mobileNumber: "+971501234567",
    address: "Dubai",
    paymentMethod: "Cash",
    country: "UAE",
    certificatePhotoUrl: "invalid-url",
  });
  var hasPhotoUrlError = urlErrors.some(function (e) { return e.field === "certificatePhotoUrl"; });
  assert(hasPhotoUrlError, "invalid certificatePhotoUrl format detected");
})();

// ===========================
// Summary
// ===========================
console.log("\n===========================");
console.log("Total: " + total + " | Passed: " + passed + " | Failed: " + failed);
console.log("===========================");

if (failed > 0) {
  process.exit(1);
}
