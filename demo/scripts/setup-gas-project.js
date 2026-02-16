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
    throw new Error('~/.clasprc.json not found. Run: npx clasp login --no-localhost');
  }
  const clasprc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8'));
  const oauth2Client = new google.auth.OAuth2(
    clasprc.oauth2ClientSettings.clientId,
    clasprc.oauth2ClientSettings.clientSecret
  );
  oauth2Client.setCredentials(clasprc.token);
  return oauth2Client;
}

/**
 * スプレッドシートのヘッダー行（Code.gs の SHEET_HEADERS と一致させる）
 */
const HEADERS = [
  'VisitDate', 'CsCategory', 'CustomerName', 'Gender', 'Birthday',
  'Age', 'MobileNumber', 'Email', 'Address', 'REF',
  'PaymentMethod', 'Country', 'CountryJP', 'Continent大陸',
  'Subregion小地域', '誕生月', '総買取額', '総合計'
];

/**
 * 新しいスプレッドシートを作成しヘッダー行を設定する。
 * stdout にスプレッドシートID を出力する。
 */
async function createSheet() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });

  // スプレッドシート作成
  const res = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: '買取台帳 E2E テスト' },
      sheets: [{
        properties: { title: 'Sheet1' },
      }],
    },
  });

  const spreadsheetId = res.data.spreadsheetId;

  // ヘッダー行を設定
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Sheet1!A1:R1',
    valueInputOption: 'RAW',
    requestBody: {
      values: [HEADERS],
    },
  });

  // stdout にスプレッドシートIDを出力（deploy-gas.sh で使う）
  console.log(spreadsheetId);
}

/**
 * スプレッドシートの最終行を読み取って JSON で出力する。
 * 環境変数 GOOGLE_SHEET_ID が必要。
 */
async function readLastRow() {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;

  if (!spreadsheetId) {
    console.error('GOOGLE_SHEET_ID environment variable is required');
    process.exit(1);
  }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Sheet1!A:R',
  });

  const rows = res.data.values;
  if (!rows || rows.length < 2) {
    console.error('No data rows found');
    process.exit(1);
  }

  console.log(JSON.stringify(rows[rows.length - 1]));
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
