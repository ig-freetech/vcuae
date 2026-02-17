"use strict";

var assert = require("assert");
var LedgerCore = require("../shared/ledger-core");
var fixtures = require("./fixtures");

// -------------------------------------------------------
// Minimal test runner (no external dependencies)
// -------------------------------------------------------
var results = { passed: 0, failed: 0, errors: [] };

function test(name, fn) {
  try {
    fn();
    results.passed++;
  } catch (e) {
    results.failed++;
    results.errors.push({ name: name, message: e.message });
  }
}

// =======================================================
// 2.1 Date normalisation, age calculation, birth month
// =======================================================

test("normalizeDateInput: YYYY-MM-DD passes through", function () {
  var input = { visitDate: "2026-01-15", csCategory: "", customerName: "", gender: "", birthday: "", mobileNumber: "", email: "", address: "", ref: "", paymentMethod: "", country: "", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.visitDate, "2026-01-15");
});

test("normalizeDateInput: DD/MM/YYYY converts to ISO", function () {
  var input = { visitDate: "", csCategory: "", customerName: "", gender: "", birthday: "15/05/1990", mobileNumber: "", email: "", address: "", ref: "", paymentMethod: "", country: "", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.birthday, "1990-05-15");
});

test("normalizeDateInput: DD-MM-YYYY converts to ISO", function () {
  var input = { visitDate: "", csCategory: "", customerName: "", gender: "", birthday: "15-05-1990", mobileNumber: "", email: "", address: "", ref: "", paymentMethod: "", country: "", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.birthday, "1990-05-15");
});

test("normalizeDateInput: invalid date returns empty string", function () {
  var input = { visitDate: "", csCategory: "", customerName: "", gender: "", birthday: "not-a-date", mobileNumber: "", email: "", address: "", ref: "", paymentMethod: "", country: "", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.birthday, "");
});

test("normalizeDateInput: invalid ISO date (Feb 30) returns empty string", function () {
  var input = { visitDate: "", csCategory: "", customerName: "", gender: "", birthday: "1990-02-30", mobileNumber: "", email: "", address: "", ref: "", paymentMethod: "", country: "", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.birthday, "");
});

test("isValidIsoDate: valid date returns true", function () {
  assert.strictEqual(LedgerCore.isValidIsoDate("2026-01-15"), true);
});

test("isValidIsoDate: Feb 29 leap year returns true", function () {
  assert.strictEqual(LedgerCore.isValidIsoDate("2024-02-29"), true);
});

test("isValidIsoDate: Feb 29 non-leap year returns false", function () {
  assert.strictEqual(LedgerCore.isValidIsoDate("2025-02-29"), false);
});

test("isValidIsoDate: month 13 returns false", function () {
  assert.strictEqual(LedgerCore.isValidIsoDate("2026-13-01"), false);
});

// --- calculateAge via deriveFields ---

test("calculateAge: birthday before visit date (had birthday this year)", function () {
  // birthday: 1990-05-15, visitDate: 2026-06-01 => age 36
  var record = { birthday: "1990-05-15", visitDate: "2026-06-01", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.age, 36);
});

test("calculateAge: birthday after visit date (not yet had birthday)", function () {
  // birthday: 1990-05-15, visitDate: 2026-03-01 => age 35
  var record = { birthday: "1990-05-15", visitDate: "2026-03-01", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.age, 35);
});

test("calculateAge: birthday same day as visit date", function () {
  // birthday: 1990-05-15, visitDate: 2026-05-15 => age 36
  var record = { birthday: "1990-05-15", visitDate: "2026-05-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.age, 36);
});

test("calculateAge: missing birthday returns empty string", function () {
  var record = { birthday: "", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.age, "");
});

// --- deriveBirthMonth via deriveFields ---

test("deriveBirthMonth: valid birthday returns month number", function () {
  var record = { birthday: "1990-05-15", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.birthMonth, 5);
});

test("deriveBirthMonth: January birthday returns 1", function () {
  var record = { birthday: "1985-01-20", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.birthMonth, 1);
});

test("deriveBirthMonth: December birthday returns 12", function () {
  var record = { birthday: "1985-12-25", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.birthMonth, 12);
});

test("deriveBirthMonth: invalid birthday returns empty string", function () {
  var record = { birthday: "", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.birthMonth, "");
});

// =======================================================
// 2.2 Country metadata mapping
// =======================================================

test("resolveCountry: exact match (INDIA)", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "India" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryJP, "インド");
  assert.strictEqual(derived.continent, "Asia");
  assert.strictEqual(derived.subregion, "Southern Asia");
  assert.strictEqual(derived.countryMatched, true);
});

test("resolveCountry: alias UAE", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "UAE" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryJP, "アラブ首長国連邦");
  assert.strictEqual(derived.continent, "Asia");
  assert.strictEqual(derived.subregion, "Western Asia");
  assert.strictEqual(derived.countryMatched, true);
});

test("resolveCountry: alias UK", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "UK" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryJP, "イギリス");
  assert.strictEqual(derived.countryMatched, true);
});

test("resolveCountry: alias USA", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "USA" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryJP, "アメリカ合衆国");
  assert.strictEqual(derived.countryMatched, true);
});

test("resolveCountry: unknown country returns N/A fallback", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "Atlantis" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryJP, "N/A");
  assert.strictEqual(derived.continent, "N/A");
  assert.strictEqual(derived.subregion, "N/A");
  assert.strictEqual(derived.countryMatched, false);
});

test("resolveCountry: empty string input", function () {
  var record = { birthday: "1990-01-01", visitDate: "2026-01-15", country: "" };
  var derived = LedgerCore.deriveFields(record);
  assert.strictEqual(derived.countryMatched, false);
  assert.strictEqual(derived.countryJP, "N/A");
});

// =======================================================
// 2.3 Input validation
// =======================================================

test("validateInput: all required fields present => valid: true", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validCompletePayload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, true);
  assert.strictEqual(result.errors.length, 0);
});

test("validateInput: missing required field (customerName) => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { customerName: "" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("customerName") !== -1, "customerName should be in errors");
});

test("validateInput: missing visitDate => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { visitDate: "" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("visitDate") !== -1, "visitDate should be in errors");
});

test("validateInput: invalid email => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { email: "not-an-email" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("email") !== -1, "email should be in errors");
});

test("validateInput: short phone number (< 7 digits) => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { mobileNumber: "12345" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("mobileNumber") !== -1, "mobileNumber should be in errors");
});

test("validateInput: invalid csCategory => errors", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validationErrorCases.invalidCategory);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("csCategory") !== -1, "csCategory should be in errors");
});

test("validateInput: invalid gender => errors", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validationErrorCases.invalidGender);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("gender") !== -1, "gender should be in errors");
});

test("validateInput: invalid paymentMethod => errors", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validationErrorCases.invalidPayment);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("paymentMethod") !== -1, "paymentMethod should be in errors");
});

test("validateInput: null totalPurchase => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { totalPurchase: "abc" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("totalPurchase") !== -1, "totalPurchase should be in errors");
});

test("validateInput: null grandTotal => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { grandTotal: "xyz" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("grandTotal") !== -1, "grandTotal should be in errors");
});

test("validateInput: invalid certificatePhotoUrl => errors", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { certificatePhotoUrl: "not-a-url" });
  var normalized = LedgerCore.normalizeInput(payload);
  var result = LedgerCore.validateInput(normalized);
  assert.strictEqual(result.valid, false);
  var fields = result.errors.map(function (e) { return e.field; });
  assert.ok(fields.indexOf("certificatePhotoUrl") !== -1, "certificatePhotoUrl should be in errors");
});

// =======================================================
// 2.4 Integration: normalizeInput + toApiPayload
// =======================================================

test("normalizeInput: parseCurrency removes commas", function () {
  var input = { visitDate: "2026-01-15", csCategory: "Sales", customerName: "Test", gender: "Male", birthday: "1990-01-01", mobileNumber: "+971501234567", email: "t@t.com", address: "Addr", ref: "", paymentMethod: "Cash", country: "India", totalPurchase: "15,000", grandTotal: "16,500" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.totalPurchase, 15000);
  assert.strictEqual(out.grandTotal, 16500);
});

test("normalizeInput: sanitizeText trims and collapses spaces", function () {
  var input = { visitDate: "2026-01-15", csCategory: "Sales", customerName: "  John   Smith  ", gender: "Male", birthday: "1990-01-01", mobileNumber: "+971501234567", email: "  JOHN@EXAMPLE.COM  ", address: "Addr", ref: "", paymentMethod: "Cash", country: "India", totalPurchase: "0", grandTotal: "0" };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.customerName, "John Smith");
  assert.strictEqual(out.email, "john@example.com");
});

test("normalizeInput: null/undefined values become empty strings", function () {
  var input = { visitDate: null, csCategory: undefined, customerName: null, gender: undefined, birthday: null, mobileNumber: null, email: null, address: null, ref: null, paymentMethod: null, country: null, totalPurchase: null, grandTotal: null };
  var out = LedgerCore.normalizeInput(input);
  assert.strictEqual(out.customerName, "");
  assert.strictEqual(out.visitDate, "");
  assert.strictEqual(out.email, "");
  assert.strictEqual(out.totalPurchase, null);
  assert.strictEqual(out.grandTotal, null);
});

test("toApiPayload: returns normalized payload with null currency as empty string", function () {
  var raw = { visitDate: "15/01/2026", csCategory: "Sales", customerName: "  Test User  ", gender: "Male", birthday: "15-05-1990", mobileNumber: "+971501234567", email: "Test@Example.COM", address: "Dubai", ref: "REF-001", paymentMethod: "Cash", country: "India", totalPurchase: "abc", grandTotal: "16,500", certificatePhotoUrl: " https://drive.google.com/file/d/file-1/view " };
  var out = LedgerCore.toApiPayload(raw);
  assert.strictEqual(out.visitDate, "2026-01-15");
  assert.strictEqual(out.birthday, "1990-05-15");
  assert.strictEqual(out.customerName, "Test User");
  assert.strictEqual(out.email, "test@example.com");
  assert.strictEqual(out.totalPurchase, "");
  assert.strictEqual(out.grandTotal, 16500);
  assert.strictEqual(out.certificatePhotoUrl, "https://drive.google.com/file/d/file-1/view");
});

test("toApiPayload: complete valid payload preserves all fields", function () {
  var out = LedgerCore.toApiPayload(fixtures.validCompletePayload);
  assert.strictEqual(out.visitDate, "2026-01-15");
  assert.strictEqual(out.customerName, "John Smith");
  assert.strictEqual(out.gender, "Male");
  assert.strictEqual(out.birthday, "1990-05-15");
  assert.strictEqual(out.mobileNumber, "+971501234567");
  assert.strictEqual(out.email, "john.smith@example.com");
  assert.strictEqual(out.country, "United Arab Emirates");
  assert.strictEqual(out.address, "Dubai Marina, Tower 5, Apt 1201");
  assert.strictEqual(out.ref, "REF-001");
  assert.strictEqual(out.paymentMethod, "Cash");
  assert.strictEqual(out.csCategory, "Sales");
  assert.strictEqual(out.totalPurchase, 15000);
  assert.strictEqual(out.grandTotal, 16500);
  assert.strictEqual(out.certificatePhotoUrl, "https://drive.google.com/file/d/file-1/view");
});

// =======================================================
// 2.5 Row mapping: buildSheetRow
// =======================================================

test("buildSheetRow: returns array of 19 elements matching SHEET_HEADERS", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validCompletePayload);
  var row = LedgerCore.buildSheetRow(normalized);
  assert.strictEqual(row.length, 19);
  assert.strictEqual(row.length, LedgerCore.SHEET_HEADERS.length);
});

test("buildSheetRow: header order matches values", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validCompletePayload);
  var row = LedgerCore.buildSheetRow(normalized);
  // SHEET_HEADERS: VisitDate, CsCategory, CustomerName, Gender, Birthday, Age,
  //   MobileNumber, Email, Address, REF, PaymentMethod,
  //   Country, CountryJP, Continent大陸, Subregion小地域, 誕生月,
  //   総買取額, 総合計, CertificatePhotoUrl
  assert.strictEqual(row[0], "2026-01-15", "VisitDate");
  assert.strictEqual(row[1], "Sales", "CsCategory");
  assert.strictEqual(row[2], "John Smith", "CustomerName");
  assert.strictEqual(row[3], "Male", "Gender");
  assert.strictEqual(row[4], "1990-05-15", "Birthday");
  assert.strictEqual(typeof row[5], "number", "Age should be number");
  assert.strictEqual(row[6], "+971501234567", "MobileNumber");
  assert.strictEqual(row[7], "john.smith@example.com", "Email");
  assert.strictEqual(row[8], "Dubai Marina, Tower 5, Apt 1201", "Address");
  assert.strictEqual(row[9], "REF-001", "REF");
  assert.strictEqual(row[10], "Cash", "PaymentMethod");
});

test("buildSheetRow: derived fields are in correct positions", function () {
  var normalized = LedgerCore.normalizeInput(fixtures.validCompletePayload);
  var row = LedgerCore.buildSheetRow(normalized);
  // Country (index 11) = resolved country name
  assert.strictEqual(row[11], "United Arab Emirates", "Country");
  // CountryJP (index 12)
  assert.strictEqual(row[12], "アラブ首長国連邦", "CountryJP");
  // Continent (index 13)
  assert.strictEqual(row[13], "Asia", "Continent");
  // Subregion (index 14)
  assert.strictEqual(row[14], "Western Asia", "Subregion");
  // BirthMonth (index 15)
  assert.strictEqual(row[15], 5, "BirthMonth");
  // totalPurchase (index 16)
  assert.strictEqual(row[16], 15000, "TotalPurchase");
  // grandTotal (index 17)
  assert.strictEqual(row[17], 16500, "GrandTotal");
  // certificatePhotoUrl (index 18)
  assert.strictEqual(row[18], "https://drive.google.com/file/d/file-1/view", "CertificatePhotoUrl");
});

test("buildSheetRow: optional fields (email, ref) can be empty", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { email: "", ref: "" });
  var normalized = LedgerCore.normalizeInput(payload);
  var row = LedgerCore.buildSheetRow(normalized);
  assert.strictEqual(row[7], "", "Email should be empty");
  assert.strictEqual(row[9], "", "REF should be empty");
  assert.strictEqual(row.length, 19, "Still 19 elements");
});

test("buildSheetRow: age calculation for UAE country alias", function () {
  var payload = Object.assign({}, fixtures.validCompletePayload, { country: "UAE" });
  var normalized = LedgerCore.normalizeInput(payload);
  var row = LedgerCore.buildSheetRow(normalized);
  assert.strictEqual(row[11], "United Arab Emirates", "Country resolved from alias");
  assert.strictEqual(row[12], "アラブ首長国連邦", "CountryJP resolved");
});

// =======================================================
// 2.6 Constants export checks
// =======================================================

test("SHEET_HEADERS has 19 entries", function () {
  assert.strictEqual(LedgerCore.SHEET_HEADERS.length, 19);
});

test("CATEGORY_OPTIONS contains known values", function () {
  assert.ok(LedgerCore.CATEGORY_OPTIONS.indexOf("Sales") !== -1);
  assert.ok(LedgerCore.CATEGORY_OPTIONS.indexOf("buy") !== -1);
});

test("GENDER_OPTIONS contains Male, Female, Other", function () {
  assert.deepStrictEqual(LedgerCore.GENDER_OPTIONS, ["Male", "Female", "Other"]);
});

test("PAYMENT_OPTIONS contains Cash and Card", function () {
  assert.ok(LedgerCore.PAYMENT_OPTIONS.indexOf("Cash") !== -1);
  assert.ok(LedgerCore.PAYMENT_OPTIONS.indexOf("Card") !== -1);
});

test("COUNTRY_OPTIONS is sorted", function () {
  var sorted = LedgerCore.COUNTRY_OPTIONS.slice().sort();
  assert.deepStrictEqual(LedgerCore.COUNTRY_OPTIONS, sorted);
});

test("COUNTRY_METADATA has United Arab Emirates", function () {
  assert.ok(LedgerCore.COUNTRY_METADATA["UNITED ARAB EMIRATES"]);
  assert.strictEqual(LedgerCore.COUNTRY_METADATA["UNITED ARAB EMIRATES"].countryJP, "アラブ首長国連邦");
});

// =======================================================
// Results
// =======================================================

console.log("\n-------------------------------------------");
if (results.failed === 0) {
  console.log("All " + results.passed + " tests passed");
} else {
  console.log(
    results.passed + " passed, " + results.failed + " failed\n"
  );
  results.errors.forEach(function (err) {
    console.log("  FAIL: " + err.name);
    console.log("        " + err.message);
  });
}
console.log("-------------------------------------------\n");

process.exit(results.failed > 0 ? 1 : 0);
