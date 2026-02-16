## 1. OpenSpec and Project Setup

- [ ] 1.1 Confirm acceptance criteria and spreadsheet column mapping against client sample sheet
- [ ] 1.2 Add `demo/README.md` with local run instructions and environment variable contract
- [ ] 1.3 Define shared fixture payloads for customer step, staff step, and full submit contract

## 2. Shared Ledger Core (TDD)

- [ ] 2.1 Add automated tests for date normalization, age calculation, and birth month derivation
- [ ] 2.2 Add automated tests for country metadata mapping (match, alias, unknown fallback)
- [ ] 2.3 Add automated tests for input validation (required fields, email/phone format, numeric totals)
- [ ] 2.4 Implement/finalize `demo/shared/ledger-core.js` to satisfy all shared logic tests
- [ ] 2.5 Add automated tests for fixed spreadsheet row order mapping and optional field handling

## 3. Tablet Web Flow (TDD)

- [ ] 3.1 Create web flow unit tests for step transitions and client-side validation behavior
- [ ] 3.2 Implement `demo/web/app.js` for two-step flow, derived field preview, and submit guard
- [ ] 3.3 Finalize `demo/web/index.html` form structure for customer/staff responsibility split
- [ ] 3.4 Finalize `demo/web/styles.css` and responsive behavior for tablet portrait/landscape
- [ ] 3.5 Add PWA assets (`manifest.webmanifest`, service worker, icon references) and verify installability

## 4. Apps Script Endpoint and Integration (TDD)

- [ ] 4.1 Add endpoint contract tests for success response and structured error response
- [ ] 4.2 Implement `demo/apps-script/Code.gs` with `doPost` validation, API key check, and append flow
- [ ] 4.3 Implement fixed schema row mapping from payload to spreadsheet columns in Apps Script
- [ ] 4.4 Add tests/fixtures for failure paths (auth error, validation error, unknown country fallback)
- [ ] 4.5 Document Apps Script deployment, script properties, and sheet ID setup in `demo/apps-script/README.md`

## 5. Verification, Demo Readiness, and Handoff

- [ ] 5.1 Run all automated tests and record command outputs in project notes
- [ ] 5.2 Perform manual tablet smoke test for end-to-end submit to Google Spreadsheet
- [ ] 5.3 Run OpenSpec verification to ensure proposal/spec/design/tasks remain coherent
- [ ] 5.4 Update beads statuses for completed subtasks and record unresolved follow-ups
- [ ] 5.5 Complete session landing checklist (`git pull --rebase`, `bd sync`, `git push`, final status check)
