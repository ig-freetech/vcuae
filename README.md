# Purchase Ledger Auto-Posting Demo

Tablet input → Google Apps Script → automatic append to Google Spreadsheet — a serverless demo.

## Architecture

```
[Tablet Web App] → POST JSON → [Apps Script Web App] → appendRow → [Google Spreadsheet]
```

- **Web App (PWA)**: Input form running in a tablet browser
- **Apps Script**: Google's serverless runtime. Handles Self-Generated Token auth, validation, derived-field calculation, and appends one row to the spreadsheet
- **Google Spreadsheet**: Data store

## Input Flow

1. **Customer Input**
   - Customer information entry
   - All 4 consent checkboxes must be checked before proceeding to Staff Review
   - The 3rd consent item is highlighted in yellow
2. **Staff Review**
   - `CsCategory` is entered by staff
   - Take a certificate photo, preview it, then "Save to Drive" to upload to Google Drive
   - The saved image URL is recorded in the `CertificatePhotoUrl` column on submit

## Published URLs (GitHub Pages)

- Custom domain: [vcuae.zer0ai.dev](https://vcuae.zer0ai.dev/)
- User input (`/web`): [vcuae.zer0ai.dev/web/](https://vcuae.zer0ai.dev/web/)
- Admin panel (`/admin`): [vcuae.zer0ai.dev/admin/](https://vcuae.zer0ai.dev/admin/)

### QR Code — User Input Form (`/web`)

Scan to open the customer input form on a phone or tablet:

<img src="demo/assets/qr-web.png" alt="QR code for /web" width="300">

## Install as App on Phone / Tablet

### iPhone / iPad (Safari)

1. Open [vcuae.zer0ai.dev/web/](https://vcuae.zer0ai.dev/web/) in Safari
2. Tap the Share button
3. Select "Add to Home Screen"
4. Confirm the name and tap "Add"

### Android (Chrome)

1. Open [vcuae.zer0ai.dev/web/](https://vcuae.zer0ai.dev/web/) in Chrome
2. From the menu, select "Install app" or "Add to Home screen"
3. Confirm the install dialog

To install the admin panel as an app, repeat the same steps for [vcuae.zer0ai.dev/admin/](https://vcuae.zer0ai.dev/admin/).

## Directory Structure

```
demo/
├── shared/          # Shared logic (validation, derived-field calculation)
│   └── ledger-core.js
├── web/             # User input PWA (/web)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   └── icons/
├── admin/           # Admin settings PWA (/admin)
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   └── icons/
├── apps-script/     # Google Apps Script
│   ├── Code.gs
│   └── README.md
├── scripts/         # Deploy & setup scripts
│   ├── deploy-gas.sh
│   └── setup-gas-project.js
├── tests/           # Automated tests
│   ├── fixtures.js
│   └── apps-script.test.js
└── README.md        # This file
```

## Quick Setup

### 1. Values to decide (Apps Script Script Properties)

| Property               | Description                                                            | Default    |
| ---------------------- | ---------------------------------------------------------------------- | ---------- |
| `SELF_GENERATED_TOKEN` | Shared token you generate                                              | (required) |
| `ADMIN_PASSCODE`       | Passcode to unlock the admin panel                                     | (required) |
| `DRIVE_FOLDER_ID`      | Google Drive folder ID for certificate photos (auto-set from `/admin`) | (optional) |

### 2. Deploy & configure via the Admin Panel

For step-by-step instructions, open [/admin](https://vcuae.zer0ai.dev/admin/) and follow the **Setup Guide** shown on first visit. It covers:

1. Creating an Apps Script project
2. Pasting `Code.gs` and `appsscript.json` (manual setup)
3. Generating a token & setting Script Properties
4. Deploying as a Web App
5. Unlocking the admin panel
6. Configuring Spreadsheet & Column Mapping

The guide also includes troubleshooting tips and instructions for updating the code after changes.

Manual setup requirement for Google Drive save:

- Copy both `demo/apps-script/Code.gs` and `demo/apps-script/appsscript.json` into your Apps Script project
- `appsscript.json` includes the Drive OAuth scope (`https://www.googleapis.com/auth/drive`) required for:
  - Google Drive folder validation in `/admin`
  - Certificate photo upload from `/web`
- If you update `Code.gs` or `appsscript.json`, re-deploy with **New version** (without `New version`, updated code/manifest is not applied)

Operational note for later Code.gs updates:

- Initial publish: use **Deploy -> New deployment** to create the first Web App URL
- After initial publish: use **Deploy -> Manage deployments -> Edit -> New version -> Deploy** on the existing deployment to keep the same URL
- Re-deploying without selecting **New version** does not apply updated `Code.gs` contents
- If Web App URL and `SELF_GENERATED_TOKEN` are unchanged, you do **not** need to regenerate/reapply the Web config
- If you create a new deployment (URL changes) or change `SELF_GENERATED_TOKEN`, regenerate config in `/admin` and apply it again in `/web`

## Local Development

1. `cd demo && npm run serve`
2. Open the admin panel at [http://localhost:3000/admin/](http://localhost:3000/admin/)
3. Follow the Quick Setup steps above to configure the connection
4. Open the user form at [http://localhost:3000/web/](http://localhost:3000/web/) — Customer Info (4 consent checks) → Staff Review (enter CsCategory, optionally save photo) → Submit

## Running Tests

```bash
# Apps Script endpoint tests
node demo/tests/apps-script.test.js
```

## E2E Tests

### Prerequisites

- Node.js 18+
- `googleapis` npm package (`npm install googleapis`)
- Signed in via `clasp login`

### First-time Setup

```bash
cd demo
npm install
npx clasp login --no-localhost   # Open the URL, authorize, paste the code
npm run deploy:gas               # Deploy GAS → outputs .env
```

### Test Commands

```bash
npm run test:e2e                 # Full E2E (spreadsheet verification included)
npm run test:e2e:mock            # Mock mode (no Google auth required)
npm run test:unit                # Unit tests
```

### Mock Mode

Run with `MOCK_MODE=true` to mock the GAS submission and test only the UI.
Works in CI without Google credentials.
