(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.LedgerCore = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

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

  var CATEGORY_OPTIONS = [
    "repeatSales (販売)",
    "repeatBuy (買取)",
    "Sales (販売)",
    "buy (買取)",
  ];

  var GENDER_OPTIONS = ["Male", "Female", "Other"];

  var PAYMENT_OPTIONS = [
    "Cash",
    "Card",
    "Bank Transfer",
    "Tabby",
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

  var COUNTRY_OPTIONS = Object.keys(COUNTRY_METADATA)
    .map(function (key) {
      return COUNTRY_METADATA[key].country;
    })
    .sort();

  function sanitizeText(value) {
    if (value === null || value === undefined) {
      return "";
    }
    return String(value).replace(/\s+/g, " ").trim();
  }

  function normalizeDateInput(value) {
    var text = sanitizeText(value);
    if (!text) {
      return "";
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return isValidIsoDate(text) ? text : "";
    }

    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
      var dmy = text.split("/");
      var dmyIso = dmy[2] + "-" + dmy[1] + "-" + dmy[0];
      return isValidIsoDate(dmyIso) ? dmyIso : "";
    }

    if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
      var dmyDash = text.split("-");
      var dmyDashIso = dmyDash[2] + "-" + dmyDash[1] + "-" + dmyDash[0];
      return isValidIsoDate(dmyDashIso) ? dmyDashIso : "";
    }

    return "";
  }

  function isValidIsoDate(isoDate) {
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

  function parseCurrency(value) {
    var text = sanitizeText(value);
    if (!text) {
      return null;
    }
    var normalized = text.replace(/,/g, "");
    var parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function normalizeCountryKey(country) {
    var text = sanitizeText(country)
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

  function resolveCountryMetadata(country) {
    var raw = sanitizeText(country);
    if (!raw) {
      return {
        country: "",
        countryJP: "N/A",
        continent: "N/A",
        subregion: "N/A",
        matched: false,
      };
    }

    var key = normalizeCountryKey(raw);
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

  function calculateAge(birthdayIso, visitDateIso) {
    if (!birthdayIso || !visitDateIso) {
      return null;
    }
    if (!isValidIsoDate(birthdayIso) || !isValidIsoDate(visitDateIso)) {
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

  function deriveBirthMonth(birthdayIso) {
    if (!birthdayIso || !isValidIsoDate(birthdayIso)) {
      return null;
    }
    return Number(birthdayIso.split("-")[1]);
  }

  function normalizeInput(input) {
    var normalized = {
      visitDate: normalizeDateInput(input.visitDate),
      csCategory: sanitizeText(input.csCategory),
      customerName: sanitizeText(input.customerName),
      gender: sanitizeText(input.gender),
      birthday: normalizeDateInput(input.birthday),
      mobileNumber: sanitizeText(input.mobileNumber),
      email: sanitizeText(input.email).toLowerCase(),
      address: sanitizeText(input.address),
      ref: sanitizeText(input.ref),
      paymentMethod: sanitizeText(input.paymentMethod),
      country: sanitizeText(input.country),
      totalPurchase: parseCurrency(input.totalPurchase),
      grandTotal: parseCurrency(input.grandTotal),
      certificatePhotoUrl: sanitizeText(input.certificatePhotoUrl),
    };

    return normalized;
  }

  function validateInput(record) {
    var errors = [];
    var requiredFields = [
      ["visitDate", "Visit Date is required"],
      ["csCategory", "Category is required"],
      ["customerName", "Customer Name is required"],
      ["gender", "Gender is required"],
      ["birthday", "Birthday is required"],
      ["mobileNumber", "Mobile Number is required"],
      ["address", "Address is required"],
      ["paymentMethod", "Payment Method is required"],
      ["country", "Country is required"],
    ];

    requiredFields.forEach(function (entry) {
      if (!sanitizeText(record[entry[0]])) {
        errors.push({ field: entry[0], message: entry[1] });
      }
    });

    if (record.visitDate && !isValidIsoDate(record.visitDate)) {
      errors.push({ field: "visitDate", message: "Invalid Visit Date format" });
    }
    if (record.birthday && !isValidIsoDate(record.birthday)) {
      errors.push({ field: "birthday", message: "Invalid Birthday format" });
    }

    if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
      errors.push({ field: "email", message: "Invalid Email format" });
    }

    var phoneDigits = record.mobileNumber.replace(/\D/g, "");
    if (record.mobileNumber && phoneDigits.length < 7) {
      errors.push({
        field: "mobileNumber",
        message: "Mobile Number must be at least 7 digits",
      });
    }


    if (
      record.csCategory &&
      CATEGORY_OPTIONS.indexOf(record.csCategory) === -1
    ) {
      errors.push({
        field: "csCategory",
        message: "Invalid Category selection",
      });
    }

    if (record.gender && GENDER_OPTIONS.indexOf(record.gender) === -1) {
      errors.push({
        field: "gender",
        message: "Invalid Gender selection",
      });
    }


    if (
      record.certificatePhotoUrl &&
      !/^https?:\/\/[^\s]+$/i.test(record.certificatePhotoUrl)
    ) {
      errors.push({
        field: "certificatePhotoUrl",
        message: "Invalid Certificate Photo URL format",
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }

  function deriveFields(record) {
    var countryMeta = resolveCountryMetadata(record.country);
    var age = calculateAge(record.birthday, record.visitDate);
    var birthMonth = deriveBirthMonth(record.birthday);

    return {
      country: countryMeta.country || record.country,
      countryJP: countryMeta.countryJP,
      continent: countryMeta.continent,
      subregion: countryMeta.subregion,
      age: age === null ? "" : age,
      birthMonth: birthMonth === null ? "" : birthMonth,
      countryMatched: countryMeta.matched,
    };
  }

  function buildSheetRow(record) {
    var derived = deriveFields(record);
    return [
      record.visitDate,
      record.csCategory,
      record.customerName,
      record.gender,
      record.birthday,
      derived.age,
      record.mobileNumber,
      record.email,
      record.address,
      record.ref,
      record.paymentMethod,
      derived.country,
      derived.countryJP,
      derived.continent,
      derived.subregion,
      derived.birthMonth,
      record.totalPurchase,
      record.grandTotal,
      record.certificatePhotoUrl || "",
    ];
  }

  function toApiPayload(rawInput) {
    var normalized = normalizeInput(rawInput);
    return {
      visitDate: normalized.visitDate,
      csCategory: normalized.csCategory,
      customerName: normalized.customerName,
      gender: normalized.gender,
      birthday: normalized.birthday,
      mobileNumber: normalized.mobileNumber,
      email: normalized.email,
      address: normalized.address,
      ref: normalized.ref,
      paymentMethod: normalized.paymentMethod,
      country: normalized.country,
      totalPurchase:
        normalized.totalPurchase === null ? "" : normalized.totalPurchase,
      grandTotal: normalized.grandTotal === null ? "" : normalized.grandTotal,
      certificatePhotoUrl: normalized.certificatePhotoUrl,
    };
  }

  return {
    SHEET_HEADERS: SHEET_HEADERS,
    CATEGORY_OPTIONS: CATEGORY_OPTIONS,
    GENDER_OPTIONS: GENDER_OPTIONS,
    PAYMENT_OPTIONS: PAYMENT_OPTIONS,
    COUNTRY_OPTIONS: COUNTRY_OPTIONS,
    COUNTRY_METADATA: COUNTRY_METADATA,
    normalizeInput: normalizeInput,
    validateInput: validateInput,
    deriveFields: deriveFields,
    buildSheetRow: buildSheetRow,
    toApiPayload: toApiPayload,
    isValidIsoDate: isValidIsoDate,
  };
});
