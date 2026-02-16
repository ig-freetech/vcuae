(function () {
  "use strict";

  var SESSION_AUTH_KEY = "ledger_admin_authenticated";
  var SESSION_PASSCODE_KEY = "ledger_admin_passcode";

  // --- Unlock refs ---
  var adminLock = document.getElementById("admin-lock");
  var adminPanel = document.getElementById("admin-panel");
  var unlockEndpoint = document.getElementById("unlock-endpoint");
  var unlockToken = document.getElementById("unlock-token");
  var unlockEndpointField = document.getElementById("unlock-endpoint-field");
  var unlockTokenField = document.getElementById("unlock-token-field");
  var unlockPasscode = document.getElementById("unlock-passcode");
  var unlockHelpInitial = document.getElementById("unlock-help-initial");
  var unlockHelpSaved = document.getElementById("unlock-help-saved");
  var unlockAdminBtn = document.getElementById("unlock-admin");
  var unlockStatus = document.getElementById("unlock-status");
  var lockAdminBtn = document.getElementById("lock-admin");

  // --- Settings refs ---
  var endpoint = document.getElementById("endpoint");
  var selfGeneratedTokenInput = document.getElementById("self-generated-token");
  var saveSettings = document.getElementById("save-settings");

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

  // --- Setup guide refs ---
  var copyCodeGsBtn = document.getElementById("copy-code-gs");
  var copyCodeGsStatus = document.getElementById("copy-code-gs-status");
  var generateTokenBtn = document.getElementById("generate-token");
  var generateTokenStatus = document.getElementById("generate-token-status");

  var CODE_GS_RAW_URL = "https://raw.githubusercontent.com/ig-freetech/vcuae/main/demo/apps-script/Code.gs";

  function setStatus(el, msg, cls) {
    if (!el) {
      return;
    }
    el.textContent = msg || "";
    el.className = "status " + (cls || "");
  }

  function showGuideStatus(el, msg, cls) {
    el.textContent = msg;
    el.className = "guide-status " + (cls || "");
    if (cls === "ok") {
      setTimeout(function () {
        el.textContent = "";
        el.className = "guide-status";
      }, 5000);
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

  function extractSpreadsheetId(url) {
    var match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  }

  function colIndexToLetter(i) {
    return String.fromCharCode(65 + i);
  }

  function revealStep2() {
    settingsStep2.classList.remove("hidden");
  }

  function revealStep3() {
    settingsStep3.classList.remove("hidden");
  }

  function resetSpreadsheetUiState() {
    settingsStep2.classList.add("hidden");
    settingsStep3.classList.add("hidden");
    sheetNameSelect.innerHTML = '<option value="">-- Select a sheet --</option>';
    sheetNameSelect.disabled = true;
    columnMapping.innerHTML = "";
    headerMismatchWarning.classList.add("hidden");
    headerDiff.textContent = "";
    setStatus(connectionStatus, "", "");
    setStatus(spreadsheetStatus, "", "");
  }

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
        diffLines.push(colIndexToLetter(i) + ': Expected "' + expected + '", Actual "' + actual + '"');
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

  function getStoredEndpointAndToken() {
    return {
      endpoint: localStorage.getItem("ledger_endpoint") || "",
      token:
        localStorage.getItem("ledger_selfGeneratedToken") ||
        localStorage.getItem("ledger_apiKey") ||
        "",
    };
  }

  function hasStoredUnlockCredentials() {
    var creds = getStoredEndpointAndToken();
    return Boolean(creds.endpoint && creds.token);
  }

  function persistEndpointAndToken(ep, token) {
    var current = getStoredEndpointAndToken();
    if (current.endpoint !== ep || current.token !== token) {
      localStorage.removeItem("ledger_connectionVerified");
    }
    localStorage.setItem("ledger_endpoint", ep);
    localStorage.setItem("ledger_selfGeneratedToken", token);
    localStorage.removeItem("ledger_apiKey");
  }

  function clearStoredEndpointAndToken() {
    localStorage.removeItem("ledger_endpoint");
    localStorage.removeItem("ledger_selfGeneratedToken");
    localStorage.removeItem("ledger_apiKey");
    localStorage.removeItem("ledger_connectionVerified");
  }

  function verifyAdminPasscode(ep, token, passcode) {
    return fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        selfGeneratedToken: token,
        action: "verifyAdminPasscode",
        adminPasscode: passcode,
      }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success") {
          return { ok: true, message: data.message || "Admin passcode verified" };
        }
        return { ok: false, message: data.message || "Invalid admin passcode" };
      })
      .catch(function (err) {
        return { ok: false, message: "Connection error: " + err.message };
      });
  }

  function ensureVerifiedPasscode(ep, token) {
    var passcode = sessionStorage.getItem(SESSION_PASSCODE_KEY) || "";
    if (!passcode) {
      return Promise.resolve({ ok: false, message: "Admin passcode not found in this session" });
    }
    return verifyAdminPasscode(ep, token, passcode).then(function (result) {
      if (result.ok) {
        sessionStorage.setItem(SESSION_AUTH_KEY, "true");
      }
      return result;
    });
  }

  function getHeaders(ep, token, sheetName) {
    var url = ep + "?action=getHeaders&selfGeneratedToken=" + encodeURIComponent(token);
    if (sheetName) {
      url += "&sheetName=" + encodeURIComponent(sheetName);
    }
    return fetch(url)
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success" && data.headers) {
          showColumnMapping(data.headers);
        } else {
          setStatus(spreadsheetStatus, data.message || "Failed to retrieve headers", "err");
        }
      })
      .catch(function (err) {
        setStatus(spreadsheetStatus, "Connection error: " + err.message, "err");
      });
  }

  function populateConnectionFieldsFromStorage() {
    var creds = getStoredEndpointAndToken();
    endpoint.value = creds.endpoint || "";
    selfGeneratedTokenInput.value = creds.token || "";
  }

  function syncUnlockMode() {
    var hasSaved = hasStoredUnlockCredentials();
    var creds = getStoredEndpointAndToken();

    if (unlockEndpointField) {
      unlockEndpointField.classList.toggle("hidden", hasSaved);
    }
    if (unlockTokenField) {
      unlockTokenField.classList.toggle("hidden", hasSaved);
    }
    if (unlockHelpInitial) {
      unlockHelpInitial.classList.toggle("hidden", hasSaved);
    }
    if (unlockHelpSaved) {
      unlockHelpSaved.classList.toggle("hidden", !hasSaved);
    }

    if (unlockEndpoint) {
      unlockEndpoint.value = creds.endpoint || "";
    }
    if (unlockToken) {
      unlockToken.value = creds.token || "";
    }
  }

  function restoreSavedSpreadsheetState() {
    resetSpreadsheetUiState();

    var creds = getStoredEndpointAndToken();
    var savedSpreadsheetUrl = localStorage.getItem("ledger_spreadsheetUrl");
    var savedSpreadsheetId = localStorage.getItem("ledger_spreadsheetId");
    var savedSheetName = localStorage.getItem("ledger_sheetName");
    var savedConnectionVerified = localStorage.getItem("ledger_connectionVerified");

    if (savedSpreadsheetUrl) {
      spreadsheetUrl.value = savedSpreadsheetUrl;
    }

    if (savedConnectionVerified === "true" && creds.endpoint && creds.token) {
      revealStep2();
      if (savedSheetName) {
        var opt = document.createElement("option");
        opt.value = savedSheetName;
        opt.textContent = savedSheetName;
        opt.selected = true;
        sheetNameSelect.appendChild(opt);
        sheetNameSelect.disabled = false;
      }
      if (savedSpreadsheetId && savedSheetName) {
        revealStep3();
        getHeaders(creds.endpoint, creds.token, savedSheetName);
      }
    }
  }

  function showAdminPanel() {
    adminLock.classList.add("hidden");
    adminPanel.classList.remove("hidden");
  }

  function showAdminLockPanel() {
    adminPanel.classList.add("hidden");
    adminLock.classList.remove("hidden");
  }

  function unlockAdministration() {
    var passcode = unlockPasscode.value.trim();
    if (!passcode) {
      setStatus(unlockStatus, "Admin passcode is required", "err");
      return;
    }

    var creds = getStoredEndpointAndToken();
    var ep = creds.endpoint || unlockEndpoint.value.trim();
    var token = creds.token || unlockToken.value.trim();

    if (!ep || !token) {
      setStatus(unlockStatus, "Web App URL and Self-Generated Token are required for first unlock", "err");
      return;
    }

    unlockAdminBtn.disabled = true;
    setStatus(unlockStatus, "Verifying admin passcode...", "");

    verifyAdminPasscode(ep, token, passcode)
      .then(function (result) {
        if (result.ok) {
          persistEndpointAndToken(ep, token);
          sessionStorage.setItem(SESSION_PASSCODE_KEY, passcode);
          sessionStorage.setItem(SESSION_AUTH_KEY, "true");
          populateConnectionFieldsFromStorage();
          syncUnlockMode();
          restoreSavedSpreadsheetState();
          showAdminPanel();
          setStatus(unlockStatus, "Administration unlocked", "ok");
          unlockPasscode.value = "";
        } else {
          if (
            hasStoredUnlockCredentials() &&
            /self-generated token|connection error|failed to fetch|network/i.test(result.message || "")
          ) {
            clearStoredEndpointAndToken();
            populateConnectionFieldsFromStorage();
            syncUnlockMode();
            setStatus(
              unlockStatus,
              "Saved URL/Token could not be verified. Re-enter URL, Token, and passcode.",
              "err",
            );
            return;
          }
          sessionStorage.removeItem(SESSION_PASSCODE_KEY);
          sessionStorage.removeItem(SESSION_AUTH_KEY);
          setStatus(unlockStatus, result.message || "Failed to unlock administration", "err");
        }
      })
      .finally(function () {
        unlockAdminBtn.disabled = false;
      });
  }

  function lockAdministration() {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_PASSCODE_KEY);
    unlockPasscode.value = "";
    syncUnlockMode();
    setStatus(unlockStatus, "", "");
    showAdminLockPanel();
  }

  // --- Setup guide actions ---
  if (copyCodeGsBtn) {
    copyCodeGsBtn.addEventListener("click", function () {
      copyCodeGsBtn.disabled = true;
      showGuideStatus(copyCodeGsStatus, "取得中...", "");
      fetch(CODE_GS_RAW_URL)
        .then(function (res) {
          if (!res.ok) {
            throw new Error("HTTP " + res.status);
          }
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
      navigator.clipboard
        .writeText(token)
        .then(function () {
          showGuideStatus(generateTokenStatus, "コピーしました: " + token.substring(0, 8) + "...", "ok");
        })
        .catch(function () {
          showGuideStatus(generateTokenStatus, "自動コピー失敗。手動でコピー: " + token, "err");
        });
    });
  }

  // --- Unlock listeners ---
  unlockAdminBtn.addEventListener("click", unlockAdministration);
  unlockPasscode.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      unlockAdministration();
    }
  });
  lockAdminBtn.addEventListener("click", lockAdministration);

  // --- Connection step ---
  saveSettings.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    if (!ep || !token) {
      setStatus(connectionStatus, "Please enter both URL and Self-Generated Token", "err");
      return;
    }
    persistEndpointAndToken(ep, token);
    syncUnlockMode();
    setStatus(connectionStatus, "Settings saved", "ok");
  });

  testConnectionBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    if (!ep || !token) {
      setStatus(connectionStatus, "Please enter both URL and Self-Generated Token", "err");
      return;
    }

    setStatus(connectionStatus, "Verifying admin passcode and testing connection...", "");
    testConnectionBtn.disabled = true;

    ensureVerifiedPasscode(ep, token)
      .then(function (verifyResult) {
        if (!verifyResult.ok) {
          throw new Error(verifyResult.message || "Admin passcode verification failed");
        }
        return fetch(ep + "?action=health&selfGeneratedToken=" + encodeURIComponent(token));
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success" || data.status === "ok") {
          setStatus(connectionStatus, "Connection successful: " + (data.message || "Service is running"), "ok");
          persistEndpointAndToken(ep, token);
          localStorage.setItem("ledger_connectionVerified", "true");
          syncUnlockMode();
          revealStep2();
        } else {
          setStatus(connectionStatus, "Connection error: " + (data.message || "Unknown error"), "err");
        }
      })
      .catch(function (err) {
        setStatus(connectionStatus, err.message || "Connection error", "err");
        if ((err.message || "").toLowerCase().indexOf("passcode") >= 0) {
          lockAdministration();
          setStatus(unlockStatus, err.message, "err");
        }
      })
      .finally(function () {
        testConnectionBtn.disabled = false;
      });
  });

  // --- Spreadsheet step ---
  loadSheetsBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    var ssUrl = spreadsheetUrl.value.trim();
    var ssId = extractSpreadsheetId(ssUrl);

    if (!ssId) {
      setStatus(spreadsheetStatus, "Please enter a valid spreadsheet URL", "err");
      return;
    }

    setStatus(spreadsheetStatus, "Verifying passcode and loading sheets...", "");
    loadSheetsBtn.disabled = true;

    ensureVerifiedPasscode(ep, token)
      .then(function (verifyResult) {
        if (!verifyResult.ok) {
          throw new Error(verifyResult.message || "Admin passcode verification failed");
        }
        return fetch(
          ep +
            "?action=listSheets&selfGeneratedToken=" +
            encodeURIComponent(token) +
            "&spreadsheetId=" +
            encodeURIComponent(ssId),
        );
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success" && data.sheets) {
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
          setStatus(spreadsheetStatus, data.sheets.length + " sheet(s) retrieved", "ok");
        } else {
          setStatus(spreadsheetStatus, data.message || "Failed to retrieve sheet list", "err");
        }
      })
      .catch(function (err) {
        setStatus(spreadsheetStatus, err.message || "Connection error", "err");
      })
      .finally(function () {
        loadSheetsBtn.disabled = false;
      });
  });

  applySpreadsheetBtn.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var token = selfGeneratedTokenInput.value.trim();
    var ssUrl = spreadsheetUrl.value.trim();
    var ssId = extractSpreadsheetId(ssUrl);
    var selectedSheet = sheetNameSelect.value;

    if (!ssId) {
      setStatus(spreadsheetStatus, "Please enter a valid spreadsheet URL", "err");
      return;
    }
    if (!selectedSheet) {
      setStatus(spreadsheetStatus, "Please select a sheet", "err");
      return;
    }

    setStatus(spreadsheetStatus, "Verifying passcode and configuring spreadsheet...", "");
    applySpreadsheetBtn.disabled = true;

    ensureVerifiedPasscode(ep, token)
      .then(function (verifyResult) {
        if (!verifyResult.ok) {
          throw new Error(verifyResult.message || "Admin passcode verification failed");
        }
        return fetch(ep, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            selfGeneratedToken: token,
            action: "configure",
            config: {
              spreadsheetId: ssId,
              sheetName: selectedSheet,
            },
          }),
        });
      })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        if (data.status === "success") {
          localStorage.setItem("ledger_spreadsheetUrl", ssUrl);
          localStorage.setItem("ledger_spreadsheetId", ssId);
          localStorage.setItem("ledger_sheetName", selectedSheet);
          localStorage.setItem("ledger_connectionVerified", "true");

          setStatus(spreadsheetStatus, "Spreadsheet configured", "ok");
          revealStep3();
          getHeaders(ep, token, selectedSheet);
        } else {
          setStatus(spreadsheetStatus, data.message || "Configuration failed", "err");
        }
      })
      .catch(function (err) {
        setStatus(spreadsheetStatus, err.message || "Connection error", "err");
      })
      .finally(function () {
        applySpreadsheetBtn.disabled = false;
      });
  });

  // --- Initial load ---
  populateConnectionFieldsFromStorage();
  syncUnlockMode();
  if (
    sessionStorage.getItem(SESSION_AUTH_KEY) === "true" &&
    sessionStorage.getItem(SESSION_PASSCODE_KEY) &&
    hasStoredUnlockCredentials()
  ) {
    restoreSavedSpreadsheetState();
    showAdminPanel();
  } else {
    sessionStorage.removeItem(SESSION_AUTH_KEY);
    sessionStorage.removeItem(SESSION_PASSCODE_KEY);
    showAdminLockPanel();
  }

  // --- Service Worker registration ---
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then(function (registration) {
        return registration.update().catch(function () {
          return null;
        });
      })
      .catch(function () {
        // SW registration failed silently
      });
  }
})();
