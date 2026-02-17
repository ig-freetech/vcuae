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
BASE_URL="http://localhost:3000/web/"
PASS=0
FAIL=0

# --- Helpers ---
assert_contains() {
  local output="$1" expected="$2" label="$3"
  if echo "$output" | grep -q "$expected"; then
    echo "  ✓ $label"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $label (expected: $expected)"
    FAIL=$((FAIL + 1))
  fi
}

run() {
  playwright-cli run-code "$1" -s="$SESSION"
}

# --- Local server ---
cd "$DEMO_DIR"
npx serve . -l 3000 --no-clipboard &
SERVER_PID=$!
sleep 2

cleanup() {
  kill $SERVER_PID 2>/dev/null || true
  playwright-cli close -s="$SESSION" 2>/dev/null || true
  rm -f "/tmp/golden-e2e-snap-$$.yml"
}
trap cleanup EXIT

# --- Session ---
playwright-cli open "$BASE_URL" -s="$SESSION"
run 'await page.setDefaultTimeout(30000)'

# --- localStorage (non-MOCK) ---
if [ "${MOCK_MODE:-}" != "true" ]; then
  run "await page.evaluate(() => {
    localStorage.setItem('ledger_endpoint', '${GAS_ENDPOINT_URL:-}');
    localStorage.setItem('ledger_selfGeneratedToken', '${GAS_SELF_GENERATED_TOKEN:-}');
  })"
  playwright-cli goto "$BASE_URL" -s="$SESSION"
fi

# --- Mock mode: intercept network ---
if [ "${MOCK_MODE:-}" = "true" ]; then
  run "await page.evaluate(() => {
    localStorage.setItem('ledger_endpoint', 'https://script.google.com/macros/s/mock/exec');
    localStorage.setItem('ledger_selfGeneratedToken', 'mock-self-generated-token');
  })"
  playwright-cli goto "$BASE_URL" -s="$SESSION"

  run "await page.evaluate(() => {
    var _origFetch = window.fetch.bind(window);
    window.fetch = function(url, opts) {
      if (typeof url === 'string' && url.includes('/macros/s/')) {
        return Promise.resolve(new Response(
          JSON.stringify({status:'success',message:'Row appended successfully'}),
          {status: 200, headers: {'Content-Type':'application/json'}}
        ));
      }
      return _origFetch(url, opts);
    };
  })"
fi

echo "=== STEP 1: Customer pane ==="
# Wait for app.js to populate select options (LedgerCore must be loaded)
run 'await page.waitForFunction(() => document.querySelector("#gender").options.length > 1, { timeout: 10000 })'

run 'await page.fill("input[name=\"customerName\"]", "John Smith")'
run 'await page.selectOption("#gender", "Male")'
run 'await page.fill("input[name=\"birthday\"]", "1990-05-15")'
run 'await page.fill("input[name=\"mobileNumber\"]", "+971501234567")'
run 'await page.fill("input[name=\"email\"]", "john.smith@example.com")'
run 'await page.fill("#country", "United Arab Emirates")'
run 'await page.fill("textarea[name=\"address\"]", "Dubai Marina, Tower 5, Apt 1201")'
run 'await page.check("input[name=\"consent1\"]")'
run 'await page.check("input[name=\"consent2\"]")'
run 'await page.check("input[name=\"consent3\"]")'
run 'await page.check("input[name=\"consent4\"]")'

# Derived field verification
SNAP_FILE="/tmp/golden-e2e-snap-$$.yml"
playwright-cli snapshot --filename "$SNAP_FILE" -s="$SESSION"
SNAP=$(cat "$SNAP_FILE")
assert_contains "$SNAP" "アラブ首長国連邦" "derived-country-jp"
assert_contains "$SNAP" "Asia" "derived-continent"
assert_contains "$SNAP" "Western Asia" "derived-subregion"

echo "=== STEP 2: Next -> Staff pane ==="
run 'await page.click("#next-btn")'
sleep 1

echo "=== STEP 3: Staff pane ==="
run 'await page.fill("input[name=\"visitDate\"]", "2026-01-15")'
run 'await page.selectOption("#cs-category", "Sales")'
run 'await page.fill("input[name=\"ref\"]", "REF-001")'
run 'await page.selectOption("#payment-method", "Cash")'
run 'await page.fill("input[name=\"totalPurchase\"]", "15000")'
run 'await page.fill("input[name=\"grandTotal\"]", "16500")'

echo "=== STEP 4: Submit ==="
run 'await page.click("#submit-btn")'

echo "=== STEP 5: UI verification ==="
# Poll snapshot for success status (max 30s, every 2s)
FOUND_SUCCESS=false
for _i in $(seq 1 15); do
  playwright-cli snapshot --filename="$SNAP_FILE" -s="$SESSION" > /dev/null 2>&1
  if grep -q "Submission successful" "$SNAP_FILE" 2>/dev/null; then
    FOUND_SUCCESS=true
    break
  fi
  sleep 2
done
SNAP=$(cat "$SNAP_FILE")
assert_contains "$SNAP" "Submission successful" "status-success"

echo "=== STEP 6: Spreadsheet verification ==="
if [ "${MOCK_MODE:-}" != "true" ]; then
  sleep 3  # Wait for GAS write
  SHEET_RESULT=0
  node "$SCRIPT_DIR/verify-spreadsheet.js" || SHEET_RESULT=$?
  if [ $SHEET_RESULT -eq 0 ]; then
    echo "  ✓ spreadsheet-19-columns"
    PASS=$((PASS + 1))
  else
    echo "  ✗ spreadsheet-19-columns"
    FAIL=$((FAIL + 1))
  fi
else
  echo "  - spreadsheet verification skipped (mock mode)"
fi

# --- Summary ---
echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="

[ $FAIL -eq 0 ] && exit 0 || exit 1
