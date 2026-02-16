(function () {
  "use strict";

  // --- DOM refs ---
  var endpoint = document.getElementById("endpoint");
  var selfGeneratedTokenInput = document.getElementById("self-generated-token");
  var saveSettings = document.getElementById("save-settings");

  var stepCustomer = document.getElementById("step-customer");
  var stepStaff = document.getElementById("step-staff");
  var paneCustomer = document.getElementById("pane-customer");
  var paneStaff = document.getElementById("pane-staff");

  var ledgerForm = document.getElementById("ledger-form");
  var nextBtn = document.getElementById("next-btn");
  var backBtn = document.getElementById("back-btn");
  var submitBtn = document.getElementById("submit-btn");
  var status = document.getElementById("status");

  var genderSelect = document.getElementById("gender");
  var csCategorySelect = document.getElementById("cs-category");
  var paymentMethodSelect = document.getElementById("payment-method");
  var countryList = document.getElementById("country-list");

  var derivedAge = document.getElementById("derived-age");
  var derivedMonth = document.getElementById("derived-month");
  var derivedCountryJP = document.getElementById("derived-country-jp");
  var derivedContinent = document.getElementById("derived-continent");
  var derivedSubregion = document.getElementById("derived-subregion");

  var birthdayInput = ledgerForm.elements.birthday;
  var countryInput = document.getElementById("country");
  var visitDateInput = ledgerForm.elements.visitDate;

  // --- Settings Step DOM refs ---
  var settingsStep1 = document.getElementById("settings-step-1");
  var settingsStep2 = document.getElementById("settings-step-2");
  var settingsStep3 = document.getElementById("settings-step-3");
  var testConnectionBtn = document.getElementById("test-connection");
  var connectionStatus = document.getElementById("connection-status");
  var spreadsheetUrl = document.getElementById("spreadsheet-url");
  var sheetNameSelect = document.getElementById("sheet-name");
  var loadSheetsBtn = document.getElementById("load-sheets");
  var applySpreadsheetBtn = document.getElementById("apply-spreadsheet");
  var spreadsheetStatus = document.getElementById("spreadsheet-status");
  var columnMapping = document.getElementById("column-mapping");
  var headerMismatchWarning = document.getElementById("header-mismatch-warning");
  var headerDiff = document.getElementById("header-diff");

  // --- Setup Guide DOM refs ---
  var copyCodeGsBtn = document.getElementById("copy-code-gs");
  var copyCodeGsStatus = document.getElementById("copy-code-gs-status");
  var generateTokenBtn = document.getElementById("generate-token");
  var generateTokenStatus = document.getElementById("generate-token-status");

  // --- View navigation refs ---
  var mainView = document.getElementById("main-view");
  var settingsView = document.getElementById("settings-view");
  var backToMain = document.getElementById("back-to-main");
  var backToMainBottom = document.getElementById("back-to-main-bottom");
  var configBanner = document.getElementById("config-banner");

  // --- Helpers ---
  function populateSelect(selectEl, options, placeholder) {
    var frag = document.createDocumentFragment();
    if (placeholder) {
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = placeholder;
      opt.disabled = true;
      opt.selected = true;
      frag.appendChild(opt);
    }
    for (var i = 0; i < options.length; i++) {
      var o = document.createElement("option");
      o.value = options[i];
      o.textContent = options[i];
      frag.appendChild(o);
    }
    selectEl.appendChild(frag);
  }

  function populateDatalist(datalistEl, options) {
    var frag = document.createDocumentFragment();
    for (var i = 0; i < options.length; i++) {
      var o = document.createElement("option");
      o.value = options[i];
      frag.appendChild(o);
    }
    datalistEl.appendChild(frag);
  }

  function todayISO() {
    var d = new Date();
    var yyyy = d.getFullYear();
    var mm = String(d.getMonth() + 1).padStart(2, "0");
    var dd = String(d.getDate()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd;
  }

  function showStatus(msg, cls) {
    status.textContent = msg;
    status.className = "status " + (cls || "");
  }

  function clearStatus() {
    status.textContent = "";
    status.className = "status";
  }

  function extractSpreadsheetId(url) {
    var match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function colIndexToLetter(i) {
    return String.fromCharCode(65 + i);
  }

  // --- Setup Guide Helpers ---
  var CODE_GS_RAW_URL = "https://raw.githubusercontent.com/ig-freetech/vcuae/main/demo/apps-script/Code.gs";

  function showGuideStatus(el, msg, cls) {
    el.textContent = msg;
    el.className = "guide-status " + (cls || "");
    if (cls === "ok") {
      setTimeout(function () { el.textContent = ""; el.className = "guide-status"; }, 5000);
    }
  }

  function generateSecureToken(length) {
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    var values = new Uint8Array(length);
    crypto.getRandomValues(values);
    var result = "";
    for (var i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    return result;
  }

  if (copyCodeGsBtn) {
    copyCodeGsBtn.addEventListener("click", function () {
      copyCodeGsBtn.disabled = true;
      showGuideStatus(copyCodeGsStatus, "取得中...", "");
      fetch(CODE_GS_RAW_URL)
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.text();
        })
        .then(function (code) {
          return navigator.clipboard.writeText(code);
        })
        .then(function () {
          showGuideStatus(copyCodeGsStatus, "コピーしました", "ok");
        })
        .catch(function () {
          showGuideStatus(copyCodeGsStatus, "コピー失敗 — GitHubから直接コピーしてください", "err");
        })
        .finally(function () {
          copyCodeGsBtn.disabled = false;
        });
    });
  }

  if (generateTokenBtn) {
    generateTokenBtn.addEventListener("click", function () {
      var token = generateSecureToken(48);
      navigator.clipboard.writeText(token)
        .then(function () {
          showGuideStatus(generateTokenStatus, "コピーしました: " + token.substring(0, 8) + "...", "ok");
        })
        .catch(function () {
          showGuideStatus(generateTokenStatus, "自動コピー失敗。手動でコピー: " + token, "err");
        });
    });
  }

  // --- Progressive Disclosure ---
  function revealStep2() {
    settingsStep2.classList.remove("hidden");
  }

  function revealStep3() {
    settingsStep3.classList.remove("hidden");
  }

  // --- View Navigation ---
  function showView(viewName) {
    if (viewName === "settings") {
      mainView.classList.remove("active");
      settingsView.classList.add("active");
    } else {
      settingsView.classList.remove("active");
      mainView.classList.add("active");
      updateConfigBanner();
    }
  }

  function updateConfigBanner() {
    var isConfigured = localStorage.getItem("ledger_connectionVerified") === "true";
    if (isConfigured) {
      configBanner.classList.add("hidden");
    } else {
      configBanner.classList.remove("hidden");
    }
  }

  // --- Header Validation ---
  function showColumnMapping(headers) {
    var expectedHeaders = LedgerCore.SHEET_HEADERS;
    columnMapping.innerHTML = "";

    var table = document.createElement("table");
    table.className = "mapping-table";
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var cols = ["Column", "Expected", "Actual", "Status"];
    for (var c = 0; c < cols.length; c++) {
      var th = document.createElement("th");
      th.textContent = cols[c];
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement("tbody");
    var maxLen = Math.max(expectedHeaders.length, headers.length);
    var hasMismatch = false;
    var diffLines = [];

    for (var i = 0; i < maxLen; i++) {
      var tr = document.createElement("tr");
      var tdCol = document.createElement("td");
      tdCol.textContent = colIndexToLetter(i);
      tr.appendChild(tdCol);

      var tdExpected = document.createElement("td");
      tdExpected.textContent = i < expectedHeaders.length ? expectedHeaders[i] : "(none)";
      tr.appendChild(tdExpected);

      var tdActual = document.createElement("td");
      tdActual.textContent = i < headers.length ? headers[i] : "(none)";
      tr.appendChild(tdActual);

      var tdStatus = document.createElement("td");
      var expected = i < expectedHeaders.length ? expectedHeaders[i] : "";
      var actual = i < headers.length ? headers[i] : "";
      if (expected === actual) {
        tdStatus.textContent = "\u2713";
        tdStatus.className = "match-ok";
      } else {
        tdStatus.textContent = "\u26A0";
        tdStatus.className = "match-warn";
        hasMismatch = true;
        diffLines.push(colIndexToLetter(i) + ": Expected \"" + expected + "\", Actual \"" + actual + "\"");
      }
      tr.appendChild(tdStatus);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    columnMapping.appendChild(table);

    if (hasMismatch) {
      headerMismatchWarning.classList.remove("hidden");
      headerDiff.textContent = diffLines.join("\n");
    } else {
      headerMismatchWarning.classList.add("hidden");
      headerDiff.textContent = "";
    }
  }

  function getHeaders(ep, token, sheetName) {
    var url =
      ep +
      "?action=getHeaders&selfGeneratedToken=" +
      encodeURIComponent(token);
    if (sheetName) {
      url += "&sheetName=" + encodeURIComponent(sheetName);
    }
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === "success" && data.headers) {
          showColumnMapping(data.headers);
        } else {
          spreadsheetStatus.textContent = data.message || "Failed to retrieve headers";
          spreadsheetStatus.className = "status err";
        }
      })
      .catch(function (err) {
        spreadsheetStatus.textContent = "Connection error: " + err.message;
        spreadsheetStatus.className = "status err";
      });
  }

  // --- Populate selects & datalist ---
  populateSelect(genderSelect, LedgerCore.GENDER_OPTIONS, "-- Gender --");
  populateSelect(
    csCategorySelect,
    LedgerCore.CATEGORY_OPTIONS,
    "-- Category --"
  );
  populateSelect(
    paymentMethodSelect,
    LedgerCore.PAYMENT_OPTIONS,
    "-- Payment --"
  );
  populateDatalist(countryList, LedgerCore.COUNTRY_OPTIONS);

  // --- Restore settings ---
  var savedEndpoint = localStorage.getItem("ledger_endpoint");
  var savedSelfGeneratedToken =
    localStorage.getItem("ledger_selfGeneratedToken") ||
    localStorage.getItem("ledger_apiKey");
  if (savedEndpoint) endpoint.value = savedEndpoint;
  if (savedSelfGeneratedToken) selfGeneratedTokenInput.value = savedSelfGeneratedToken;

  // --- Restore spreadsheet settings ---
  var savedSpreadsheetUrl = localStorage.getItem("ledger_spreadsheetUrl");
  var savedSpreadsheetId = localStorage.getItem("ledger_spreadsheetId");
  var savedSheetName = localStorage.getItem("ledger_sheetName");
  var savedConnectionVerified = localStorage.getItem("ledger_connectionVerified");

  if (savedSpreadsheetUrl) {
    spreadsheetUrl.value = savedSpreadsheetUrl;
  }
  if (savedConnectionVerified === "true" && savedEndpoint && savedSelfGeneratedToken) {
    revealStep2();
    if (savedSheetName) {
      // Create a single option with saved sheet name
      var opt = document.createElement("option");
      opt.value = savedSheetName;
      opt.textContent = savedSheetName;
      opt.selected = true;
      sheetNameSelect.appendChild(opt);
      sheetNameSelect.disabled = false;
    }
    if (savedSpreadsheetId && savedSheetName) {
      revealStep3();
      getHeaders(savedEndpoint, savedSelfGeneratedToken, savedSheetName);
    }
  }

  // --- Initialize view ---
  (function initView() {
    showView("main");
  })();

  // --- Default visit date ---
  if (!visitDateInput.value) {
    visitDateInput.value = todayISO();
  }

  // --- Save settings ---
  saveSettings.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    if (!ep || !token) {
      showStatus("Please enter both URL and Self-Generated Token", "err");
      return;
    }
    localStorage.setItem("ledger_endpoint", ep);
    localStorage.setItem("ledger_selfGeneratedToken", token);
    localStorage.removeItem("ledger_apiKey");
    showStatus("Settings saved", "ok");
    setTimeout(clearStatus, 3000);
  });

  // --- Connection Test (Step 1 → Step 2) ---
  testConnectionBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    if (!ep || !token) {
      connectionStatus.textContent = "Please enter both URL and Self-Generated Token";
      connectionStatus.className = "status err";
      return;
    }

    connectionStatus.textContent = "Testing connection...";
    connectionStatus.className = "status";
    testConnectionBtn.disabled = true;

    fetch(
      ep +
        "?action=health&selfGeneratedToken=" +
        encodeURIComponent(token)
    )
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === "success" || data.status === "ok") {
          connectionStatus.textContent = "Connection successful: " + (data.message || "Service is running");
          connectionStatus.className = "status ok";
          // Save connection settings automatically
          localStorage.setItem("ledger_endpoint", ep);
          localStorage.setItem("ledger_selfGeneratedToken", token);
          localStorage.removeItem("ledger_apiKey");
          localStorage.setItem("ledger_connectionVerified", "true");
          updateConfigBanner();
          revealStep2();
        } else {
          connectionStatus.textContent = "Connection error: " + (data.message || "Unknown error");
          connectionStatus.className = "status err";
        }
      })
      .catch(function (err) {
        connectionStatus.textContent = "Connection error: " + err.message;
        connectionStatus.className = "status err";
      })
      .finally(function () {
        testConnectionBtn.disabled = false;
      });
  });

  // --- Load Sheets (Step 2) ---
  loadSheetsBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    var ssUrl = spreadsheetUrl.value.trim();
    var ssId = extractSpreadsheetId(ssUrl);

    if (!ssId) {
      spreadsheetStatus.textContent = "Please enter a valid spreadsheet URL";
      spreadsheetStatus.className = "status err";
      return;
    }

    spreadsheetStatus.textContent = "Loading sheets...";
    spreadsheetStatus.className = "status";
    loadSheetsBtn.disabled = true;

    fetch(
      ep +
        "?action=listSheets&selfGeneratedToken=" +
        encodeURIComponent(token) +
        "&spreadsheetId=" +
        encodeURIComponent(ssId)
    )
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === "success" && data.sheets) {
          // Clear existing options
          sheetNameSelect.innerHTML = "";
          var placeholder = document.createElement("option");
          placeholder.value = "";
          placeholder.textContent = "-- Select a sheet --";
          placeholder.disabled = true;
          placeholder.selected = true;
          sheetNameSelect.appendChild(placeholder);

          for (var i = 0; i < data.sheets.length; i++) {
            var opt = document.createElement("option");
            opt.value = data.sheets[i];
            opt.textContent = data.sheets[i];
            sheetNameSelect.appendChild(opt);
          }
          sheetNameSelect.disabled = false;
          spreadsheetStatus.textContent = data.sheets.length + " sheet(s) retrieved";
          spreadsheetStatus.className = "status ok";
        } else {
          spreadsheetStatus.textContent = data.message || "Failed to retrieve sheet list";
          spreadsheetStatus.className = "status err";
        }
      })
      .catch(function (err) {
        spreadsheetStatus.textContent = "Connection error: " + err.message;
        spreadsheetStatus.className = "status err";
      })
      .finally(function () {
        loadSheetsBtn.disabled = false;
      });
  });

  // --- Apply Spreadsheet (Step 2 → Step 3) ---
  applySpreadsheetBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    var ssUrl = spreadsheetUrl.value.trim();
    var ssId = extractSpreadsheetId(ssUrl);
    var selectedSheet = sheetNameSelect.value;

    if (!ssId) {
      spreadsheetStatus.textContent = "Please enter a valid spreadsheet URL";
      spreadsheetStatus.className = "status err";
      return;
    }
    if (!selectedSheet) {
      spreadsheetStatus.textContent = "Please select a sheet";
      spreadsheetStatus.className = "status err";
      return;
    }

    spreadsheetStatus.textContent = "Configuring spreadsheet...";
    spreadsheetStatus.className = "status";
    applySpreadsheetBtn.disabled = true;

    fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfGeneratedToken: token,
        action: "configure",
        config: {
          spreadsheetId: ssId,
          sheetName: selectedSheet
        }
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === "success") {
          // Save to localStorage
          localStorage.setItem("ledger_spreadsheetUrl", ssUrl);
          localStorage.setItem("ledger_spreadsheetId", ssId);
          localStorage.setItem("ledger_sheetName", selectedSheet);
          localStorage.setItem("ledger_connectionVerified", "true");

          spreadsheetStatus.textContent = "Spreadsheet configured";
          spreadsheetStatus.className = "status ok";

          revealStep3();
          getHeaders(ep, token, selectedSheet);
        } else {
          spreadsheetStatus.textContent = data.message || "Configuration failed";
          spreadsheetStatus.className = "status err";
        }
      })
      .catch(function (err) {
        spreadsheetStatus.textContent = "Connection error: " + err.message;
        spreadsheetStatus.className = "status err";
      })
      .finally(function () {
        applySpreadsheetBtn.disabled = false;
      });
  });

  // --- Step navigation ---
  function showPane(target) {
    if (target === "staff") {
      paneCustomer.classList.remove("active");
      paneStaff.classList.add("active");
      stepCustomer.classList.remove("active");
      stepStaff.classList.add("active");
      stepStaff.disabled = false;
    } else {
      paneStaff.classList.remove("active");
      paneCustomer.classList.add("active");
      stepStaff.classList.remove("active");
      stepCustomer.classList.add("active");
      stepStaff.disabled = true;
    }
  }

  nextBtn.addEventListener("click", function () {
    // Client-side validation of customer pane required fields
    var inputs = paneCustomer.querySelectorAll("[required]");
    var allValid = true;
    for (var i = 0; i < inputs.length; i++) {
      if (!inputs[i].checkValidity()) {
        inputs[i].reportValidity();
        allValid = false;
        break;
      }
    }
    if (allValid) {
      showPane("staff");
    }
  });

  backBtn.addEventListener("click", function () {
    showPane("customer");
  });

  stepCustomer.addEventListener("click", function () {
    showPane("customer");
  });

  stepStaff.addEventListener("click", function () {
    if (!stepStaff.disabled) {
      showPane("staff");
    }
  });

  // --- Derived fields preview (real-time) ---
  function updateDerived() {
    var birthday = birthdayInput.value;
    var country = countryInput.value;
    var visitDate = visitDateInput.value || todayISO();

    if (!birthday && !country) {
      derivedAge.textContent = "-";
      derivedMonth.textContent = "-";
      derivedCountryJP.textContent = "-";
      derivedContinent.textContent = "-";
      derivedSubregion.textContent = "-";
      return;
    }

    var derived = LedgerCore.deriveFields({
      birthday: birthday,
      country: country,
      visitDate: visitDate,
    });

    derivedAge.textContent = derived.age !== "" ? derived.age : "-";
    derivedMonth.textContent = derived.birthMonth !== "" ? derived.birthMonth : "-";
    derivedCountryJP.textContent = derived.countryJP || "-";
    derivedContinent.textContent = derived.continent || "-";
    derivedSubregion.textContent = derived.subregion || "-";
  }

  birthdayInput.addEventListener("input", updateDerived);
  birthdayInput.addEventListener("change", updateDerived);
  countryInput.addEventListener("input", updateDerived);
  countryInput.addEventListener("change", updateDerived);
  visitDateInput.addEventListener("input", updateDerived);
  visitDateInput.addEventListener("change", updateDerived);

  // --- Hidden admin gesture (tap title 5 times within 3 seconds) ---
  var adminTapCount = 0;
  var adminTapTimer = null;
  document.querySelector(".hero h1").addEventListener("click", function () {
    adminTapCount++;
    if (adminTapCount === 1) {
      adminTapTimer = setTimeout(function () { adminTapCount = 0; }, 3000);
    }
    if (adminTapCount >= 5) {
      clearTimeout(adminTapTimer);
      adminTapCount = 0;
      showView("settings");
    }
  });

  // --- View navigation listeners ---
  backToMain.addEventListener("click", function() { showView("main"); });
  backToMainBottom.addEventListener("click", function() { showView("main"); });

  // --- Form submission ---
  ledgerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    // Collect all fields from FormData
    var fd = new FormData(ledgerForm);
    var rawInput = {};
    fd.forEach(function (value, key) {
      rawInput[key] = value;
    });

    // Normalize and validate via LedgerCore
    var payload = LedgerCore.toApiPayload(rawInput);
    var normalized = LedgerCore.normalizeInput(rawInput);
    var validation = LedgerCore.validateInput(normalized);

    if (!validation.valid) {
      var msgs = validation.errors.map(function (err) {
        return err.message;
      });
      showStatus(msgs.join("\n"), "err");
      return;
    }

    // Check connection settings
    var ep = localStorage.getItem("ledger_endpoint");
    var token =
      localStorage.getItem("ledger_selfGeneratedToken") ||
      localStorage.getItem("ledger_apiKey");
    if (!ep || !token) {
      showStatus("Please configure connection settings first", "err");
      return;
    }

    // Prevent double submission
    submitBtn.disabled = true;

    fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selfGeneratedToken: token, data: payload }),
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            showStatus("Submission successful", "ok");
            ledgerForm.reset();
            // Re-set default visit date after reset
            visitDateInput.value = todayISO();
            // Reset derived fields
            derivedAge.textContent = "-";
            derivedMonth.textContent = "-";
            derivedCountryJP.textContent = "-";
            derivedContinent.textContent = "-";
            derivedSubregion.textContent = "-";
            // Return to customer step
            showPane("customer");
          } else {
            showStatus(
              result.message || "Submission error: " + response.status,
              "err"
            );
          }
        });
      })
      .catch(function (err) {
        showStatus("Connection error: " + err.message, "err");
      })
      .finally(function () {
        submitBtn.disabled = false;
      });
  });

  // --- Service Worker registration ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(function () {
      // SW registration failed silently (e.g. file:// protocol)
    });
  }
})();
