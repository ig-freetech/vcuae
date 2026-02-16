#!/bin/bash
set -euo pipefail

# golden-e2e.sh - E2E golden test using playwright-cli
# Fills the ledger form (customer + staff) and submits to spreadsheet.
# Usage:
#   MOCK_MODE=true ./golden-e2e.sh   # UI-only (no real spreadsheet)
#   ./golden-e2e.sh                  # Full mode (requires .env)

# --- Environment ---
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DEMO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load .env if present
if [ -f "$DEMO_DIR/.env" ]; then
  set -a
  source "$DEMO_DIR/.env"
  set +a
fi

SESSION="golden-$$"
BASE_URL="http://localhost:3000"
PASS=0
FAIL=0

# --- Helpers ---
assert_contains() {
  local output="$1" expected="$2" label="$3"
  if echo "$output" | grep -q "$expected"; then
    echo "  ✓ $label"
    ((PASS++))
  else
    echo "  ✗ $label (expected: $expected)"
    ((FAIL++))
  fi
}

run() {
  playwright-cli run-code "$1" -s="$SESSION"
}

# --- Local server ---
cd "$DEMO_DIR"
npx serve web -l 3000 --no-clipboard &
SERVER_PID=$!
sleep 2

cleanup() {
  kill $SERVER_PID 2>/dev/null || true
  playwright-cli close -s="$SESSION" 2>/dev/null || true
}
trap cleanup EXIT

# --- Session ---
playwright-cli open "$BASE_URL" -s="$SESSION"

# --- localStorage (non-MOCK) ---
if [ "${MOCK_MODE:-}" != "true" ]; then
  run "await page.evaluate(() => {
    localStorage.setItem('ledger_endpoint', '${GAS_ENDPOINT_URL:-}');
    localStorage.setItem('ledger_apiKey', '${GAS_API_KEY:-}');
  })"
  playwright-cli goto "$BASE_URL" -s="$SESSION"
fi

# --- Mock mode: intercept network ---
if [ "${MOCK_MODE:-}" = "true" ]; then
  run "await page.evaluate(() => {
    localStorage.setItem('ledger_endpoint', 'https://script.google.com/macros/s/mock/exec');
    localStorage.setItem('ledger_apiKey', 'mock-api-key');
  })"
  playwright-cli goto "$BASE_URL" -s="$SESSION"

  run "await page.route('**/macros/s/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({status:'success',message:'Row appended successfully'})
    });
  })"
fi

echo "=== STEP 1: Customer pane ==="
run 'await page.fill("input[name=\"customerName\"]", "John Smith")'
run 'await page.selectOption("#gender", "Male")'
run 'await page.fill("input[name=\"birthday\"]", "1990-05-15")'
run 'await page.fill("input[name=\"mobileNumber\"]", "+971501234567")'
run 'await page.fill("input[name=\"email\"]", "john.smith@example.com")'
run 'await page.fill("#country", "United Arab Emirates")'
run 'await page.fill("textarea[name=\"address\"]", "Dubai Marina, Tower 5, Apt 1201")'
run 'await page.selectOption("#cs-category", "Sales (販売)")'

# Derived field verification
SNAP=$(playwright-cli snapshot -s="$SESSION")
assert_contains "$SNAP" "アラブ首長国連邦" "derived-country-jp"
assert_contains "$SNAP" "Asia" "derived-continent"
assert_contains "$SNAP" "Western Asia" "derived-subregion"

echo "=== STEP 2: Next -> Staff pane ==="
run 'await page.click("#next-btn")'
sleep 1

echo "=== STEP 3: Staff pane ==="
run 'await page.fill("input[name=\"visitDate\"]", "2026-01-15")'
run 'await page.fill("input[name=\"ref\"]", "REF-001")'
run 'await page.selectOption("#payment-method", "Cash")'
run 'await page.fill("input[name=\"totalPurchase\"]", "15000")'
run 'await page.fill("input[name=\"grandTotal\"]", "16500")'

echo "=== STEP 4: Submit ==="
run 'await page.click("#submit-btn")'

echo "=== STEP 5: UI verification ==="
# Wait for success status (max 30s)
run 'await page.waitForFunction(() => {
  const el = document.getElementById("status");
  return el && el.textContent.includes("送信成功");
}, { timeout: 30000 })'

SNAP=$(playwright-cli snapshot -s="$SESSION")
assert_contains "$SNAP" "送信成功" "status-success"

echo "=== STEP 6: Spreadsheet verification ==="
if [ "${MOCK_MODE:-}" != "true" ]; then
  sleep 3  # Wait for GAS write
  SHEET_RESULT=0
  node "$SCRIPT_DIR/verify-spreadsheet.js" || SHEET_RESULT=$?
  if [ $SHEET_RESULT -eq 0 ]; then
    echo "  ✓ spreadsheet-18-columns"
    ((PASS++))
  else
    echo "  ✗ spreadsheet-18-columns"
    ((FAIL++))
  fi
else
  echo "  - spreadsheet verification skipped (mock mode)"
fi

# --- Summary ---
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

[ $FAIL -eq 0 ] && exit 0 || exit 1
