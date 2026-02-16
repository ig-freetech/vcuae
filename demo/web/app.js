(function () {
  "use strict";

  // --- DOM refs ---
  var endpoint = document.getElementById("endpoint");
  var apiKey = document.getElementById("api-key");
  var saveSettings = document.getElementById("save-settings");
  var settingsPanel = document.getElementById("settings-panel");

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
  var savedApiKey = localStorage.getItem("ledger_apiKey");
  if (savedEndpoint) endpoint.value = savedEndpoint;
  if (savedApiKey) apiKey.value = savedApiKey;
  if (savedEndpoint && savedApiKey) {
    settingsPanel.removeAttribute("open");
  }

  // --- Default visit date ---
  if (!visitDateInput.value) {
    visitDateInput.value = todayISO();
  }

  // --- Save settings ---
  saveSettings.addEventListener("click", function () {
    var ep = endpoint.value.trim();
    var ak = apiKey.value.trim();
    if (!ep || !ak) {
      showStatus("URL と API Key を両方入力してください", "err");
      return;
    }
    localStorage.setItem("ledger_endpoint", ep);
    localStorage.setItem("ledger_apiKey", ak);
    showStatus("設定を保存しました", "ok");
    setTimeout(clearStatus, 3000);
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
    var ak = localStorage.getItem("ledger_apiKey");
    if (!ep || !ak) {
      showStatus("接続設定を入力してください", "err");
      return;
    }

    // Prevent double submission
    submitBtn.disabled = true;

    fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: ak, data: payload }),
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            showStatus("送信成功", "ok");
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
              result.message || "送信エラー: " + response.status,
              "err"
            );
          }
        });
      })
      .catch(function (err) {
        showStatus("通信エラー: " + err.message, "err");
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
