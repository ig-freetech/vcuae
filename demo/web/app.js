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
  var countryList = document.getElementById("country-list");

  var capturePhotoBtn = document.getElementById("capture-photo-btn");
  var retakePhotoBtn = document.getElementById("retake-photo-btn");
  var savePhotoBtn = document.getElementById("save-photo-btn");
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
  var countryInput = document.getElementById("country");
  var visitDateInput = ledgerForm.elements.visitDate;
  var configBanner = document.getElementById("config-banner");

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
    savePhotoBtn.disabled = true;
    updateSavedPhotoLink("");
    setPhotoStatus("", "");
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
  populateDatalist(countryList, LedgerCore.COUNTRY_OPTIONS);

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
  countryInput.addEventListener("input", updateDerived);
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
    savePhotoBtn.disabled = false;

    certificatePhotoUrlInput.value = "";
    updateSavedPhotoLink("");
    setPhotoStatus("Photo selected. Review and tap Save to Drive.", "");
  });

  savePhotoBtn.addEventListener("click", function () {
    var creds = getStoredEndpointAndToken();
    if (!creds.endpoint || !creds.token) {
      setPhotoStatus("Please configure connection settings first", "err");
      return;
    }
    if (!selectedPhotoFile) {
      setPhotoStatus("Take a photo first", "err");
      return;
    }

    savePhotoBtn.disabled = true;
    capturePhotoBtn.disabled = true;
    retakePhotoBtn.disabled = true;
    setPhotoStatus("Uploading photo to Drive...", "");

    fileToDataUrl(selectedPhotoFile)
      .then(function (dataUrl) {
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
        });
      })
      .then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            certificatePhotoUrlInput.value = result.fileUrl || "";
            updateSavedPhotoLink(certificatePhotoUrlInput.value);
            setPhotoStatus("Photo saved to Drive", "ok");
          } else {
            setPhotoStatus(result.message || "Photo upload failed", "err");
          }
        });
      })
      .catch(function (err) {
        setPhotoStatus("Photo upload error: " + err.message, "err");
      })
      .finally(function () {
        savePhotoBtn.disabled = false;
        capturePhotoBtn.disabled = false;
        retakePhotoBtn.disabled = false;
      });
  });

  // --- Form submission ---
  ledgerForm.addEventListener("submit", function (e) {
    e.preventDefault();

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

    fetch(creds.endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: JSON.stringify({ selfGeneratedToken: creds.token, data: payload }),
    })
      .then(function (response) {
        return response.json().then(function (result) {
          if (response.ok && result.status === "success") {
            showStatus("Submission successful", "ok");
            ledgerForm.reset();
            visitDateInput.value = todayISO();
            derivedAge.textContent = "-";
            derivedMonth.textContent = "-";
            derivedCountryJP.textContent = "-";
            derivedContinent.textContent = "-";
            derivedSubregion.textContent = "-";
            resetPhotoUi();
            showPane("customer");
            updateConfigBanner();
          } else {
            showStatus(result.message || "Submission error: " + response.status, "err");
          }
        });
      })
      .catch(function (err) {
        showStatus("Connection error: " + err.message, "err");
      })
      .finally(function () {
        submitBtn.disabled = false;
        setTimeout(clearStatus, 3000);
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
