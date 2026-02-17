(function () {
  "use strict";

  // --- DOM refs ---
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
  var refSelect = document.getElementById("ref-select");
  var refOtherInput = document.getElementById("ref-other");
  var refHidden = document.getElementById("ref-value");
  var paymentSelect = document.getElementById("payment-select");
  var paymentOtherInput = document.getElementById("payment-other");
  var paymentHidden = document.getElementById("payment-value");
  var countrySelect = document.getElementById("country");

  var capturePhotoBtn = document.getElementById("capture-photo-btn");
  var retakePhotoBtn = document.getElementById("retake-photo-btn");
  var certificatePhotoInput = document.getElementById("certificate-photo-input");
  var certificatePhotoUrlInput = document.getElementById("certificate-photo-url");
  var photoPreviewWrap = document.getElementById("photo-preview-wrap");
  var certificatePhotoPreview = document.getElementById("certificate-photo-preview");
  var photoSavedWrap = document.getElementById("photo-saved-wrap");
  var photoSavedLink = document.getElementById("photo-saved-link");
  var photoStatus = document.getElementById("photo-status");

  var derivedAge = document.getElementById("derived-age");
  var derivedMonth = document.getElementById("derived-month");
  var derivedCountryJP = document.getElementById("derived-country-jp");
  var derivedContinent = document.getElementById("derived-continent");
  var derivedSubregion = document.getElementById("derived-subregion");

  var birthdayInput = ledgerForm.elements.birthday;
  var countryInput = countrySelect;
  var visitDateInput = ledgerForm.elements.visitDate;
  var configBanner = document.getElementById("config-banner");
  var configInput = document.getElementById("config-input");
  var applyConfigBtn = document.getElementById("apply-config");
  var configStatus = document.getElementById("config-status");
  var successOverlay = document.getElementById("success-overlay");
  var successWriteTargetWrap = document.getElementById("success-write-target-wrap");
  var successWriteTargetMeta = document.getElementById("success-write-target-meta");
  var successWriteTargetLink = document.getElementById("success-write-target-link");
  var newEntryBtn = document.getElementById("new-entry-btn");

  var selectedPhotoFile = null;
  var selectedPhotoPreviewUrl = "";

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

  function setPhotoStatus(msg, cls) {
    photoStatus.textContent = msg || "";
    photoStatus.className = "status " + (cls || "");
  }

  function updateSavedPhotoLink(url) {
    if (!url) {
      photoSavedWrap.classList.add("hidden");
      photoSavedLink.removeAttribute("href");
      return;
    }
    photoSavedLink.href = url;
    photoSavedWrap.classList.remove("hidden");
  }

  function revokeSelectedPhotoPreview() {
    if (selectedPhotoPreviewUrl) {
      URL.revokeObjectURL(selectedPhotoPreviewUrl);
      selectedPhotoPreviewUrl = "";
    }
  }

  function sanitizeFileNamePart(text) {
    return String(text || "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 48);
  }

  function buildPhotoFileNameHint() {
    var visitDate = sanitizeFileNamePart(visitDateInput.value || todayISO());
    var customerName = sanitizeFileNamePart(ledgerForm.elements.customerName.value || "customer");
    var ref = sanitizeFileNamePart(ledgerForm.elements.ref.value || "");
    return [visitDate, customerName, ref].filter(Boolean).join("_");
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(reader.result || "");
      };
      reader.onerror = function () {
        reject(new Error("Failed to read image file"));
      };
      reader.readAsDataURL(file);
    });
  }

  function resetPhotoUi() {
    selectedPhotoFile = null;
    revokeSelectedPhotoPreview();
    certificatePhotoInput.value = "";
    certificatePhotoUrlInput.value = "";
    certificatePhotoPreview.removeAttribute("src");
    photoPreviewWrap.classList.add("hidden");
    retakePhotoBtn.classList.add("hidden");
    updateSavedPhotoLink("");
    setPhotoStatus("", "");
    updateSubmitBtnState();
  }

  function getStoredEndpointAndToken() {
    return {
      endpoint: localStorage.getItem("ledger_endpoint") || "",
      token:
        localStorage.getItem("ledger_selfGeneratedToken") || "",
    };
  }

  function updateConfigBanner() {
    var isConfigured = localStorage.getItem("ledger_connectionVerified") === "true";
    if (isConfigured) {
      configBanner.classList.add("hidden");
    } else {
      configBanner.classList.remove("hidden");
    }
  }

  function applyConfig(configString) {
    try {
      var json = JSON.parse(atob(configString.trim()));
      if (!json.e || !json.t) {
        throw new Error("Missing endpoint or token");
      }
      localStorage.setItem("ledger_endpoint", json.e);
      localStorage.setItem("ledger_selfGeneratedToken", json.t);
      localStorage.setItem("ledger_connectionVerified", "true");
      updateConfigBanner();
      if (configStatus) {
        configStatus.textContent = "Configuration applied successfully.";
        configStatus.className = "status ok";
      }
      return true;
    } catch (err) {
      if (configStatus) {
        configStatus.textContent = "Invalid config. Please copy again from Admin app.";
        configStatus.className = "status err";
      }
      return false;
    }
  }

  // --- Config import via URL parameter ---
  (function () {
    var params = new URLSearchParams(window.location.search);
    var configParam = params.get("config");
    if (configParam) {
      applyConfig(configParam);
      history.replaceState(null, "", window.location.pathname);
    }
  })();

  // --- Config import via paste ---
  if (applyConfigBtn && configInput) {
    applyConfigBtn.addEventListener("click", function () {
      var val = configInput.value.trim();
      if (!val) {
        if (configStatus) {
          configStatus.textContent = "Please paste the config string first.";
          configStatus.className = "status err";
        }
        return;
      }
      applyConfig(val);
    });
  }

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

  // --- Populate options ---
  populateSelect(genderSelect, LedgerCore.GENDER_OPTIONS, "-- Gender --");
  populateSelect(csCategorySelect, LedgerCore.CATEGORY_OPTIONS, "-- Category --");
  populateSelect(countrySelect, LedgerCore.COUNTRY_OPTIONS, "-- Country --");

  // --- Toggle Buy Total / Sales Total based on Category ---
  var labelBuyTotal = document.getElementById("label-buy-total");
  var labelSalesTotal = document.getElementById("label-sales-total");
  csCategorySelect.addEventListener("change", function () {
    var val = csCategorySelect.value;
    var isBuy = val.toLowerCase().indexOf("buy") !== -1;
    var isSales = val.toLowerCase().indexOf("sales") !== -1;
    labelBuyTotal.classList.toggle("hidden", !isBuy);
    labelSalesTotal.classList.toggle("hidden", !isSales);
  });

  // --- "Other" toggle for REF and Payment Method ---
  function setupOtherToggle(selectEl, otherInput, hiddenInput) {
    otherInput.required = false;
    selectEl.addEventListener("change", function () {
      if (selectEl.value === "Other") {
        otherInput.classList.remove("hidden");
        otherInput.required = selectEl.hasAttribute("required");
        hiddenInput.value = "";
      } else {
        otherInput.classList.add("hidden");
        otherInput.required = false;
        otherInput.value = "";
        hiddenInput.value = selectEl.value;
      }
    });
    otherInput.addEventListener("input", function () {
      hiddenInput.value = otherInput.value;
    });
  }
  setupOtherToggle(refSelect, refOtherInput, refHidden);
  setupOtherToggle(paymentSelect, paymentOtherInput, paymentHidden);

  // --- Initial state ---
  updateConfigBanner();
  if (!visitDateInput.value) {
    visitDateInput.value = todayISO();
  }
  updateDerived();
  resetPhotoUi();

  // --- Step navigation ---
  nextBtn.addEventListener("click", function () {
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

  // --- Derived preview updates ---
  birthdayInput.addEventListener("input", updateDerived);
  birthdayInput.addEventListener("change", updateDerived);
  countryInput.addEventListener("change", updateDerived);
  visitDateInput.addEventListener("input", updateDerived);
  visitDateInput.addEventListener("change", updateDerived);

  // --- Photo upload flow ---
  capturePhotoBtn.addEventListener("click", function () {
    certificatePhotoInput.value = "";
    certificatePhotoInput.click();
  });

  retakePhotoBtn.addEventListener("click", function () {
    certificatePhotoInput.value = "";
    certificatePhotoInput.click();
  });

  certificatePhotoInput.addEventListener("change", function () {
    var file = certificatePhotoInput.files && certificatePhotoInput.files[0];
    if (!file) {
      return;
    }
    if (!/^image\//.test(file.type)) {
      setPhotoStatus("Please select an image file", "err");
      return;
    }

    selectedPhotoFile = file;
    revokeSelectedPhotoPreview();
    selectedPhotoPreviewUrl = URL.createObjectURL(file);
    certificatePhotoPreview.src = selectedPhotoPreviewUrl;
    photoPreviewWrap.classList.remove("hidden");
    retakePhotoBtn.classList.remove("hidden");

    certificatePhotoUrlInput.value = "";
    updateSavedPhotoLink("");
    setPhotoStatus("Photo ready. It will be uploaded when you submit.", "");
    updateSubmitBtnState();
  });

  // --- Submit button state ---
  function updateSubmitBtnState() {
    submitBtn.disabled = !selectedPhotoFile;
  }

  function isLegacyUploadUnsupportedError(result) {
    if (!result || typeof result !== "object") {
      return false;
    }
    if (String(result.code || "") !== "VALIDATION_ERROR") {
      return false;
    }
    if (/missing or invalid data field/i.test(String(result.message || ""))) {
      return true;
    }
    var errors = Array.isArray(result.errors) ? result.errors : [];
    for (var i = 0; i < errors.length; i++) {
      if (errors[i] && String(errors[i].field || "") === "data") {
        return true;
      }
    }
    return false;
  }

  // --- Photo upload to Drive ---
  function uploadPhotoToDrive(creds) {
    return fileToDataUrl(selectedPhotoFile).then(function (dataUrl) {
      var commaIndex = dataUrl.indexOf(",");
      var base64Data = commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : "";
      return fetch(creds.endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify({
          selfGeneratedToken: creds.token,
          action: "uploadCertificatePhoto",
          photoBase64: base64Data,
          mimeType: selectedPhotoFile.type || "image/jpeg",
          fileNameHint: buildPhotoFileNameHint(),
        }),
      }).then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            return result.fileUrl || "";
          }
          if (isLegacyUploadUnsupportedError(result)) {
            throw new Error(
              "Endpoint does not support photo upload action. Update GAS deployment URL and redeploy latest Code.gs.",
            );
          }
          throw new Error(result.message || "Photo upload failed");
        });
      });
    });
  }

  // --- Success overlay ---
  function updateSuccessWriteTarget(writeTarget) {
    if (!successWriteTargetWrap || !successWriteTargetLink || !successWriteTargetMeta) {
      return;
    }
    var target = writeTarget || {};
    var sheetUrl = String(target.sheetUrl || "");
    if (!sheetUrl) {
      successWriteTargetWrap.classList.add("hidden");
      successWriteTargetMeta.textContent = "";
      successWriteTargetLink.removeAttribute("href");
      successWriteTargetLink.textContent = "";
      return;
    }
    var rowNumber = Number(target.rowNumber);
    var metaParts = [];
    if (target.sheetName) {
      metaParts.push("Sheet: " + String(target.sheetName));
    }
    if (rowNumber > 0) {
      metaParts.push("Row: " + rowNumber);
    }
    successWriteTargetMeta.textContent = metaParts.length > 0 ? metaParts.join(" / ") : "Saved destination";
    successWriteTargetLink.href = sheetUrl;
    successWriteTargetLink.textContent = "Spreadsheet URL";
    successWriteTargetLink.title = sheetUrl;
    successWriteTargetWrap.classList.remove("hidden");
  }

  function showSuccessOverlay(result) {
    updateSuccessWriteTarget(result && result.writeTarget);
    successOverlay.classList.remove("hidden");
  }

  function hideSuccessOverlay() {
    successOverlay.classList.add("hidden");
  }

  function resetFormCompletely() {
    hideSuccessOverlay();
    updateSuccessWriteTarget(null);
    ledgerForm.reset();
    visitDateInput.value = todayISO();
    derivedAge.textContent = "-";
    derivedMonth.textContent = "-";
    derivedCountryJP.textContent = "-";
    derivedContinent.textContent = "-";
    derivedSubregion.textContent = "-";
    resetPhotoUi();
    // Reset "Other" input fields
    refOtherInput.classList.add("hidden");
    refOtherInput.required = false;
    refOtherInput.value = "";
    refHidden.value = "";
    paymentOtherInput.classList.add("hidden");
    paymentOtherInput.required = false;
    paymentOtherInput.value = "";
    paymentHidden.value = "";
    showPane("customer");
    updateConfigBanner();
    clearStatus();
  }

  newEntryBtn.addEventListener("click", function () {
    resetFormCompletely();
  });

  // --- Form submission ---
  ledgerForm.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!selectedPhotoFile) {
      showStatus("Please take a certificate photo", "err");
      return;
    }

    var fd = new FormData(ledgerForm);
    var rawInput = {};
    fd.forEach(function (value, key) {
      rawInput[key] = value;
    });

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

    var creds = getStoredEndpointAndToken();
    if (!creds.endpoint || !creds.token) {
      showStatus("Please configure connection settings first", "err");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";
    submitBtn.classList.add("btn-submitting");
    clearStatus();

    uploadPhotoToDrive(creds)
      .then(function (fileUrl) {
        certificatePhotoUrlInput.value = fileUrl;
        updateSavedPhotoLink(fileUrl);
        payload.certificatePhotoUrl = fileUrl;

        return fetch(creds.endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: JSON.stringify({
            selfGeneratedToken: creds.token,
            action: "appendRow",
            data: payload,
          }),
        });
      })
      .then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            showSuccessOverlay(result);
          } else {
            showStatus(result.message || "Submission error: " + response.status, "err");
          }
        });
      })
      .catch(function (err) {
        showStatus("Error: " + err.message, "err");
      })
      .finally(function () {
        submitBtn.textContent = "Submit";
        submitBtn.classList.remove("btn-submitting");
        updateSubmitBtnState();
      });
  });

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
