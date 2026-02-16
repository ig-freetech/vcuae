"use strict";

// -------------------------------------------------------
// Shared test fixtures for ledger-core.js tests
// -------------------------------------------------------

// --- Valid customer step input ---
var validCustomerInput = {
  customerName: "John Smith",
  gender: "Male",
  birthday: "1990-05-15",
  mobileNumber: "+971501234567",
  email: "john.smith@example.com",
  country: "United Arab Emirates",
  address: "Dubai Marina, Tower 5, Apt 1201",
  csCategory: "Sales (販売)",
};

// --- Valid staff step input ---
var validStaffInput = {
  visitDate: "2026-01-15",
  ref: "REF-001",
  paymentMethod: "Cash",
  totalPurchase: "15,000",
  grandTotal: "16,500",
};

// --- Complete submission payload (customer + staff merged) ---
var validCompletePayload = {
  customerName: "John Smith",
  gender: "Male",
  birthday: "1990-05-15",
  mobileNumber: "+971501234567",
  email: "john.smith@example.com",
  country: "United Arab Emirates",
  address: "Dubai Marina, Tower 5, Apt 1201",
  csCategory: "Sales (販売)",
  visitDate: "2026-01-15",
  ref: "REF-001",
  paymentMethod: "Cash",
  totalPurchase: "15,000",
  grandTotal: "16,500",
};

// --- Validation error cases ---
var validationErrorCases = {
  emptyRequired: {
    customerName: "",
    gender: "Male",
    birthday: "1990-05-15",
    mobileNumber: "+971501234567",
    email: "john@example.com",
    country: "United Arab Emirates",
    address: "Dubai Marina",
    csCategory: "Sales (販売)",
    visitDate: "2026-01-15",
    ref: "",
    paymentMethod: "Cash",
    totalPurchase: "15000",
    grandTotal: "16500",
  },
  invalidEmail: {
    customerName: "Test User",
    gender: "Female",
    birthday: "1985-03-20",
    mobileNumber: "+971509876543",
    email: "not-an-email",
    country: "India",
    address: "Mumbai, MH",
    csCategory: "buy (買取)",
    visitDate: "2026-02-01",
    ref: "",
    paymentMethod: "Card",
    totalPurchase: "5000",
    grandTotal: "5500",
  },
  shortPhone: {
    customerName: "Test User",
    gender: "Male",
    birthday: "1992-07-10",
    mobileNumber: "12345",
    email: "test@example.com",
    country: "India",
    address: "Delhi",
    csCategory: "Sales (販売)",
    visitDate: "2026-01-20",
    ref: "",
    paymentMethod: "Cash",
    totalPurchase: "8000",
    grandTotal: "8800",
  },
  invalidDate: {
    customerName: "Test User",
    gender: "Male",
    birthday: "not-a-date",
    mobileNumber: "+971501234567",
    email: "test@example.com",
    country: "India",
    address: "Mumbai",
    csCategory: "Sales (販売)",
    visitDate: "2026-01-20",
    ref: "",
    paymentMethod: "Cash",
    totalPurchase: "10000",
    grandTotal: "11000",
  },
  invalidGender: {
    customerName: "Test User",
    gender: "Unknown",
    birthday: "1990-01-01",
    mobileNumber: "+971501234567",
    email: "test@example.com",
    country: "India",
    address: "Mumbai",
    csCategory: "Sales (販売)",
    visitDate: "2026-01-20",
    ref: "",
    paymentMethod: "Cash",
    totalPurchase: "10000",
    grandTotal: "11000",
  },
  invalidCategory: {
    customerName: "Test User",
    gender: "Male",
    birthday: "1990-01-01",
    mobileNumber: "+971501234567",
    email: "test@example.com",
    country: "India",
    address: "Mumbai",
    csCategory: "InvalidCategory",
    visitDate: "2026-01-20",
    ref: "",
    paymentMethod: "Cash",
    totalPurchase: "10000",
    grandTotal: "11000",
  },
  invalidPayment: {
    customerName: "Test User",
    gender: "Male",
    birthday: "1990-01-01",
    mobileNumber: "+971501234567",
    email: "test@example.com",
    country: "India",
    address: "Mumbai",
    csCategory: "Sales (販売)",
    visitDate: "2026-01-20",
    ref: "",
    paymentMethod: "Bitcoin",
    totalPurchase: "10000",
    grandTotal: "11000",
  },
};

// --- Country edge cases ---
var countryEdgeCases = {
  alias_UAE: "UAE",
  alias_UK: "UK",
  alias_USA: "USA",
  fullName_INDIA: "India",
  fullName_UAE: "United Arab Emirates",
  unknown: "Atlantis",
  empty: "",
};

module.exports = {
  validCustomerInput: validCustomerInput,
  validStaffInput: validStaffInput,
  validCompletePayload: validCompletePayload,
  validationErrorCases: validationErrorCases,
  countryEdgeCases: countryEdgeCases,
};
