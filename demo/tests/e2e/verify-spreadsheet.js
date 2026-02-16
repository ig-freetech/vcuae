#!/usr/bin/env node
"use strict";

/**
 * E2E golden test: Spreadsheet verification
 * Reads the last row from Google Sheets and compares against
 * the expected 18-column row built by LedgerCore.buildSheetRow().
 *
 * Prerequisites:
 *   - ~/.clasprc.json with valid OAuth credentials (run: npx clasp login)
 *   - GOOGLE_SHEET_ID in demo/.env
 *   - googleapis npm package installed
 */

var path = require("path");
var fs = require("fs");
var os = require("os");

// Load .env from demo root
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env") });

// LedgerCore for expected-value computation
var LedgerCore = require(path.join(__dirname, "..", "..", "shared", "ledger-core.js"));

// --- Auth via ~/.clasprc.json ---
function getAuthClient() {
  var google = require("googleapis").google;
  var clasprcPath = path.join(os.homedir(), ".clasprc.json");
  if (!fs.existsSync(clasprcPath)) {
    throw new Error(
      "~/.clasprc.json not found. Run: npx clasp login --no-localhost"
    );
  }
  var clasprc = JSON.parse(fs.readFileSync(clasprcPath, "utf8"));
  var oauth2Client = new google.auth.OAuth2(
    clasprc.oauth2ClientSettings.clientId,
    clasprc.oauth2ClientSettings.clientSecret
  );
  oauth2Client.setCredentials(clasprc.token);
  return { auth: oauth2Client, google: google };
}

// --- Read last row ---
async function readLastRow() {
  var ctx = getAuthClient();
  var sheets = ctx.google.sheets({ version: "v4", auth: ctx.auth });
  var spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID not set in .env");
  }

  var res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: "Sheet1!A:R",
  });

  var rows = res.data.values;
  if (!rows || rows.length < 2) {
    throw new Error("No data rows found in spreadsheet");
  }

  return rows[rows.length - 1]; // last row
}

// --- Build expected row from golden test input ---
function buildExpectedRow() {
  // Values matching golden-e2e.sh form input
  var rawInput = {
    customerName: "John Smith",
    gender: "Male",
    birthday: "1990-05-15",
    mobileNumber: "+971501234567",
    email: "john.smith@example.com",
    country: "United Arab Emirates",
    address: "Dubai Marina, Tower 5, Apt 1201",
    csCategory: "Sales (\u8CA9\u58F2)",
    visitDate: "2026-01-15",
    ref: "REF-001",
    paymentMethod: "Cash",
    totalPurchase: "15000",
    grandTotal: "16500",
  };

  var normalized = LedgerCore.normalizeInput(rawInput);
  return LedgerCore.buildSheetRow(normalized);
}

// --- Compare ---
async function main() {
  console.log("Reading last row from spreadsheet...");
  var actualRow = await readLastRow();
  var expectedRow = buildExpectedRow();

  console.log("Expected:", expectedRow);
  console.log("Actual:  ", actualRow);

  var allMatch = true;
  var headers = [
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
    "Continent\u5927\u9678",
    "Subregion\u5C0F\u5730\u57DF",
    "\u8A95\u751F\u6708",
    "\u7DCF\u8CB7\u53D6\u984D",
    "\u7DCF\u5408\u8A08",
  ];

  for (var i = 0; i < expectedRow.length; i++) {
    var exp = String(expectedRow[i]);
    var act = String(actualRow[i] || "");
    if (exp !== act) {
      // MobileNumber: tolerate leading + prefix variation
      if (
        headers[i] === "MobileNumber" &&
        act.replace(/^\+/, "") === exp.replace(/^\+/, "")
      ) {
        console.log(
          "  ~ " +
            headers[i] +
            ": " +
            act +
            " \u2248 " +
            exp +
            " (phone format tolerance)"
        );
        continue;
      }
      console.log(
        "  \u2717 " +
          headers[i] +
          ': expected "' +
          exp +
          '", got "' +
          act +
          '"'
      );
      allMatch = false;
    } else {
      console.log("  \u2713 " + headers[i] + ": " + act);
    }
  }

  if (allMatch) {
    console.log("\n\u2713 All 18 columns match!");
    process.exit(0);
  } else {
    console.log("\n\u2717 Column mismatch detected");
    process.exit(1);
  }
}

main().catch(function (err) {
  console.error("Error:", err.message);
  process.exit(1);
});
