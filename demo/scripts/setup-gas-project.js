#!/usr/bin/env node
/**
 * setup-gas-project.js
 *
 * ~/.clasprc.json の OAuth 認証情報を再利用して Google Sheets API を操作する。
 * deploy-gas.sh から呼ばれるヘルパースクリプト。
 *
 * Dependencies:
 *   - googleapis (npm install googleapis)
 *
 * Used by:
 *   - demo/scripts/deploy-gas.sh
 */
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * ~/.clasprc.json から OAuth2 クライアントを生成する。
 * @returns {google.auth.OAuth2}
 */
function getAuthClient() {
  const clasprcPath = path.join(require('os').homedir(), '.clasprc.json');
  if (!fs.existsSync(clasprcPath)) {
    throw new Error('~/.clasprc.json not found. Run: clasp login --no-localhost');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  let clientId, clientSecret, token;
  if (clasprc.tokens && clasprc.tokens.default) {
    // clasp v3.x format
    const t = clasprc.tokens.default;
    clientId = t.client_id;
    clientSecret = t.client_secret;
    token = { access_token: t.access_token, refresh_token: t.refresh_token };
  } else {
    // clasp v2.x format
    clientId = clasprc.oauth2ClientSettings.clientId;
    clientSecret = clasprc.oauth2ClientSettings.clientSecret;
    token = clasprc.token;
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials(token);
  return oauth2Client;
}

/**
 * 新しいスプレッドシートを Drive API で作成する。
 * ヘッダー行は Code.gs の ensureHeaders_ が初回 POST 時に自動設定する。
 * stdout にスプレッドシートID を出力する。
 */
async function createSheet() {
  const auth = getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  const res = await drive.files.create({
    requestBody: {
      name: '買取台帳 E2E テスト',
      mimeType: 'application/vnd.google-apps.spreadsheet',
    },
    fields: 'id',
  });
  console.log(res.data.id);
}

/**
 * GAS Web App の doGet 経由でスプレッドシートの最終行を読み取って JSON で出力する。
 * 環境変数 GAS_ENDPOINT_URL, GAS_API_KEY が必要。
 */
async function readLastRow() {
  const endpointUrl = process.env.GAS_ENDPOINT_URL;
  const apiKey = process.env.GAS_API_KEY;
  if (!endpointUrl || !apiKey) {
    console.error('GAS_ENDPOINT_URL and GAS_API_KEY environment variables are required');
    process.exit(1);
  }
  const url = `${endpointUrl}?action=readLastRow&apiKey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, { redirect: 'follow' });
  const json = await res.json();
  if (json.status !== 'success') {
    console.error(json.message || 'Failed to read last row');
    process.exit(1);
  }
  console.log(JSON.stringify(json.row));
}

// CLI
const command = process.argv[2];
switch (command) {
  case 'create-sheet':
    createSheet().catch(err => { console.error(err.message); process.exit(1); });
    break;
  case 'read-last-row':
    readLastRow().catch(err => { console.error(err.message); process.exit(1); });
    break;
  default:
    console.error('Usage: setup-gas-project.js <create-sheet|read-last-row>');
    process.exit(1);
}
